// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "./BCNFT.sol";
import "../interfaces/IAttributes.sol";

contract BCOracleToken is BCNFT {
  error TokenNotFound();

  uint256 private _nextTokenId;

  // version 2
  mapping(uint256 => IAttributes.Rarity) private _rarity;

  function initialize(string memory tokenUri) public initializer {
    __BCNFTBase_init("BYTE City Oracle Token", "BCOT", tokenUri);
    _maxSupply = 1000;
    _nextTokenId = 1;
  }

  function nextTokenId() external view returns (uint256) {
    return _nextTokenId;
  }

  function mint(address to, IAttributes.Rarity rarity) external virtual onlyFactory returns (uint256) {
    if (mintEnded() || _nextTokenId == 0 || _nextTokenId > maxSupply()) revert CannotMint();
    _rarity[_nextTokenId] = rarity;
    _safeMint(to, _nextTokenId);
    return _nextTokenId++;
  }

  function rarityOf(uint256 tokenId) external view returns (IAttributes.Rarity) {
    if (!_exists(tokenId)) revert TokenNotFound();
    return _rarity[tokenId];
  }
}
