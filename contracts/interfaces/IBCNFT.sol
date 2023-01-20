// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc

interface IBCNFT {
  function setMaxSupply(uint256 maxSupply_) external;

  function setFactory(address factory_, bool enabled) external;

  function mint(address to) external returns (uint256);

  function endMinting() external;

  function mintEnded() external view returns (bool);

  function maxSupply() external view returns (uint256);

  function nextTokenId() external view returns (uint256);
}
