// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "./BCNFT.sol";

contract BCOracleToken is BCNFT {
  function initialize(string memory tokenUri) public initializer {
    __BCNFTBase_init("BYTE City Oracle Token", "BCOT", tokenUri);
  }
}
