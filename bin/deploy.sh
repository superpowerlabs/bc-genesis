#!/usr/bin/env bash

#npm run clean
#npm run compile

npx hardhat run scripts/deploy-$1.js --network $2
