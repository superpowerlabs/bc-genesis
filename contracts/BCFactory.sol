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

import "hardhat/console.sol";

contract BCFactory is OwnableUpgradeable, UUPSUpgradeable {
  using AddressUpgradeable for address;
  using SafeMathUpgradeable for uint256;

  event OracleMinted(uint256 indexed id, uint256 partId1, uint256 partId2, uint256 partId3, uint256 partId4);
  event RootSet(bytes32 root1, bytes32 root2);

  error NotAndERC721(address);
  error InvalidSignature();
  error SignatureAlreadyUsed();
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
  mapping(bytes32 => bool) public usedSignatures;

  // Version 2

  Phase public phase;
  uint256 public startAt;

  mapping(uint256 => uint256) internal _rarityIndex;

  uint256 private _factor;
  uint256 private _addend;
  uint256 private _rangeSize;

  function initialize(address genesis_, address oracle_) public initializer {
    __Ownable_init();
    __UUPSUpgradeable_init();
    if (!IERC165Upgradeable(genesis_).supportsInterface(type(IERC721Upgradeable).interfaceId)) revert NotAndERC721(genesis_);
    if (!IERC165Upgradeable(oracle_).supportsInterface(type(IERC721Upgradeable).interfaceId)) revert NotAndERC721(oracle_);
    genesisToken = BCGenesisToken(genesis_);
    oracleToken = BCOracleToken(oracle_);
    // For initial testing, we use the following coprime.
    // They will be updated for mainnet distribution
    updateRevealParams(13, 17, 40);
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

  function setRoot(bytes32 root1_, bytes32 root2_) external onlyOwner {
    // allows to update the root, if no genesis has been minted yet
    if (genesisToken.totalSupply() > 0) revert RootAlreadySet();
    merkleOneRoot = root1_;
    merkleTwoRoot = root2_;
    emit RootSet(root1_, root2_);
  }

  function start(uint256 timestamp) external onlyOwner {
    if (timestamp < block.timestamp || timestamp > block.timestamp + 1 days) revert InvalidStart();
    startAt = timestamp;
  }

  function currentPhase() public view returns (Phase) {
    if (genesisToken.mintEnded()) return Phase.Closed;
    if (startAt > block.timestamp) return Phase.NotOpened;
    if (block.timestamp >= startAt && block.timestamp < startAt + 2 hours) return Phase.GuaranteedAllowList;
    if (block.timestamp >= startAt + 2 hours && block.timestamp < startAt + 1 days) return Phase.GeneralAllowList;
    return Phase.Public;
  }

  function _encodeLeaf(address recipient) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(recipient));
  }

  function mintGenesisPhaseOne(bytes32[] calldata proof) external {
    if (merkleOneRoot == 0) revert RootNotSet();
    if (currentPhase() != Phase.GuaranteedAllowList) revert PhaseClosedOrNotOpenYet();
    _useSignature(proof);
    _validateProof(proof, merkleOneRoot);
    genesisToken.mint(_msgSender());
  }

  function mintGenesisPhaseTwo(bytes32[] calldata proof) external {
    if (currentPhase() != Phase.GeneralAllowList) revert PhaseClosedOrNotOpenYet();
    _useSignature(proof);
    _validateProof(proof, merkleTwoRoot);
    genesisToken.mint(_msgSender());
  }

  function mintGenesisPhaseThree() external {
    if (genesisToken.totalSupply() == 2400) revert AllTokensHaveBeenMinted();
    if (currentPhase() != Phase.Public) revert PhaseClosedOrNotOpenYet();
    // max 2 tokens per address
    if (genesisToken.balanceOf(_msgSender()) > 1) revert TooManyTokens();
    genesisToken.mint(_msgSender());
  }

  function _validateProof(bytes32[] calldata proof, bytes32 root) internal view {
    if (!MerkleProofUpgradeable.verify(proof, root, _encodeLeaf(_msgSender()))) revert InvalidProof();
  }

  function _useSignature(bytes32[] calldata proof) internal {
    bytes32 key = keccak256(abi.encodePacked(_msgSender(), proof));
    if (usedSignatures[key]) revert SignatureAlreadyUsed();
    usedSignatures[key] = true;
  }

  function mintOracle(
    uint256 partId1,
    uint256 partId2,
    uint256 partId3,
    uint256 partId4
  ) external {}
}
