// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./tokens/GenesisRobot.sol";

contract RobotFactory is GenesisRobot {
  GenesisRobotParts public partsAddress;

  function createRobot(address _owner, uint256[] memory _parts) public {
    // Check if all parts are different body parts
    bool[] memory seenParts;
    for (uint i = 0; i < _parts.length; i++) {
      GenesisRobotParts.Part memory currentPart = partsAddress.getPart(_parts[i]);
      require(!seenParts[(currentPart.bodyPart)], "All parts must be different body parts");
      seenParts[(currentPart.bodyPart)] = true;
    }

    // Check if all parts are the same color
    GenesisRobotParts.Part memory firstPart = partsAddress.getPart(_parts[0]);
    for (uint i = 1; i < _parts.length; i++) {
      require(
        keccak256(abi.encodePacked(firstPart.color)) == keccak256(abi.encodePacked(partsAddress.getPart(_parts[i]).color)),
        "All parts must be the same color"
      );
    }

    // Burn all parts and mint the robot
    for (uint i = 0; i < _parts.length; i++) {
      partsAddress.burn(_owner, _parts[i]);
    }

    addBodyPart(_owner, _parts[0], _parts);
  }
}
