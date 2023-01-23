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

import "./tokens/BCGenesisToken.sol";
import "./tokens/BCOracleToken.sol";
import "./utils/Signable.sol";

//import "hardhat/console.sol";

contract BCFactory is Signable, OwnableUpgradeable, UUPSUpgradeable {
  using AddressUpgradeable for address;
  using SafeMathUpgradeable for uint256;

  event OracleMinted(uint256 id, uint256 partId1, uint256 partId2, uint256 partId3, uint256 partId4);

  error NotAndERC721(address);
  error InvalidSignature();
  error SignatureAlreadyUsed();
  error NotGenesisOwner();

  BCGenesisToken public genesisToken;
  BCOracleToken public oracleToken;

  function initialize(address genesis_, address oracle_) public initializer {
    __Ownable_init();
    __UUPSUpgradeable_init();
    if (!IERC165Upgradeable(genesis_).supportsInterface(type(IERC721Upgradeable).interfaceId)) revert NotAndERC721(genesis_);
    if (!IERC165Upgradeable(oracle_).supportsInterface(type(IERC721Upgradeable).interfaceId)) revert NotAndERC721(oracle_);
    genesisToken = BCGenesisToken(genesis_);
    oracleToken = BCOracleToken(oracle_);
  }

  function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}

  function setValidator(uint256 id, address validator) public override onlyOwner {
    super.setValidator(id, validator);
  }

  function mintGenesis(uint256 randomValue, bytes calldata signature) external {
    if (!isSignedByValidator(0, hashGenesis(_msgSender(), randomValue), signature)) revert InvalidSignature();
    genesisToken.mint(_msgSender());
  }

  function mintOracle(
    uint256 partId1,
    uint256 partId2,
    uint256 partId3,
    uint256 partId4,
    uint256 randomValue,
    bytes calldata signature
  ) external {
    if (!isSignedByValidator(0, hashOracle(_msgSender(), partId1, partId2, partId3, partId4, randomValue), signature))
      revert InvalidSignature();
    if (
      genesisToken.ownerOf(partId1) != _msgSender() ||
      genesisToken.ownerOf(partId2) != _msgSender() ||
      genesisToken.ownerOf(partId3) != _msgSender() ||
      genesisToken.ownerOf(partId4) != _msgSender()
    ) revert NotGenesisOwner();
    uint256 oracleId = oracleToken.mint(_msgSender());
    uint256[] memory parts = new uint256[](4);
    parts[0] = partId1;
    parts[1] = partId2;
    parts[2] = partId3;
    parts[3] = partId4;
    genesisToken.burnBatch(parts);
    emit OracleMinted(oracleId, partId1, partId2, partId3, partId4);
  }

  function hashGenesis(address to, uint256 randomValue) public view returns (bytes32) {
    return
      keccak256(
        abi.encodePacked(
          "\x19\x01", // EIP-191
          block.chainid,
          to,
          randomValue
        )
      );
  }

  function hashOracle(
    address to,
    uint256 partId1,
    uint256 partId2,
    uint256 partId3,
    uint256 partId4,
    uint256 randomValue
  ) public view returns (bytes32) {
    return
      keccak256(
        abi.encodePacked(
          "\x19\x01", // EIP-191
          block.chainid,
          to,
          partId1,
          partId2,
          partId3,
          partId4,
          randomValue
        )
      );
  }
}
