#!/usr/bin/env bash

npx hardhat run scripts/deploy-$1.js --network $2
