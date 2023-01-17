// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title ERC1155 token that represents body parts for a Bot in ByteCity
/// @author Yacin Bahi <yacin@superpower.io>
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract GenesisParts is ERC1155, Ownable {
  address internal _burner;

  constructor() ERC1155(""){
  }

  /// @notice Set the burner for the token
  /// @param burner The factory that mints the Genesis token from the GenesisParts
  function setBurner(address burner) public onlyOwner {
    require(Address.isContract(burner), "Burner should be a contract");
    _burner = burner;
  }

  /// @notice Set meta data URI for token
  /// @dev Use with tokenId setURI("https://api.mob.land/wl/{id}") when deploying contract
  /// @param newUri Uri to use
  function setURI(string memory newUri) public onlyOwner {
    _setURI(newUri);
  }

  /// @notice Mints a token by Id
  /// @dev Explain to a developer any extra details
  /// @param account address of the token owner
  /// @param id token id to mint
  /// @param amount how many token of that id to mint
  /// @return list of id just minted
  function mint(address account, uint id, uint256 amount) onlyOwner
    public payable returns (uint)
  {
    // require(msg.value == mintFee);
    _mint(account, id, amount, "");
    return id;
  }

  /// @notice Mints a batch of token by Ids
  /// @dev Explain to a developer any extra details
  /// @param account address of the token owner
  /// @param ids tokens id to mint
  /// @param amounts amounts of token to mint for each token
  /// @return list of idx just minted
  function mintBatch(address account, uint[] memory ids, uint256[] memory amounts) onlyOwner
    public payable returns (uint[] memory)
  {
    // require(msg.value == mintFee);
    _mintBatch(account, ids, amounts, "");
    return ids;
  }

  /// @notice Lets contract's authorized burner to burn tokens
  /// @dev Explain to a developer any extra details
  /// @param account address of the token owner
  /// @param id token id to burn
  /// @param amount how many token of that id to burn
  function burn(address account, uint id, uint256 amount) public {
    require(_burner == _msgSender(), "Not authorised to burn");
    _burn(account, id, amount);
  }

  /// @notice Lets contract's authorized burner to burn a batc of tokens
  /// @dev Explain to a developer any extra details
  /// @param account address of the token owner
  /// @param ids token ids to burn
  /// @param amounts amount of token to burn each
  function burnBatch(address account, uint[] memory ids, uint256[] memory amounts) public {
    require(_burner == _msgSender(), "Not authorised to burn");
    _burnBatch(account, ids, amounts);
  }

  /// @notice Lets contract's authorized burner to burn a set of tokens
  /// @dev Burns excalty one of each token in the set
  /// @param account address of the token owner
  /// @param ids token ids to burn
  function burnGenesisPartSet(address account, uint[] memory ids) public {
    require(_burner == _msgSender(), "Not authorised to burn");
    for (uint256 index = 0; index < 4; index++) {
      _burn(account, ids[index], 1);      
    }
  }
}