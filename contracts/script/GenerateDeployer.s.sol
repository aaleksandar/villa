// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";

/**
 * @title GenerateDeployer
 * @notice Generate a new deployer wallet for Base Sepolia
 * @dev Run locally: forge script script/GenerateDeployer.s.sol -vvvv
 *
 * WARNING: This generates a private key. Handle with extreme care!
 * - Never commit to version control
 * - Store in secure location
 * - Use only for testnet
 */
contract GenerateDeployer is Script {
    function run() external {
        // Generate a new wallet using Foundry's built-in randomness
        uint256 privateKey = vm.randomUint();
        address deployer = vm.addr(privateKey);

        console2.log("=== NEW DEPLOYER WALLET ===");
        console2.log("");
        console2.log("Address:", deployer);
        console2.log("");
        console2.log("Private Key (KEEP SECRET!):");
        console2.log(vm.toString(bytes32(privateKey)));
        console2.log("");
        console2.log("=== NEXT STEPS ===");
        console2.log("1. Fund with Base Sepolia ETH from faucet:");
        console2.log("   https://www.alchemy.com/faucets/base-sepolia");
        console2.log("   https://faucet.quicknode.com/base/sepolia");
        console2.log("");
        console2.log("2. Add to .env (DO NOT COMMIT!):");
        console2.log("   DEPLOYER_PRIVATE_KEY=<key above>");
        console2.log("");
        console2.log("3. Deploy contracts:");
        console2.log("   forge script script/DeployProxyNicknameResolver.s.sol \\");
        console2.log("     --rpc-url base-sepolia --broadcast --verify");
        console2.log("");
        console2.log("4. Verify in GitHub Actions:");
        console2.log("   Add DEPLOYER_PRIVATE_KEY to GitHub Secrets");
        console2.log("=========================");
    }
}
