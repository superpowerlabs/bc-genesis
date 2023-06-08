// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// The staking part is taken from Everdragons2GenesisV2 contract
// https://github.com/ndujaLabs/everdragons2-core/blob/main/contracts/Everdragons2GenesisV2.sol

// Author: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";
import "@ndujalabs/erc721lockable/ERC721LockableUpgradeable.sol";

import "../interfaces/IBCNFTBase.sol";

/*
About ownership and upgradeability

There is a strategy for it. Following OpenZeppelin best practices, we will deploy
the contracts and then transfer the ownership of the proxy-contract to a
Gnosis safe multi-sig wallet. Any subsequent upgrades will be performed
according to this process. Here is the guide we will follow to transfer ownership
to the multi-sig wallet and later deploy new implementations:
https://docs.openzeppelin.com/defender/guide-upgrades

To split the risks, a few more multi-sign wallets will become the owners of
the contracts in this suite.

Regarding the time lock, we are not implementing an explicit process because when
a bug is discovered (which is the primary reason why we are using upgradeable
contracts), the speed of response is crucial to avoid disaster.
For example, the recent crash of the UST could have been mitigated if they
did not have to wait for the fixed lockup time before intervening.

*/

contract BCNFTBase is
  IBCNFTBase,
  Initializable,
  ERC721LockableUpgradeable,
  ERC721RoyaltyUpgradeable,
  UUPSUpgradeable
{
  using AddressUpgradeable for address;

  error NotALocker();
  error NotTheOwner();
  error AssetDoesNotExist();
  error AlreadyInitiated();
  error NotTheAssetOwner();
  error NotTheAssetOwnerNorTheGame();
  error PlayerAlreadyAuthorized();
  error PlayerNotAuthorized();
  error FrozenTokenURI();
  error NotAContract();
  error NotAnAttributablePlayer();
  error NotADeactivatedLocker();
  error WrongLocker();
  error NotLockedAsset();
  error LockedAsset();
  error AtLeastOneLockedAsset();
  error LockerNotApproved();

  string private _baseTokenURI;
  bool private _baseTokenURIFrozen;

  mapping(uint256 => mapping(address => mapping(uint256 => uint256))) internal _tokenAttributes;

  modifier tokenExists(uint256 id) {
    if (!_exists(id)) {
      revert AssetDoesNotExist();
    }
    _;
  }

  // solhint-disable-next-line
  function __BCNFTBase_init(
    string memory name,
    string memory symbol,
    string memory tokenUri
  ) internal initializer {
    __ERC721_init(name, symbol);
    __ERC721Enumerable_init();
    __Ownable_init();
    _baseTokenURI = tokenUri;
    __UUPSUpgradeable_init();
  }

  function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}

  function _canSetDefaultLocked() internal view override onlyOwner {}

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId,
    uint256 batchSize
  ) internal override(ERC721Upgradeable, ERC721LockableUpgradeable) {
    super._beforeTokenTransfer(from, to, tokenId, batchSize);
  }

  // ERC165 implementation
  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721RoyaltyUpgradeable, ERC721LockableUpgradeable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function updateTokenURI(string memory uri) external override onlyOwner {
    if (_baseTokenURIFrozen) {
      revert FrozenTokenURI();
    }
    // after revealing, this allows to set up a final uri
    _baseTokenURI = uri;
    emit TokenURIUpdated(uri);
  }

  function freezeTokenURI() external override onlyOwner {
    _baseTokenURIFrozen = true;
    emit TokenURIFrozen();
  }

  function contractURI() public view override returns (string memory) {
    return string(abi.encodePacked(_baseTokenURI, "0"));
  }


  // ERC Royalty standard

  function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721RoyaltyUpgradeable) {
    super._burn(tokenId);
    _resetTokenRoyalty(tokenId);
  }

  uint256[50] private __gap;
}
