const {expect} = require("chai");

describe("GenesisFactory", function () {
  let genesisParts;
  let genesisToken;

  let owner, holder1, holder2, holder3;

  before(async function () {
    [owner, holder1, holder2, holder3] = await ethers.getSigners();
    GenesisParts = await ethers.getContractFactory("GenesisParts");
    GenesisFactory = await ethers.getContractFactory("GenesisFactory");
  });

  async function initAndDeploy() {
    genesisParts = await GenesisParts.deploy();
    await(genesisParts).deployed();

    genesisFactory = await GenesisFactory.deploy();
    await(genesisFactory).deployed();

    await genesisParts.setBurner(genesisFactory.address);
    await genesisFactory.setGenesisParts(genesisParts.address);
  };

  beforeEach(async function () {
    await initAndDeploy();
  });

  describe("burnBatch", ()=> {
    it("should burn a batch of GenesisParts token", async function () {
      const tokenIds = [1001, 1002, 1003, 1004];
      const mintAmounts = [10,10,10,10];
      const burnAmounts = [1,1,1,1];
      await genesisParts.mintBatch(holder1.address, tokenIds, mintAmounts);
      let balance0 = await genesisParts.balanceOf(holder1.address, tokenIds[0])
      await genesisFactory.burnBatch(holder1.address, tokenIds, burnAmounts);
      let balance1 = await genesisParts.balanceOf(holder1.address, tokenIds[0])
      expect(balance1).to.equal(balance0.sub(burnAmounts[0]));
    });
  })

});
