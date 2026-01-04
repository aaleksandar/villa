// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test, console2 } from "forge-std/Test.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import { VillaNicknameResolverV2 } from "../../src/VillaNicknameResolverV2.sol";
import { BiometricRecoverySignerV2 } from "../../src/BiometricRecoverySignerV2.sol";
import { MockGroth16Verifier } from "../../src/mocks/MockGroth16Verifier.sol";

/**
 * @title LocalDeployment
 * @notice E2E tests for full Villa contract deployment on local Anvil
 * @dev Run with: forge test --match-contract LocalDeployment -vvv
 *
 * Tests the complete deployment flow:
 * 1. Deploy implementations
 * 2. Deploy proxies
 * 3. Initialize contracts
 * 4. Transfer ownership
 * 5. Verify functionality
 */
contract LocalDeploymentTest is Test {
    // Contracts
    VillaNicknameResolverV2 public nicknameResolverImpl;
    VillaNicknameResolverV2 public nicknameResolver;
    BiometricRecoverySignerV2 public recoverySignerImpl;
    BiometricRecoverySignerV2 public recoverySignerV2;
    MockGroth16Verifier public verifier;

    // Addresses
    address public deployer;
    address public admin;
    address public user1;
    address public user2;
    address public relayer;

    // Test constants
    string constant GATEWAY_URL = "https://api.villa.cash/ens/resolve";
    bytes32 constant FACE_HASH_1 = keccak256("face_embedding_user1");
    bytes32 constant FACE_HASH_2 = keccak256("face_embedding_user2");

    function setUp() public {
        // Setup accounts
        deployer = makeAddr("deployer");
        admin = makeAddr("admin");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        relayer = makeAddr("relayer");

        // Fund accounts
        vm.deal(deployer, 100 ether);
        vm.deal(admin, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(relayer, 10 ether);

        // Deploy all contracts
        vm.startPrank(deployer);
        _deployContracts();
        vm.stopPrank();
    }

    function _deployContracts() internal {
        // 1. Deploy mock verifier
        verifier = new MockGroth16Verifier();
        console2.log("MockGroth16Verifier deployed:", address(verifier));

        // 2. Deploy VillaNicknameResolverV2 with proxy
        nicknameResolverImpl = new VillaNicknameResolverV2();
        bytes memory nicknameInitData = abi.encodeCall(
            VillaNicknameResolverV2.initialize,
            (GATEWAY_URL, deployer)
        );
        ERC1967Proxy nicknameProxy = new ERC1967Proxy(
            address(nicknameResolverImpl),
            nicknameInitData
        );
        nicknameResolver = VillaNicknameResolverV2(address(nicknameProxy));
        console2.log("VillaNicknameResolverV2 proxy deployed:", address(nicknameResolver));

        // 3. Deploy BiometricRecoverySignerV2 with proxy
        recoverySignerImpl = new BiometricRecoverySignerV2();
        bytes memory recoveryInitData = abi.encodeCall(
            BiometricRecoverySignerV2.initialize,
            (address(verifier), deployer)
        );
        ERC1967Proxy recoveryProxy = new ERC1967Proxy(
            address(recoverySignerImpl),
            recoveryInitData
        );
        recoverySignerV2 = BiometricRecoverySignerV2(address(recoveryProxy));
        console2.log("BiometricRecoverySignerV2 proxy deployed:", address(recoverySignerV2));
    }

    /*//////////////////////////////////////////////////////////////
                         DEPLOYMENT VERIFICATION
    //////////////////////////////////////////////////////////////*/

    function test_DeploymentSuccessful() public view {
        // Verify nickname resolver
        assertEq(nicknameResolver.url(), GATEWAY_URL);
        assertEq(nicknameResolver.owner(), deployer);
        assertFalse(nicknameResolver.paused());
        assertEq(nicknameResolver.version(), "2.0.0");

        // Verify recovery signer
        assertEq(address(recoverySignerV2.livenessVerifier()), address(verifier));
        assertEq(recoverySignerV2.owner(), deployer);
        assertFalse(recoverySignerV2.paused());
        assertEq(recoverySignerV2.version(), "2.0.0");
    }

    function test_ProxyImplementation() public view {
        // Verify proxies point to correct implementations
        // (implementations are stored at ERC1967 storage slot)
        bytes32 implSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

        bytes32 nicknameImplAddress = vm.load(address(nicknameResolver), implSlot);
        assertEq(address(uint160(uint256(nicknameImplAddress))), address(nicknameResolverImpl));

        bytes32 recoveryImplAddress = vm.load(address(recoverySignerV2), implSlot);
        assertEq(address(uint160(uint256(recoveryImplAddress))), address(recoverySignerImpl));
    }

    /*//////////////////////////////////////////////////////////////
                         OWNERSHIP TRANSFER E2E
    //////////////////////////////////////////////////////////////*/

    function test_OwnershipTransferFlow() public {
        // Step 1: Deployer initiates transfer to admin
        vm.prank(deployer);
        nicknameResolver.transferOwnership(admin);

        // Owner is still deployer until accepted
        assertEq(nicknameResolver.owner(), deployer);
        assertEq(nicknameResolver.pendingOwner(), admin);

        // Step 2: Admin accepts ownership
        vm.prank(admin);
        nicknameResolver.acceptOwnership();

        // Now admin is owner
        assertEq(nicknameResolver.owner(), admin);
        assertEq(nicknameResolver.pendingOwner(), address(0));

        // Step 3: Deployer can no longer admin
        vm.prank(deployer);
        vm.expectRevert();
        nicknameResolver.setUrl("https://malicious.com");

        // Step 4: New admin can admin
        vm.prank(admin);
        nicknameResolver.setUrl("https://new-api.villa.cash/ens/resolve");
        assertEq(nicknameResolver.url(), "https://new-api.villa.cash/ens/resolve");
    }

    /*//////////////////////////////////////////////////////////////
                         NICKNAME RESOLVER E2E
    //////////////////////////////////////////////////////////////*/

    function test_NicknameResolution_CCIP_Read() public {
        bytes memory name = abi.encode("alice.villa.eth");
        bytes memory data = abi.encodeWithSignature("addr(bytes32)", bytes32(0));

        // Should revert with OffchainLookup for CCIP-Read
        // We use low-level call to capture the revert reason
        (bool success, bytes memory reason) = address(nicknameResolver).call(
            abi.encodeCall(nicknameResolver.resolve, (name, data))
        );

        // Should have reverted
        assertFalse(success, "Should have reverted with OffchainLookup");

        // Verify it's an OffchainLookup error by checking selector
        bytes4 selector = bytes4(reason);
        assertEq(selector, VillaNicknameResolverV2.OffchainLookup.selector);
    }

    function test_NicknameResolver_PauseProtection() public {
        // Pause the contract
        vm.prank(deployer);
        nicknameResolver.pause();
        assertTrue(nicknameResolver.paused());

        // Resolution should fail when paused
        bytes memory name = abi.encode("alice.villa.eth");
        bytes memory data = abi.encodeWithSignature("addr(bytes32)", bytes32(0));

        vm.expectRevert();
        nicknameResolver.resolve(name, data);

        // Unpause and verify it works again
        vm.prank(deployer);
        nicknameResolver.unpause();
        assertFalse(nicknameResolver.paused());
    }

    /*//////////////////////////////////////////////////////////////
                         BIOMETRIC RECOVERY E2E
    //////////////////////////////////////////////////////////////*/

    function test_BiometricRecovery_FullFlow() public {
        // Mock liveness proof with valid magic prefix (0xdeadbeef)
        bytes memory livenessProof = verifier.generateValidProof();

        // Step 1: User enrolls face
        vm.prank(user1);
        recoverySignerV2.enrollFace(FACE_HASH_1, livenessProof);

        assertTrue(recoverySignerV2.isEnrolled(user1));
        assertEq(recoverySignerV2.enrolledFaceKeyHashes(user1), FACE_HASH_1);

        // Step 2: Get next nonce
        uint256 nonce = recoverySignerV2.getNextNonce(user1);
        assertEq(nonce, 1);

        // Step 3: Verify enrollment state
        assertTrue(recoverySignerV2.isEnrolled(user1));
    }

    function test_BiometricRecovery_RevokeFlow() public {
        // Enroll first with valid mock proof
        bytes memory livenessProof = verifier.generateValidProof();

        vm.prank(user1);
        recoverySignerV2.enrollFace(FACE_HASH_1, livenessProof);
        assertTrue(recoverySignerV2.isEnrolled(user1));

        // Revoke
        vm.prank(user1);
        recoverySignerV2.revokeFace();
        assertFalse(recoverySignerV2.isEnrolled(user1));
    }

    function test_BiometricRecovery_UpdateFlow() public {
        // Enroll first with valid mock proof
        bytes memory livenessProof = verifier.generateValidProof();

        vm.prank(user1);
        recoverySignerV2.enrollFace(FACE_HASH_1, livenessProof);
        assertEq(recoverySignerV2.enrolledFaceKeyHashes(user1), FACE_HASH_1);

        // Update to new face hash
        vm.prank(user1);
        recoverySignerV2.updateFace(FACE_HASH_2, livenessProof);
        assertEq(recoverySignerV2.enrolledFaceKeyHashes(user1), FACE_HASH_2);
    }

    /*//////////////////////////////////////////////////////////////
                         UPGRADE E2E
    //////////////////////////////////////////////////////////////*/

    function test_UpgradeFlow() public {
        // Deploy new implementation
        vm.startPrank(deployer);
        VillaNicknameResolverV2 newImpl = new VillaNicknameResolverV2();

        // Set some state before upgrade
        nicknameResolver.setUrl("https://before-upgrade.villa.cash");
        string memory urlBefore = nicknameResolver.url();

        // Upgrade
        nicknameResolver.upgradeToAndCall(address(newImpl), "");

        // Verify state preserved
        assertEq(nicknameResolver.url(), urlBefore);
        assertEq(nicknameResolver.owner(), deployer);
        vm.stopPrank();
    }

    function test_UpgradeBlockedForNonOwner() public {
        vm.startPrank(deployer);
        VillaNicknameResolverV2 newImpl = new VillaNicknameResolverV2();
        vm.stopPrank();

        // Non-owner cannot upgrade
        vm.prank(user1);
        vm.expectRevert();
        nicknameResolver.upgradeToAndCall(address(newImpl), "");
    }

    /*//////////////////////////////////////////////////////////////
                         EMERGENCY SCENARIOS
    //////////////////////////////////////////////////////////////*/

    function test_EmergencyPause_AllContracts() public {
        vm.startPrank(deployer);

        // Pause both contracts
        nicknameResolver.pause();
        recoverySignerV2.pause();

        assertTrue(nicknameResolver.paused());
        assertTrue(recoverySignerV2.paused());

        // Verify operations blocked
        bytes memory name = abi.encode("test");
        bytes memory data = "";

        vm.expectRevert();
        nicknameResolver.resolve(name, data);

        // Empty proof should fail - contract is paused AND proof is invalid
        bytes memory livenessProof = verifier.generateValidProof();

        vm.expectRevert();
        recoverySignerV2.enrollFace(FACE_HASH_1, livenessProof);

        // Unpause both
        nicknameResolver.unpause();
        recoverySignerV2.unpause();

        assertFalse(nicknameResolver.paused());
        assertFalse(recoverySignerV2.paused());

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                         GAS BENCHMARKS
    //////////////////////////////////////////////////////////////*/

    function test_GasBenchmark_Deployment() public {
        vm.startPrank(deployer);

        uint256 gasStart = gasleft();
        VillaNicknameResolverV2 impl = new VillaNicknameResolverV2();
        uint256 implGas = gasStart - gasleft();

        gasStart = gasleft();
        bytes memory initData = abi.encodeCall(
            VillaNicknameResolverV2.initialize,
            (GATEWAY_URL, deployer)
        );
        new ERC1967Proxy(address(impl), initData);
        uint256 proxyGas = gasStart - gasleft();

        console2.log("Implementation deployment gas:", implGas);
        console2.log("Proxy deployment gas:", proxyGas);
        console2.log("Total deployment gas:", implGas + proxyGas);

        vm.stopPrank();
    }

    function test_GasBenchmark_FaceEnrollment() public {
        bytes memory livenessProof = verifier.generateValidProof();

        vm.prank(user1);
        uint256 gasStart = gasleft();
        recoverySignerV2.enrollFace(FACE_HASH_1, livenessProof);
        uint256 gasUsed = gasStart - gasleft();

        console2.log("Face enrollment gas:", gasUsed);
    }
}
