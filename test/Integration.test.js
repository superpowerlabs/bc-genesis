const {expect} = require("chai");
const { deployContractUpgradeable, deployContract, number,initEthers} = require("./helpers");

describe("Integration test", function () {
  let GenesisToken, bodyPart;
  let OracleToken, robot;
  let Factory, factory;
  let owner, holder1, holder2, holder3;

  before(async function () {
    [owner, holder1, holder2, holder3] = await ethers.getSigners();
    GenesisToken = await ethers.getContractFactory("BCGenesisToken");
    OracleToken = await ethers.getContractFactory("BCOracleToken");

    Factory = await ethers.getContractFactory("BCFactory");
    initEthers(ethers);

    
  });

  beforeEach(async function () {
    bodyPart = await upgrades.deployProxy(GenesisToken, ["https://s3.Byte.City/BodyPart/"]);
    await bodyPart.deployed();
    robot = await upgrades.deployProxy(OracleToken, ["https://s3.Byte.City/Robot/"]);
    await robot.deployed();
    factory = await Factory.deploy();
    await factory.deployed();


  });

  it("should verify the flow", async function () {

  });

});
