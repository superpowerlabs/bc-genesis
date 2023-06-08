const {expect} = require("chai");
const {deployContractUpgradeable, deployContract, number} = require("./helpers");

describe("Integration test", function () {
  let GenesisToken, bodyPart;
  let OracleToken, robot;
  let Factory, factory;
  let owner, holder1, holder2, holder3;

  before(async function () {
    [owner, holder1, holder2, holder3] = await ethers.getSigners();
  });

  beforeEach(async function () {});

  it("should verify the flow", async function () {});
});
