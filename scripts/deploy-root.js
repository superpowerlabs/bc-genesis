require("dotenv").config();
const hre = require("hardhat");
const ethers = hre.ethers;

const DeployUtils = require("./lib/DeployUtils");
const tree0 = require("./data/test/rootLeavesAndProofs0.json");
const tree1 = require("./data/test/rootLeavesAndProofs1.json");
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

  const factory = await deployUtils.attach("BCFactoryForTest");

  await deployUtils.Tx(factory.setRoot("0x" + tree0.root, "0x" + tree1.root), "Setting the roots of the merkle trees");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
