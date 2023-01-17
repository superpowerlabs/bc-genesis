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

  //TODO: test all balances with balanceOfBatch
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

  describe("isVariantSetConsistent", ()=> {

    it("should test a valid set", async function () {
      const tokenIds = [101, 201, 301, 401];
      const {0: boolValue, 1:strValue } = await genesisFactory.isVariantSetConsistent(tokenIds);
      expect(boolValue).to.equal(true);
      expect(strValue).to.equal("success");
    });

    it("should fail because missing part", async function () {
      const tokenIds = [101, 201, 301];
      const {0: boolValue, 1:strValue } = await genesisFactory.isVariantSetConsistent(tokenIds);
      expect(boolValue).to.equal(false);
      expect(strValue).to.equal("Not enough or too many parts");
    });

    it("should test an inconstant set of parts", async function () {
      const tokenIds = [101, 201, 301, 404];
      const {0: boolValue, 1:strValue } = await genesisFactory.isVariantSetConsistent(tokenIds);
      expect(boolValue).to.equal(false);
      expect(strValue).to.equal("Unconsistent variants in token set");
    });

  });


  describe("mint", ()=> {
    it("should mint successfully an new token from a set of GenesisPart", async function () {
      const tokenIds = [1001, 2001, 3001, 4001]; // 4 parts of same color/variant
      const mintAmounts = [1,1,1,1];
      const holders = [holder1.address, holder1.address,holder1.address,holder1.address]

      await genesisParts.mintBatch(holder1.address, tokenIds, mintAmounts);
      // minting some GenesisParts
      let balances0 = await genesisParts.balanceOfBatch(holders, tokenIds);

      // // try to mint GenesisToken from the parts
      let genToken = await genesisFactory.mintGenesisToken(holder1.address, tokenIds);

      // successfully minting burns GenesisParts
      let balances1 = await genesisParts.balanceOfBatch(holders, tokenIds)
      for (let index = 0; index < balances1.length; index++) {
        expect(balances1[index]).to.equal(balances0[index].sub(1));        
      }
      // holder1 should have one GenesisToken
      expect(genToken(holder1.address)).to.equal(1);
    });

    it("should fail to mint an new token from a set of GenesisPart", async function () {
      const tokenIds = [1001, 2001, 3001, 4001, 4010]; // 4 parts of same color/variant
      const incompleteSet = [1001, 2001]; // 4 parts of same color/variant
      const invalidSet = [1001, 2001, 3001, 4010]; // 4 parts of same color/variant
      const mintAmounts = [1,1,1,1,1];
      const holders = [holder1.address, holder1.address, holder1.address,holder1.address,holder1.address]

      await genesisParts.mintBatch(holder1.address, tokenIds, mintAmounts);
      // // try to mint GenesisToken from the parts
      await expect(genesisFactory.mintGenesisToken(holder1.address, invalidSet))
        .revertedWith("Unconsistent variants in token set");

      await expect(genesisFactory.mintGenesisToken(holder1.address, incompleteSet))
        .revertedWith("Not enough or too many parts");

    });
  })

});
