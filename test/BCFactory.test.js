const {expect} = require("chai");
const {getRoot, getProofAndId, getProofAndIdByIndex, addr0} = require("./helpers");

// this is an array set up just for simulation
const {signPackedData, assertThrowsMessage, getBlockNumber} = require("./helpers");
describe("BCFactory", function () {
  let factory;
  let genesis;
  let oracle;
  let blockNumber;
  let encoded;

  let owner, wl1, nwl1, nwl2, wl2, wl3, wl4, wl5, wl6, wl7;
  let validator0PK = "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a";

  before(async function () {
    [owner, wl1, nwl1, nwl2, wl2, wl3, wl4, wl5, wl6, wl7] = await ethers.getSigners();

    BCGenesisToken = await ethers.getContractFactory("BCGenesisToken");
    BCOracleToken = await ethers.getContractFactory("BCOracleToken");
    BCFactory = await ethers.getContractFactory("BCFactory");
  });

  async function initAndDeploy() {
    genesis = await upgrades.deployProxy(BCGenesisToken, ["https://s3.Byte.City/BodyPart/"]);
    await genesis.deployed();
    blockNumber = await getBlockNumber();

    oracle = await upgrades.deployProxy(BCOracleToken, ["https://s3.Byte.City/Robot/"]);
    await oracle.deployed();
    blockNumber = await getBlockNumber();

    factory = await upgrades.deployProxy(BCFactory, [genesis.address, oracle.address]);
    await factory.deployed();

    await genesis.setFactory(factory.address, true);
    await oracle.setFactory(factory.address, true);

    await expect(factory.setRoot(getRoot())).emit(factory, "RootSet").withArgs(getRoot());
    // console.log(encoded.map(e => e.toString()));
  }

  async function getSignature(hash, privateKey) {
    return signPackedData(hash, privateKey);
  }

  beforeEach(async function () {
    await initAndDeploy();
  });

  describe("mintGenesis", function () {
    it("should mint parts", async function () {
      let [proof, id] = getProofAndId(wl1.address);
      await factory.connect(wl1).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
    });

    it("should fail to mint if wrong proof", async function () {
      let [proof, id] = getProofAndId(wl2.address);
      await assertThrowsMessage(factory.connect(wl1).mintGenesis(id, proof), "InvalidProof()");
    });
  });
});
