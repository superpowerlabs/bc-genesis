// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Author : Francesco Sullo < francesco@superpower.io>
// (c) Superpower Labs Inc.

import "./BCFactory.sol";

//import "hardhat/console.sol";

contract BCFactoryForTest is BCFactory {
  function currentPhase() public view override returns (Phase) {
    if (startAt == 0 || block.timestamp < startAt) return Phase.NotOpened;
    uint256 blocks = (block.timestamp - startAt) / 2 hours;
    uint256 _startAt = startAt + blocks * 2 hours;
    if (genesisToken.mintEnded()) return Phase.Closed;
    if (block.timestamp < _startAt + 30 minutes) return Phase.GuaranteedAllowList;
    if (block.timestamp < _startAt + 90 minutes) return Phase.GeneralAllowList;
    return Phase.Public;
  }

  function setRoot(bytes32 root1_, bytes32 root2_) external override onlyOwner {
    // allows to update the root at any time, for test only
    merkleOneRoot = root1_;
    merkleTwoRoot = root2_;
    emit RootSet(root1_, root2_);
  }
}
