require("dotenv").config();
const {expect} = require("chai");
const hre = require("hardhat");
const ethers = hre.ethers;

const DeployUtils = require("./lib/DeployUtils");
const tree0 = require("../data/rootLeavesAndProofs0.json");
const tree1 = require("../data/rootLeavesAndProofs1.json");
let deployUtils;

async function main() {
  deployUtils = new DeployUtils(ethers);
  require("./consoleLogAlert")();

  // console.error("Remember to update merkle tree and indexes");
  // process.exit();

  const chainId = await deployUtils.currentChainId();
  let [deployer] = await ethers.getSigners();

  const network = chainId === 1 ? "ethereum" : chainId === 44787 ? "alfajores" : "localhost";
  console.log("Updating root in factory with:", deployer.address, "on", network);

  const factory = await deployUtils.attach("BCFactory");

  await deployUtils.Tx(
    factory.setRoot("0x" + tree0.root, "0x" + tree1.root, {gasLimit: 200000}),
    "Setting the roots of the merkle trees"
  );
  expect(await factory.merkleOneRoot()).to.equal("0x" + tree0.root);
  expect(await factory.merkleTwoRoot()).to.equal("0x" + tree1.root);
  //
  // await deployUtils.Tx(factory.start(1692795600), "Setting the start time");

  // await deployUtils.Tx(factory.setTreasury("0xC7CaEc69AABc6285cB45376D4dFcf4Dbe9958e44", 120), "Setting treasury address");

  // await deployUtils.Tx(factory.updateRevealParams(7, 19, 40), "Update reveal params");

  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
  // await deployUtils.Tx(factory.preMint(10));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
