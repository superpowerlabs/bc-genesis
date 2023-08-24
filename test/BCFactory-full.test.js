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

const testFinal = require("./fixtures/test-final-data.json");

const indexes = [
  2, 1, 0, 0, 0, 2, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1, 1, 1, 1, 0, 2, 0, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
  1, 1, 0, 4, 0, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3,
];

describe("BCFactory integration", function () {
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

  function shuffle(index, salt) {
    let rand;
    for (let i = index.length - 1; i > 0; i--) {
      // we take only the latest 4 bytes of the hash
      // to make sure the number is not too big in JavaScript
      let hash = ethers.utils.id(i + salt).substring(58, 66);
      let num = parseInt(hash, 16);
      rand = Math.floor(num % (i + 1));
      [index[i], index[rand]] = [index[rand], index[i]];
    }
    return index;
  }

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

  describe("mintAllTheOracles", function () {
    this.timeout(1000000);

    it("should mint oracle", async function () {
      let ts = (await getTimestamp()) + 1000;
      await factory.start(ts);

      await increaseBlockTimestampBy(3600 * 25);

      encoded = [];
      let tmp = [];
      for (let i of indexes) {
        tmp.push(i);
      }
      encoded.push(await factory.encode(tmp));

      await factory.saveRarityIndex(encoded);

      // verify rarity is returned as expected
      for (let i = 0; i < 2400; i++) {
        let tokenId = i + 1;
        let rarity = (await factory.rarityByIndex(tokenId)).toNumber();
        expect(rarity).equal(indexes[Math.floor((tokenId - 1) / 40)]);
      }

      const randData = {
        common: {
          head: [],
          torso: [],
          arms: [],
          legs: [],
        },
        uncommon: {
          head: [],
          torso: [],
          arms: [],
          legs: [],
        },
        rare: {
          head: [],
          torso: [],
          arms: [],
          legs: [],
        },
        epic: {
          head: [],
          torso: [],
          arms: [],
          legs: [],
        },
        legendary: {
          head: [],
          torso: [],
          arms: [],
          legs: [],
        },
      };
      console.log("Minting genesis tokens");

      for (let i = 0; i < 2400; i++) {
        let m = testFinal[i];
        let part = m.attributes[0].value.toLowerCase();
        let rarity = m.attributes[1].value.toLowerCase();
        expect(m.tokenId).equal(i + 1);
        randData[rarity][part].push(m.tokenId);
        await expect(factory.connect(wl1).mintGenesis([], 0, false))
          .emit(genesis, "Transfer")
          .withArgs(addr0, wl1.address, i + 1);
      }
      for (let rarity in randData) {
        for (let part in randData[rarity]) {
          randData[rarity][part] = shuffle(randData[rarity][part], Math.random().toString());
        }
      }

      console.log("Minting oracles");
      let k = 1;
      for (let rarity in randData) {
        for (let j = 0; j < randData[rarity].head.length; j++) {
          let ids = [randData[rarity].head[j], randData[rarity].torso[j], randData[rarity].arms[j], randData[rarity].legs[j]];
          // console.log("Minting oracle", k, "using genesis", ids);
          await expect(factory.connect(wl1).mintOracle(...ids))
            .emit(factory, "OracleMinted")
            .withArgs(k, ...ids)
            .emit(genesis, "Transfer")
            .withArgs(wl1.address, addr0, ids[0])
            .emit(genesis, "Transfer")
            .withArgs(wl1.address, addr0, ids[1])
            .emit(genesis, "Transfer")
            .withArgs(wl1.address, addr0, ids[2])
            .emit(genesis, "Transfer")
            .withArgs(wl1.address, addr0, ids[3]);
          k++;
        }
      }
    });
  });
});
