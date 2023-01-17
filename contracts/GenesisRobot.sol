pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


contract GenesisRobot is ERC721Upgradeable, OwnableUpgradeable {
    address public factory;
    uint256 internal _nextTokenId;
    uint256 internal _maxSupply;
    error InvalidSupply();
    error CannotMint();
    error NotFactory();


    modifier onlyFactory() {
    if(msg.sender != factory)revert NotFactory();
    _;
    }

    modifier canMint(uint256 amount) {
    if (!canMintAmount(amount)) revert CannotMint();
    _;
  }

    function setFactory(address _factory) public onlyOwner {
        factory = _factory;
    }

  function setMaxSupply(uint256 maxSupply_) external onlyOwner {
    if (_nextTokenId == 0) {
      _nextTokenId = 1;
    }
    if (_nextTokenId > maxSupply_) revert InvalidSupply();
    _maxSupply = maxSupply_;
  }

  function maxSupply() external view returns (uint256) {
    return _maxSupply;
  }

  function nextTokenId() external view returns (uint256) {
    return _nextTokenId;
  }

  function canMintAmount(uint256 amount) public view returns (bool) {
    return _nextTokenId > 0 && _nextTokenId + amount < _maxSupply + 2;
  }

  function mint(address to, uint256 amount) external virtual onlyFactory canMint(amount){
    for (uint256 i = 0; i < amount; i++) {
      _safeMint(to, _nextTokenId++);
    }
  }

}