const {expect} = require("chai");
const { deployContractUpgradeable, deployContract, number} = require("./helpers");

describe("BCFactory", function () {
  let factory;
  let genesis;
  let oracle;

  let owner, holder1, holder2, holder3;

  before(async function () {
    [owner, holder1, holder2, holder3] = await ethers.getSigners();

    BCGenesisToken = await ethers.getContractFactory("BCGenesisToken");
    BCOracleToken = await ethers.getContractFactory("BCOracleToken");
    BCFactory = await ethers.getContractFactory("BCFactory");
  });

  async function initAndDeploy() {
    genesis = await upgrades.deployProxy(BCGenesisToken, ["https://api.blocto.app/v1/genesis/{id}"]);
    await genesis.deployed();

    oracle = await upgrades.deployProxy(BCOracleToken, ["https://api.blocto.app/v1/oracle/{id}"]);
    await oracle.deployed();

    factory = await upgrades.deployProxy(BCFactory, [genesis.address, oracle.address]);
    await factory.deployed();
  }

  beforeEach(async function () {
    await initAndDeploy();
  });

  describe("setValidator", function () {
    it.skip("should successfully set Validator", async function () {
    });
  });

  describe("hashGenesis", function () {
    it.skip("should successfully hash genesis", async function () {
      const hash = await factory.hashGenesis(
        holder1.address,
        Math.random());
      expect(hash).to.be.a("string");
    });
  });

  describe("mintGenesis", function () {
    it("should fail to mint if not owner of parts", async function () {
      // const random = Math.random();
      // const sig1 = 
      // factory.mintGenesis(holder1, random, sig1);
    });
    it("should fail to mint if not signed", async function () {

    });
  });

  describe("mintOracle", function () {
    it("should fail to mint if not owner of parts", async function () {

    });
    it("should fail to mint if not signed", async function () {

    });
  });
});
