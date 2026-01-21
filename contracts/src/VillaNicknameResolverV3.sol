// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/// @title VillaNicknameResolverV3
/// @notice CCIP-Read ENS resolver with on-chain nickname minting (UUPS Upgradeable)
/// @dev Adds role-based access control and on-chain nickname storage
/// @custom:security-contact security@villa.cash
/// @custom:oz-upgrades-from VillaNicknameResolverV2
contract VillaNicknameResolverV3 is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    event UrlUpdated(string oldUrl, string newUrl);
    event ContractUpgraded(address indexed previousVersion, address indexed newVersion);
    event NicknameMinted(address indexed user, string nickname);
    event NicknameTransferred(address indexed from, address indexed to, string nickname);

    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    error EmptyUrl();
    error ContractPaused();
    error NicknameAlreadyMinted();
    error NicknameTaken();
    error NicknameNotOwned();
    error InvalidNickname();
    error ZeroAddress();

    string public url;
    
    mapping(address => string) public nicknames;
    mapping(bytes32 => address) public nicknameToAddress;
    
    uint256 public totalMinted;

    uint256[45] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _url, address _admin) external initializer {
        if (bytes(_url).length == 0) revert EmptyUrl();
        if (_admin == address(0)) revert ZeroAddress();

        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);

        url = _url;
        emit UrlUpdated("", _url);
    }

    function setUrl(string memory _url) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bytes(_url).length == 0) revert EmptyUrl();
        string memory oldUrl = url;
        url = _url;
        emit UrlUpdated(oldUrl, _url);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mintNickname(
        address user,
        string calldata nickname
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        _mintNickname(user, nickname);
    }

    function mintNicknameBatch(
        address[] calldata users,
        string[] calldata _nicknames
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(users.length == _nicknames.length, "Length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            _mintNickname(users[i], _nicknames[i]);
        }
    }

    function _mintNickname(address user, string calldata nickname) internal {
        if (user == address(0)) revert ZeroAddress();
        if (bytes(nickname).length == 0) revert InvalidNickname();
        if (bytes(nicknames[user]).length > 0) revert NicknameAlreadyMinted();
        
        bytes32 nicknameHash = keccak256(abi.encodePacked(_normalize(nickname)));
        if (nicknameToAddress[nicknameHash] != address(0)) revert NicknameTaken();

        nicknames[user] = nickname;
        nicknameToAddress[nicknameHash] = user;
        totalMinted++;

        emit NicknameMinted(user, nickname);
    }

    function transferNickname(address to) external whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        
        string memory nickname = nicknames[msg.sender];
        if (bytes(nickname).length == 0) revert NicknameNotOwned();
        if (bytes(nicknames[to]).length > 0) revert NicknameAlreadyMinted();

        bytes32 nicknameHash = keccak256(abi.encodePacked(_normalize(nickname)));
        
        delete nicknames[msg.sender];
        nicknames[to] = nickname;
        nicknameToAddress[nicknameHash] = to;

        emit NicknameTransferred(msg.sender, to, nickname);
    }

    function _normalize(string memory nickname) internal pure returns (string memory) {
        bytes memory b = bytes(nickname);
        bytes memory result = new bytes(b.length);
        for (uint256 i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 65 && c <= 90) {
                result[i] = bytes1(c + 32);
            } else {
                result[i] = b[i];
            }
        }
        return string(result);
    }

    function getNickname(address user) external view returns (string memory) {
        return nicknames[user];
    }

    function getAddress(string calldata nickname) external view returns (address) {
        bytes32 nicknameHash = keccak256(abi.encodePacked(_normalize(nickname)));
        return nicknameToAddress[nicknameHash];
    }

    function isNicknameAvailable(string calldata nickname) external view returns (bool) {
        bytes32 nicknameHash = keccak256(abi.encodePacked(_normalize(nickname)));
        return nicknameToAddress[nicknameHash] == address(0);
    }

    function hasMinted(address user) external view returns (bool) {
        return bytes(nicknames[user]).length > 0;
    }

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

    function resolveWithProof(bytes calldata response, bytes calldata)
        external
        view
        whenNotPaused
        returns (bytes memory)
    {
        return response;
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override(AccessControlUpgradeable) 
        returns (bool) 
    {
        return
            interfaceId == 0x9061b923 ||
            interfaceId == 0x01ffc9a7 ||
            super.supportsInterface(interfaceId);
    }

    function version() external pure returns (string memory) {
        return "3.0.0";
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {
        emit ContractUpgraded(address(this), newImplementation);
    }
}
