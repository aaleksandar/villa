// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { VillaNicknameResolverV3 } from "../src/VillaNicknameResolverV3.sol";

/// @title DeployProxyNicknameResolverV3
/// @notice Deployment script for VillaNicknameResolverV3 with UUPS proxy
/// @dev Deploys implementation, proxy, and initializes with AccessControl roles
contract DeployProxyNicknameResolverV3 is Script {
    /// @notice Deploy VillaNicknameResolverV3 with proxy (custom params)
    /// @param gatewayUrl The initial gateway URL for CCIP-Read
    /// @param admin The initial admin address (receives all roles)
    /// @return proxy The address of the deployed proxy (user interacts with this)
    /// @return implementation The address of the implementation contract
    function deployWithParams(string memory gatewayUrl, address admin)
        public
        returns (address proxy, address implementation)
    {
        require(bytes(gatewayUrl).length > 0, "Gateway URL cannot be empty");
        require(admin != address(0), "Admin cannot be zero address");

        vm.startBroadcast();

        // 1. Deploy implementation contract
        VillaNicknameResolverV3 implementationContract = new VillaNicknameResolverV3();
        implementation = address(implementationContract);

        console2.log("Implementation deployed at:", implementation);

        // 2. Encode initialization data
        bytes memory initData = abi.encodeWithSelector(
            VillaNicknameResolverV3.initialize.selector,
            gatewayUrl,
            admin
        );

        // 3. Deploy ERC1967Proxy pointing to implementation
        ERC1967Proxy proxyContract = new ERC1967Proxy(implementation, initData);
        proxy = address(proxyContract);

        console2.log("Proxy deployed at:", proxy);
        console2.log("Gateway URL:", gatewayUrl);
        console2.log("Admin:", admin);

        vm.stopBroadcast();

        // Verify initialization
        VillaNicknameResolverV3 resolver = VillaNicknameResolverV3(proxy);
        require(
            keccak256(bytes(resolver.url())) == keccak256(bytes(gatewayUrl)),
            "Gateway URL mismatch"
        );
        require(resolver.hasRole(resolver.DEFAULT_ADMIN_ROLE(), admin), "Admin role not set");
        require(resolver.hasRole(resolver.MINTER_ROLE(), admin), "Minter role not set");
        require(resolver.hasRole(resolver.UPGRADER_ROLE(), admin), "Upgrader role not set");
        require(resolver.hasRole(resolver.PAUSER_ROLE(), admin), "Pauser role not set");

        console2.log("Initialization verified successfully");
        console2.log("Contract version:", resolver.version());
    }

    /// @notice Deploy with default parameters (Villa API, deployer as admin)
    /// @dev Standard entry point for forge script
    /// @return proxy The proxy address
    /// @return implementation The implementation address
    function run() external returns (address proxy, address implementation) {
        string memory defaultUrl = "https://api.villa.cash/ens/resolve";
        address defaultAdmin = vm.envOr("OWNER", msg.sender);

        require(bytes(defaultUrl).length > 0, "Gateway URL cannot be empty");
        require(defaultAdmin != address(0), "Admin cannot be zero address");

        vm.startBroadcast();

        // 1. Deploy implementation contract
        VillaNicknameResolverV3 implementationContract = new VillaNicknameResolverV3();
        implementation = address(implementationContract);

        console2.log("Implementation deployed at:", implementation);

        // 2. Encode initialization data
        bytes memory initData = abi.encodeWithSelector(
            VillaNicknameResolverV3.initialize.selector,
            defaultUrl,
            defaultAdmin
        );

        // 3. Deploy ERC1967Proxy pointing to implementation
        ERC1967Proxy proxyContract = new ERC1967Proxy(implementation, initData);
        proxy = address(proxyContract);

        console2.log("Proxy deployed at:", proxy);
        console2.log("Gateway URL:", defaultUrl);
        console2.log("Admin:", defaultAdmin);

        vm.stopBroadcast();

        // Verify initialization
        VillaNicknameResolverV3 resolver = VillaNicknameResolverV3(proxy);
        require(
            keccak256(bytes(resolver.url())) == keccak256(bytes(defaultUrl)),
            "Gateway URL mismatch"
        );
        require(resolver.hasRole(resolver.DEFAULT_ADMIN_ROLE(), defaultAdmin), "Admin role not set");
        require(resolver.hasRole(resolver.MINTER_ROLE(), defaultAdmin), "Minter role not set");

        console2.log("Initialization verified successfully");
        console2.log("Contract version:", resolver.version());
    }
}
