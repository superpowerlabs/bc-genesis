// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "@openzeppelin/contracts/utils/Counters.sol";
import "./BCNFT.sol";

//import "hardhat/console.sol";

contract BCGenesisToken is BCNFT {
  using Counters for Counters.Counter;

  Counters.Counter private _tokenIdCounter;

  function initialize(string memory tokenUri) public initializer {
    __BCNFTBase_init("BYTE CITY Genesis Body Part Token", "BCGBP", tokenUri);
    _maxSupply = 2400;
  }

  function burnBatch(uint256[4] calldata tokenIds) external onlyFactory {
    for (uint256 i = 0; i < tokenIds.length; i++) {
      _burn(tokenIds[i]);
    }
  }

  function mint(address to) external virtual onlyFactory {
    _tokenIdCounter.increment();
    // we start from tokenId #1
    uint256 tokenId = _tokenIdCounter.current();
    if (tokenId > maxSupply()) revert MintingHasEnded();
    _safeMint(to, tokenId);
  }
}
