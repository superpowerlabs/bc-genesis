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
  uint public constant PARTS_NUMBER = 4; // 4 body parts: head, larm, rarm, legs 
  uint public constant PARTS_NUMBER_TOT = 10; // is 1+2+3+4=10 for 4 body parts: head, larm, rarm, legs 
  uint public constant VARIANT_NUMBER = 10; // 10 colors for example
  uint public constant MAPPING_MULT = 100; // multiplier to create mapping

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

  /// @notice Lets contract's authorized burner to burn a set of tokens
  /// @dev Explain to a developer any extra details
  /// @param account address of the token owner
  /// @param ids token ids to burn
  /// @param amounts amount of token to burn each
  function burnBatch(address account, uint[] memory ids, uint256[] memory amounts) public {
    require(_burner == _msgSender(), "Not authorised to burn");
    _burnBatch(account, ids, amounts);
  }

  /// @notice Determines if set of variants is consistent to mint a GenesisToken
  /// @dev The ids of the token are mapped by genesis parts and variant
  ///      Bellow an explanation with MAPPING_MULT=100:
  ///      100-199 [0,1,2,3...] head      of various variant 0,1,2,3 ...
  ///      200-299 [0,1,2,3...] legs      of various variant 0,1,2,3 ...
  ///      300-399 [0,1,2,3...] leftarm   of various variant 0,1,2,3 ...
  ///      400-499 [0,1,2,3...] righttarm of various variant 0,1,2,3 ...
  ///      500-499 [0,1,2,3...] .....     of various variant 0,1,2,3 ...
  ///      The client app uses the following mapping function to set parts ids:
  ///      tokenId = genesis_part * 100 + variant, (where 100 is the MAPPING_MULT)
  ///      for example: legs=2, variant=3 => tokenId = 203 
  /// @param tokenIds ids of all token to check for consistency (can we make a GenesisToken by combining them)
  /// @return true if a GenesisToken can be minted from the set and false otherwise
  function isVariantSetConsistent(uint256[] memory tokenIds) public pure returns (bool, string memory)  {
    // TODO: check of gas usage not hight, optimize if too hight, for example, remove
    // error messages from return value.
    // require(_burner == _msgSender(), "Not authorised to burn");

    if (tokenIds.length != PARTS_NUMBER) {
      return (false, "Not enough or too many parts");
      // return(false);
    }

    uint variant = tokenIds[0] % MAPPING_MULT;
    for (uint i=1; i<tokenIds.length; i++) {
      if (tokenIds[i] % MAPPING_MULT != variant) {
        return (false, "Unconsistent variants in token set");
        // return(false);
      }
    }

    uint n = 0;
    for (uint i=0; i<tokenIds.length; i++) {
      // int/100 MAPPING_MULT to get the part number of the token
      n += i/MAPPING_MULT;
    }
    if (n == PARTS_NUMBER_TOT) {
      return (false, "Missing genesis part, required to have one part of each to mint a GenesisToken");
      // return(false);
    }

    return(true, "success");
    // return(true);
  }
}