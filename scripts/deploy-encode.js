require("dotenv").config();
const hre = require("hardhat");
const ethers = hre.ethers;

const DeployUtils = require("./lib/DeployUtils");
let deployUtils;

const indexes = [
  2, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 1, 0, 2, 3, 0, 0, 0, 2, 3, 0, 1, 0,
  1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 2, 0, 1, 0, 0, 0, 1, 3, 0, 0, 2, 0, 0, 1, 3, 1, 0, 0, 1, 1, 0, 1, 2, 1, 0, 0, 0, 2, 2, 1,
  0, 0, 2, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 1, 2, 1, 0, 0, 0, 1, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1,
  1, 1, 0, 1, 0, 0, 0, 0, 3, 0, 0, 0, 2, 4,
];

async function main() {
  deployUtils = new DeployUtils(ethers);
  require("./consoleLogAlert")();

  console.error("Remember to update merkle tree and indexes");
  process.exit();

  const chainId = await deployUtils.currentChainId();
  let [deployer] = await ethers.getSigners();

  const network = chainId === 1 ? "ethereum" : chainId === 44787 ? "alfajores" : "localhost";
  console.log("Updating root in factory with:", deployer.address, "on", network);

  const factory = await deployUtils.attach("BCFactory");
  await deployUtils.Tx(factory.setRoot(process.env.ROOT), "Setting the root of the merkle tree");

  let encoded = [];
  let index77;
  for (let i = 0; i < indexes.length; i++) {
    if (i % 77 === 0) {
      index77 = [];
    }
    index77.push(indexes[i]);
    if (index77.length === 77) {
      encoded.push(await factory.encode(index77));
    }
  }
  if (index77.length > 0) {
    encoded.push(await factory.encode(index77));
  }
  // console.log(encoded.map(e => e.toString()));
  await deployUtils.Tx(factory.saveRarityIndex(encoded), "Saving rarity index");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
