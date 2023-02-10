// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Author : Jerry Bassat < jerry@superpower.io>
// (c) Superpower Labs Inc.

import "../tokens/BCGenesisToken.sol";
import "../tokens/BCOracleToken.sol";

//import "hardhat/console.sol";

contract MockFactory {
  BCGenesisToken public genesisToken;
  BCOracleToken public oracleToken;

  function initialize(address genesis_, address oracle_) public {
    genesisToken = BCGenesisToken(genesis_);
    oracleToken = BCOracleToken(oracle_);
  }

  function mintGenesis(address to) public {
    genesisToken.mint(to);
  }

  function mintOracle(address to) public {
    oracleToken.mint(to);
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
