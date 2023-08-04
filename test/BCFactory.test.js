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
  getProofAndIdByIndex,
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
      await assertThrowsMessage(factory.connect(wl1).mintGenesis(proof, true), "PhaseClosedOrNotOpenYet()");
    });

    it("should mint parts", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);
      await increaseBlockTimestampBy(2000);
      let proof = getProof(0, wl1.address);
      await factory.connect(wl1).mintGenesis(proof, true);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
    });

    it("should fail to mint if wrong proof", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);
      await increaseBlockTimestampBy(2000);
      let proof = getProof(0, wl2.address);
      await assertThrowsMessage(factory.connect(wl1).mintGenesis(proof, true), "InvalidProof()");
    });

    it("should fail if wrong phase", async function () {
      proof = getProof(1, wl1.address);
      await assertThrowsMessage(factory.connect(wl1).mintGenesis(proof, false), "PhaseClosedOrNotOpenYet()");
    });

    it("should fail to mint if phase not opened", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);
      await increaseBlockTimestampBy(2000);

      let proof = getProof(0, wl1.address);
      await expect(factory.connect(wl1).mintGenesis(proof, true)).emit(genesis, "Transfer").withArgs(addr0, wl1.address, 1);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);

      proof = getProof(0, wl2.address);
      await assertThrowsMessage(factory.connect(wl2).mintGenesis(proof, false), "PhaseClosedOrNotOpenYet()");
      await expect(factory.connect(wl2).mintGenesis(proof, true)).emit(genesis, "Transfer").withArgs(addr0, wl2.address, 2);

      expect(await factory.hasProofBeenUsed(proof)).to.equal(true);

      await assertThrowsMessage(factory.connect(wl2).mintGenesis(proof, true), "ProofAlreadyUsed()");

      await increaseBlockTimestampBy(3600 * 2);

      proof = getProof(0, wl3.address);
      await expect(factory.connect(wl3).mintGenesis(proof, true)).emit(genesis, "Transfer").withArgs(addr0, wl3.address, 3);

      proof = getProof(1, wl2.address);
      await expect(factory.connect(wl2).mintGenesis(proof, false)).emit(genesis, "Transfer").withArgs(addr0, wl2.address, 4);

      proof = getProof(1, wl3.address);
      await expect(factory.connect(wl3).mintGenesis(proof, false)).emit(genesis, "Transfer").withArgs(addr0, wl3.address, 5);

      proof = getProof(1, wl4.address);
      await expect(factory.connect(wl4).mintGenesis(proof, false)).emit(genesis, "Transfer").withArgs(addr0, wl4.address, 6);

      await increaseBlockTimestampBy(3600 * 24);

      await expect(factory.connect(wl5).mintGenesis([], false)).emit(genesis, "Transfer").withArgs(addr0, wl5.address, 7);

      await expect(factory.connect(wl5).mintGenesis([], false)).emit(genesis, "Transfer").withArgs(addr0, wl5.address, 8);

      proof = getProof(1, wl5.address);
      await expect(factory.connect(wl5).mintGenesis(proof, false)).emit(genesis, "Transfer").withArgs(addr0, wl5.address, 9);
      //
      proof = getProof(0, nwl2.address);
      await expect(factory.connect(nwl2).mintGenesis(proof, true)).emit(genesis, "Transfer").withArgs(addr0, nwl2.address, 10);

      await genesis.endMinting();

      await assertThrowsMessage(factory.connect(wl7).mintGenesis([], false), "PhaseClosedOrNotOpenYet()");
    });
  });

  describe("mintOracle", function () {
    it("should mint oracle", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);
      // jump to public phase, to simplify testing
      await increaseBlockTimestampBy(3600 * 25);

      for (let k = 0; k < 4; k++) {
        for (let i = 1; i < 17; i++) {
          let wl = i > 12 ? wl4 : i > 8 ? wl3 : i > 4 ? wl2 : wl1;
          let [proof, id] = getProofAndIdByIndex(wl.address, k * 4 + ((i - 1) % 4));
          await factory.connect(wl).mintGenesis(id, proof);
        }
      }

      await genesis.connect(wl2)["safeTransferFrom(address,address,uint256)"](wl2.address, wl1.address, 6);
      await genesis.connect(wl3)["safeTransferFrom(address,address,uint256)"](wl3.address, wl1.address, 11);
      await genesis.connect(wl4)["safeTransferFrom(address,address,uint256)"](wl4.address, wl1.address, 13);

      expect(await genesis.balanceOf(wl1.address)).equal(19);

      await expect(factory.connect(wl1).mintOracle(1, 6, 11, 53)).revertedWith("NotGenesisOwner()");
      await expect(factory.connect(wl1).mintOracle(1, 6, 11, 13)).revertedWith("NotAFullSet()");
      await expect(factory.connect(wl1).mintOracle(1, 6, 11, 49)).revertedWith("NotAllSameRarity()");

      await expect(factory.connect(wl1).mintOracle(2, 6, 11, 13))
        .emit(factory, "OracleMinted")
        .withArgs(1, 2, 6, 11, 13)
        .emit(genesis, "Transfer")
        .withArgs(wl1.address, addr0, 2)
        .emit(genesis, "Transfer")
        .withArgs(wl1.address, addr0, 6)
        .emit(genesis, "Transfer")
        .withArgs(wl1.address, addr0, 11)
        .emit(genesis, "Transfer")
        .withArgs(wl1.address, addr0, 13);

      //check if the parts are burned
      expect(await genesis.balanceOf(wl1.address)).equal(15);
      expect(await oracle.balanceOf(wl1.address)).equal(1);

      await expect(factory.connect(wl1).mintOracle(2, 6, 11, 13)).revertedWith("ERC721: invalid token ID");
    });
  });

  describe("encode/decode", async function () {
    it("should verify that the rarity by index is correct", async function () {
      this.timeout(10000);
      for (let i = 0; i < 10000; i += Math.round(13 * Math.random())) {
        const rarity = await factory.rarityByIndex(i);
        expect(rarity).to.equal(indexes[Math.floor(i / 40)]);
      }
    });
  });
});
