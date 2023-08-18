#!/usr/bin/env bash

CONTRACT=$1
ADDRESS=$2
CHAIN_ID=$3
FOLDER=$4
if [[ "$FOLDER" != "" ]]; then
  FOLDER=$FOLDER/
fi

if [[ $CHAIN_ID == "" ]]; then
  echo "Usage: $0 <contract> <address> <chain-id> [folder]"
  exit 1
fi

NODE_ENV=test npx hardhat sourcifySubmit --contract-name $CONTRACT --source-name "contracts/$CONTRACT.sol" --address $ADDRESS --chain-id $CHAIN_ID
