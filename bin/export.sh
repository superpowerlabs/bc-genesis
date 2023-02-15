#!/usr/bin/env bash
# must be run from the root

npx hardhat compile

node scripts/exportABIs.js

cp export/ABIs.json ../GENESIS-BYTE-CITY-REVEAL/src/config/ABIs.json
cp export/deployed.json ../GENESIS-BYTE-CITY-REVEAL/src/config/.
