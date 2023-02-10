// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

interface IRevealable {
  function setBlockNumbers(uint256[] memory blockNumbers_) external;

  function addBlockNumbers(uint256[] memory newBlockNumbers_) external;

  function getClosingBlockNumberIds() external view returns (uint256[] memory);

  function getBLockRangeByBlockNumberId(uint256 blockNumberId_) external view returns (uint256, uint256, uint256, uint256);

  function findBlockIdByBlockNumber(uint256 blockNumber_) external view returns (uint256);

}
