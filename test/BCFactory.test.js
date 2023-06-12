const {expect} = require("chai");
const {getRoot, getProofAndId} = require("./helpers");

const {signPackedData, assertThrowsMessage, getBlockNumber} = require("./helpers");
describe("BCFactory", function () {
  let factory;
  let genesis;
  let oracle;
  let blockNumber;

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

  describe("mintOracle", function () {
    it("should mint oracle", async function () {
      expect(await genesis.balanceOf(wl1.address)).equal(0);
      let [proof, id] = getProofAndId(wl1.address);
      let id1 = id;
      await factory.connect(wl1).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
      [proof, id] = getProofAndId(wl2.address);
      let id2 = id;
      await factory.connect(wl2).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl2.address)).to.equal(1);
      [proof, id] = getProofAndId(wl3.address);
      let id3 = id;
      await factory.connect(wl3).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl3.address)).to.equal(1);
      [proof, id] = getProofAndId(wl4.address);
      let id4 = id;
      await factory.connect(wl4).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl4.address)).to.equal(1);

      await genesis.connect(wl2)["safeTransferFrom(address,address,uint256)"](wl2.address, wl1.address, id2);
      await genesis.connect(wl3)["safeTransferFrom(address,address,uint256)"](wl3.address, wl1.address, id3);
      await genesis.connect(wl4)["safeTransferFrom(address,address,uint256)"](wl4.address, wl1.address, id4);

      expect(await genesis.balanceOf(wl1.address)).equal(4);

      await expect(factory.connect(wl1).mintOracle(id1, id2, id3, id4)).revertedWith("GenesisMintingNotEnded()")

      await genesis.endMinting();

      const mintedOracle = await factory.connect(wl1).mintOracle(id1, id2, id3, id4);
      await expect(mintedOracle).to.emit(factory, "OracleMinted").withArgs(1, id1, id2, id3, id4);
      expect(mintedOracle.hash).to.exist;
      //check if the parts are burned
      expect(await genesis.balanceOf(wl1.address)).equal(0);
      expect(await oracle.balanceOf(wl1.address)).equal(1);
    });

    it("should revert trying to use already used parts", async function () {
      let [proof, id] = getProofAndId(wl1.address);
      let id1 = id;
      await factory.connect(wl1).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
      [proof, id] = getProofAndId(wl2.address);
      let id2 = id;
      await factory.connect(wl2).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl2.address)).to.equal(1);
      [proof, id] = getProofAndId(wl3.address);
      let id3 = id;
      await factory.connect(wl3).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl3.address)).to.equal(1);
      [proof, id] = getProofAndId(wl4.address);
      let id4 = id;
      await factory.connect(wl4).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl4.address)).to.equal(1);

      await genesis.connect(wl2)["safeTransferFrom(address,address,uint256)"](wl2.address, wl1.address, id2);
      await genesis.connect(wl3)["safeTransferFrom(address,address,uint256)"](wl3.address, wl1.address, id3);
      await genesis.connect(wl4)["safeTransferFrom(address,address,uint256)"](wl4.address, wl1.address, id4);

      expect(await genesis.balanceOf(wl1.address)).equal(4);

      await genesis.endMinting();

      await factory.connect(wl1).mintOracle(id1, id2, id3, id4);
      await assertThrowsMessage(factory.connect(wl1).mintOracle(id1, id2, id3, id4), "ERC721: invalid token ID");
    });

    it("should revert if not owner of parts", async function () {
      let [proof, id] = getProofAndId(wl1.address);
      let id1 = id;
      await factory.connect(wl1).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
      [proof, id] = getProofAndId(wl2.address);
      let id2 = id;
      await factory.connect(wl2).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl2.address)).to.equal(1);
      [proof, id] = getProofAndId(wl3.address);
      let id3 = id;
      await factory.connect(wl3).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl3.address)).to.equal(1);
      [proof, id] = getProofAndId(wl4.address);
      let id4 = id;
      await factory.connect(wl4).mintGenesis(id, proof);
      expect(await genesis.balanceOf(wl4.address)).to.equal(1);

      await genesis.connect(wl2)["safeTransferFrom(address,address,uint256)"](wl2.address, wl1.address, id2);
      await genesis.connect(wl3)["safeTransferFrom(address,address,uint256)"](wl3.address, wl1.address, id3);

      expect(await genesis.balanceOf(wl1.address)).equal(3);

      await genesis.endMinting();

      await assertThrowsMessage(factory.connect(wl1).mintOracle(id1, id2, id3, id4), "NotGenesisOwner()");
    });
  });
});
