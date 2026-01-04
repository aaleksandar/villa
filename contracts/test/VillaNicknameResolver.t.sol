// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test, console2 } from "forge-std/Test.sol";
import { VillaNicknameResolver } from "../src/VillaNicknameResolver.sol";

contract VillaNicknameResolverTest is Test {
    VillaNicknameResolver public resolver;
    address public owner;
    address public alice;

    string constant INITIAL_URL = "https://api.villa.cash/ens/resolve";
    string constant NEW_URL = "https://api2.villa.cash/ens/resolve";

    event UrlUpdated(string oldUrl, string newUrl);

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        resolver = new VillaNicknameResolver(INITIAL_URL);
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Constructor_SetsInitialUrl() public view {
        assertEq(resolver.url(), INITIAL_URL);
    }

    function test_Constructor_SetsOwner() public view {
        assertEq(resolver.owner(), owner);
    }

    function test_Constructor_RevertsOnEmptyUrl() public {
        vm.expectRevert(VillaNicknameResolver.EmptyUrl.selector);
        new VillaNicknameResolver("");
    }

    function test_Constructor_EmitsUrlUpdated() public {
        vm.expectEmit(true, true, true, true);
        emit UrlUpdated("", INITIAL_URL);
        new VillaNicknameResolver(INITIAL_URL);
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
        vm.expectRevert(VillaNicknameResolver.EmptyUrl.selector);
        resolver.setUrl("");
    }

    /*//////////////////////////////////////////////////////////////
                            RESOLVE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Resolve_RevertsWithOffchainLookup() public {
        bytes memory name = abi.encode("alice.villa.eth");
        bytes memory data = abi.encodeWithSignature("addr(bytes32)", bytes32(0));

        vm.expectRevert(); // We expect a revert, specific type checked below
        try resolver.resolve(name, data) {
            fail("Should have reverted with OffchainLookup");
        } catch (bytes memory reason) {
            // Verify it's an OffchainLookup error by checking the selector
            bytes4 selector = bytes4(reason);
            assertEq(selector, VillaNicknameResolver.OffchainLookup.selector);
        }
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

    function test_TransferOwnership() public {
        resolver.transferOwnership(alice);
        assertEq(resolver.owner(), alice);
    }

    function test_RenounceOwnership() public {
        resolver.renounceOwnership();
        assertEq(resolver.owner(), address(0));
    }
}
