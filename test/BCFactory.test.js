const chai = require("chai");
let expectCount = 0;
const expect = (actual) => {
  if (expectCount > 0) {
    console.log(`> ${expectCount++}`);
  }
  return chai.expect(actual);
};
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

const indexes = [
  2, 1, 0, 0, 0, 2, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1, 1, 1, 1, 0, 2, 0, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
  1, 1, 0, 4, 0, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3,
];

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

  let proof, data, tmp, nonce;
  let owner, wl1, nwl1, nwl2, wl2, wl3, wl4, wl5, wl6, wl7, treasury;
  let validator0PK = "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a";

  before(async function () {
    [owner, wl1, nwl1, nwl2, wl2, wl3, wl4, wl5, wl6, wl7, treasury] = await ethers.getSigners();

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
      tmp = getProof(0, wl1.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await assertThrowsMessage(factory.connect(wl1).mintGenesis(proof, nonce, true), "PhaseClosedOrNotOpenYet()");
    });

    it("should mint parts", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);
      await increaseBlockTimestampBy(2000);
      tmp = getProof(0, wl1.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await factory.connect(wl1).mintGenesis(proof, nonce, true);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);
    });

    it("should fail to mint if wrong proof", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);
      await increaseBlockTimestampBy(2000);
      tmp = getProof(0, wl2.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await assertThrowsMessage(factory.connect(wl1).mintGenesis(proof, nonce, true), "InvalidProof()");
    });

    it("should fail if wrong phase", async function () {
      tmp = getProof(1, wl1.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await assertThrowsMessage(factory.connect(wl1).mintGenesis(proof, nonce, false), "PhaseClosedOrNotOpenYet()");
    });

    it("should fail to mint if phase not opened", async function () {
      // let expectCount = 1;

      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);
      await increaseBlockTimestampBy(2000);

      tmp = getProof(0, wl1.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));

      await expect(factory.connect(wl1).mintGenesis(proof, nonce, true))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl1.address, 1);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);

      tmp = getProof(0, wl2.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await assertThrowsMessage(factory.connect(wl2).mintGenesis(proof, nonce, false), "PhaseClosedOrNotOpenYet()");
      await expect(factory.connect(wl2).mintGenesis(proof, nonce, true))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl2.address, 2);

      expect(await factory.hasProofBeenUsed(proof, nonce, wl2.address)).to.equal(true);

      await assertThrowsMessage(factory.connect(wl2).mintGenesis(proof, nonce, true), "ProofAlreadyUsed()");

      await increaseBlockTimestampBy(3600 * 2);

      tmp = getProof(0, wl3.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await expect(factory.connect(wl3).mintGenesis(proof, nonce, true))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl3.address, 3);

      tmp = getProof(1, wl2.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await expect(factory.connect(wl2).mintGenesis(proof, nonce, false))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl2.address, 4);

      tmp = getProof(1, wl3.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await expect(factory.connect(wl3).mintGenesis(proof, nonce, false))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl3.address, 5);

      tmp = getProof(1, wl4.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await expect(factory.connect(wl4).mintGenesis(proof, nonce, false))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl4.address, 6);

      await increaseBlockTimestampBy(3600 * 24);

      await expect(factory.connect(wl5).mintGenesis([], nonce, false))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl5.address, 7);

      await expect(factory.connect(wl5).mintGenesis([], nonce, false))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl5.address, 8);

      tmp = getProof(1, wl5.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await expect(factory.connect(wl5).mintGenesis(proof, nonce, false))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl5.address, 9);
      //
      tmp = getProof(0, nwl2.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await expect(factory.connect(nwl2).mintGenesis(proof, nonce, true))
        .emit(genesis, "Transfer")
        .withArgs(addr0, nwl2.address, 10);

      await genesis.endMinting();

      await assertThrowsMessage(factory.connect(wl7).mintGenesis([], nonce, false), "PhaseClosedOrNotOpenYet()");
    });

    it("should preMint successfully the full reserve", async function () {
      // let expectCount = 1;

      await factory.setTreasury(treasury.address, 40);

      await expect(factory.preMint(10))
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 1)
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 10);

      await expect(factory.preMint(10))
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 11)
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 20);

      await expect(factory.preMint(10))
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 21)
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 30);

      await expect(factory.preMint(10))
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 31)
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 40);

      await expect(factory.preMint(10)).revertedWith("PreMintingLimitReached()");

      expect(await genesis.balanceOf(treasury.address)).to.equal(40);

      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);

      await increaseBlockTimestampBy(2000);

      tmp = getProof(0, wl1.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));

      await expect(factory.connect(wl1).mintGenesis(proof, nonce, true))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl1.address, 41);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);

      tmp = getProof(0, wl2.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await assertThrowsMessage(factory.connect(wl2).mintGenesis(proof, nonce, false), "PhaseClosedOrNotOpenYet()");
      await expect(factory.connect(wl2).mintGenesis(proof, nonce, true))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl2.address, 42);
    });

    it("should preMint successfully using an excessive reserve", async function () {
      // let expectCount = 1;

      await factory.setTreasury(treasury.address, 40);

      await expect(factory.preMint(10))
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 1)
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 10);

      await expect(factory.preMint(10))
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 11)
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 20);

      await expect(factory.preMint(10))
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 21)
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 30);

      await expect(factory.preMint(40))
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 31)
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 40);

      await expect(factory.preMint(10)).revertedWith("PreMintingLimitReached()");

      expect(await genesis.balanceOf(treasury.address)).to.equal(40);
    });

    it("should preMint till the time starts", async function () {
      // let expectCount = 1;

      await factory.setTreasury(treasury.address, 40);

      await expect(factory.preMint(10))
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 1)
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 10);

      await expect(factory.preMint(10))
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 11)
        .emit(genesis, "Transfer")
        .withArgs(addr0, treasury.address, 20);

      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);

      await increaseBlockTimestampBy(2000);

      await expect(factory.preMint(10)).revertedWith("PhaseClosedOrNotOpenYet()");

      expect(await genesis.balanceOf(treasury.address)).to.equal(20);

      tmp = getProof(0, wl1.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));

      await expect(factory.connect(wl1).mintGenesis(proof, nonce, true))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl1.address, 21);
      expect(await genesis.balanceOf(wl1.address)).to.equal(1);

      tmp = getProof(0, wl2.address);
      data = tmp.data;
      proof = tmp.proof;
      nonce = Number("0x" + data.slice(-3));
      await assertThrowsMessage(factory.connect(wl2).mintGenesis(proof, nonce, false), "PhaseClosedOrNotOpenYet()");
      await expect(factory.connect(wl2).mintGenesis(proof, nonce, true))
        .emit(genesis, "Transfer")
        .withArgs(addr0, wl2.address, 22);
    });
  });

  describe("mintOracle", function () {
    it("should mint oracle", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);

      encoded = [];
      let tmp = [];
      for (let i of indexes) {
        tmp.push(i);
      }
      encoded.push(await factory.encode(tmp));
      await factory.saveRarityIndex(encoded);

      // jump to public phase, to simplify testing
      await increaseBlockTimestampBy(3600 * 25);

      for (let k = 0; k < 4; k++) {
        for (let i = 1; i < 17; i++) {
          let wl = i > 12 ? wl4 : i > 8 ? wl3 : i > 4 ? wl2 : wl1;
          await factory.connect(wl).mintGenesis([], 0, false);
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

  it("should preMint successfully using an excessive reserve", async function () {
    // let expectCount = 1;

    await factory.setTreasury(treasury.address, 40);

    await expect(factory.preMint(10))
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 1)
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 10);

    await expect(factory.preMint(10))
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 11)
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 20);

    await expect(factory.preMint(10))
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 21)
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 30);

    await expect(factory.preMint(40))
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 31)
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 40);

    await expect(genesis.connect(treasury).transferFrom(treasury.address, wl1.address, 1))
      .emit(genesis, "Transfer")
      .withArgs(treasury.address, wl1.address, 1);

    await expect(factory.preMint(10)).revertedWith("PreMintingLimitReached()");

    expect(await genesis.balanceOf(treasury.address)).to.equal(39);
    expect(await genesis.balanceOf(wl1.address)).to.equal(1);
  });

  it("should preMint till the time starts", async function () {
    // let expectCount = 1;

    await factory.setTreasury(treasury.address, 40);

    await expect(factory.preMint(10))
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 1)
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 10);

    await expect(factory.preMint(10))
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 11)
      .emit(genesis, "Transfer")
      .withArgs(addr0, treasury.address, 20);

    let ts = (await getTimestamp()) + 1000;
    await factory.start(ts);

    await increaseBlockTimestampBy(2000);

    await expect(factory.preMint(10)).revertedWith("PhaseClosedOrNotOpenYet()");

    expect(await genesis.balanceOf(treasury.address)).to.equal(20);

    tmp = getProof(0, wl1.address);
    data = tmp.data;
    proof = tmp.proof;
    nonce = Number("0x" + data.slice(-3));

    await expect(factory.connect(wl1).mintGenesis(proof, nonce, true))
      .emit(genesis, "Transfer")
      .withArgs(addr0, wl1.address, 21);
    expect(await genesis.balanceOf(wl1.address)).to.equal(1);

    tmp = getProof(0, wl2.address);
    data = tmp.data;
    proof = tmp.proof;
    nonce = Number("0x" + data.slice(-3));
    await assertThrowsMessage(factory.connect(wl2).mintGenesis(proof, nonce, false), "PhaseClosedOrNotOpenYet()");
    await expect(factory.connect(wl2).mintGenesis(proof, nonce, true))
      .emit(genesis, "Transfer")
      .withArgs(addr0, wl2.address, 22);
  });
});
