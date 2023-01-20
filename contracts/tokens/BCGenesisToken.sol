// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "./BCNFT.sol";

contract BCGenesisToken is BCNFT {

  function initialize(string memory tokenUri) public initializer {
    __BCNFTBase_init("BYTE City Genesis Token", "BCGT", tokenUri);
  }

  function burnBatch(uint256[] calldata tokenIds) external onlyFactory {
    for (uint256 i = 0; i < tokenIds.length; i++) {
      _burn(tokenIds[i]);
    }
  }

}
