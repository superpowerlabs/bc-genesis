// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const fs = require("fs-extra");
const path = require("path");

async function main() {
  const ABIs = {
    when: new Date().toISOString(),
    contracts: {},
  };

  function abi(name, folder, rename) {
    let source = path.resolve(__dirname, `../artifacts/contracts/${folder ? folder + "/" : ""}${name}.sol/${name}.json`);
    let json = require(source);
    ABIs.contracts[rename || name] = json.abi;
  }

  abi("BCNFT", "tokens/");
  abi("BCNFTBase", "tokens/");
  abi("BCGenesisToken", "tokens/");
  abi("BCOracleToken", "tokens/");

  await fs.writeFile(path.resolve(__dirname, "../export/ABIs.json"), JSON.stringify(ABIs, null, 2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
