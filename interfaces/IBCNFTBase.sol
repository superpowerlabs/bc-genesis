// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Author: Francesco Sullo <francesco@superpower.io>

import "@ndujalabs/erc721lockable/contracts/IERC721Lockable.sol";
import "@ndujalabs/erc721attributable/contracts/IERC721Attributable.sol";

interface IBCNFTBase is IERC721Lockable, IERC721Attributable {
  event TokenURIFrozen();
  event TokenURIUpdated(string uri);

  function updateTokenURI(string memory uri) external;

  function freezeTokenURI() external;

  function contractURI() external view returns (string memory);
}
