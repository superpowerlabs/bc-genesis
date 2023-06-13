// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Author : Jerry Bassat < jerry@superpower.io>
// (c) Superpower Labs Inc.

import "../tokens/BCGenesisToken.sol";
import "../tokens/BCOracleToken.sol";
import "../interfaces/IAttributes.sol";

//import "hardhat/console.sol";

contract MockFactory {
  BCGenesisToken public genesisToken;
  BCOracleToken public oracleToken;

  constructor(address genesis_, address oracle_) {
    genesisToken = BCGenesisToken(genesis_);
    oracleToken = BCOracleToken(oracle_);
  }

  function mintGenesis(address to, uint256 tokenId) public {
    genesisToken.mint(to, tokenId);
  }

  function mintOracle(address to) public {
    oracleToken.mint(to, IAttributes.Rarity.COMMON);
  }

  function burnBatch(uint256[4] calldata tokenIds) public {
    genesisToken.burnBatch(tokenIds);
  }

  function lockGenesis(uint256 tokenId) public {
    genesisToken.lock(tokenId);
  }

  function lockOracle(uint256 tokenId) public {
    oracleToken.lock(tokenId);
  }
}
