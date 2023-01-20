const {expect} = require("chai");
const {signPackedData, increaseBlockTimestampBy} = require("./helpers");

describe("BCFactory", function () {
  let factory;
  let genesis;
  let oracle;
  let validator0, validator1;

  let owner, holder1, holder2, holder3, minter;
  let validator0PK = "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a";

  before(async function () {
    [owner, holder1, holder2, holder3, validator0, validator1] = await ethers.getSigners();

    BCGenesisToken = await ethers.getContractFactory("BCGenesisToken");
    BCOracleToken = await ethers.getContractFactory("BCOracleToken");
    BCFactory = await ethers.getContractFactory("BCFactory");
  })

  async function initAndDeploy() {
    genesis = await upgrades.deployProxy(BCGenesisToken, ["https://api.blocto.app/v1/genesis/{id}"]);
    await genesis.deployed();
    genesis.setMaxSupply(100);

    oracle = await upgrades.deployProxy(BCOracleToken, ["https://api.blocto.app/v1/oracle/{id}"]);
    await oracle.deployed();
    oracle.setMaxSupply(100);

    factory = await upgrades.deployProxy(BCFactory, [genesis.address, oracle.address]);
    await factory.deployed();

    expect(await factory.setValidator(0, validator0.address))
      .emit(factory, "ValidatorSet")
      .withArgs(0, validator0.address);
    // expect(await factory.setValidator(1, validator1.address))
    //   .emit(factory, "ValidatorSet")
    //   .withArgs(1, validator1.address);
  }

  async function getSignature(hash, privateKey) {
    return signPackedData(hash, privateKey);
  }

  beforeEach(async function () {
    await initAndDeploy();
  });

  describe("setValidator", function () {
    it.only("should successfully set Validator", async function () {
      expect(await factory.setValidator(0, validator0.address))
        .emit(factory, "ValidatorSet")
        .withArgs(0, validator0.address);
    });
  });

  describe("hashGenesis", function () {
    it("should successfully hash genesis", async function () {
      const rand = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
      const hash = await factory.hashGenesis(holder1.address, rand);
      expect(hash).to.be.a("string");
    });
  });

  describe("mintGenesis", function () {
    it("should mint parts", async function () {
      const rand = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
      const hash = await factory.hashGenesis(holder1.address, rand);
      const sign = await getSignature(hash, validator0PK);
      await genesis.setFactory(factory.address, true);
      const part = await factory.connect(holder1).mintGenesis(rand, sign);
      expect(part.hash).to.exist;
    });

    it("should fail to mint if not signed", async function () {
      const rand = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
      const hash = await factory.hashGenesis(holder2.address, rand);
      const sign = await getSignature(hash, validator0PK);
      await genesis.setFactory(factory.address, true);
      await expect(factory.connect(holder1).mintGenesis(rand, sign)).revertedWith("InvalidSignature()");
    });
  });

  describe("hashOracle", function () {
    it("should successfully hash oracle", async function () {
      const rand = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
      const hash1 = await factory.hashOracle(holder1.address, 1, 2, 3, 4, rand);
      expect(hash1).to.be.a("string");
    });
  });

  describe("mintOracle", function () {
    it("should mint oracle", async function () {
      const rand = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
      const hash = await factory.hashGenesis(holder1.address, rand);
      const sign = await getSignature(hash, validator0PK);
      await genesis.setFactory(factory.address, true);
      for (let x = 0; x < 8; x++) {
        await factory.connect(holder1).mintGenesis(rand, sign);
      }
      expect(await genesis.balanceOf(holder1.address)).equal(8);
      const hash1 = await factory.hashOracle(holder1.address, 1, 2, 3, 4, rand);
      const sign1 = await getSignature(hash1, validator0PK);
      const hash2 = await factory.hashOracle(holder1.address, 5, 6, 7, 8, rand);
      const sign2 = await getSignature(hash2, validator0PK);
      await oracle.setFactory(factory.address, true);
      const orac = await factory.connect(holder1).mintOracle(1, 2, 3, 4, rand, sign1);
      await expect(orac).to.emit(factory, "OracleMinted").withArgs(1, 1, 2, 3, 4);
      expect(orac.hash).to.exist;
      //check if the parts are burned
      expect(await genesis.balanceOf(holder1.address)).equal(4);
      expect(await oracle.balanceOf(holder1.address)).equal(1);
      //check if signature already used
      expect(await factory.isSignatureUsed(sign1)).equal(true);
      expect(await factory.isSignatureUsed(sign2)).equal(false);
    });

    it("should fail to mint if not signed", async function () {
      const rand = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
      const hash = await factory.hashGenesis(holder1.address, rand);
      const sign = await getSignature(hash, validator0PK);
      await genesis.setFactory(factory.address, true);
      for (let x = 0; x < 4; x++) {
        await factory.connect(holder1).mintGenesis(rand, sign);
      }
      expect(await genesis.balanceOf(holder1.address)).equal(4);
      const hash1 = await factory.hashOracle(holder1.address, 1, 2, 3, 4, rand);
      const sign1 = await getSignature(hash1, validator0PK);
      await oracle.setFactory(factory.address, true);
      await expect(factory.connect(holder2).mintOracle(1, 2, 3, 4, rand, sign1)).revertedWith("InvalidSignature()");
    });

    it("should revert trying to use already used parts", async function () {
      const rand = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
      const hash = await factory.hashGenesis(holder1.address, rand);
      const sign = await getSignature(hash, validator0PK);
      await genesis.setFactory(factory.address, true);
      for (let x = 0; x < 4; x++) {
        await factory.connect(holder1).mintGenesis(rand, sign);
      }
      expect(await genesis.balanceOf(holder1.address)).equal(4);
      const hash1 = await factory.hashOracle(holder1.address, 1, 2, 3, 4, rand);
      const sign1 = await getSignature(hash1, validator0PK);
      await oracle.setFactory(factory.address, true);
      await factory.connect(holder1).mintOracle(1, 2, 3, 4, rand, sign1);
      await expect(factory.connect(holder1).mintOracle(1, 2, 3, 4, rand, sign1)).revertedWith("ERC721: invalid token ID");
    });

    it("should revert if not owner of parts", async function () {
      const rand = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
      const hash = await factory.hashGenesis(holder1.address, rand);
      const sign = await getSignature(hash, validator0PK);
      await genesis.setFactory(factory.address, true);
      for (let x = 0; x < 4; x++) {
        await factory.connect(holder1).mintGenesis(rand, sign);
      }
      expect(await genesis.balanceOf(holder1.address)).equal(4);
      const hash1 = await factory.hashOracle(holder2.address, 1, 2, 3, 4, rand);
      const sign1 = await getSignature(hash1, validator0PK);
      await oracle.setFactory(factory.address, true);
      await expect(factory.connect(holder2).mintOracle(1, 2, 3, 4, rand, sign1)).revertedWith("NotGenesisOwner()");
    });
  });
});
