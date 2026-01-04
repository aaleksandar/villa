// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test, console2 } from "forge-std/Test.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { BiometricRecoverySignerV2 } from "../src/BiometricRecoverySignerV2.sol";
import { IGroth16Verifier } from "../src/interfaces/IGroth16Verifier.sol";

/// @notice Mock Groth16 verifier for testing
contract MockGroth16Verifier is IGroth16Verifier {
    bool public shouldReturnValid = true;

    function verifyProof(bytes calldata) external view override returns (bool) {
        return shouldReturnValid;
    }

    function setShouldReturnValid(bool _shouldReturnValid) external {
        shouldReturnValid = _shouldReturnValid;
    }
}

contract BiometricRecoverySignerV2Test is Test {
    BiometricRecoverySignerV2 public signer;
    BiometricRecoverySignerV2 public implementation;
    MockGroth16Verifier public verifier;
    address public owner;
    address public alice;
    uint256 public alicePrivateKey;
    address public bob;
    uint256 public bobPrivateKey;

    bytes32 public aliceFaceKeyHash;
    bytes32 constant NEW_FACE_KEY_HASH = keccak256("alice_new_face_key");
    bytes public validLivenessProof;
    bytes32 constant TEST_DIGEST = keccak256("test_message");

    event FaceEnrolled(address indexed account, bytes32 indexed faceKeyHash, uint256 timestamp);
    event FaceRevoked(address indexed account, bytes32 indexed faceKeyHash, uint256 timestamp);
    event RecoveryExecuted(address indexed account, uint256 indexed nonce, uint256 timestamp);
    event LivenessVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event ContractUpgraded(address indexed previousVersion, address indexed newVersion);
    event Paused(address account);
    event Unpaused(address account);

    function setUp() public {
        owner = address(this);

        // Create test accounts with private keys
        alicePrivateKey = 0xA11CE;
        alice = vm.addr(alicePrivateKey);
        bobPrivateKey = 0xB0B;
        bob = vm.addr(bobPrivateKey);

        // Deploy mock verifier
        verifier = new MockGroth16Verifier();

        // Generate valid proof and face key hash
        validLivenessProof = hex"deadbeef";
        aliceFaceKeyHash = keccak256(abi.encode(alice));

        // Deploy implementation
        implementation = new BiometricRecoverySignerV2();

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            BiometricRecoverySignerV2.initialize.selector,
            address(verifier),
            owner
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);

        // Wrap proxy with interface
        signer = BiometricRecoverySignerV2(address(proxy));
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialize_SetsVerifier() public view {
        assertEq(address(signer.livenessVerifier()), address(verifier));
    }

    function test_Initialize_SetsOwner() public view {
        assertEq(signer.owner(), owner);
    }

    function test_Initialize_RevertsOnZeroAddress() public {
        BiometricRecoverySignerV2 newImpl = new BiometricRecoverySignerV2();

        bytes memory initData = abi.encodeWithSelector(
            BiometricRecoverySignerV2.initialize.selector,
            address(0),
            owner
        );

        vm.expectRevert(BiometricRecoverySignerV2.ZeroAddress.selector);
        new ERC1967Proxy(address(newImpl), initData);
    }

    function test_Initialize_CannotBeCalledTwice() public {
        vm.expectRevert();
        signer.initialize(address(verifier), alice);
    }

    /*//////////////////////////////////////////////////////////////
                            ENROLLMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_EnrollFace_Success() public {
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit FaceEnrolled(alice, aliceFaceKeyHash, block.timestamp);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        assertEq(signer.enrolledFaceKeyHashes(alice), aliceFaceKeyHash);
        assertEq(signer.enrollmentTimestamps(alice), block.timestamp);
        assertTrue(signer.isEnrolled(alice));
    }

    function test_EnrollFace_RevertsIfAlreadyEnrolled() public {
        vm.startPrank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        vm.expectRevert(BiometricRecoverySignerV2.FaceAlreadyEnrolled.selector);
        signer.enrollFace(NEW_FACE_KEY_HASH, validLivenessProof);
        vm.stopPrank();
    }

    function test_EnrollFace_RevertsOnInvalidLivenessProof() public {
        verifier.setShouldReturnValid(false);

        vm.prank(alice);
        vm.expectRevert(BiometricRecoverySignerV2.InvalidLivenessProof.selector);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);
    }

    function test_EnrollFace_RevertsWhenPaused() public {
        signer.pause();

        vm.prank(alice);
        vm.expectRevert();
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);
    }

    /*//////////////////////////////////////////////////////////////
                            REVOKE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RevokeFace_Success() public {
        vm.startPrank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        vm.expectEmit(true, true, true, true);
        emit FaceRevoked(alice, aliceFaceKeyHash, block.timestamp);
        signer.revokeFace();
        vm.stopPrank();

        assertEq(signer.enrolledFaceKeyHashes(alice), bytes32(0));
        assertEq(signer.enrollmentTimestamps(alice), 0);
        assertFalse(signer.isEnrolled(alice));
    }

    function test_RevokeFace_RevertsIfNotEnrolled() public {
        vm.prank(alice);
        vm.expectRevert(BiometricRecoverySignerV2.FaceNotEnrolled.selector);
        signer.revokeFace();
    }

    function test_RevokeFace_RevertsWhenPaused() public {
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        signer.pause();

        vm.prank(alice);
        vm.expectRevert();
        signer.revokeFace();
    }

    /*//////////////////////////////////////////////////////////////
                            UPDATE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateFace_Success() public {
        vm.startPrank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        vm.expectEmit(true, true, true, true);
        emit FaceRevoked(alice, aliceFaceKeyHash, block.timestamp);
        vm.expectEmit(true, true, true, true);
        emit FaceEnrolled(alice, NEW_FACE_KEY_HASH, block.timestamp);
        signer.updateFace(NEW_FACE_KEY_HASH, validLivenessProof);
        vm.stopPrank();

        assertEq(signer.enrolledFaceKeyHashes(alice), NEW_FACE_KEY_HASH);
    }

    function test_UpdateFace_WorksIfNotPreviouslyEnrolled() public {
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit FaceEnrolled(alice, aliceFaceKeyHash, block.timestamp);
        signer.updateFace(aliceFaceKeyHash, validLivenessProof);

        assertEq(signer.enrolledFaceKeyHashes(alice), aliceFaceKeyHash);
    }

    function test_UpdateFace_RevertsOnInvalidLivenessProof() public {
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        verifier.setShouldReturnValid(false);

        vm.prank(alice);
        vm.expectRevert(BiometricRecoverySignerV2.InvalidLivenessProof.selector);
        signer.updateFace(NEW_FACE_KEY_HASH, validLivenessProof);
    }

    /*//////////////////////////////////////////////////////////////
                        SIGNATURE VERIFICATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_IsValidSignatureWithKeyHash_ValidSignature() public {
        // Enroll face
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        // Create signature components
        uint256 nonce = 1;
        bytes memory faceSignature = _createMockFaceSignature(alice);
        bytes memory signature = abi.encode(validLivenessProof, faceSignature, nonce);

        // Verify signature
        vm.prank(alice);
        bool isValid = signer.isValidSignatureWithKeyHash(
            TEST_DIGEST,
            signature,
            aliceFaceKeyHash
        );

        assertTrue(isValid);
    }

    function test_IsValidSignatureWithKeyHash_InvalidLivenessProof() public {
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        verifier.setShouldReturnValid(false);

        uint256 nonce = 1;
        bytes memory faceSignature = _createMockFaceSignature(alice);
        bytes memory signature = abi.encode(validLivenessProof, faceSignature, nonce);

        vm.prank(alice);
        bool isValid = signer.isValidSignatureWithKeyHash(
            TEST_DIGEST,
            signature,
            aliceFaceKeyHash
        );

        assertFalse(isValid);
    }

    function test_IsValidSignatureWithKeyHash_NonceAlreadyUsed() public {
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        // Consume nonce 1
        vm.prank(alice);
        signer.consumeNonce(1);

        // Try to use nonce 1 again
        uint256 nonce = 1;
        bytes memory faceSignature = _createMockFaceSignature(alice);
        bytes memory signature = abi.encode(validLivenessProof, faceSignature, nonce);

        vm.prank(alice);
        bool isValid = signer.isValidSignatureWithKeyHash(
            TEST_DIGEST,
            signature,
            aliceFaceKeyHash
        );

        assertFalse(isValid);
    }

    function test_IsValidSignatureWithKeyHash_FaceNotEnrolled() public {
        uint256 nonce = 1;
        bytes memory faceSignature = _createMockFaceSignature(alice);
        bytes memory signature = abi.encode(validLivenessProof, faceSignature, nonce);

        vm.prank(alice);
        bool isValid = signer.isValidSignatureWithKeyHash(
            TEST_DIGEST,
            signature,
            aliceFaceKeyHash
        );

        assertFalse(isValid);
    }

    function test_IsValidSignatureWithKeyHash_RevertsWhenPaused() public {
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        signer.pause();

        uint256 nonce = 1;
        bytes memory faceSignature = _createMockFaceSignature(alice);
        bytes memory signature = abi.encode(validLivenessProof, faceSignature, nonce);

        vm.prank(alice);
        vm.expectRevert();
        signer.isValidSignatureWithKeyHash(TEST_DIGEST, signature, aliceFaceKeyHash);
    }

    /*//////////////////////////////////////////////////////////////
                            NONCE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ConsumeNonce_Success() public {
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit RecoveryExecuted(alice, 1, block.timestamp);
        signer.consumeNonce(1);

        assertEq(signer.recoveryNonces(alice), 1);
        assertEq(signer.getNextNonce(alice), 2);
    }

    function test_ConsumeNonce_RevertsIfAlreadyUsed() public {
        vm.startPrank(alice);
        signer.consumeNonce(1);

        vm.expectRevert(BiometricRecoverySignerV2.NonceAlreadyUsed.selector);
        signer.consumeNonce(1);
        vm.stopPrank();
    }

    function test_ConsumeNonce_RevertsWhenPaused() public {
        signer.pause();

        vm.prank(alice);
        vm.expectRevert();
        signer.consumeNonce(1);
    }

    function test_GetNextNonce_StartsAtOne() public view {
        assertEq(signer.getNextNonce(alice), 1);
    }

    function test_GetNextNonce_IncrementsCorrectly() public {
        vm.prank(alice);
        signer.consumeNonce(1);

        assertEq(signer.getNextNonce(alice), 2);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetLivenessVerifier_Success() public {
        MockGroth16Verifier newVerifier = new MockGroth16Verifier();

        vm.expectEmit(true, true, true, true);
        emit LivenessVerifierUpdated(address(verifier), address(newVerifier));
        signer.setLivenessVerifier(address(newVerifier));

        assertEq(address(signer.livenessVerifier()), address(newVerifier));
    }

    function test_SetLivenessVerifier_RevertsOnZeroAddress() public {
        vm.expectRevert(BiometricRecoverySignerV2.ZeroAddress.selector);
        signer.setLivenessVerifier(address(0));
    }

    function test_SetLivenessVerifier_RevertsIfNotOwner() public {
        MockGroth16Verifier newVerifier = new MockGroth16Verifier();

        vm.prank(alice);
        vm.expectRevert();
        signer.setLivenessVerifier(address(newVerifier));
    }

    function test_Pause_Success() public {
        vm.expectEmit(true, true, true, true);
        emit Paused(owner);
        signer.pause();

        assertTrue(signer.paused());
    }

    function test_Pause_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        signer.pause();
    }

    function test_Unpause_Success() public {
        signer.pause();

        vm.expectEmit(true, true, true, true);
        emit Unpaused(owner);
        signer.unpause();

        assertFalse(signer.paused());
    }

    function test_Unpause_RevertsIfNotOwner() public {
        signer.pause();

        vm.prank(alice);
        vm.expectRevert();
        signer.unpause();
    }

    /*//////////////////////////////////////////////////////////////
                            OWNERSHIP TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TransferOwnership_2Step() public {
        signer.transferOwnership(alice);
        assertEq(signer.owner(), owner);

        vm.prank(alice);
        signer.acceptOwnership();
        assertEq(signer.owner(), alice);
    }

    function test_TransferOwnership_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        signer.transferOwnership(bob);
    }

    function test_RenounceOwnership() public {
        signer.renounceOwnership();
        assertEq(signer.owner(), address(0));
    }

    /*//////////////////////////////////////////////////////////////
                            UPGRADE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpgradeToNewImplementation() public {
        BiometricRecoverySignerV2 newImpl = new BiometricRecoverySignerV2();

        vm.expectEmit(true, true, true, true);
        emit ContractUpgraded(address(signer), address(newImpl));
        signer.upgradeToAndCall(address(newImpl), "");

        // Verify state is preserved
        assertEq(address(signer.livenessVerifier()), address(verifier));
        assertEq(signer.owner(), owner);
    }

    function test_Upgrade_RevertsIfNotOwner() public {
        BiometricRecoverySignerV2 newImpl = new BiometricRecoverySignerV2();

        vm.prank(alice);
        vm.expectRevert();
        signer.upgradeToAndCall(address(newImpl), "");
    }

    function test_Upgrade_PreservesEnrollment() public {
        // Enroll face
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        // Upgrade
        BiometricRecoverySignerV2 newImpl = new BiometricRecoverySignerV2();
        signer.upgradeToAndCall(address(newImpl), "");

        // Verify enrollment is preserved
        assertEq(signer.enrolledFaceKeyHashes(alice), aliceFaceKeyHash);
        assertTrue(signer.isEnrolled(alice));
    }

    /*//////////////////////////////////////////////////////////////
                            VERSION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Version_Returns2_0_0() public view {
        assertEq(signer.version(), "2.0.0");
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _createMockFaceSignature(address /* signerAddr */)
        internal
        returns (bytes memory)
    {
        // Create a proper ECDSA signature using vm.sign
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, TEST_DIGEST);
        return abi.encodePacked(r, s, v);
    }
}
