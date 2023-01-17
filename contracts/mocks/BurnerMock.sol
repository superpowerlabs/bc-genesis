// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../GenesisParts.sol";

contract BurnerMock {
  GenesisParts public part;

  function setGenesisParts(address parts_) external {
    require(parts_.code.length > 0, "Not a contract");
    part = GenesisParts(parts_);
  }

  function burn(
    address account,
    uint256 id,
    uint256 amount
  ) public {
    part.burn(account, id, amount);
  }

  function burnBatch(
    address account,
    uint256[] memory ids,
    uint256[] memory amounts
  ) public {
    part.burnBatch(account, ids, amounts);
  }
}
