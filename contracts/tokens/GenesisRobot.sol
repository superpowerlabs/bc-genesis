pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./GenesisRobotParts.sol";

contract GenesisRobot is ERC721Upgradeable, GenesisRobotParts {
  mapping(uint256 => GenesisRobotParts.Part[]) public parts;

  function mintRobot(address _owner, uint256 id) public {
    _mint(_owner, id);
  }

  function addBodyPart(address _owner, uint256 id, uint256[] memory _parts) public {
    parts[id] = _parts;
    mintRobot(_owner, id);
  }
}
