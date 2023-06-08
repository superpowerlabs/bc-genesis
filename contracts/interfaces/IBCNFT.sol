// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc

interface IBCNFT {

  function setFactory(address factory_, bool enabled) external;

  function endMinting() external;

  function mintEnded() external view returns (bool);

  function maxSupply() external view returns (uint256);

}
