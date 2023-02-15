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
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

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

  BCGenesisToken public genesisToken;
  BCOracleToken public oracleToken;

  bytes32 public root;
  bool public allowListMintingFinished;

  function initialize(address genesis_, address oracle_) public initializer {
    __Ownable_init();
    __UUPSUpgradeable_init();
    if (!IERC165Upgradeable(genesis_).supportsInterface(type(IERC721Upgradeable).interfaceId)) revert NotAndERC721(genesis_);
    if (!IERC165Upgradeable(oracle_).supportsInterface(type(IERC721Upgradeable).interfaceId)) revert NotAndERC721(oracle_);
    genesisToken = BCGenesisToken(genesis_);
    oracleToken = BCOracleToken(oracle_);
  }

  function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}

  function setRoot(bytes32 root_) external onlyOwner {
    // allows to update the root, if no genesis has been minted yet
    if (genesisToken.totalSupply() > 0) revert RootAlreadySet();
    root = root_;
    emit RootSet(root_);
  }

  function finishAllowListMinting() external onlyOwner {
    allowListMintingFinished = true;
    emit AllowListMintingFinished();
  }

  function encodeLeaf(address recipient) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(recipient));
  }

  function mintGenesis(bytes32[] calldata proof) external {
    if (root == 0) revert RootNotSet();
    if (allowListMintingFinished) revert AllowListFinished();
    if (!MerkleProof.verify(proof, root, encodeLeaf(_msgSender()))) revert InvalidProof();
    genesisToken.mint(_msgSender());
  }

  function mintOracle(
    uint256 partId1,
    uint256 partId2,
    uint256 partId3,
    uint256 partId4
  ) external {
    if (oracleToken.totalSupply() >= 1000) revert OracleMintingFinished();
    if (
      genesisToken.ownerOf(partId1) != _msgSender() ||
      genesisToken.ownerOf(partId2) != _msgSender() ||
      genesisToken.ownerOf(partId3) != _msgSender() ||
      genesisToken.ownerOf(partId4) != _msgSender()
    ) revert NotGenesisOwner();
    uint256 oracleId = oracleToken.mint(_msgSender());
    genesisToken.burnBatch([partId1, partId2, partId3, partId4]);
    emit OracleMinted(oracleId, partId1, partId2, partId3, partId4);
  }
}
