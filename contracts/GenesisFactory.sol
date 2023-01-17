// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import "./GenesisParts.sol";
import "./GenesisToken.sol";

/// @title Factory responsible for minting GenesisParts into GenesisToken
/// @author Yacin Bahi <yacin@superpower.io>
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract GenesisFactory {
  uint public constant PARTS_NUMBER = 4; // 4 body parts: head, larm, rarm, legs 
  uint public constant PARTS_NUMBER_TOT = 10; // is 1+2+3+4=10 for 4 body parts: head, larm, rarm, legs 
  uint public constant VARIANT_NUMBER = 10; // 10 colors for example
  uint public constant MAPPING_MULT = 100; // multiplier to create mapping

  GenesisParts private _part;
  GenesisToken private _genesisToken;
 
  /// @notice Sets the GenesisParts contract on the factorty 
  function setGenesisParts(address genesisParts_) external {
    require(genesisParts_.code.length > 0, "Not a contract");
    _part = GenesisParts(genesisParts_);
  }

  /// @notice Sets the GenesisToken contract on the factorty 
  function setGenesisToken(address genesisToken_) external {
    require(genesisToken_.code.length > 0, "Not a contract");
    _genesisToken = GenesisToken(genesisToken_);
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

  /// @notice Used to mint a GenesisToken from a complete set of GenesisParts  
  /// @dev This function checks that the parts set is complete and consistent before
  ///      minting the new GnesisTokena and burning the GenesisParts
  /// @param player address of the token owner
  /// @param ids token ids to mint 
  /// @return address of the new minted GenesisToken
  function mintGenesisToken(
    address player,
    uint256[] memory ids
  ) public returns (uint256) {
    bool status = false;
    string memory response;
    (status, response) = isVariantSetConsistent(ids);
    require(status, response);

    uint256 newTokenId = _genesisToken.awardItem(player, "https://byte.city/genesis-token-xxxxx.json");
    _part.burnGenesisPartSet(player, ids);
    return(newTokenId);
  }

  /// @notice Used to burn a set of tokens  
  /// @dev Explain to a developer any extra details
  /// @param account address of the token owner
  /// @param ids token ids to burn
  /// @param amounts how many tokens of each to burn
  function burnBatch(
    address account,
    uint256[] memory ids,
    uint256[] memory amounts
  ) public {
    _part.burnBatch(account, ids, amounts);
  }

}

