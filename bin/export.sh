#!/usr/bin/env bash
# must be run from the root

#rm -rf cache
#rm -rf artifacts
#NODE_ENV=test npx hardhat compile

node scripts/exportABIs.js
