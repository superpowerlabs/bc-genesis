// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Author : Francesco Sullo < francesco@superpower.io>
// (c) Superpower Labs Inc.

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {MerkleProofUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";

import "./tokens/BCGenesisToken.sol";
import "./tokens/BCOracleToken.sol";
import "./interfaces/IAttributes.sol";

import {console} from "hardhat/console.sol";

contract BCFactory is OwnableUpgradeable, UUPSUpgradeable {
  using AddressUpgradeable for address;
  using SafeMathUpgradeable for uint256;

  event OracleMinted(uint256 indexed id, uint256 partId1, uint256 partId2, uint256 partId3, uint256 partId4);
  event RootSet(bytes32 root1, bytes32 root2);

  error NotAndERC721(address);
  error ProofAlreadyUsed();
  error NotGenesisOwner();
  error OracleMintingFinished();
  error RootNotSet();
  error RootAlreadySet();
  error InvalidProof();
  error PhaseClosedOrNotOpenYet();
  error NotAllSameRarity();
  error NotAFullSet();
  error TooManyValues();
  error InvalidRarity();
  error BurningFailed();
  error TooManyTokens();
  error InvalidStart();
  error AllTokensHaveBeenMinted();
  error AlreadySet();
  error PreMintingLimitReached();

  enum Phase {
    NotOpened,
    GuaranteedAllowList,
    GeneralAllowList,
    Public,
    Closed
  }

  BCGenesisToken public genesisToken;
  BCOracleToken public oracleToken;

  bytes32 public merkleOneRoot;
  bytes32 public merkleTwoRoot;
  mapping(bytes32 => bool) public usedProofs;

  // Version 2

  uint256 public startAt;

  mapping(uint256 => uint256) internal _rarityIndex;

  uint256 private _factor;
  uint256 private _addend;
  uint256 private _rangeSize;
  uint256 private _treasuryWalletAndReservedAmount;

  function initialize(address genesis_, address oracle_) public initializer {
    __Ownable_init();
    __UUPSUpgradeable_init();
    if (!IERC165Upgradeable(genesis_).supportsInterface(type(IERC721Upgradeable).interfaceId)) revert NotAndERC721(genesis_);
    if (!IERC165Upgradeable(oracle_).supportsInterface(type(IERC721Upgradeable).interfaceId)) revert NotAndERC721(oracle_);
    genesisToken = BCGenesisToken(genesis_);
    oracleToken = BCOracleToken(oracle_);
    // For initial testing, we use the following coprime.
    // They will be updated for mainnet distribution
    updateRevealParams(7, 19, 40);
  }

  function updateRevealParams(
    uint256 factor_,
    uint256 addend_,
    uint256 rangeSize_
  ) public onlyOwner {
    _factor = factor_;
    _addend = addend_;
    _rangeSize = rangeSize_;
  }

  function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}

  function setTreasury(address treasury_, uint256 reservedAmount) external onlyOwner {
    _treasuryWalletAndReservedAmount = (uint256(uint160(treasury_)) << 96) | reservedAmount;
  }

  function getTreasury() public view returns (address treasury_, uint256 reservedAmount) {
    treasury_ = address(uint160(_treasuryWalletAndReservedAmount >> 96));
    reservedAmount = uint256(uint96(_treasuryWalletAndReservedAmount));
  }

  function preMint(uint256 amount) external onlyOwner {
    if (currentPhase() != Phase.NotOpened) revert PhaseClosedOrNotOpenYet();
    (address treasury_, uint256 reservedAmount) = getTreasury();
    if (genesisToken.totalSupply() >= reservedAmount) revert PreMintingLimitReached();
    if (genesisToken.totalSupply() + amount > reservedAmount) {
      amount = reservedAmount - genesisToken.totalSupply();
    }
    for (uint256 i = 0; i < amount; i++) {
      genesisToken.mint(treasury_);
    }
  }

  function setRoot(bytes32 root1_, bytes32 root2_) external virtual onlyOwner {
    // allows to update the root, if no genesis has been minted yet
    if (genesisToken.totalSupply() > 0) revert RootAlreadySet();
    merkleOneRoot = root1_;
    merkleTwoRoot = root2_;
    emit RootSet(root1_, root2_);
  }

  function start(uint256 timestamp) external onlyOwner {
    if (timestamp < block.timestamp) revert InvalidStart();
    if (startAt > 0 && block.timestamp > startAt) revert AlreadySet();
    startAt = timestamp;
  }

  function currentPhase() public view virtual returns (Phase) {
    if (genesisToken.mintEnded()) return Phase.Closed;
    if (startAt == 0 || block.timestamp < startAt) return Phase.NotOpened;
    if (block.timestamp < startAt + 4 hours) return Phase.GuaranteedAllowList;
    if (block.timestamp < startAt + 8 hours) return Phase.GeneralAllowList;
    return Phase.Public;
  }

  function _encodeLeaf(address recipient, uint256 nonce) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(recipient, nonce));
  }

  function mintGenesis(
    bytes32[] calldata proof,
    uint256 nonce,
    bool isGuaranteed
  ) external {
    if (merkleOneRoot == 0) revert RootNotSet();
    Phase phase = currentPhase();
    if (phase < Phase.GuaranteedAllowList || phase > Phase.Public) revert PhaseClosedOrNotOpenYet();
    if (phase < Phase.Public) {
      _useProof(proof, nonce, _msgSender());
      if (isGuaranteed) {
        _validateProof(proof, nonce, merkleOneRoot);
      } else {
        if (phase < Phase.GeneralAllowList) revert PhaseClosedOrNotOpenYet();
        _validateProof(proof, nonce, merkleTwoRoot);
      }
    }
    if (genesisToken.totalSupply() >= 2400) revert AllTokensHaveBeenMinted();
    genesisToken.mint(_msgSender());
  }

  function _validateProof(
    bytes32[] calldata proof,
    uint256 nonce,
    bytes32 root
  ) internal view {
    if (!MerkleProofUpgradeable.verify(proof, root, _encodeLeaf(_msgSender(), nonce))) revert InvalidProof();
  }

  function _useProof(
    bytes32[] calldata proof,
    uint256 nonce,
    address sender
  ) internal {
    bytes32 key = keccak256(abi.encodePacked(proof, nonce, sender));
    if (usedProofs[key]) revert ProofAlreadyUsed();
    usedProofs[key] = true;
  }

  function genesisMinted() external view returns (uint256) {
    return genesisToken.totalSupply();
  }

  function hasProofBeenUsed(
    bytes32[] calldata proof,
    uint256 nonce,
    address sender
  ) external view returns (bool) {
    bytes32 key = keccak256(abi.encodePacked(proof, nonce, sender));
    return usedProofs[key];
  }

  function _isOwner(uint256 partId) internal view {
    if (genesisToken.ownerOf(partId) != _msgSender()) revert NotGenesisOwner();
  }

  function _validateBodyParts(
    uint256 partId1,
    uint256 partId2,
    uint256 partId3,
    uint256 partId4
  ) internal view returns (IAttributes.Rarity) {
    _isOwner(partId1);
    _isOwner(partId2);
    _isOwner(partId3);
    _isOwner(partId4);
    uint256 rarity_ = rarityByIndex(partId1);
    if (rarity_ != rarityByIndex(partId2) || rarity_ != rarityByIndex(partId3) || rarity_ != rarityByIndex(partId4)) {
      revert NotAllSameRarity();
    }
    if (part(partId1) + part(partId2) + part(partId3) + part(partId4) != 14) {
      revert NotAFullSet();
    }
    return IAttributes.Rarity(rarity_);
  }

  function mintOracle(
    uint256 partId1,
    uint256 partId2,
    uint256 partId3,
    uint256 partId4
  ) external {
    IAttributes.Rarity rarity = _validateBodyParts(partId1, partId2, partId3, partId4);
    uint256 oracleId = oracleToken.mint(_msgSender(), rarity);
    try genesisToken.burnBatch([partId1, partId2, partId3, partId4]) {
      // do nothing
    } catch {
      revert BurningFailed();
    }
    emit OracleMinted(oracleId, partId1, partId2, partId3, partId4);
  }

  function saveRarityIndex(uint256[] memory rarityIndex_) public onlyOwner {
    for (uint256 i = 0; i < rarityIndex_.length; i++) {
      _rarityIndex[i] = rarityIndex_[i];
    }
  }

  function part(uint256 genesisId) public view returns (uint256) {
    uint256 base = (genesisId - 1) / _rangeSize;
    uint256 diff = (base * _rangeSize);
    genesisId -= diff;
    uint256 factorInverse = 1;
    for (uint256 i = 1; i <= _rangeSize; i++) {
      if ((_factor * i) % _rangeSize == 1) {
        factorInverse = i;
        break;
      }
    }
    uint256 baseId = diff + ((((genesisId - 1 + _rangeSize - _addend) % _rangeSize) * factorInverse) % _rangeSize) + 1;
    return (((baseId - 1) % _rangeSize) / 10)**2;
  }

  function encode(uint256[] memory arr) public pure returns (uint256) {
    uint256 res;
    if (arr.length > 77) revert TooManyValues();
    for (uint256 i = 0; i < arr.length; i++) {
      if (arr[i] > 4) revert InvalidRarity();
      res += arr[i] * (10**i);
    }
    return res;
  }

  function rarityByIndex(uint256 genesisTokenId_) public view returns (uint256) {
    uint256 index = (genesisTokenId_ - 1) / _rangeSize;
    uint256 val = _rarityIndex[0] / (10**index);
    return val % 10;
  }

  function getParams()
    external
    view
    returns (
      uint256 factor_,
      uint256 addend_,
      uint256 rangeSize_
    )
  {
    factor_ = _factor;
    addend_ = _addend;
    rangeSize_ = _rangeSize;
  }
}
