// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import "./GenesisParts.sol";
import "./GenesisToken.sol";

/// @title Factory responsible for minting GenesisParts into GenesisToken
/// @author Yacin Bahi <yacin@superpower.io>
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract GenesisFactory {

  GenesisParts public part;

  function setGenesisParts(address parts_) external {
    require(parts_.code.length > 0, "Not a contract");
    part = GenesisParts(parts_);
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
    part.burnBatch(account, ids, amounts);
  }

}

