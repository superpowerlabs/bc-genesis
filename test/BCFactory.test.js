const {expect} = require("chai");
const {getRoot, getProofAndId, getProofAndIdByIndex, addr0} = require("./helpers");

// this is an array set up just for simulation
const indexes = [
  1, 3, 1, 1, 2, 2, 1, 4, 1, 0, 3, 0, 2, 0, 4, 1, 0, 3, 0, 0, 3, 0, 1, 2, 0, 0, 0, 0, 2, 0, 4, 0, 1, 2, 0, 0, 2, 1, 1, 4, 1, 0,
  3, 3, 1, 3, 0, 2, 0, 1, 0, 3, 2, 1, 3, 1, 1, 0, 4, 0, 1, 2, 3, 4, 1, 3, 4, 3, 2, 1, 0, 0, 1, 1, 3, 2, 2, 1, 3, 1, 2, 1, 1, 1,
  0, 3, 1, 4, 0, 3, 1, 1, 0, 0, 2, 0, 3, 0, 0, 2, 4, 1, 3, 2, 1, 3, 4, 3, 3, 2, 1, 2, 0, 2, 1, 3, 0, 0, 0, 4, 2, 4, 1, 0, 1, 1,
  4, 3, 0, 1, 3, 0, 0, 2, 2, 0, 3, 3, 2, 2, 1, 3, 0, 0, 0, 2, 0, 0, 1, 3, 0, 1, 2, 1, 2, 3, 0, 2, 0, 4, 4, 0, 4, 3, 2, 2, 0, 2,
  1, 2, 2, 2, 3, 1, 0, 0, 1, 3, 1, 4, 2, 3, 2, 2, 1, 2, 0, 2, 0, 1, 4, 3, 0, 4, 1, 4, 2, 0, 0, 2, 0, 1, 0, 2, 2, 2, 1, 0, 1, 0,
  0, 3, 1, 2, 1, 2, 2, 0, 4, 0, 0, 0, 4, 1, 0, 2, 0, 3, 4, 0, 0, 4, 3, 1, 3, 2, 0, 4, 1, 0, 3, 1, 3, 1, 1, 0, 0, 0, 1, 0,
];

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

    if (!encoded) {
      encoded = [];
      let index77;
      for (let i = 0; i < indexes.length; i++) {
        if (i % 77 === 0) {
          index77 = [];
        }
        index77.push(indexes[i]);
        if (index77.length === 77) {
          encoded.push(await factory.encode(index77));
        }
      }
      if (index77.length > 0) {
        encoded.push(await factory.encode(index77));
      }
    }
    // console.log(encoded.map(e => e.toString()));
    await factory.saveRarityIndex(encoded);
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

  describe.only("mintOracle", function () {
    it("should mint oracle", async function () {
      for (k = 0; k < 4; k++) {
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
      // await expect(factory.connect(wl1).mintOracle(1, 6, 11, 13)).revertedWith("NotAFullSet()");
      // await expect(factory.connect(wl1).mintOracle(1, 6, 11, 49)).revertedWith("NotAllSameRarity()");

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
