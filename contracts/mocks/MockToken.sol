// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Author : Jerry Bassat <jerry@superpower.io>
// (c) Superpower Labs Inc.

import "../tokens/BCNFT.sol";

contract BCMockToken is BCNFT {
  function initialize(string memory tokenUri) public initializer {
    __BCNFTBase_init("Mock Token with low Supply", "MOCK", tokenUri);
    _maxSupply = 5;
  }
}
