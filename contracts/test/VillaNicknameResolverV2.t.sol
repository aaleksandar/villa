// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test, console2 } from "forge-std/Test.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { VillaNicknameResolverV2 } from "../src/VillaNicknameResolverV2.sol";
import { VillaNicknameResolver } from "../src/VillaNicknameResolver.sol";

contract VillaNicknameResolverV2Test is Test {
    VillaNicknameResolverV2 public resolver;
    VillaNicknameResolverV2 public implementation;
    address public owner;
    address public alice;
    address public bob;

    string constant INITIAL_URL = "https://api.villa.cash/ens/resolve";
    string constant NEW_URL = "https://api2.villa.cash/ens/resolve";

    event UrlUpdated(string oldUrl, string newUrl);
    event ContractUpgraded(address indexed previousVersion, address indexed newVersion);
    event Paused(address account);
    event Unpaused(address account);

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");

        // Deploy implementation
        implementation = new VillaNicknameResolverV2();

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            VillaNicknameResolverV2.initialize.selector,
            INITIAL_URL,
            owner
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);

        // Wrap proxy with interface
        resolver = VillaNicknameResolverV2(address(proxy));
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialize_SetsInitialUrl() public view {
        assertEq(resolver.url(), INITIAL_URL);
    }

    function test_Initialize_SetsOwner() public view {
        assertEq(resolver.owner(), owner);
    }

    function test_Initialize_RevertsOnEmptyUrl() public {
        VillaNicknameResolverV2 newImpl = new VillaNicknameResolverV2();

        bytes memory initData = abi.encodeWithSelector(
            VillaNicknameResolverV2.initialize.selector,
            "",
            owner
        );

        vm.expectRevert(VillaNicknameResolverV2.EmptyUrl.selector);
        new ERC1967Proxy(address(newImpl), initData);
    }

    function test_Initialize_CannotBeCalledTwice() public {
        vm.expectRevert();
        resolver.initialize(NEW_URL, alice);
    }

    function test_Initialize_EmitsUrlUpdated() public {
        VillaNicknameResolverV2 newImpl = new VillaNicknameResolverV2();

        bytes memory initData = abi.encodeWithSelector(
            VillaNicknameResolverV2.initialize.selector,
            INITIAL_URL,
            owner
        );

        vm.expectEmit(true, true, true, true);
        emit UrlUpdated("", INITIAL_URL);
        new ERC1967Proxy(address(newImpl), initData);
    }

    /*//////////////////////////////////////////////////////////////
                            SET URL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetUrl_UpdatesUrl() public {
        resolver.setUrl(NEW_URL);
        assertEq(resolver.url(), NEW_URL);
    }

    function test_SetUrl_EmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit UrlUpdated(INITIAL_URL, NEW_URL);
        resolver.setUrl(NEW_URL);
    }

    function test_SetUrl_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        resolver.setUrl(NEW_URL);
    }

    function test_SetUrl_RevertsOnEmptyUrl() public {
        vm.expectRevert(VillaNicknameResolverV2.EmptyUrl.selector);
        resolver.setUrl("");
    }

    /*//////////////////////////////////////////////////////////////
                            PAUSE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Pause_PausesContract() public {
        resolver.pause();
        assertTrue(resolver.paused());
    }

    function test_Pause_EmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit Paused(owner);
        resolver.pause();
    }

    function test_Pause_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        resolver.pause();
    }

    function test_Unpause_UnpausesContract() public {
        resolver.pause();
        resolver.unpause();
        assertFalse(resolver.paused());
    }

    function test_Unpause_EmitsEvent() public {
        resolver.pause();
        vm.expectEmit(true, true, true, true);
        emit Unpaused(owner);
        resolver.unpause();
    }

    function test_Unpause_RevertsIfNotOwner() public {
        resolver.pause();
        vm.prank(alice);
        vm.expectRevert();
        resolver.unpause();
    }

    /*//////////////////////////////////////////////////////////////
                            RESOLVE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Resolve_RevertsWithOffchainLookup() public {
        bytes memory name = abi.encode("alice.villa.eth");
        bytes memory data = abi.encodeWithSignature("addr(bytes32)", bytes32(0));

        // We expect a revert with OffchainLookup, verify using try/catch
        try resolver.resolve(name, data) {
            fail("Should have reverted with OffchainLookup");
        } catch (bytes memory reason) {
            // Verify it's an OffchainLookup error by checking the selector
            bytes4 selector = bytes4(reason);
            assertEq(selector, VillaNicknameResolverV2.OffchainLookup.selector);
        }
    }

    function test_Resolve_RevertsWhenPaused() public {
        resolver.pause();

        bytes memory name = abi.encode("alice.villa.eth");
        bytes memory data = abi.encodeWithSignature("addr(bytes32)", bytes32(0));

        vm.expectRevert();
        resolver.resolve(name, data);
    }

    /*//////////////////////////////////////////////////////////////
                        RESOLVE WITH PROOF TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ResolveWithProof_ReturnsResponse() public view {
        bytes memory response = abi.encode(address(alice));
        bytes memory extraData = abi.encode("alice.villa.eth");

        bytes memory result = resolver.resolveWithProof(response, extraData);
        assertEq(result, response);
    }

    function test_ResolveWithProof_WorksWithEmptyResponse() public view {
        bytes memory response = "";
        bytes memory extraData = abi.encode("unknown.villa.eth");

        bytes memory result = resolver.resolveWithProof(response, extraData);
        assertEq(result, response);
    }

    function test_ResolveWithProof_RevertsWhenPaused() public {
        resolver.pause();

        bytes memory response = abi.encode(address(alice));
        bytes memory extraData = abi.encode("alice.villa.eth");

        vm.expectRevert();
        resolver.resolveWithProof(response, extraData);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERFACE SUPPORT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SupportsInterface_IExtendedResolver() public view {
        // IExtendedResolver interface ID (CCIP-Read)
        assertTrue(resolver.supportsInterface(0x9061b923));
    }

    function test_SupportsInterface_ERC165() public view {
        // ERC-165 interface ID
        assertTrue(resolver.supportsInterface(0x01ffc9a7));
    }

    function test_SupportsInterface_InvalidInterface() public view {
        assertFalse(resolver.supportsInterface(0xffffffff));
    }

    /*//////////////////////////////////////////////////////////////
                            OWNERSHIP TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TransferOwnership_2Step() public {
        resolver.transferOwnership(alice);
        // Ownership not transferred yet (2-step)
        assertEq(resolver.owner(), owner);

        vm.prank(alice);
        resolver.acceptOwnership();
        // Now ownership is transferred
        assertEq(resolver.owner(), alice);
    }

    function test_TransferOwnership_RevertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        resolver.transferOwnership(bob);
    }

    function test_RenounceOwnership() public {
        resolver.renounceOwnership();
        assertEq(resolver.owner(), address(0));
    }

    /*//////////////////////////////////////////////////////////////
                            UPGRADE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpgradeToNewImplementation() public {
        // Deploy new implementation
        VillaNicknameResolverV2 newImpl = new VillaNicknameResolverV2();

        // Upgrade through proxy
        vm.expectEmit(true, true, true, true);
        emit ContractUpgraded(address(resolver), address(newImpl));
        resolver.upgradeToAndCall(address(newImpl), "");

        // Verify state is preserved
        assertEq(resolver.url(), INITIAL_URL);
        assertEq(resolver.owner(), owner);
    }

    function test_Upgrade_RevertsIfNotOwner() public {
        VillaNicknameResolverV2 newImpl = new VillaNicknameResolverV2();

        vm.prank(alice);
        vm.expectRevert();
        resolver.upgradeToAndCall(address(newImpl), "");
    }

    function test_Upgrade_PreservesState() public {
        // Modify state
        resolver.setUrl(NEW_URL);
        resolver.pause();

        // Deploy and upgrade to new implementation
        VillaNicknameResolverV2 newImpl = new VillaNicknameResolverV2();
        resolver.upgradeToAndCall(address(newImpl), "");

        // Verify state is preserved
        assertEq(resolver.url(), NEW_URL);
        assertTrue(resolver.paused());
        assertEq(resolver.owner(), owner);
    }

    /*//////////////////////////////////////////////////////////////
                            VERSION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Version_Returns2_0_0() public view {
        assertEq(resolver.version(), "2.0.0");
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE PATH TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpgradeFromV1ToV2() public {
        // Deploy V1 contract
        VillaNicknameResolver v1 = new VillaNicknameResolver(INITIAL_URL);

        // V1 has owner and url set
        assertEq(v1.owner(), address(this));
        assertEq(v1.url(), INITIAL_URL);

        // Deploy V2 with same initial state via proxy
        VillaNicknameResolverV2 v2Impl = new VillaNicknameResolverV2();
        bytes memory initData = abi.encodeWithSelector(
            VillaNicknameResolverV2.initialize.selector,
            INITIAL_URL,
            address(this)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(v2Impl), initData);
        VillaNicknameResolverV2 v2 = VillaNicknameResolverV2(address(proxy));

        // V2 should have same state as V1
        assertEq(v2.owner(), v1.owner());
        assertEq(v2.url(), v1.url());

        // V2 has additional features (pause)
        v2.pause();
        assertTrue(v2.paused());

        // V2 has version function
        assertEq(v2.version(), "2.0.0");
    }
}
