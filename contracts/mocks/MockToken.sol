// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Author : Jerry Bassat <jerry@superpower.io>
// (c) Superpower Labs Inc.

import "../interfaces/IBCToken.sol";
import "../tokens/BCNFT.sol";

contract BCMockToken is BCNFT, IBCToken {
  function initialize(string memory tokenUri) public initializer {
    __BCNFTBase_init("Mock Token with low Supply", "MOCK", tokenUri);
  }

  function setParameters(uint256 blockNumberOnStart_) external onlyOwner {
    _setParameters(5, blockNumberOnStart_, true);
  }
}
