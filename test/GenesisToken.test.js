const {expect} = require("chai");
const { deployContractUpgradeable, deployContract, number} = require("./helpers");

describe("GenesisToken", function () {
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
  
  describe("listMintedAvatars", ()=> {
    it("should let gamer list all its minted Avatars", async function () {

    });
  
  })

});
