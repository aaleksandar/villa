// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/// @title VillaNicknameResolverV2
/// @notice CCIP-Read compatible ENS resolver for Villa nicknames (UUPS Upgradeable)
/// @dev Points to offchain API for resolution (EIP-3668)
/// @custom:security-contact security@villa.cash
/// @custom:oz-upgrades-from VillaNicknameResolver
contract VillaNicknameResolverV2 is
    Initializable,
    Ownable2StepUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
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
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The gateway URL for offchain resolution
    string public url;

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
    /// @param _url The initial gateway URL (e.g., "https://api.villa.cash/ens/resolve")
    /// @param _owner The initial owner address
    function initialize(string memory _url, address _owner) external initializer {
        if (bytes(_url).length == 0) revert EmptyUrl();

        __Ownable2Step_init();
        __Pausable_init();

        _transferOwnership(_owner);
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
        whenNotPaused
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
        whenNotPaused
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

    /// @notice Get the current contract version
    /// @return The version string
    function version() external pure returns (string memory) {
        return "2.0.0";
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
