const {requirePath} = require("require-or-mock");
const path = require("path");
const fs = require("fs");
// if missed, it sets up a mock
requirePath(".env");
requirePath("export/deployed.json");

require("dotenv").config();
require("@secrez/cryptoenv").parse(() => process.env.NODE_ENV !== "test");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-contract-sizer");
require("solidity-coverage");

// if (fs.existsSync(path.resolve(__dirname, "../../NPM/hardhat-sourcify"))) {
//   // I made a PR to hardhat-sourcify to make it work with pnpm
//   // While we wait for a merge and an update, this is a workaround
//   require("../../NPM/hardhat-sourcify");
// }

if (process.env.GAS_REPORT === "yes") {
  require("hardhat-gas-reporter");
}

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      blockGasLimit: 10000000,
    },
    localhost: {
      url: "http://localhost:8545",
      chainId: 1337,
    },
    ethereum: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.FOR_MAINNET],
      chainId: 1,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.FOR_TESTNET],
      chainId: 5,
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      gasPrice: 225000000000,
      chainId: 43113,
      accounts: [process.env.FOR_TESTNET],
    },
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [process.env.FOR_TESTNET],
      chainId: 44787,
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_KEY,
  },
  gasReporter: {
    currency: "USD",
    // coinmarketcap: env.coinMarketCapAPIKey
  },
};
