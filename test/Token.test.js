const {expect} = require("chai");
const {initEthers, assertThrowsMessage} = require("./helpers");


// tests to be fixed

describe("GenesisToken", function () {
  let GenesisToken, bodyPart;
  let OracleToken, robot;
  let Factory, factory;
  let owner, holder;

  before(async function () {
    [owner, holder] = await ethers.getSigners();
    GenesisToken = await ethers.getContractFactory("BCGenesisToken");
    OracleToken = await ethers.getContractFactory("BCOracleToken");

    Factory = await ethers.getContractFactory("MockFactory");
    initEthers(ethers);
  });

  async function initAndDeploy() {
    bodyPart = await upgrades.deployProxy(GenesisToken, ["https://s3.Byte.City/BodyPart/"]);
    await bodyPart.deployed();
    robot = await upgrades.deployProxy(OracleToken, ["https://s3.Byte.City/Robot/"]);
    await robot.deployed();
    factory = await Factory.deploy();
    await factory.deployed();
  }

  describe("BCNFTBase Testing", async function () {
    beforeEach(async function () {
      await initAndDeploy();
    });

    it("Should set Uri Flow", async function () {
    expect(await bodyPart.contractURI()).equal("https://s3.Byte.City/BodyPart/0")

    const uri = "https://s3.Byte.City/Test/"
    await bodyPart.updateTokenURI(uri)
     expect(await bodyPart.contractURI()).equal(uri + "0")

     await bodyPart.freezeTokenURI()

    await expect(bodyPart.updateTokenURI(uri)).revertedWith("FrozenTokenURI")
    });

    it("Should implement ILockable", async function () {
      await bodyPart.setFactory(factory.address, true);
      await bodyPart.setMaxSupply(10)
      await factory.initialize(bodyPart.address, robot.address)
      await factory.mintGenesis(holder.address)
      await factory.mintGenesis(holder.address)

      await bodyPart.connect(holder).approve(factory.address, 1)
      expect(await bodyPart.locked(1)).equal(false)

      await expect(factory.lockGenesis(1)).revertedWith("NotALocker")
      await bodyPart.setLocker(factory.address)
      expect(await bodyPart.isLocker(factory.address)).equal(true)
      await factory.lockGenesis(1)
      expect(await bodyPart.locked(1)).equal(true)

      });
      
  });

  describe("Token Testing", async function () {
    beforeEach(async function () {
      await initAndDeploy();
    });

    it("should set Max Supply", async function () {

      await bodyPart.setFactory(factory.address, true);
      await factory.initialize(bodyPart.address, robot.address)
      await bodyPart.setMaxSupply(2)

      await factory.mintGenesis(holder.address)
      await factory.mintGenesis(holder.address)
      expect(await bodyPart.balanceOf(holder.address)).equal(2)
      await expect(factory.mintGenesis(holder.address)).revertedWith("CannotMint")
      
    });    

    it("should set Factory ", async function () {

      expect(await bodyPart.hasFactories()).equal(false)
      await expect(bodyPart.setFactory(holder.address, true)).revertedWith("NotAContract")

      await bodyPart.setFactory(factory.address, true);

      expect(await bodyPart.hasFactories()).equal(true)
      expect(await bodyPart.isFactory(factory.address)).equal(true)

      //Unsets Factory if called again with False
      await bodyPart.setFactory(factory.address, false);

      expect(await bodyPart.hasFactories()).equal(false)
      expect(await bodyPart.isFactory(factory.address)).equal(false)
    });

    it("should Mint and Burn Batch Genesis", async function () {
        await bodyPart.setFactory(factory.address, true);
        expect(await bodyPart.nextTokenId()).equal(0)
        await bodyPart.setMaxSupply(10)

        await factory.initialize(bodyPart.address, robot.address)

        expect(await bodyPart.balanceOf(holder.address)).equal(0)

        expect(await bodyPart.nextTokenId()).equal(1)
        await factory.mintGenesis(holder.address)
        expect(await bodyPart.ownerOf(1)).equal(holder.address)
        expect(await bodyPart.nextTokenId()).equal(2)

        await factory.mintGenesis(holder.address)
        await factory.mintGenesis(holder.address)
        expect(await bodyPart.balanceOf(holder.address)).equal(3)

        await bodyPart.endMinting()
        await expect(factory.mintGenesis(holder.address)).revertedWith("CannotMint")

        await factory.burnBatch([1,2])
        expect(await bodyPart.balanceOf(holder.address)).equal(1)

        await expect(factory.burnBatch([5])).revertedWith("ERC721: invalid token ID")
      });

      it("should set Max Supply", async function () {
        await bodyPart.setFactory(factory.address, true);
        await factory.initialize(bodyPart.address, robot.address)

        expect(await bodyPart.maxSupply()).equal(0)
        await bodyPart.setMaxSupply(2)
        expect(await bodyPart.maxSupply()).equal(2)

        await factory.mintGenesis(holder.address)
        await factory.mintGenesis(holder.address)
        await expect(factory.mintGenesis(holder.address)).revertedWith("CannotMint")

        await bodyPart.setMaxSupply(3)
        await factory.mintGenesis(holder.address)

        await expect(bodyPart.setMaxSupply(2)).revertedWith("InvalidSupply")
      });
      
  });
});
