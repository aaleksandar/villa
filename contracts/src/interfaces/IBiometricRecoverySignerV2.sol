// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IExternalSigner } from "./IExternalSigner.sol";

/// @title IBiometricRecoverySignerV2
/// @notice Interface for biometric recovery signer with face-based authentication
interface IBiometricRecoverySignerV2 is IExternalSigner {
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
                             INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Initialize the contract
    /// @param _livenessVerifier Address of the liveness verifier
    /// @param _owner The initial owner address
    function initialize(address _livenessVerifier, address _owner) external;

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the liveness verifier contract
    /// @param _newVerifier Address of the new verifier
    function setLivenessVerifier(address _newVerifier) external;

    /// @notice Pause the contract
    function pause() external;

    /// @notice Unpause the contract
    function unpause() external;

    /*//////////////////////////////////////////////////////////////
                            ENROLLMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Enroll a face-derived key hash for an account
    /// @param faceKeyHash The keccak256 hash of the face-derived public key
    /// @param livenessProof ZK proof that face capture was live
    function enrollFace(bytes32 faceKeyHash, bytes calldata livenessProof) external;

    /// @notice Revoke face enrollment
    function revokeFace() external;

    /// @notice Update face enrollment (revoke and re-enroll)
    /// @param newFaceKeyHash The new face-derived key hash
    /// @param livenessProof ZK proof for new face capture
    function updateFace(bytes32 newFaceKeyHash, bytes calldata livenessProof) external;

    /*//////////////////////////////////////////////////////////////
                        SIGNATURE VERIFICATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Consume a nonce after successful recovery
    /// @param nonce The nonce that was used
    function consumeNonce(uint256 nonce) external;

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Check if an account has face recovery enrolled
    /// @param account The account address to check
    /// @return True if enrolled, false otherwise
    function isEnrolled(address account) external view returns (bool);

    /// @notice Get the next valid nonce for an account
    /// @param account The account address to check
    /// @return The next valid nonce
    function getNextNonce(address account) external view returns (uint256);

    /// @notice Get the current contract version
    /// @return The version string
    function version() external pure returns (string memory);

    /// @notice Get the liveness verifier address
    /// @return The verifier address
    function livenessVerifier() external view returns (address);

    /// @notice Get enrolled face key hash for an account
    /// @param account The account address
    /// @return The face key hash
    function enrolledFaceKeyHashes(address account) external view returns (bytes32);

    /// @notice Get recovery nonce for an account
    /// @param account The account address
    /// @return The current nonce
    function recoveryNonces(address account) external view returns (uint256);

    /// @notice Get enrollment timestamp for an account
    /// @param account The account address
    /// @return The enrollment timestamp
    function enrollmentTimestamps(address account) external view returns (uint256);

    /// @notice Get the contract owner
    /// @return The owner address
    function owner() external view returns (address);

    /// @notice Check if contract is paused
    /// @return True if paused
    function paused() external view returns (bool);
}
