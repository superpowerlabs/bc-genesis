require("dotenv").config();
const hre = require("hardhat");
const ethers = hre.ethers;

const DeployUtils = require("./lib/DeployUtils");
let deployUtils;

const rootLeavesAndProofs = require("../data/rootLeavesAndProofs.json");

async function main() {
  deployUtils = new DeployUtils(ethers);
  require("./consoleLogAlert")();

  const chainId = await deployUtils.currentChainId();
  let [deployer] = await ethers.getSigners();

  const network = chainId === 1 ? "ethereum" : chainId === 5 ? "goerli" : chainId === 44787 ? "alfajores" : "localhost";
  console.log("Updating root in factory with:", deployer.address, "on", network);

  const factory = await deployUtils.attach("BCFactory");
  await deployUtils.Tx(factory.setRoot(`0x` + rootLeavesAndProofs.root), "Setting the root of the merkle tree");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
