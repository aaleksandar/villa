// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { VillaNicknameResolver } from "../src/VillaNicknameResolver.sol";

/// @title DeployNicknameResolver
/// @notice Deploy VillaNicknameResolver to Base (production or testnet)
/// @dev Requires DEPLOYER_PRIVATE_KEY env var
contract DeployNicknameResolver is Script {
    /// @dev Default gateway URL for Villa API
    string constant DEFAULT_GATEWAY_URL = "https://api.villa.cash/ens/resolve";

    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Allow custom gateway URL via env var, fallback to default
        string memory gatewayUrl = vm.envOr("GATEWAY_URL", DEFAULT_GATEWAY_URL);

        console2.log("=== DEPLOYMENT CONFIG ===");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("Gateway URL:", gatewayUrl);
        console2.log("");

        // Validate gateway URL
        require(bytes(gatewayUrl).length > 0, "Gateway URL cannot be empty");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy VillaNicknameResolver
        VillaNicknameResolver resolver = new VillaNicknameResolver(gatewayUrl);
        console2.log("VillaNicknameResolver deployed to:", address(resolver));

        vm.stopBroadcast();

        // Output deployment summary
        console2.log("");
        console2.log("=== DEPLOYMENT SUMMARY ===");
        console2.log("Save to contracts/deployments/%s.json:", block.chainid);
        console2.log("");
        console2.log("{");
        console2.log('  "chainId": %s,', vm.toString(block.chainid));
        console2.log('  "network": "%s",', _getNetworkName(block.chainid));
        console2.log('  "deployer": "%s",', deployer);
        console2.log('  "timestamp": %s,', block.timestamp);
        console2.log('  "contracts": {');
        console2.log('    "VillaNicknameResolver": "%s"', address(resolver));
        console2.log("  },");
        console2.log('  "config": {');
        console2.log('    "gatewayUrl": "%s"', gatewayUrl);
        console2.log("  }");
        console2.log("}");
        console2.log("===========================");
    }

    /// @dev Get human-readable network name from chain ID
    function _getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 8453) return "base";
        if (chainId == 84532) return "base-sepolia";
        if (chainId == 31337) return "anvil";
        return "unknown";
    }
}
