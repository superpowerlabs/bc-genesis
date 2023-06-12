// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Inspired by Everdragons2 NFTs, https://everdragons2.com
// Authors: Francesco Sullo <francesco@superpower.io>
// Collaborators: Jerry Bassat <jerry@superpower.io>
// (c) Superpower Labs Inc.

import "./BCNFTBase.sol";
import "../interfaces/IBCNFT.sol";

abstract contract BCNFT is IBCNFT, BCNFTBase {
  event MintingEnded();

  error Forbidden();
  error CannotMint();
  error ZeroAddress();
  error ParametersAlreadySetUp();
  error InvalidStart();

  using AddressUpgradeable for address;
  uint256 internal _maxSupply;
  bool private _mintEnded;

  address[] public factories;

  modifier onlyFactory() {
    if (!isFactory(_msgSender())) revert Forbidden();
    _;
  }

  function setFactory(address factory_, bool enabled) external override onlyOwner {
    if (!factory_.isContract()) revert NotAContract();
    if (enabled) {
      if (!isFactory(factory_)) {
        factories.push(factory_);
      }
    } else {
      if (isFactory(factory_)) {
        for (uint256 i = 0; i < factories.length; i++) {
          if (factories[i] == factory_) {
            factories[i] = address(0);
          }
        }
      }
    }
  }

  function isFactory(address factory_) public view returns (bool) {
    for (uint256 i = 0; i < factories.length; i++) {
      if (factories[i] != address(0)) {
        if (factories[i] == factory_) {
          return true;
        }
      }
    }
    return false;
  }

  function hasFactories() public view returns (bool) {
    for (uint256 i = 0; i < factories.length; i++) {
      if (factories[i] != address(0)) {
        return true;
      }
    }
    return false;
  }

  function endMinting() external override onlyOwner {
    // force the end of the minting
    _mintEnded = true;
    emit MintingEnded();
  }

  function mintEnded() public view override returns (bool) {
    return _mintEnded;
  }

  function maxSupply() public view override returns (uint256) {
    if (_mintEnded) {
      return totalSupply();
    } else {
      return _maxSupply;
    }
  }

  function canMint() public view returns (bool) {
    return !mintEnded() && totalSupply() < maxSupply();
  }

}
