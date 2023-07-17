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

contract BCFactory is OwnableUpgradeable, UUPSUpgradeable {
  using AddressUpgradeable for address;
  using SafeMathUpgradeable for uint256;

  event OracleMinted(uint256 indexed id, uint256 partId1, uint256 partId2, uint256 partId3, uint256 partId4);
  event AllowListMintingFinished();
  event RootSet(bytes32 root);

  error NotAndERC721(address);
  error InvalidSignature();
  error SignatureAlreadyUsed();
  error NotGenesisOwner();
  error OracleMintingFinished();
  error RootNotSet();
  error RootAlreadySet();
  error InvalidProof();
  error AllowListFinished();
  error NotAllSameRarity();
  error NotAFullSet();
  error TooManyValues();
  error InvalidRarity();
  error BurningFailed();

  BCGenesisToken public genesisToken;
  BCOracleToken public oracleToken;

  bytes32 public merkleRoot;

  // Version 2

  bool public allowListMintingFinished;
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

  function setRoot(bytes32 root_) external onlyOwner {
    // allows to update the root, if no genesis has been minted yet
    if (genesisToken.totalSupply() > 0) revert RootAlreadySet();
    merkleRoot = root_;
    emit RootSet(root_);
  }

  function finishAllowListMinting() external onlyOwner {
    allowListMintingFinished = true;
    emit AllowListMintingFinished();
  }

  function _encodeLeaf(address recipient, uint256 tokenId) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(recipient, tokenId));
  }

  function mintGenesis(uint256 tokenId, bytes32[] calldata proof) external {
    if (merkleRoot == 0) revert RootNotSet();
    if (allowListMintingFinished) revert AllowListFinished();
    if (!MerkleProofUpgradeable.verify(proof, merkleRoot, _encodeLeaf(_msgSender(), tokenId))) revert InvalidProof();
    genesisToken.mint(_msgSender(), tokenId);
  }

  function mintOracle(
    uint256 partId1,
    uint256 partId2,
    uint256 partId3,
    uint256 partId4
  ) external {}
}
