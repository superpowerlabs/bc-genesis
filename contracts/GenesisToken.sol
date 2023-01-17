// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/// @title NFT token that represents body parts for a Bot in ByteCity
/// @author Yacin Bahi <yacin@superpower.io>
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

string constant name = "GenesisToken";
string constant symbol = "GNT";

contract GenesisToken is ERC721(name, symbol), Ownable {
  
}

