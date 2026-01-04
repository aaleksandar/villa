// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { VillaNicknameResolverV2 } from "../src/VillaNicknameResolverV2.sol";

/// @title DeployProxyNicknameResolver
/// @notice Deployment script for VillaNicknameResolverV2 with UUPS proxy
/// @dev Deploys implementation, proxy, and initializes
contract DeployProxyNicknameResolver is Script {
    /// @notice Deploy VillaNicknameResolverV2 with proxy (custom params)
    /// @param gatewayUrl The initial gateway URL for CCIP-Read
    /// @param owner The initial owner address
    /// @return proxy The address of the deployed proxy (user interacts with this)
    /// @return implementation The address of the implementation contract
    function deployWithParams(string memory gatewayUrl, address owner)
        public
        returns (address proxy, address implementation)
    {
        require(bytes(gatewayUrl).length > 0, "Gateway URL cannot be empty");
        require(owner != address(0), "Owner cannot be zero address");

        vm.startBroadcast();

        // 1. Deploy implementation contract
        VillaNicknameResolverV2 implementationContract = new VillaNicknameResolverV2();
        implementation = address(implementationContract);

        console2.log("Implementation deployed at:", implementation);

        // 2. Encode initialization data
        bytes memory initData = abi.encodeWithSelector(
            VillaNicknameResolverV2.initialize.selector,
            gatewayUrl,
            owner
        );

        // 3. Deploy ERC1967Proxy pointing to implementation
        ERC1967Proxy proxyContract = new ERC1967Proxy(implementation, initData);
        proxy = address(proxyContract);

        console2.log("Proxy deployed at:", proxy);
        console2.log("Gateway URL:", gatewayUrl);
        console2.log("Owner:", owner);

        vm.stopBroadcast();

        // Verify initialization
        VillaNicknameResolverV2 resolver = VillaNicknameResolverV2(proxy);
        require(
            keccak256(bytes(resolver.url())) == keccak256(bytes(gatewayUrl)),
            "Gateway URL mismatch"
        );
        require(resolver.owner() == owner, "Owner mismatch");

        console2.log("Initialization verified successfully");
        console2.log("Contract version:", resolver.version());
    }

    /// @notice Deploy with default parameters (Villa API, deployer as owner)
    /// @dev Standard entry point for forge script
    /// @return proxy The proxy address
    /// @return implementation The implementation address
    function run() external returns (address proxy, address implementation) {
        string memory defaultUrl = "https://api.villa.cash/ens/resolve";
        address defaultOwner = vm.envOr("OWNER", msg.sender);

        require(bytes(defaultUrl).length > 0, "Gateway URL cannot be empty");
        require(defaultOwner != address(0), "Owner cannot be zero address");

        vm.startBroadcast();

        // 1. Deploy implementation contract
        VillaNicknameResolverV2 implementationContract = new VillaNicknameResolverV2();
        implementation = address(implementationContract);

        console2.log("Implementation deployed at:", implementation);

        // 2. Encode initialization data
        bytes memory initData = abi.encodeWithSelector(
            VillaNicknameResolverV2.initialize.selector,
            defaultUrl,
            defaultOwner
        );

        // 3. Deploy ERC1967Proxy pointing to implementation
        ERC1967Proxy proxyContract = new ERC1967Proxy(implementation, initData);
        proxy = address(proxyContract);

        console2.log("Proxy deployed at:", proxy);
        console2.log("Gateway URL:", defaultUrl);
        console2.log("Owner:", defaultOwner);

        vm.stopBroadcast();

        // Verify initialization
        VillaNicknameResolverV2 resolver = VillaNicknameResolverV2(proxy);
        require(
            keccak256(bytes(resolver.url())) == keccak256(bytes(defaultUrl)),
            "Gateway URL mismatch"
        );
        require(resolver.owner() == defaultOwner, "Owner mismatch");

        console2.log("Initialization verified successfully");
        console2.log("Contract version:", resolver.version());
    }
}
