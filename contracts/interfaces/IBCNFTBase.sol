// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Author: Francesco Sullo <francesco@superpower.io>

interface IBCNFTBase {
  event TokenURIFrozen();
  event TokenURIUpdated(string uri);

  function updateTokenURI(string memory uri) external;

  function freezeTokenURI() external;

  function contractURI() external view returns (string memory);
}
