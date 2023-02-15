const {expect} = require("chai");
const {getRoot, getProof} = require("./helpers");

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
    await genesis.setParameters(blockNumber + 1);

    oracle = await upgrades.deployProxy(BCOracleToken, ["https://s3.Byte.City/Robot/"]);
    await oracle.deployed();
    blockNumber = await getBlockNumber();
    await oracle.setParameters(blockNumber + 1);

    factory = await upgrades.deployProxy(BCFactory, [genesis.address, oracle.address]);
    await factory.deployed();

    await genesis.setFactory(factory.address, true);
    await oracle.setFactory(factory.address, true);

    await expect(factory.setRoot(getRoot()))
        .emit(factory, "RootSet")
        .withArgs(getRoot());
  }

  async function getSignature(hash, privateKey) {
    return signPackedData(hash, privateKey);
  }

  beforeEach(async function () {
    await initAndDeploy();
  });

  describe("mintGenesis", function () {
    it("should mint parts", async function () {
      let proof = getProof(wl1.address);
      await factory.connect(wl1).mintGenesis(proof);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
    });

    it("should fail to mint if wrong proof", async function () {
      let proof = getProof(wl2.address);
      await assertThrowsMessage(factory.connect(wl1).mintGenesis(proof),
          "InvalidProof()");
    });

  });

  describe("mintOracle", function () {
    it("should mint oracle", async function () {
      let proof = getProof(wl1.address);
      await factory.connect(wl1).mintGenesis(proof);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
      proof = getProof(wl2.address);
      await factory.connect(wl2).mintGenesis(proof);
      expect(await genesis.balanceOf(wl2.address)).to.equal(1);
      proof = getProof(wl3.address);
      await factory.connect(wl3).mintGenesis(proof);
      expect(await genesis.balanceOf(wl3.address)).to.equal(1);
      proof = getProof(wl4.address);
      await factory.connect(wl4).mintGenesis(proof);
      expect(await genesis.balanceOf(wl4.address)).to.equal(1);

      await genesis.connect(wl2)["safeTransferFrom(address,address,uint256)"](wl2.address, wl1.address, 2);
      await genesis.connect(wl3)["safeTransferFrom(address,address,uint256)"](wl3.address, wl1.address, 3);
      await genesis.connect(wl4)["safeTransferFrom(address,address,uint256)"](wl4.address, wl1.address, 4);

      expect(await genesis.balanceOf(wl1.address)).equal(4);

      const mintedOracle = await factory.connect(wl1).mintOracle(1, 2, 3, 4);
      await expect(mintedOracle).to.emit(factory, "OracleMinted").withArgs(1, 1, 2, 3, 4);
      expect(mintedOracle.hash).to.exist;
      //check if the parts are burned
      expect(await genesis.balanceOf(wl1.address)).equal(0);
      expect(await oracle.balanceOf(wl1.address)).equal(1);
    });

    it("should revert trying to use already used parts", async function () {
      let proof = getProof(wl1.address);
      await factory.connect(wl1).mintGenesis(proof);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
      proof = getProof(wl2.address);
      await factory.connect(wl2).mintGenesis(proof);
      expect(await genesis.balanceOf(wl2.address)).to.equal(1);
      proof = getProof(wl3.address);
      await factory.connect(wl3).mintGenesis(proof);
      expect(await genesis.balanceOf(wl3.address)).to.equal(1);
      proof = getProof(wl4.address);
      await factory.connect(wl4).mintGenesis(proof);
      expect(await genesis.balanceOf(wl4.address)).to.equal(1);

      await genesis.connect(wl2)["safeTransferFrom(address,address,uint256)"](wl2.address, wl1.address, 2);
      await genesis.connect(wl3)["safeTransferFrom(address,address,uint256)"](wl3.address, wl1.address, 3);
      await genesis.connect(wl4)["safeTransferFrom(address,address,uint256)"](wl4.address, wl1.address, 4);

      expect(await genesis.balanceOf(wl1.address)).equal(4);

      await factory.connect(wl1).mintOracle(1, 2, 3, 4);
      await assertThrowsMessage(factory.connect(wl1).mintOracle(1, 2, 3, 4), "ERC721: invalid token ID");

    });

    it("should revert if not owner of parts", async function () {
      let proof = getProof(wl1.address);
      await factory.connect(wl1).mintGenesis(proof);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
      proof = getProof(wl2.address);
      await factory.connect(wl2).mintGenesis(proof);
      expect(await genesis.balanceOf(wl2.address)).to.equal(1);
      proof = getProof(wl3.address);
      await factory.connect(wl3).mintGenesis(proof);
      expect(await genesis.balanceOf(wl3.address)).to.equal(1);
      proof = getProof(wl4.address);
      await factory.connect(wl4).mintGenesis(proof);
      expect(await genesis.balanceOf(wl4.address)).to.equal(1);

      await genesis.connect(wl2)["safeTransferFrom(address,address,uint256)"](wl2.address, wl1.address, 2);
      await genesis.connect(wl3)["safeTransferFrom(address,address,uint256)"](wl3.address, wl1.address, 3);
      // await genesis.connect(wl4)["safeTransferFrom(address,address,uint256)"](wl4.address, wl1.address, 4);

      expect(await genesis.balanceOf(wl1.address)).equal(3);

      await assertThrowsMessage(factory.connect(wl1).mintOracle(1, 2, 3, 4), "NotGenesisOwner()");

    });
  });
});
