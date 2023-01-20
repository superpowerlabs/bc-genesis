// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Inspired by Everdragons2 NFTs, https://everdragons2.com
// Authors: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "./BCNFTBase.sol";
import "../interfaces/IBCNFT.sol";

abstract contract BCNFT is IBCNFT, BCNFTBase {
  error Forbidden();
  error CannotMint();
  error ZeroAddress();
  error ParametersAlreadySetUp();
  error NotEnoughWLSlots();
  error InvalidDeadline();
  error WhitelistNotSetYet();
  error InvalidStart();

  using AddressUpgradeable for address;
  uint256 private _nextTokenId;
  uint256 private _initialMaxSupply;
  uint private _blockNumberOnStart;
  bool private _mintEnded;
  bool private _decayActive;

  address[] public factories;

  modifier onlyFactory() {
    if (!isFactory(_msgSender())) revert Forbidden();
    _;
  }

  function _setParameters(uint256 maxSupply_, uint256 blockNumberOnStart_, bool activateDecay) internal {
    if (_initialMaxSupply > 0) revert ParametersAlreadySetUp();
    if (blockNumberOnStart_ < block.number + 1 hours) revert InvalidStart();
    _blockNumberOnStart = blockNumberOnStart_;
    _nextTokenId = 1;
    _initialMaxSupply = maxSupply_;
    _decayActive = activateDecay;
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

  function mint(address to) external virtual override onlyFactory returns (uint256) {
    if (_nextTokenId == 0 || _nextTokenId > _maxSupply) revert CannotMint();
    _safeMint(to, _nextTokenId);
    return _nextTokenId++;
  }

  function endMinting() external override onlyOwner {
    _mintEnded = true;
  }

  function mintEnded() external view override returns (bool) {
    return _mintEnded;
  }

  function maxSupply() external view override returns (uint256) {
    if(_mintEnded) {
      return totalSupply();
    } else if (_decayActive) {
      //TODO: Define Proper Decay Factor
      return _initialMaxSupply - ((block.number - _blockNumberOnStart)/100);
    } else {
      return _initialMaxSupply;
    }
  }

  function nextTokenId() external view override returns (uint256) {
    return _nextTokenId;
  }
}
