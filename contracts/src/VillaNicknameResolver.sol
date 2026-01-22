// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title VillaNicknameResolver
/// @notice CCIP-Read compatible ENS resolver for Villa nicknames
/// @dev Points to offchain API for resolution (EIP-3668)
/// @custom:security-contact security@villa.cash
contract VillaNicknameResolver is Ownable {
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when the gateway URL is updated
    event UrlUpdated(string oldUrl, string newUrl);

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

    error EmptyUrl();

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The gateway URL for offchain resolution
    string public url;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @param _url The initial gateway URL (e.g., "https://api.villa.cash/ens/resolve")
    constructor(string memory _url) Ownable(msg.sender) {
        if (bytes(_url).length == 0) revert EmptyUrl();
        url = _url;
        emit UrlUpdated("", _url);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the gateway URL
    /// @param _url The new gateway URL
    function setUrl(string memory _url) external onlyOwner {
        if (bytes(_url).length == 0) revert EmptyUrl();
        string memory oldUrl = url;
        url = _url;
        emit UrlUpdated(oldUrl, _url);
    }

    /*//////////////////////////////////////////////////////////////
                        RESOLUTION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Resolve a nickname to an address using CCIP-Read
    /// @dev Reverts with OffchainLookup to trigger gateway query
    /// @param name The ENS-encoded name to resolve
    /// @param data The resolution request data
    /// @return Never returns, always reverts with OffchainLookup
    function resolve(bytes calldata name, bytes calldata data)
        external
        view
        returns (bytes memory)
    {
        string[] memory urls = new string[](1);
        urls[0] = url;

        revert OffchainLookup(
            address(this),
            urls,
            data,
            this.resolveWithProof.selector,
            name
        );
    }

    /// @notice Callback function for CCIP-Read response
    /// @dev Called by client after fetching data from gateway
    /// @param response The gateway response (signed data)
    /// @param extraData The original name passed to resolve()
    /// @return The verified resolution result
    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (bytes memory)
    {
        // In a production implementation, this would verify a signature
        // from the gateway to ensure data integrity. For now, we trust
        // the gateway as it's controlled by Villa.
        // TODO: Add signature verification when gateway signing is implemented
        return response;
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Check if resolver supports an interface
    /// @param interfaceId The interface identifier
    /// @return True if interface is supported
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return
            interfaceId == 0x9061b923 || // IExtendedResolver (CCIP-Read)
            interfaceId == 0x01ffc9a7; // ERC-165
    }
}
