const { MerkleTree } = require('merkletreejs')
const { toChecksumAddress } = require("ethereumjs-util");
const keccak256 = require('keccak256')
const path = require('path')
const fs = require('fs-extra')
const {utils} = require('ethers')

const winners = require('../data/raffleWinners').map(e => toChecksumAddress(e)).sort()

const leaves = winners.map(v => keccak256(v))

const tree = new MerkleTree(leaves, keccak256, { sort: true })
const root = tree.getRoot().toString('hex')

fs.writeFileSync(path.resolve(__dirname, '../data/merkleTree.json'), JSON.stringify(tree));

const proofs = {
  root,
  children:  []
}

for (let i = 0; i < leaves.length; i++) {
  let proof = tree.getHexProof(leaves[i])
  let leaf = leaves[i];
  proofs.children.push({
    wallet: winners[i],
    leaf: utils.hexZeroPad(utils.hexlify(leaf), 32),
    proof
  })
}

fs.writeFileSync(path.resolve(__dirname, '../data/rootLeavesAndProofs.json'), JSON.stringify(proofs, null, 2));


