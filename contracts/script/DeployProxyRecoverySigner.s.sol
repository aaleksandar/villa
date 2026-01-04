// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { BiometricRecoverySignerV2 } from "../src/BiometricRecoverySignerV2.sol";

/// @title DeployProxyRecoverySigner
/// @notice Deployment script for BiometricRecoverySignerV2 with UUPS proxy
/// @dev Deploys implementation, proxy, and initializes
contract DeployProxyRecoverySigner is Script {
    /// @notice Deploy BiometricRecoverySignerV2 with custom verifier
    /// @param livenessVerifier The address of the Groth16 liveness verifier
    /// @param owner The initial owner address
    /// @return proxy The address of the deployed proxy (user interacts with this)
    /// @return implementation The address of the implementation contract
    function deployWithParams(address livenessVerifier, address owner)
        public
        returns (address proxy, address implementation)
    {
        require(livenessVerifier != address(0), "Liveness verifier cannot be zero address");
        require(owner != address(0), "Owner cannot be zero address");

        vm.startBroadcast();

        // 1. Deploy implementation contract
        BiometricRecoverySignerV2 implementationContract = new BiometricRecoverySignerV2();
        implementation = address(implementationContract);

        console2.log("Implementation deployed at:", implementation);

        // 2. Encode initialization data
        bytes memory initData = abi.encodeWithSelector(
            BiometricRecoverySignerV2.initialize.selector,
            livenessVerifier,
            owner
        );

        // 3. Deploy ERC1967Proxy pointing to implementation
        ERC1967Proxy proxyContract = new ERC1967Proxy(implementation, initData);
        proxy = address(proxyContract);

        console2.log("Proxy deployed at:", proxy);
        console2.log("Liveness Verifier:", livenessVerifier);
        console2.log("Owner:", owner);

        vm.stopBroadcast();

        // Verify initialization
        BiometricRecoverySignerV2 signer = BiometricRecoverySignerV2(proxy);
        require(
            address(signer.livenessVerifier()) == livenessVerifier,
            "Liveness verifier mismatch"
        );
        require(signer.owner() == owner, "Owner mismatch");

        console2.log("Initialization verified successfully");
        console2.log("Contract version:", signer.version());
    }

    /// @notice Standard deployment entry point with mock verifier
    /// @dev Deploys a mock verifier and uses deployer as owner
    /// @return proxy The proxy address
    /// @return implementation The implementation address
    function run() external returns (address proxy, address implementation) {
        address defaultOwner = vm.envOr("OWNER", msg.sender);

        require(defaultOwner != address(0), "Owner cannot be zero address");

        vm.startBroadcast();

        // Deploy a mock verifier for testing
        MockGroth16Verifier mockVerifier = new MockGroth16Verifier();
        address verifierAddress = address(mockVerifier);

        console2.log("Mock verifier deployed at:", verifierAddress);

        // 1. Deploy implementation contract
        BiometricRecoverySignerV2 implementationContract = new BiometricRecoverySignerV2();
        implementation = address(implementationContract);

        console2.log("Implementation deployed at:", implementation);

        // 2. Encode initialization data
        bytes memory initData = abi.encodeWithSelector(
            BiometricRecoverySignerV2.initialize.selector,
            verifierAddress,
            defaultOwner
        );

        // 3. Deploy ERC1967Proxy pointing to implementation
        ERC1967Proxy proxyContract = new ERC1967Proxy(implementation, initData);
        proxy = address(proxyContract);

        console2.log("Proxy deployed at:", proxy);
        console2.log("Liveness Verifier:", verifierAddress);
        console2.log("Owner:", defaultOwner);

        vm.stopBroadcast();

        // Verify initialization
        BiometricRecoverySignerV2 signer = BiometricRecoverySignerV2(proxy);
        require(
            address(signer.livenessVerifier()) == verifierAddress,
            "Liveness verifier mismatch"
        );
        require(signer.owner() == defaultOwner, "Owner mismatch");

        console2.log("Initialization verified successfully");
        console2.log("Contract version:", signer.version());
    }
}

/// @notice Mock Groth16 verifier for testing
/// @dev Always returns true for testing purposes
contract MockGroth16Verifier {
    /// @notice Mock verification function
    /// @return Always returns true
    function verifyProof(bytes calldata) external pure returns (bool) {
        return true;
    }
}
