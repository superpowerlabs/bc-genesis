// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Authors: Francesco Sullo <francesco@sullo.co>

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

contract Signable {
  using ECDSAUpgradeable for bytes32;

  event ValidatorSet(uint256 id, address validator);

  error addressZeroNotAllowed();

  mapping(uint256 => address) public validators;

  function setValidator(uint256 id, address validator) public virtual {
    if (validator == address(0)) revert addressZeroNotAllowed();
    validators[id] = validator;
    emit ValidatorSet(id, validator);
  }

  /** @dev how to use it:
    require(
      isSignedByValidator(0, encodeForSignature(to, tokenType, lockedFrom, lockedUntil, mainIndex, tokenAmountOrID), signature),
      "WormholeBridge: invalid signature"
    );
  */

  // this is called internally and externally by the web3 app to test a validation
  function isSignedByValidator(
    uint256 id,
    bytes32 hash,
    bytes memory signature
  ) public view returns (bool) {
    return validators[id] != address(0) && validators[id] == hash.recover(signature);
  }
}
