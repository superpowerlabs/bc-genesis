// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Author : Francesco Sullo < francesco@superpower.io>
// (c) Superpower Labs Inc.

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "./soliutils/UUPSUpgradableTemplate.sol";
import "./BodyParts.sol";
import "./GenesisRobot.sol";
import "./utils/Constants.sol";



contract RobotFactory is UUPSUpgradableTemplate {
  using AddressUpgradeable for address;
  using SafeMathUpgradeable for uint256;

  event NewPriceFor(uint8 nftId, address paymentToken, uint256 whitelistPrice, uint256 price);
  event FactorySetFor(uint8 nftId, address factory);
  event FactoryRemovedFor(uint8 nftId, address factory);

  error NotAContract();
  error NFTAlreadySet();
  error NFTNotFound();
  error FactoryNotFound();
  error TransferFailed();
  error NotEnoughWLSlots();
  error InconsistentArrays();
  error RepeatedAcceptedToken();
  error InvalidAmountForSale();
  error OnlyOneTokenForTransactionInPublicSale();
  error MissingBodyPart();


  mapping(address => uint8) private _nftsByAddress;
  BodyParts private _bp;
  GenesisRobot private _robot;

  function initialize() public initializer {
    __UUPSUpgradableTemplate_init();
  }

  /// @dev Sets the ERC 1155 address of the body parts to be burned  
  /// @param bp the address of the whitelist
  function setbodyParts(address bp) external onlyOwner {
    if (!bp.isContract()) revert NotAContract();
    _bp = BodyParts(bp);
  }

  /// @notice Sets the Nft to be minted
  /// @param robot the address of the Robot NFT
  function setRobotNft(address robot) external onlyOwner {
    if (!robot.isContract()) revert NotAContract();
    _robot = GenesisRobot(robot);
  }

  /// @notice Create a Robot Genesis NFT
  /// @dev Given a payment token, will use the normal price or the discounted price if whitelisted
  /// @param bodypartID the Body part to be Veried of ownership
  function createRobot(
    uint256 bodypartID
  ) external {
    uint8 bodypartAmount = Constants.robotAmount[bodypartID];
    for (uint8 i = 0; i <= bodypartAmount; i++) {
        if (_bp.balanceOf(_msgSender(), bodypartID + i) < 1) revert MissingBodyPart();
    }
    _robot.mint(_msgSender(), 1);
    for (uint8 i = 0; i <= bodypartAmount; i++) {
        _bp.burn(_msgSender(), bodypartID + i, 1);
    }
  }

}
