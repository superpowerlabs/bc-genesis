// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

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

//import "hardhat/console.sol";

contract BCFactory is OwnableUpgradeable, UUPSUpgradeable {
  using AddressUpgradeable for address;
  using SafeMathUpgradeable for uint256;

  event OracleMinted(uint256 id, uint256 partId1, uint256 partId2, uint256 partId3, uint256 partId4);
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
  error NotSameRarity();
  error TooManyValues();
  error InvalidRarity();
  error NotAFullSet();

  BCGenesisToken public genesisToken;
  BCOracleToken public oracleToken;

  bytes32 public merkleRoot;
  bool public allowListMintingFinished;
  uint private _rangeSize;
  uint[] private _rarityIndex;

  function initialize(address genesis_, address oracle_) public initializer {
    __Ownable_init();
    __UUPSUpgradeable_init();
    if (!IERC165Upgradeable(genesis_).supportsInterface(type(IERC721Upgradeable).interfaceId)) revert NotAndERC721(genesis_);
    if (!IERC165Upgradeable(oracle_).supportsInterface(type(IERC721Upgradeable).interfaceId)) revert NotAndERC721(oracle_);
    genesisToken = BCGenesisToken(genesis_);
    oracleToken = BCOracleToken(oracle_);
    _rangeSize = 40;
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

  function genesisMintEnded() public view returns (bool) {
    return allowListMintingFinished || genesisToken.totalSupply() > 5599;
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

  function saveRarityIndex(uint256[] memory rarityIndex_) public onlyOwner {
    for (uint256 i = 0; i < rarityIndex_.length; i++) {
      _rarityIndex[i] = rarityIndex_[i];
    }
  }

  function encode(uint256[] memory arr) external pure returns (uint256) {
    uint256 res;
    if (arr.length > 77) revert TooManyValues();
    for (uint256 i = 0; i < arr.length; i++) {
      if (arr[i] > 4) revert InvalidRarity();
      res += arr[i] * (10**i);
    }
    return res;
  }

  function _decode(uint256 encoded, uint256 index) internal pure returns (uint256) {
    uint256 val = encoded / (10**index);
    return val % 10;
  }

  function _rarity(uint256 partId) internal view returns (uint256) {
    uint256 elem = _rarityIndex[partId / (_rangeSize * 77)];
    uint256 onElem = partId % (_rangeSize * 77);
    uint256 remainder = onElem / _rangeSize;
    return _decode(elem, remainder);
  }

  function _revert(uint partId) internal view returns (uint) {
    uint factor = 13;
    uint addend = 17;
    uint base = (partId - 1) / _rangeSize;
    uint diff = base * _rangeSize;
    partId = partId - diff;
    uint factorInverse = 1;
    for (uint i = 1; i <= _rangeSize; i++) {
      if ((factor * i) % _rangeSize == 1) {
        factorInverse = i;
        break;
      }
    }
    return diff + ((((partId - 1 + _rangeSize - addend) % _rangeSize) * factorInverse) % _rangeSize) + 1;
  }

  function _part(uint partId) internal view returns (uint) {
    uint reverted = _revert(partId);
    uint extra = (reverted - 1) % _rangeSize;
    return (extra / 10) ** 2;
  }

  function _validateBodyParts(
    uint256 partId1,
    uint256 partId2,
    uint256 partId3,
    uint256 partId4
  ) internal view {
    if (
      genesisToken.ownerOf(partId1) != _msgSender() ||
      genesisToken.ownerOf(partId2) != _msgSender() ||
      genesisToken.ownerOf(partId3) != _msgSender() ||
      genesisToken.ownerOf(partId4) != _msgSender()
    ) revert NotGenesisOwner();
    if (_part(partId1) + _part(partId2) + _part(partId3) + _part(partId4) != 14) {
      revert NotAFullSet();
    }
    uint a = _rarity(partId1);
    if (a != _rarity(partId2) || a != _rarity(partId3) || a != _rarity(partId4)) {
      revert NotSameRarity();
    }
  }

  function mintOracle(
    uint256 partId1,
    uint256 partId2,
    uint256 partId3,
    uint256 partId4
  ) external {
    if (oracleToken.totalSupply() > 999) revert OracleMintingFinished();
    _validateBodyParts(partId1, partId2, partId3, partId4);
    uint256 oracleId = oracleToken.mint(_msgSender());
    genesisToken.burnBatch([partId1, partId2, partId3, partId4]);
    emit OracleMinted(oracleId, partId1, partId2, partId3, partId4);
  }
}
