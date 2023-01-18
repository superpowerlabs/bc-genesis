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
  error InvalidSupply();
  error NotEnoughWLSlots();
  error InvalidDeadline();
  error WhitelistNotSetYet();

  using AddressUpgradeable for address;
  uint256 private _nextTokenId;
  uint256 private _maxSupply;
  uint private _blockNumberOnStart;
  bool private _mintEnded;

  address[] public factories;

  modifier onlyFactory() {
    if (
      isFactory(_msgSender()) ||
      // owner is authorized as long as there are no factories
      (!hasFactories() && _msgSender() == owner())
    ) _;
    else revert Forbidden();
  }

  function setMaxSupply(uint256 maxSupply_) external onlyOwner {
    if (_nextTokenId == 0) {
      _blockNumberOnStart = block.number;
      _nextTokenId = 1;
    }
    if (_nextTokenId > maxSupply_) revert InvalidSupply();
    _maxSupply = maxSupply_;
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

  function mint(address to) external virtual override onlyFactory {
    if (_nextTokenId == 0 || _nextTokenId > maxSupply()) revert CannotMint();
    _safeMint(to, _nextTokenId++);
  }

  function endMinting() external override onlyOwner {
    _maxSupply = _nextTokenId - 1;
    _mintEnded = true;
  }

  function mintEnded() external view override returns (bool) {
    return _mintEnded;
  }

  function maxSupply() external view override returns (uint256) {
    if(_mintEnded)
    {return _maxSupply;}
    
    //TODO: Define Proper Decay Factor
    return _maxSupply - ((block.number - _blockNumberOnStart)/100);
  }

  function nextTokenId() external view override returns (uint256) {
    return _nextTokenId;
  }

}
