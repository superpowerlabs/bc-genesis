// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract GenesisRobotParts is ERC1155 {
  struct Part {
    string bodyPart;
    string color;
  }

  mapping(uint256 => Part) public parts;
  uint256 private _counter = 0;

  function mint(address _owner, string memory _bodyPart, string memory _color) public {
    parts[_counter] = Part(_bodyPart, _color);
    _mint(_owner, _counter, 1, "");
    _counter++;
  }

  function getPart(uint256 _id) public view returns (Part memory) {
    return parts[_id];
  }

  function burn(address _owner, uint256 _id) public {
    // Burn all parts
    _burn(_owner, _id, 1);
  }
}
