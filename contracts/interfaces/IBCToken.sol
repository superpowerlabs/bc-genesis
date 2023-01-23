// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc

interface IBCToken {
  function setParameters(uint256 blockNumberOnStart_) external;
}
