// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test, console2 } from "forge-std/Test.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title GaslessExecutionTest
 * @notice Tests for gasless transaction patterns inspired by Porto/Ithaca
 * @dev Demonstrates meta-transaction patterns for Villa
 *
 * Key concepts from Porto/Ithaca:
 * 1. EIP-712 typed signatures for user intent
 * 2. Relayer submits transactions on user's behalf
 * 3. Gas abstraction (user doesn't need ETH)
 *
 * Run with: forge test --match-contract GaslessExecution -vvv
 */
contract GaslessExecutionTest is Test {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // EIP-712 domain separator
    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    // Villa intent typehash
    bytes32 public constant INTENT_TYPEHASH = keccak256(
        "VillaIntent(address from,address to,uint256 value,bytes data,uint256 nonce,uint256 deadline)"
    );

    // Mock relayer contract
    MockRelayer public relayer;
    MockVillaAccount public villaAccount;

    // Test accounts
    uint256 public userPrivateKey;
    address public user;
    address public relayerOperator;
    address public recipient;

    function setUp() public {
        // Setup accounts
        userPrivateKey = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        user = vm.addr(userPrivateKey);
        relayerOperator = makeAddr("relayer");
        recipient = makeAddr("recipient");

        // Fund accounts
        vm.deal(user, 0); // User has NO ETH (gasless!)
        vm.deal(relayerOperator, 100 ether);
        vm.deal(recipient, 0);

        // Deploy contracts
        villaAccount = new MockVillaAccount();
        relayer = new MockRelayer(address(villaAccount));

        // Give Villa account some ETH (user's funds)
        vm.deal(address(villaAccount), 10 ether);
    }

    /*//////////////////////////////////////////////////////////////
                         GASLESS TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GaslessETHTransfer() public {
        // User wants to send 1 ETH to recipient but has no gas
        uint256 transferAmount = 1 ether;
        uint256 nonce = villaAccount.nonces(user);
        uint256 deadline = block.timestamp + 1 hours;

        // Step 1: User signs intent (off-chain, no gas needed)
        // Note: Empty calldata is hashed as bytes32(0)
        bytes32 structHash = keccak256(abi.encode(
            INTENT_TYPEHASH,
            user,
            recipient,
            transferAmount,
            bytes32(0), // Empty calldata hash
            nonce,
            deadline
        ));

        bytes32 domainSeparator = _buildDomainSeparator();
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Step 2: Relayer submits transaction (pays gas)
        vm.prank(relayerOperator);
        relayer.executeIntent(
            user,
            recipient,
            transferAmount,
            "",
            nonce,
            deadline,
            signature
        );

        // Step 3: Verify transfer happened
        assertEq(recipient.balance, transferAmount);
        assertEq(villaAccount.nonces(user), nonce + 1);
    }

    function test_GaslessContractCall() public {
        // User wants to call a contract but has no gas
        MockTarget target = new MockTarget();

        uint256 nonce = villaAccount.nonces(user);
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory callData = abi.encodeCall(MockTarget.doSomething, (42));

        // Sign intent
        bytes32 structHash = keccak256(abi.encode(
            INTENT_TYPEHASH,
            user,
            address(target),
            0, // No ETH value
            keccak256(callData),
            nonce,
            deadline
        ));

        bytes32 domainSeparator = _buildDomainSeparator();
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Relayer executes
        vm.prank(relayerOperator);
        relayer.executeIntent(
            user,
            address(target),
            0,
            callData,
            nonce,
            deadline,
            signature
        );

        // Verify call happened
        assertEq(target.lastValue(), 42);
        assertEq(target.lastCaller(), address(villaAccount));
    }

    function test_ReplayProtection() public {
        uint256 transferAmount = 1 ether;
        uint256 nonce = villaAccount.nonces(user);
        uint256 deadline = block.timestamp + 1 hours;

        // Sign and execute first time
        bytes32 structHash = keccak256(abi.encode(
            INTENT_TYPEHASH,
            user,
            recipient,
            transferAmount,
            bytes32(0), // Empty calldata hash
            nonce,
            deadline
        ));

        bytes32 domainSeparator = _buildDomainSeparator();
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(relayerOperator);
        relayer.executeIntent(user, recipient, transferAmount, "", nonce, deadline, signature);

        // Try to replay - should fail
        vm.prank(relayerOperator);
        vm.expectRevert("Invalid nonce");
        relayer.executeIntent(user, recipient, transferAmount, "", nonce, deadline, signature);
    }

    function test_DeadlineExpiration() public {
        uint256 nonce = villaAccount.nonces(user);
        uint256 deadline = block.timestamp - 1; // Already expired!

        bytes32 structHash = keccak256(abi.encode(
            INTENT_TYPEHASH,
            user,
            recipient,
            1 ether,
            "",
            nonce,
            deadline
        ));

        bytes32 domainSeparator = _buildDomainSeparator();
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(relayerOperator);
        vm.expectRevert("Deadline expired");
        relayer.executeIntent(user, recipient, 1 ether, "", nonce, deadline, signature);
    }

    function test_InvalidSignature() public {
        uint256 nonce = villaAccount.nonces(user);
        uint256 deadline = block.timestamp + 1 hours;

        // Sign with wrong private key
        uint256 wrongKey = 0xdeadbeef;
        bytes32 structHash = keccak256(abi.encode(
            INTENT_TYPEHASH,
            user,
            recipient,
            1 ether,
            "",
            nonce,
            deadline
        ));

        bytes32 domainSeparator = _buildDomainSeparator();
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(relayerOperator);
        vm.expectRevert("Invalid signature");
        relayer.executeIntent(user, recipient, 1 ether, "", nonce, deadline, signature);
    }

    /*//////////////////////////////////////////////////////////////
                         BATCH EXECUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_BatchExecution() public {
        // User wants to execute multiple actions in one transaction
        MockTarget target1 = new MockTarget();
        MockTarget target2 = new MockTarget();

        address[] memory targets = new address[](2);
        targets[0] = address(target1);
        targets[1] = address(target2);

        bytes[] memory callDatas = new bytes[](2);
        callDatas[0] = abi.encodeCall(MockTarget.doSomething, (100));
        callDatas[1] = abi.encodeCall(MockTarget.doSomething, (200));

        // Execute batch
        vm.prank(address(villaAccount));
        for (uint i = 0; i < targets.length; i++) {
            (bool success,) = targets[i].call(callDatas[i]);
            require(success, "Call failed");
        }

        assertEq(target1.lastValue(), 100);
        assertEq(target2.lastValue(), 200);
    }

    /*//////////////////////////////////////////////////////////////
                         HELPERS
    //////////////////////////////////////////////////////////////*/

    function _buildDomainSeparator() internal view returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256("Villa"),
            keccak256("1"),
            block.chainid,
            address(villaAccount)
        ));
    }
}

/**
 * @notice Mock Villa smart account (simplified)
 */
contract MockVillaAccount {
    mapping(address => uint256) public nonces;

    receive() external payable {}

    function execute(
        address to,
        uint256 value,
        bytes memory data
    ) external returns (bytes memory) {
        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "Execution failed");
        return result;
    }

    function incrementNonce(address user) external {
        nonces[user]++;
    }
}

/**
 * @notice Mock relayer that pays gas for users
 */
contract MockRelayer {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 public constant INTENT_TYPEHASH = keccak256(
        "VillaIntent(address from,address to,uint256 value,bytes data,uint256 nonce,uint256 deadline)"
    );

    MockVillaAccount public villaAccount;

    constructor(address _villaAccount) {
        villaAccount = MockVillaAccount(payable(_villaAccount));
    }

    function executeIntent(
        address from,
        address to,
        uint256 value,
        bytes memory data,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) external {
        // Check deadline
        require(block.timestamp <= deadline, "Deadline expired");

        // Check nonce
        require(villaAccount.nonces(from) == nonce, "Invalid nonce");

        // Build digest
        bytes32 structHash = keccak256(abi.encode(
            INTENT_TYPEHASH,
            from,
            to,
            value,
            data.length > 0 ? keccak256(data) : bytes32(0),
            nonce,
            deadline
        ));

        bytes32 domainSeparator = keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256("Villa"),
            keccak256("1"),
            block.chainid,
            address(villaAccount)
        ));

        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);

        // Verify signature
        address signer = digest.recover(signature);
        require(signer == from, "Invalid signature");

        // Increment nonce
        villaAccount.incrementNonce(from);

        // Execute via Villa account
        villaAccount.execute(to, value, data);
    }
}

/**
 * @notice Mock target contract for testing
 */
contract MockTarget {
    uint256 public lastValue;
    address public lastCaller;

    function doSomething(uint256 value) external {
        lastValue = value;
        lastCaller = msg.sender;
    }
}
