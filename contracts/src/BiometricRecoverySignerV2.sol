// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { IExternalSigner } from "./interfaces/IExternalSigner.sol";
import { IGroth16Verifier } from "./interfaces/IGroth16Verifier.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title BiometricRecoverySignerV2
/// @notice External key type for Porto that enables face-based account recovery (UUPS Upgradeable)
/// @dev Verifies ZK liveness proofs from Bionetta and face-derived ECDSA signatures
/// @custom:security-contact security@villa.cash
/// @custom:oz-upgrades-from BiometricRecoverySigner
contract BiometricRecoverySignerV2 is
    Initializable,
    Ownable2StepUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    IExternalSigner
{
    using ECDSA for bytes32;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a face is enrolled for an account
    /// @param account The account address
    /// @param faceKeyHash The hash of the face-derived key
    /// @param timestamp The enrollment timestamp
    event FaceEnrolled(address indexed account, bytes32 indexed faceKeyHash, uint256 timestamp);

    /// @notice Emitted when a face enrollment is revoked
    /// @param account The account address
    /// @param faceKeyHash The hash of the revoked face key
    /// @param timestamp The revocation timestamp
    event FaceRevoked(address indexed account, bytes32 indexed faceKeyHash, uint256 timestamp);

    /// @notice Emitted when recovery is executed
    /// @param account The account address
    /// @param nonce The nonce used for recovery
    /// @param timestamp The recovery timestamp
    event RecoveryExecuted(address indexed account, uint256 indexed nonce, uint256 timestamp);

    /// @notice Emitted when the liveness verifier is updated
    /// @param oldVerifier The previous verifier address
    /// @param newVerifier The new verifier address
    event LivenessVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    /// @notice Emitted when the contract is upgraded
    /// @param previousVersion The address of the previous implementation
    /// @param newVersion The address of the new implementation
    event ContractUpgraded(address indexed previousVersion, address indexed newVersion);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when liveness proof verification fails
    error InvalidLivenessProof();

    /// @notice Thrown when face signature verification fails
    error InvalidFaceSignature();

    /// @notice Thrown when nonce has already been used
    error NonceAlreadyUsed();

    /// @notice Thrown when face is not enrolled
    error FaceNotEnrolled();

    /// @notice Thrown when face is already enrolled
    error FaceAlreadyEnrolled();

    /// @notice Thrown when zero address is provided
    error ZeroAddress();

    /// @notice Thrown when contract is paused
    error ContractPaused();

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The Groth16 verifier for liveness proofs
    IGroth16Verifier public livenessVerifier;

    /// @notice Maps account => face-derived key hash (from fuzzy extractor)
    mapping(address account => bytes32 faceKeyHash) public enrolledFaceKeyHashes;

    /// @notice Maps account => last used nonce (prevents replay)
    mapping(address account => uint256 nonce) public recoveryNonces;

    /// @notice Maps account => enrollment timestamp (for audit)
    mapping(address account => uint256 timestamp) public enrollmentTimestamps;

    /// @dev Storage gap for future upgrades (50 slots reserved)
    uint256[50] private __gap;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /*//////////////////////////////////////////////////////////////
                             INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Initialize the contract (replaces constructor for upgradeable contracts)
    /// @param _livenessVerifier Address of deployed Groth16 liveness verifier
    /// @param _owner The initial owner address
    function initialize(address _livenessVerifier, address _owner) external initializer {
        if (_livenessVerifier == address(0)) revert ZeroAddress();

        __Ownable2Step_init();
        __Pausable_init();

        _transferOwnership(_owner);
        livenessVerifier = IGroth16Verifier(_livenessVerifier);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the liveness verifier contract
    /// @param _newVerifier Address of the new verifier contract
    function setLivenessVerifier(address _newVerifier) external onlyOwner {
        if (_newVerifier == address(0)) revert ZeroAddress();
        address oldVerifier = address(livenessVerifier);
        livenessVerifier = IGroth16Verifier(_newVerifier);
        emit LivenessVerifierUpdated(oldVerifier, _newVerifier);
    }

    /// @notice Pause the contract (emergency stop)
    /// @dev Only owner can pause
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract
    /// @dev Only owner can unpause
    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                            ENROLLMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Enroll a face-derived key hash for an account
    /// @dev Must be called by the account itself (via Porto execute)
    /// @param faceKeyHash The keccak256 hash of the face-derived public key
    /// @param livenessProof ZK proof that face capture was live
    function enrollFace(bytes32 faceKeyHash, bytes calldata livenessProof)
        external
        whenNotPaused
    {
        address account = msg.sender;

        if (enrolledFaceKeyHashes[account] != bytes32(0)) {
            revert FaceAlreadyEnrolled();
        }

        if (!_verifyLiveness(livenessProof)) {
            revert InvalidLivenessProof();
        }

        enrolledFaceKeyHashes[account] = faceKeyHash;
        enrollmentTimestamps[account] = block.timestamp;

        emit FaceEnrolled(account, faceKeyHash, block.timestamp);
    }

    /// @notice Revoke face enrollment (owner only, via Porto execute)
    function revokeFace() external whenNotPaused {
        address account = msg.sender;
        bytes32 oldHash = enrolledFaceKeyHashes[account];

        if (oldHash == bytes32(0)) {
            revert FaceNotEnrolled();
        }

        delete enrolledFaceKeyHashes[account];
        delete enrollmentTimestamps[account];

        emit FaceRevoked(account, oldHash, block.timestamp);
    }

    /// @notice Update face enrollment (revoke and re-enroll in one tx)
    /// @param newFaceKeyHash The new face-derived key hash
    /// @param livenessProof ZK proof for new face capture
    function updateFace(bytes32 newFaceKeyHash, bytes calldata livenessProof)
        external
        whenNotPaused
    {
        address account = msg.sender;

        if (!_verifyLiveness(livenessProof)) {
            revert InvalidLivenessProof();
        }

        bytes32 oldHash = enrolledFaceKeyHashes[account];
        enrolledFaceKeyHashes[account] = newFaceKeyHash;
        enrollmentTimestamps[account] = block.timestamp;

        if (oldHash != bytes32(0)) {
            emit FaceRevoked(account, oldHash, block.timestamp);
        }
        emit FaceEnrolled(account, newFaceKeyHash, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                        SIGNATURE VERIFICATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Verify signature for Porto External key type
    /// @dev Called by Porto account during recovery authorization
    /// @param digest The EIP-712 digest that was signed
    /// @param signature Packed: abi.encode(livenessProof, faceSignature, nonce)
    /// @param keyHash The key hash registered in Porto (should match enrolledFaceKeyHash)
    function isValidSignatureWithKeyHash(
        bytes32 digest,
        bytes calldata signature,
        bytes32 keyHash
    ) external view override whenNotPaused returns (bool) {
        address account = msg.sender;

        // Decode packed signature
        (bytes memory livenessProof, bytes memory faceSignature, uint256 nonce) =
            abi.decode(signature, (bytes, bytes, uint256));

        // Verify liveness proof
        if (!_verifyLiveness(livenessProof)) {
            return false;
        }

        // Verify nonce is greater than last used (prevents replay)
        if (nonce <= recoveryNonces[account]) {
            return false;
        }

        // Verify the keyHash matches enrolled face
        bytes32 enrolledHash = enrolledFaceKeyHashes[account];
        if (enrolledHash == bytes32(0) || enrolledHash != keyHash) {
            return false;
        }

        // Verify ECDSA signature from face-derived key
        return _verifyFaceSignature(digest, faceSignature, enrolledHash);
    }

    /// @notice Consume a nonce after successful recovery (called by account)
    /// @param nonce The nonce that was used
    function consumeNonce(uint256 nonce) external whenNotPaused {
        address account = msg.sender;
        if (nonce <= recoveryNonces[account]) {
            revert NonceAlreadyUsed();
        }
        recoveryNonces[account] = nonce;
        emit RecoveryExecuted(account, nonce, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Check if an account has face recovery enrolled
    /// @param account The account address to check
    /// @return True if enrolled, false otherwise
    function isEnrolled(address account) external view returns (bool) {
        return enrolledFaceKeyHashes[account] != bytes32(0);
    }

    /// @notice Get the next valid nonce for an account
    /// @param account The account address to check
    /// @return The next valid nonce
    function getNextNonce(address account) external view returns (uint256) {
        return recoveryNonces[account] + 1;
    }

    /// @notice Get the current contract version
    /// @return The version string
    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @dev Verify ZK liveness proof via Groth16 verifier
    /// @param proof The proof bytes to verify
    /// @return True if proof is valid, false otherwise
    function _verifyLiveness(bytes memory proof) internal view returns (bool) {
        if (proof.length < 4) {
            return false; // Minimum valid proof size for prefix check
        }

        try livenessVerifier.verifyProof(proof) returns (bool isValid) {
            return isValid;
        } catch {
            return false;
        }
    }

    /// @dev Verify ECDSA signature against enrolled face key hash
    /// @param digest The digest that was signed
    /// @param signature The ECDSA signature
    /// @param expectedKeyHash The expected key hash
    /// @return True if signature is valid, false otherwise
    function _verifyFaceSignature(
        bytes32 digest,
        bytes memory signature,
        bytes32 expectedKeyHash
    ) internal pure returns (bool) {
        // Recover signer from ECDSA signature
        (address recovered, ECDSA.RecoverError error,) = digest.tryRecover(signature);

        if (error != ECDSA.RecoverError.NoError) {
            return false;
        }

        // Hash recovered address and compare to enrolled key hash
        bytes32 recoveredHash = keccak256(abi.encode(recovered));
        return recoveredHash == expectedKeyHash;
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE AUTHORIZATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Authorize upgrade to new implementation
    /// @dev Only owner can authorize upgrades
    /// @param newImplementation Address of the new implementation contract
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {
        emit ContractUpgraded(address(this), newImplementation);
    }
}
