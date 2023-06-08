#!/usr/bin/env node

const {MerkleTree} = require("merkletreejs");
const ethers = require("ethers");
const keccak256 = require("keccak256");
const path = require("path");
const fs = require("fs-extra");
const {utils} = require("ethers");
const winners = require("../data/raffleWinners");

const data = [];
for (let winner of winners) {
  const myBytes32 = ethers.utils.defaultAbiCoder.encode(["uint256"], [winner.tokenId]);
  data.push(`${winner.wallet}${myBytes32.substring(2)}`);
}

const leaves = data.map((e) => keccak256(e));

const tree = new MerkleTree(leaves, keccak256, {sort: true});
const root = tree.getRoot().toString("hex");

fs.writeFileSync(path.resolve(__dirname, "../data/merkleTree.json"), JSON.stringify(tree));

const proofs = {
  root,
  children: [],
};

for (let i = 0; i < leaves.length; i++) {
  let proof = tree.getHexProof(leaves[i]);
  let leaf = leaves[i];
  let wallet = data[i].substring(0, 42);
  let tokenId = winners[i].tokenId;
  proofs.children.push({
    winner: {
      tokenId,
      wallet,
    },
    data: data[i],
    leaf: utils.hexZeroPad(utils.hexlify(leaf), 32),
    proof,
  });
}

fs.writeFileSync(path.resolve(__dirname, "../data/rootLeavesAndProofs.json"), JSON.stringify(proofs, null, 2));

// uncomment if need to modify the fixtures
// fs.writeFileSync(path.resolve(__dirname, "../test/fixtures/proofs.json"), JSON.stringify(proofs, null, 2));
