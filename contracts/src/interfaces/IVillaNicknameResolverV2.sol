// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IVillaNicknameResolverV2
/// @notice Interface for Villa nickname resolver with CCIP-Read support
interface IVillaNicknameResolverV2 {
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when the gateway URL is updated
    /// @param oldUrl The previous gateway URL
    /// @param newUrl The new gateway URL
    event UrlUpdated(string oldUrl, string newUrl);

    /// @notice Emitted when the contract is upgraded
    /// @param previousVersion The address of the previous implementation
    /// @param newVersion The address of the new implementation
    event ContractUpgraded(address indexed previousVersion, address indexed newVersion);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice EIP-3668 CCIP-Read error for offchain lookup
    /// @param sender The contract address performing the lookup
    /// @param urls Array of gateway URLs to query
    /// @param callData The data to send to the gateway
    /// @param callbackFunction The function selector to call with the response
    /// @param extraData Additional data to pass to the callback
    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    /// @notice Thrown when URL parameter is empty
    error EmptyUrl();

    /// @notice Thrown when contract is paused
    error ContractPaused();

    /*//////////////////////////////////////////////////////////////
                             INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Initialize the contract
    /// @param _url The initial gateway URL
    /// @param _owner The initial owner address
    function initialize(string memory _url, address _owner) external;

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the gateway URL
    /// @param _url The new gateway URL
    function setUrl(string memory _url) external;

    /// @notice Pause the contract
    function pause() external;

    /// @notice Unpause the contract
    function unpause() external;

    /*//////////////////////////////////////////////////////////////
                        RESOLUTION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Resolve a nickname to an address using CCIP-Read
    /// @param name The ENS-encoded name to resolve
    /// @param data The resolution request data
    /// @return Never returns, always reverts with OffchainLookup
    function resolve(bytes calldata name, bytes calldata data)
        external
        view
        returns (bytes memory);

    /// @notice Callback function for CCIP-Read response
    /// @param response The gateway response
    /// @param extraData The original name passed to resolve()
    /// @return The verified resolution result
    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (bytes memory);

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Check if resolver supports an interface
    /// @param interfaceId The interface identifier
    /// @return True if interface is supported
    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    /// @notice Get the current contract version
    /// @return The version string
    function version() external pure returns (string memory);

    /// @notice Get the gateway URL
    /// @return The gateway URL
    function url() external view returns (string memory);

    /// @notice Get the contract owner
    /// @return The owner address
    function owner() external view returns (address);

    /// @notice Check if contract is paused
    /// @return True if paused
    function paused() external view returns (bool);
}
