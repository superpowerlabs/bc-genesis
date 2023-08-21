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

  function shuffle(index) {
    let rand;
    for (let i = index.length - 1; i > 0; i--) {
      // we take only the latest 4 bytes of the hash
      // to make sure the number is not too big in JavaScript
      let hash = ethers.utils.id(i + "Some test hash").substring(58, 66);
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

  describe.only("mintAllTheOracles", function () {
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
      for (let i = 0; i < indexes.length; i++) {
        let index = indexes[i];
        expect(await factory.rarityByIndex(i)).equal(index);
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

      for (let i = 0; i < 2400; i++) {
        let m = testFinal[i];
        let part = m.attributes[0].value.toLowerCase();
        let rarity = m.attributes[1].value.toLowerCase();
        randData[rarity][part].push(m.tokenId);
        await factory.connect(wl1).mintGenesis([], 0, false);
      }
      for (let rarity in randData) {
        for (let part in randData[rarity]) {
          randData[rarity][part] = shuffle(randData[rarity][part]);
        }
      }

      console.log("Minting Oracles");

      let k = 1;
      for (let rarity in randData) {
        let l = randData[rarity].head.length;
        for (let part in randData[rarity]) {
          for (let j = 0; j < l; j++) {
            let ids = [randData[rarity].head[j], randData[rarity].torso[j], randData[rarity].arms[j], randData[rarity].legs[j]];
            console.log(k, ids);
            await factory.connect(wl1).mintOracle(...ids);
            // .emit(factory, "OracleMinted")
            // .withArgs(k, ...ids)
            // .emit(genesis, "Transfer")
            // .withArgs(wl1.address, addr0, ids[0])
            // .emit(genesis, "Transfer")
            // .withArgs(wl1.address, addr0, ids[1])
            // .emit(genesis, "Transfer")
            // .withArgs(wl1.address, addr0, ids[2])
            // .emit(genesis, "Transfer")
            // .withArgs(wl1.address, addr0, ids[3]);
            k++;
          }
        }
      }

      return;
      // jump to public phase, to simplify testing
      await increaseBlockTimestampBy(3600 * 25);

      for (let k = 0; k < 2400; k++) {
        await factory.connect(wl1).mintGenesis([], 0, false);
      }

      //
      //
      // await expect(factory.connect(wl1).mintOracle(2, 6, 11, 13))
      //   .emit(factory, "OracleMinted")
      //   .withArgs(1, 2, 6, 11, 13)
      //   .emit(genesis, "Transfer")
      //   .withArgs(wl1.address, addr0, 2)
      //   .emit(genesis, "Transfer")
      //   .withArgs(wl1.address, addr0, 6)
      //   .emit(genesis, "Transfer")
      //   .withArgs(wl1.address, addr0, 11)
      //   .emit(genesis, "Transfer")
      //   .withArgs(wl1.address, addr0, 13);
      //
      // //check if the parts are burned
      // expect(await genesis.balanceOf(wl1.address)).equal(15);
      // expect(await oracle.balanceOf(wl1.address)).equal(1);
      //
      // await expect(factory.connect(wl1).mintOracle(2, 6, 11, 13)).revertedWith("ERC721: invalid token ID");
    });
  });
});
