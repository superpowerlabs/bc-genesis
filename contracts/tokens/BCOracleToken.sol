// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "./BCNFT.sol";

contract BCOracleToken is BCNFT {
  uint256 private _nextTokenId;

  function initialize(string memory tokenUri) public initializer {
    __BCNFTBase_init("BYTE City Oracle Token", "BCOT", tokenUri);
    _maxSupply = 1000;
    _nextTokenId = 1;
  }

  function nextTokenId() external view returns (uint256) {
    return _nextTokenId;
  }

  function mint(address to) external virtual onlyFactory returns (uint256) {
    if (mintEnded() || _nextTokenId == 0 || _nextTokenId > maxSupply()) revert CannotMint();
    _safeMint(to, _nextTokenId);
    return _nextTokenId++;
  }
}
