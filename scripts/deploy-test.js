require("dotenv").config();
const hre = require("hardhat");
const ethers = hre.ethers;
const tree0 = require("./data/test/rootLeavesAndProofs0.json");
const tree1 = require("./data/test/rootLeavesAndProofs1.json");

const DeployUtils = require("./lib/DeployUtils");
let deployUtils;

async function main() {
  deployUtils = new DeployUtils(ethers);
  require("./consoleLogAlert")();

  const chainId = await deployUtils.currentChainId();
  let [deployer] = await ethers.getSigners();

  const network = chainId === 1 ? "ethereum" : chainId === 5 ? "goerli" : chainId === 44787 ? "alfajores" : "localhost";

  console.log("Deploying contracts with the account:", deployer.address, "to", network);

  const genesisToken = await deployUtils.deployProxy("BCGenesisToken", "https://meta.byte.city/genesis/test/");
  const oracle = await deployUtils.deployProxy("BCOracleToken", "https://meta.byte.city/oracles/test/");
  const factory = await deployUtils.deployProxy("BCFactoryForTest", genesisToken.address, oracle.address);
  await deployUtils.Tx(genesisToken.setFactory(factory.address, true), "Setting factory address");
  await deployUtils.Tx(oracle.setFactory(factory.address, true), "Setting factory address");

  await deployUtils.Tx(factory.setRoot("0x" + tree0.root, "0x" + tree1.root), "Setting the roots of the merkle trees");
  await deployUtils.Tx(factory.start(1691456400), "Setting the start time");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
