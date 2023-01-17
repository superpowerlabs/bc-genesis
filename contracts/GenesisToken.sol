// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

string constant name = "GenesisToken";
string constant symbol = "GNT";

/// @title ERC721 token that represents a Bot in ByteCity
/// @author Yacin Bahi <yacin@superpower.io>
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract GenesisToken is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("GenesisToken", "GNT") {}

    function awardItem(address player, string memory tokenURI)
        public
        returns (uint256)
    {
        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);
        _setTokenURI(newItemId, tokenURI);

        _tokenIds.increment();
        return newItemId;
    }
}