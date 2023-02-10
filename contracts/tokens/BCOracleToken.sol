// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "../interfaces/IBCToken.sol";
import "./BCNFT.sol";

contract BCOracleToken is BCNFT, IBCToken {
  function initialize(string memory tokenUri) public initializer {
    __BCNFTBase_init("BYTE City Oracle Token", "BCOT", tokenUri);
  }

  function setParameters(uint256 blockNumberOnStart_, uint256 decayBlocks_) external onlyOwner {
    _setParameters(1000, blockNumberOnStart_, decayBlocks_);
  }
}
