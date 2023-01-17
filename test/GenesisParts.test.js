const {expect, assert} = require("chai");
const { deployContractUpgradeable, deployContract, number} = require("./helpers");

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
  
  describe("setBurner", ()=> {

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

  describe("isVariantSetConsistent", ()=> {

    it("should test a valid set", async function () {
      const tokenIds = [101, 201, 301, 401];
      const {0: boolValue, 1:strValue } = await genesisParts.isVariantSetConsistent(tokenIds);
      expect(boolValue).to.equal(true);
      expect(strValue).to.equal("success");
    });

    it("should fail because missing part", async function () {
      const tokenIds = [101, 201, 301];
      const {0: boolValue, 1:strValue } = await genesisParts.isVariantSetConsistent(tokenIds);
      expect(boolValue).to.equal(false);
      expect(strValue).to.equal("Not enough or too many parts");
    });

    it("should test an inconstant set of parts", async function () {
      const tokenIds = [101, 201, 301, 404];
      const {0: boolValue, 1:strValue } = await genesisParts.isVariantSetConsistent(tokenIds);
      expect(boolValue).to.equal(false);
      expect(strValue).to.equal("Unconsistent variants in token set");
    });

  });
    
})