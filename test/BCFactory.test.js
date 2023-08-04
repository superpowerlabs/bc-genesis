const {expect} = require("chai");
const {
  getRoots,
  getProof,
  addr0,
  signPackedData,
  assertThrowsMessage,
  getBlockNumber,
  increaseBlockTimestampBy,
  getTimestamp,
} = require("./helpers");

describe("BCFactory", function () {
  let factory;
  let genesis;
  let oracle;
  let blockNumber;
  let encoded;

  const phase = {
    NotOpened: 0,
    GuaranteedAllowList: 1,
    GeneralAllowList: 2,
    Public: 3,
    Closed: 4,
  };

  let owner, wl1, nwl1, nwl2, wl2, wl3, wl4, wl5, wl6, wl7;
  let validator0PK = "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a";

  before(async function () {
    [owner, wl1, nwl1, nwl2, wl2, wl3, wl4, wl5, wl6, wl7] = await ethers.getSigners();

    BCGenesisToken = await ethers.getContractFactory("BCGenesisToken");
    BCOracleToken = await ethers.getContractFactory("BCOracleToken");
    BCFactory = await ethers.getContractFactory("BCFactory");
  });

  async function initAndDeploy() {
    genesis = await upgrades.deployProxy(BCGenesisToken, ["https://meta.byte.city/genesis/"]);
    await genesis.deployed();
    blockNumber = await getBlockNumber();

    oracle = await upgrades.deployProxy(BCOracleToken, ["https://meta.byte.city/oracles/"]);
    await oracle.deployed();
    blockNumber = await getBlockNumber();

    factory = await upgrades.deployProxy(BCFactory, [genesis.address, oracle.address]);
    await factory.deployed();

    await genesis.setFactory(factory.address, true);
    await oracle.setFactory(factory.address, true);

    await expect(factory.setRoot(...getRoots()))
      .emit(factory, "RootSet")
      .withArgs(...getRoots());
    // console.log(encoded.map(e => e.toString()));
  }

  async function getSignature(hash, privateKey) {
    return signPackedData(hash, privateKey);
  }

  beforeEach(async function () {
    await initAndDeploy();
  });

  describe("mintGenesis", function () {
    it("should fail to mint if phase not opened", async function () {
      let proof = getProof(0, wl1.address);
      await assertThrowsMessage(factory.connect(wl1).mintGenesisPhaseOne(proof), "PhaseClosedOrNotOpenYet()");
    });

    it("should mint parts", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);
      await increaseBlockTimestampBy(2000);
      let proof = getProof(0, wl1.address);
      await factory.connect(wl1).mintGenesisPhaseOne(proof);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
    });

    it("should fail to mint if wrong proof", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);
      await increaseBlockTimestampBy(2000);
      let proof = getProof(0, wl2.address);
      await assertThrowsMessage(factory.connect(wl1).mintGenesisPhaseOne(proof), "InvalidProof()");
    });

    it("should fail if wrong phase", async function () {
      proof = getProof(1, wl1.address);
      await assertThrowsMessage(factory.connect(wl1).mintGenesisPhaseTwo(proof), "PhaseClosedOrNotOpenYet()");
    });

    it("should fail to mint if phase not opened", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);
      await increaseBlockTimestampBy(2000);

      let proof = getProof(0, wl1.address);
      await expect(factory.connect(wl1).mintGenesisPhaseOne(proof)).emit(genesis, "Transfer").withArgs(addr0, wl1.address, 1);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);

      proof = getProof(0, wl2.address);
      await expect(factory.connect(wl2).mintGenesisPhaseOne(proof)).emit(genesis, "Transfer").withArgs(addr0, wl2.address, 2);

      await assertThrowsMessage(factory.connect(wl2).mintGenesisPhaseOne(proof), "ProofAlreadyUsed()");

      await increaseBlockTimestampBy(3600 * 2);

      proof = getProof(0, wl3.address);
      await expect(factory.connect(wl3).mintGenesisPhaseOne(proof)).emit(genesis, "Transfer").withArgs(addr0, wl3.address, 3);

      proof = getProof(1, wl2.address);
      await expect(factory.connect(wl2).mintGenesisPhaseTwo(proof)).emit(genesis, "Transfer").withArgs(addr0, wl2.address, 4);

      proof = getProof(1, wl3.address);
      await expect(factory.connect(wl3).mintGenesisPhaseTwo(proof)).emit(genesis, "Transfer").withArgs(addr0, wl3.address, 5);

      proof = getProof(1, wl4.address);
      await expect(factory.connect(wl4).mintGenesisPhaseTwo(proof)).emit(genesis, "Transfer").withArgs(addr0, wl4.address, 6);

      await increaseBlockTimestampBy(3600 * 24);

      await expect(factory.connect(wl5).mintGenesisPhaseThree()).emit(genesis, "Transfer").withArgs(addr0, wl5.address, 7);

      await expect(factory.connect(wl5).mintGenesisPhaseThree()).emit(genesis, "Transfer").withArgs(addr0, wl5.address, 8);

      proof = getProof(1, wl5.address);
      await expect(factory.connect(wl5).mintGenesisPhaseTwo(proof)).emit(genesis, "Transfer").withArgs(addr0, wl5.address, 9);
      //
      proof = getProof(0, nwl2.address);
      await expect(factory.connect(nwl2).mintGenesisPhaseOne(proof))
        .emit(genesis, "Transfer")
        .withArgs(addr0, nwl2.address, 10);

      await genesis.endMinting();

      await assertThrowsMessage(factory.connect(wl7).mintGenesisPhaseThree(), "PhaseClosedOrNotOpenYet()");
    });
  });
});
