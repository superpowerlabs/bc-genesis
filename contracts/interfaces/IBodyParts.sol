// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IBodyParts {
  function setBurner(address burner) external;

  function mintBatch(
    address to,
    uint256[] memory ids,
    uint256[] memory amounts
  ) external;

  function mintMany(
    address[] memory to,
    uint256[][] memory ids,
    uint256[][] memory amounts
  ) external;

  function burn(
    address account,
    uint256 id,
    uint256 amount
  ) external;
}
