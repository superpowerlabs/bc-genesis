// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "./BCNFT.sol";

//import "hardhat/console.sol";

contract BCGenesisToken is BCNFT {
  error OutOfBounds();

  function initialize(string memory tokenUri) public initializer {
    __BCNFTBase_init("BYTE City Genesis Token", "BCGT", tokenUri);
    _maxSupply = 10000;
  }

  function burnBatch(uint256[4] calldata tokenIds) external onlyFactory {
    for (uint256 i = 0; i < tokenIds.length; i++) {
      _burn(tokenIds[i]);
    }
  }

  function mint(address to, uint256 tokenId) external virtual onlyFactory {
    if (mintEnded() || tokenId == 0 || tokenId > maxSupply()) revert OutOfBounds();
    _safeMint(to, tokenId);
  }
}
