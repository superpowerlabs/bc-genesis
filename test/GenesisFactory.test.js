const {expect} = require("chai");
const { deployContractUpgradeable, deployContract, number} = require("./helpers");

describe("GenesisFactory", function () {
  let myToken;
  let bodyPartToken;
  let factory;

  let owner, holder1, holder2, holder3;

  before(async function () {
    [owner, holder1, holder2, holder3] = await ethers.getSigners();
  });

  async function initAndDeploy() {
    // genesisParts = await deployUtils.deployProxy("GenesisParts");

  };

  beforeEach(async function () {
    await initAndDeploy();
  });

  describe("mintNewAvatar", ()=> {

    it("should let gamer mint a new Avatar if parts set complete", async function () {

    });

    it("should fail to let gamer mint a new Avatar if parts set not complete", async function () {

    });

  })

});
