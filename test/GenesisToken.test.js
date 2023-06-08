const {expect} = require("chai");
const {initEthers, assertThrowsMessage, getBlockNumber, increaseBlockTimestampBy, getProofAndId} = require("./helpers");

describe("GenesisToken", function () {
  let GenesisToken, bodyPart;
  let OracleToken, robot;
  let MockToken, mock;
  let Factory, factory;
  let owner, wl1;
  let blockNumber;

  before(async function () {
    [owner, wl1] = await ethers.getSigners();
    GenesisToken = await ethers.getContractFactory("BCGenesisToken");
    OracleToken = await ethers.getContractFactory("BCOracleToken");
    MockToken = await ethers.getContractFactory("BCMockToken");
    Factory = await ethers.getContractFactory("MockFactory");
    initEthers(ethers);
  });

  async function initAndDeploy() {
    bodyPart = await upgrades.deployProxy(GenesisToken, ["https://s3.Byte.City/BodyPart/"]);
    await bodyPart.deployed();

    robot = await upgrades.deployProxy(OracleToken, ["https://s3.Byte.City/Robot/"]);
    await robot.deployed();

    mock = await upgrades.deployProxy(MockToken, ["https://s3.Byte.City/Mock/"]);
    await mock.deployed();

    factory = await Factory.deploy(bodyPart.address, robot.address);
    await factory.deployed();
  }

  describe("BCNFTBase Testing", async function () {
    beforeEach(async function () {
      await initAndDeploy();
    });

    it("Should set Uri Flow", async function () {
      expect(await bodyPart.contractURI()).equal("https://s3.Byte.City/BodyPart/0");

      const uri = "https://s3.Byte.City/Test/";
      await bodyPart.updateTokenURI(uri);
      expect(await bodyPart.contractURI()).equal(uri + "0");

      await bodyPart.freezeTokenURI();

      await expect(bodyPart.updateTokenURI(uri)).revertedWith("FrozenTokenURI");
    });

    it("Should implement ILockable", async function () {
      await bodyPart.setFactory(factory.address, true);
      blockNumber = await getBlockNumber();
      let id = 1;
      await factory.mintGenesis(wl1.address, id);

      await bodyPart.connect(wl1).approve(factory.address, id);
      expect(await bodyPart.locked(id)).equal(false);

      await expect(factory.lockGenesis(id)).revertedWith("Forbidden");
      await bodyPart.setLocker(factory.address);
      expect(await bodyPart.isLocker(factory.address)).equal(true);
      await factory.lockGenesis(id);
      expect(await bodyPart.locked(id)).equal(true);
    });
  });
});
