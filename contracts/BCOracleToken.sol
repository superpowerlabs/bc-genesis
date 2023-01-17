// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "./SuperpowerNFT.sol";

contract BCOracleToken is SuperpowerNFT {
  function initialize(string memory tokenUri) public initializer {
    __SuperpowerNFTBase_init("BYTE City Oracle Token", "BCOT", tokenUri);
  }
}
