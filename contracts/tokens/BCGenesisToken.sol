// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "../interfaces/IBCToken.sol";
import "../interfaces/IRevealable.sol";
import "./BCNFT.sol";

contract BCGenesisToken is BCNFT, IBCToken, IRevealable {
  error BlockNumbersOutOfOrder();
  error BlockNumbersAlreadySet();
  error BlockNumberNotSet();
  error BlockNumberOutOfRange();
  error BlockNumbersInvalid();

  struct BlockRange {
    uint32 startingBlockNumber;
    uint32 closingBlockNumber;
    uint32 lastTokenId;
    uint32 tokensInBlockRange;
  }

  uint256 private _lastBlockNumberId;
  mapping(uint256 => BlockRange) private _blockRanges;

  function initialize(string memory tokenUri) public initializer {
    __BCNFTBase_init("BYTE City Genesis Token", "BCGT", tokenUri);
  }

  function burnBatch(uint256[4] calldata tokenIds) external onlyFactory {
    for (uint256 i = 0; i < 4; i++) {
      _burn(tokenIds[i]);
    }
  }

  function setParameters(uint256 blockNumberOnStart_, uint256 decayBlocks_) external onlyOwner {
    _setParameters(10000, blockNumberOnStart_, decayBlocks_);
  }

  // Set a list of block numbers that will be used to get info about intervals
  // that will be used by the reveal app
  function setBlockNumbers(uint256[] memory blockNumbers_) external override onlyOwner {
    // the first block number is the minimum accepted block number
    if (_blockRanges[1].closingBlockNumber > 0) {
      revert BlockNumbersAlreadySet();
    }
    if (blockNumbers_.length < 2) {
      revert BlockNumbersInvalid();
    }
    for (uint256 i = 0; i < blockNumbers_.length; i++) {
      if (i > 0 && blockNumbers_[i] < blockNumbers_[i - 1]) {
        revert BlockNumbersOutOfOrder();
      }
      if (i > 0) {
        _blockRanges[i - 1].startingBlockNumber = uint32(blockNumbers_[i - 1]) + 1;
        _blockRanges[i - 1].closingBlockNumber = uint32(blockNumbers_[i]);
      }
    }
    _lastBlockNumberId = blockNumbers_.length - 1;
  }

  // Add a list of block numbers that will be used to get info about intervals
  // if the initial set is insufficient to cover the minting
  function addBlockNumbers(uint256[] memory newBlockNumbers_) external override onlyOwner {
    if (_blockRanges[1].closingBlockNumber == 0) {
      revert BlockNumberNotSet();
    }
    for (uint256 i = 0; i < newBlockNumbers_.length; i++) {
      if (newBlockNumbers_[i] <= _blockRanges[_lastBlockNumberId].closingBlockNumber) {
        revert BlockNumbersOutOfOrder();
      }
      if (i == 0) {
        _blockRanges[_lastBlockNumberId + i].startingBlockNumber =
          uint32(_blockRanges[_lastBlockNumberId].closingBlockNumber) +
          1;
      } else {
        _blockRanges[_lastBlockNumberId + i].startingBlockNumber = uint32(newBlockNumbers_[i - 1]) + 1;
      }
      _blockRanges[_lastBlockNumberId + i].closingBlockNumber = uint32(newBlockNumbers_[i]);
    }
    _lastBlockNumberId = _lastBlockNumberId + newBlockNumbers_.length;
  }

  function getClosingBlockNumberIds() external view override returns (uint256[] memory) {
    uint256[] memory blockNumberIds = new uint256[](_lastBlockNumberId);
    for (uint256 i = 0; i <= _lastBlockNumberId; i++) {
      blockNumberIds[i] = _blockRanges[i].closingBlockNumber;
    }
    return blockNumberIds;
  }

  function getBlockRangeByBlockNumberId(uint256 blockNumberId_)
    external
    view
    override
    returns (
      uint256,
      uint256,
      uint256,
      uint256
    )
  {
    if (_blockRanges[blockNumberId_].closingBlockNumber == 0) {
      revert BlockNumberOutOfRange();
    }
    return (
      _blockRanges[blockNumberId_].startingBlockNumber,
      _blockRanges[blockNumberId_].closingBlockNumber,
      _blockRanges[blockNumberId_].lastTokenId,
      _blockRanges[blockNumberId_].tokensInBlockRange
    );
  }

  function findBlockIdByBlockNumber(uint256 blockNumber_) public view override returns (uint256, bool) {
    if (blockNumber_ == 0) {
      blockNumber_ = block.number;
    }
    for (uint256 i = 1; i <= _lastBlockNumberId; i++) {
      if (blockNumber_ >= _blockRanges[i].startingBlockNumber &&
        block.number <= _blockRanges[i].closingBlockNumber) {
        return (i, true);
      }
    }
    return (0, false);
  }

  // get the block range that contains the current block number, updates
  // the last token id and the number of tokens in the block range and
  // mints a new token and return the token id
  function mint(address to) public virtual override onlyFactory returns (uint256) {
    (uint256 blockNumberId, bool found) = findBlockIdByBlockNumber(block.number);
    if (!found) revert BlockNumberOutOfRange();
    _blockRanges[blockNumberId].lastTokenId = uint32(super.mint(to));
    _blockRanges[blockNumberId].tokensInBlockRange++;
    return uint256(_blockRanges[blockNumberId].lastTokenId);
  }
}
