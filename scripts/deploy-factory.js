require("dotenv").config();
const hre = require("hardhat");
const ethers = hre.ethers;
const {getCurrentTimestamp} = require("hardhat/internal/hardhat-network/provider/utils/getCurrentTimestamp");
const {factory} = require("typescript");

const DeployUtils = require("../lib/DeployUtils");
let deployUtils;

async function main() {
  deployUtils = new DeployUtils(ethers);
  require("./consoleLogAlert")();

  function pe(amount) {
    return ethers.utils.parseEther(amount.toString());
  }

  const chainId = await deployUtils.currentChainId();
  let [deployer] = await ethers.getSigners();
  const provider = this.ethers.provider;

  const network = chainId === 56 ? "bsc" : chainId === 44787 ? "alfajores" : "localhost";

  console.log("Deploy the factory with the account:", deployer.address, "to", network);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const seed = chainId === 56 ? await deployUtils.attach("SeedToken") : await deployUtils.attach("SeedTokenMock");
  const busd = chainId === 56 ? {address: "0xe9e7cea3dedca5984780bafc599bd69add087d56"} : await deployUtils.attach("BUSDMock");

  const wl = await deployUtils.attach("WhitelistSlot");
  const factory = await deployUtils.deployProxy("NftFactory");

  await deployUtils.Tx(factory.setPaymentToken(seed.address, true), "Set SEED as a payment token");
  await deployUtils.Tx(factory.setPaymentToken(busd.address, true), "Set BUSD as a payment token");

  await deployUtils.Tx(wl.setBurner(factory.address), "Set burner in WL");

  const turf = await deployUtils.attach("Turf");
  const farm = await deployUtils.attach("Farm");

  // set up the nft in
  for (let id = 1; id <= 2; id++) {
    let nft = id === 1 ? turf : farm;
    await deployUtils.Tx(nft.setFactory(factory.address, true), "Set factory in " + (id === 1 ? "turf" : "farm"));
    await deployUtils.Tx(factory.setNewNft(nft.address), "Set nft in factory");
  }

  await deployUtils.Tx(factory.setWl(wl.address), "Set WL in factory");

  let startDate = new Date("2022-12-15T17:30:00.000Z");
  if (chainId !== 56) {
    startDate = new Date();
  }
  const startAt = parseInt(startDate.getTime() / 1000) + 60;
  const wlEndAt = startAt + 3600 * 24;

  await deployUtils.Tx(
    factory.newSale(1, 135, startAt, wlEndAt, 1, [busd.address, seed.address], [pe(420), pe(220500)], [pe(599), pe(295000)]),
    "Setting sale for turf"
  );
  await deployUtils.Tx(
    factory.newSale(2, 1250, startAt, wlEndAt, 2, [busd.address, seed.address], [pe(215), pe(110000)], [pe(299), pe(147500)]),
    "Setting sale for farm"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
