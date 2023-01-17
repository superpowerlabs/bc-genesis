const {expect} = require("chai");

describe("GenesisParts", function () {
  let genesisParts;
  let genesisFactory;
  let burner;
  let owner, holder1, holder2, holder3;

  before(async function () {
    [owner, holder1, holder2, holder3] = await ethers.getSigners();
    GenesisParts = await ethers.getContractFactory("GenesisParts");
    GenesisFactory = await ethers.getContractFactory("GenesisFactory");
    BurnerMock = await ethers.getContractFactory("BurnerMock");
  });

  async function initAndDeploy() {
    genesisParts = await GenesisParts.deploy();
    await(genesisParts).deployed();

    genesisFactory = await GenesisFactory.deploy();
    await(genesisFactory).deployed();

    burner = await BurnerMock.deploy();
    await burner.deployed();
    await burner.setGenesisParts(genesisParts.address);
  };

  beforeEach(async function () {
    await initAndDeploy();
  });

  describe("mint", ()=> {

    it("should let gamer mint (no fees) a GenesisPart by index", async function () {
      const tokenId = 1001;
      await genesisParts.mint(holder1.address, tokenId, 1);
      expect(await genesisParts.balanceOf(holder1.address, tokenId)).to.equal(1);
    });

  });
  
  describe("setBurner and burn", ()=> {

    it("should burn the token if Burner", async function () {
      const tokenId = 1001;
      const burnAmount = 5;
      await genesisParts.mint(holder1.address, tokenId, 10);
      let balance0 = await genesisParts.balanceOf(holder1.address, tokenId)
      await genesisParts.setBurner(burner.address);
      await burner.burn(holder1.address, tokenId, burnAmount);
      let balance1 = await genesisParts.balanceOf(holder1.address, tokenId)
      expect(balance1).to.equal(balance0.sub(burnAmount));
    });

    // TODO: test unhappy path
    // it("should fail burn the token if Burner", async function () {
    // });
  });

  describe("setBurner and burnBatch", ()=> {

    it("should burn the token if Burner", async function () {
      const tokenIds = [1001, 1002, 1003, 1004];
      const mintAmounts = [10,10,10,10];
      const burnAmounts = [1,1,1,1];
      await genesisParts.mintBatch(holder1.address, tokenIds, mintAmounts);
      let balance0 = await genesisParts.balanceOf(holder1.address, tokenIds[0])
      await genesisParts.setBurner(burner.address);
      await burner.burnBatch(holder1.address, tokenIds, burnAmounts);
      let balance1 = await genesisParts.balanceOf(holder1.address, tokenIds[0])
      expect(balance1).to.equal(balance0.sub(burnAmounts[0]));
    });

    // TODO: test unhappy path
    // it("should fail burn the token if Burner", async function () {
    // });
  });
    
})