const {expect} = require("chai");
const {initEthers, assertThrowsMessage, getBlockNumber,increaseBlockTimestampBy} = require("./helpers");

describe("GenesisToken", function () {
  let GenesisToken, bodyPart;
  let OracleToken, robot;
  let MockToken, mock;
  let Factory, factory;
  let owner, holder;
  let blockNumber;
  let firstBlock;


  before(async function () {
    [owner, holder] = await ethers.getSigners();
    GenesisToken = await ethers.getContractFactory("BCGenesisToken");
    OracleToken = await ethers.getContractFactory("BCOracleToken");
    MockToken = await ethers.getContractFactory("BCMockToken");


    Factory = await ethers.getContractFactory("MockFactory");
    initEthers(ethers);
  });

  async function initAndDeploy() {
    bodyPart = await upgrades.deployProxy(GenesisToken, ["https://s3.Byte.City/BodyPart/"]);
    await bodyPart.deployed();
    const blockNumber = await getBlockNumber();
    firstBlock = blockNumber
    await bodyPart.setBlockNumbers([blockNumber, blockNumber + 100, blockNumber + 200, blockNumber + 300, blockNumber + 400])

    robot = await upgrades.deployProxy(OracleToken, ["https://s3.Byte.City/Robot/"]);
    await robot.deployed();

    mock = await upgrades.deployProxy(MockToken, ["https://s3.Byte.City/Mock/"]);
    await mock.deployed();

    factory = await Factory.deploy();
    await factory.deployed();
  }

  describe("BCNFTBase Testing", async function () {
    beforeEach(async function () {
      await initAndDeploy();
    });


    it("Should set Parameters", async function () {
      blockNumber = await getBlockNumber();
      await expect(bodyPart.setParameters(blockNumber - 1, 100)).revertedWith("InvalidStart")

      blockNumber = await getBlockNumber();
      await bodyPart.setParameters(blockNumber + 1, 100);

      blockNumber = await getBlockNumber();
      await expect(bodyPart.setParameters(blockNumber + 1, 100)).revertedWith("ParametersAlreadySetUp")

      expect(await bodyPart.maxSupply()).equal(10000)
      expect(await bodyPart.nextTokenId()).equal(1)

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
      blockNumber = await getBlockNumber();
      await bodyPart.setParameters(blockNumber + 1, 100);
      await factory.initialize(bodyPart.address, robot.address)
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

    it("should set Mint Supply", async function () {

      await mock.setFactory(factory.address, true);
      await factory.initialize(bodyPart.address, mock.address)
      blockNumber = await getBlockNumber();
      await mock.setParameters(blockNumber + 1, 100);

      for(let i =0 ; i<5; i++)
      {
        await factory.mintOracle(holder.address)
      }
      expect(await mock.balanceOf(holder.address)).equal(5)
      await expect(factory.mintOracle(holder.address)).revertedWith("CannotMint")
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
        blockNumber = await getBlockNumber();
        await bodyPart.setParameters(blockNumber + 1, 100);
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

        await assertThrowsMessage(factory.burnBatch([1,2]), "missing argument: coder array tokenIds");
      });
  

      it("should Decay Supply", async function () {
        await mock.setFactory(factory.address, true);
        await factory.initialize(bodyPart.address, mock.address)

        blockNumber = await getBlockNumber();
        await mock.setParameters(blockNumber + 1, 100);

        //Since we defined Decay ((block.number - _blockNumberOnStart)/100)  100 blocks should result in -1 max supply
        for(let i =0 ; i<400; i++)
        {
          await ethers.provider.send('evm_mine');
        }
        expect(await mock.maxSupply()).equal(1)

        for(let i =0 ; i<100; i++)
        {
          await ethers.provider.send('evm_mine');
        }
        expect(await mock.maxSupply()).equal(0)

        //Decay Should Hit 0 and Stop at 0
        for(let i =0 ; i<500; i++)
        {
          await ethers.provider.send('evm_mine');
        }
        expect(await mock.maxSupply()).equal(0)

      });
      

  });

  describe("Range Flow Testing", async function () {
    beforeEach(async function () {
      await initAndDeploy();
    });

      it("Test Range flow", async function () {
        tester = await bodyPart.findBlockIdByBlockNumber(0)
        expect(tester[0]).equal(0)
        expect(tester[1]).equal(true)

        await bodyPart.setFactory(factory.address, true);
        blockNumber = await getBlockNumber();
        await bodyPart.setParameters(blockNumber + 1, 100);
        await factory.initialize(bodyPart.address, robot.address)

        const [a,b,c,d]= await bodyPart.getClosingBlockNumberIds()
        expect(a).equal(firstBlock + 100)
        expect(b).equal(firstBlock + 200)
        expect(c).equal(firstBlock + 300)
        expect(d).equal(firstBlock+ 400)

        expect(bodyPart.getBlockRangeByBlockNumberId(6)).revertedWith("BlockNumberOutOfRange")

        expect((await bodyPart.getBlockRangeByBlockNumberId(0))[0]).equal(firstBlock+1)
        expect((await bodyPart.getBlockRangeByBlockNumberId(0))[1]).equal(firstBlock+ 100)

        await factory.mintGenesis(holder.address)
        expect((await bodyPart.getBlockRangeByBlockNumberId(0))[3]).equal(1)

        for(let i= 0; i<100; i++)
         {         
           await increaseBlockTimestampBy(1)
         }
         
         tester = await bodyPart.findBlockIdByBlockNumber(0)
         expect(tester[0]).equal(1)
         expect(tester[1]).equal(true)
 
        await factory.mintGenesis(holder.address)

        expect((await bodyPart.getBlockRangeByBlockNumberId(1))[2]).equal(2)
        expect((await bodyPart.getBlockRangeByBlockNumberId(1))[3]).equal(1)

        for(let i= 0; i<500; i++)
        {         
          await increaseBlockTimestampBy(1)
        }
        await expect(factory.mintGenesis(holder.address)).revertedWith("BlockNumberOutOfRange")

      });

      it("Test findBlockIdByBlockNumber", async function () {
        let startingBlock = await getBlockNumber()
        let tester 

        tester = await bodyPart.findBlockIdByBlockNumber(startingBlock)
        expect(tester[0]).equal(0)
        expect(tester[1]).equal(true)

        tester = await bodyPart.findBlockIdByBlockNumber(startingBlock+ 100)
        expect(tester[0]).equal(1)
        expect(tester[1]).equal(true)

        tester = await bodyPart.findBlockIdByBlockNumber(startingBlock + 500)
        expect(tester[1]).equal(false)


        for(let i= 0; i<100; i++)
        {         
          await increaseBlockTimestampBy(1)
        }

        tester = await bodyPart.findBlockIdByBlockNumber(0)
        expect(tester[0]).equal(1)
        expect(tester[1]).equal(true)

        for(let i= 0; i<200; i++)
        {         
          await increaseBlockTimestampBy(1)
        }

        tester = await bodyPart.findBlockIdByBlockNumber(0)
        expect(tester[0]).equal(3)
        expect(tester[1]).equal(true)

  
        for(let i= 0; i<100; i++)
        {         
          await increaseBlockTimestampBy(1)
        }

        tester = await bodyPart.findBlockIdByBlockNumber(0)
        expect(tester[0]).equal(0)
        expect(tester[1]).equal(false)
        
      });

      it("Verify addBlockNumbers Flow", async function () {
        let tester 
        let startingBlock = await getBlockNumber()

        await expect(bodyPart.addBlockNumbers([1,5])).revertedWith("BlockNumbersOutOfOrder")

        expect((await bodyPart.getClosingBlockNumberIds()).length).equal(4)

        await bodyPart.addBlockNumbers([startingBlock+ 500, startingBlock + 600])

        expect((await bodyPart.getClosingBlockNumberIds()).length).equal(6)

        tester = await bodyPart.getBlockRangeByBlockNumberId(4)
        let tester2 = await bodyPart.getBlockRangeByBlockNumberId(3)
        expect(tester[0]).equal( tester2[1].toNumber() + 1 )

      });


      it("Verify preSet Flow", async function () {
        let startingBlock = await getBlockNumber()

        await expect(bodyPart.setBlockNumbers([startingBlock, startingBlock + 100])
        ).revertedWith("BlockNumbersAlreadySet")
        
        let bodyPart2 = await upgrades.deployProxy(GenesisToken, ["https://s3.Byte.City/BodyPart/"]);
        await bodyPart2.deployed();

        await expect(bodyPart2.addBlockNumbers([1,5])).revertedWith("BlockNumberNotSet")

        await expect(bodyPart2.setBlockNumbers([3,2,1])).revertedWith("BlockNumbersOutOfOrder")   

      });



  });
  
});
