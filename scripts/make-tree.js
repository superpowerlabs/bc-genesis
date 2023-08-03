#!/usr/bin/env node

const {MerkleTree} = require("merkletreejs");
const ethers = require("ethers");
const keccak256 = require("keccak256");
const path = require("path");
const fs = require("fs-extra");
const {utils} = require("ethers");
const guaranteedWL = require("../data/guaranteedWL");
const generalWL = require("../data/generalWL");

for (let w = 0; w < 2; w++) {
  let data = w === 0 ? guaranteedWL : generalWL;

  const leaves = data.map((e) => keccak256(e));

  const tree = new MerkleTree(leaves, keccak256, {sort: true});
  const root = tree.getRoot().toString("hex");

  fs.writeFileSync(path.resolve(__dirname, `../data/merkleTree${w}.json`), JSON.stringify(tree, null, 2));

  const proofs = {
    root,
    children: [],
  };

  for (let i = 0; i < leaves.length; i++) {
    let proof = tree.getHexProof(leaves[i]);
    let leaf = leaves[i];
    proofs.children.push({
      data: data[i],
      leaf: utils.hexZeroPad(utils.hexlify(leaf), 32),
      proof,
    });
  }

  fs.writeFileSync(path.resolve(__dirname, `../data/rootLeavesAndProofs${w}.json`), JSON.stringify(proofs, null, 2));
}
// uncomment if need to modify the fixtures
// fs.writeFileSync(path.resolve(__dirname, "../test/fixtures/proofs.json"), JSON.stringify(proofs, null, 2));
