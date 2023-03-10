require("dotenv").config();
const hre = require("hardhat");
const ethers = hre.ethers;

const DeployUtils = require("./lib/DeployUtils");
let deployUtils;

async function main() {
  deployUtils = new DeployUtils(ethers);
  require("./consoleLogAlert")();

  const chainId = await deployUtils.currentChainId();
  let [deployer] = await ethers.getSigners();

  const network = chainId === 1 ? "ethereum" : chainId === 44787 ? "alfajores" : "localhost";
  console.log("Deploying contracts with the account:", deployer.address, "to", network);

  const genesisToken = await deployUtils.deployProxy("BCGenesisToken", "https://api2.byte.city/genesis/");
  const oracle = await deployUtils.deployProxy("BCOracleToken", "https://api2.byte.city/oracles/");
  const factory = await deployUtils.deployProxy("BCFactory", genesisToken.address, oracle.address);
  await deployUtils.Tx(genesisToken.setFactory(factory.address, true), "Setting factory address");
  await deployUtils.Tx(oracle.setFactory(factory.address, true), "Setting factory address");
  await deployUtils.Tx(factory.setRoot(process.env.ROOT), "Setting the root of the merkle tree");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
