//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// This is the main building block for smart contracts.
contract Item is ERC721 {
    // This is the constructor whose code is
    // run only when the contract is created.
    constructor() ERC721("Item", "ITM") {}

    // This is the mint function.
    function mint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

}
