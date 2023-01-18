const {expect, assert} = require("chai");

const {initEthers} = require("./helpers");

// tests to be fixed

describe("GenesisToken", function () {
  let GenesisToken, bodyPart;
  let OracleToken, robot;
  let Factory, factory;
  let owner, holder;

  before(async function () {
    [owner, holder] = await ethers.getSigners();
    GenesisToken = await ethers.getContractFactory("BCGenesisToken");
    OracleToken = await ethers.getContractFactory("BCOracleToken");

    Factory = await ethers.getContractFactory("MockFactory");
    initEthers(ethers);
  });

  async function initAndDeploy() {
    bodyPart = await upgrades.deployProxy(GenesisToken, ["https://s3.Byte.City/BodyPart/"]);
    await bodyPart.deployed();
    robot = await upgrades.deployProxy(OracleToken, ["https://s3.Byte.City/Robot/"]);
    await robot.deployed();
    factory = await Factory.deploy();
    await factory.deployed();
  }

  describe("constructor and initialization", async function () {
    beforeEach(async function () {
      await initAndDeploy();
    });

    it("should set Factory and Max Supply", async function () {

      expect(await bodyPart.hasFactories()).equal(false)
      await bodyPart.setFactory(factory.address, true);

      expect(await bodyPart.hasFactories()).equal(true)
      expect(await bodyPart.isFactory(factory.address)).equal(true)

      expect(await bodyPart.maxSupply()).equal(0)
      await bodyPart.setMaxSupply(10)
      expect(await bodyPart.maxSupply()).equal(10)
      
    });
    it("should Mint and Burn Genesis", async function () {
        await bodyPart.setFactory(factory.address, true);
        await bodyPart.setMaxSupply(10)

        await factory.initialize(bodyPart.address, robot.address)


        expect(await bodyPart.balanceOf(holder.address)).equal(0)
        await factory.mintGenesis(holder.address)
        await factory.mintGenesis(holder.address)
        await factory.mintGenesis(holder.address)
        expect(await bodyPart.balanceOf(holder.address)).equal(3)

        await factory.burnBatch([1,2])
        expect(await bodyPart.balanceOf(holder.address)).equal(1)
      });
      
  });
});
