const {expect} = require("chai");
const {deployContractUpgradeable, deployContract, number} = require("./helpers");

describe("Integration test", function () {
  let myToken;
  let bodyPartToken;
  let factory;

  let owner, holder1, holder2, holder3;

  before(async function () {
    [owner, holder1, holder2, holder3] = await ethers.getSigners();
  });

  beforeEach(async function () {});

  it("should verify the flow", async function () {});
});
