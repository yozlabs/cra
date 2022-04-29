import { expect } from "chai";
import { ethers, network } from "hardhat";
import { GDATestable, GDATestable__factory } from "../typechain";

// There is currently an open issue for ethers where inherited methods are missing revert data
// For those methods this only allows us to test if a contract call was reverted, not the message
// https://github.com/ethers-io/ethers.js/issues/2885
// TODO: Track this and see if messages are present once fixed

describe("GDA", function () {
  let GDA: GDATestable__factory;
  let gda: GDATestable;
  let startBlock: number;

  const name = "gda";
  const symbol = "GDA";
  const collectionSize = 1000;
  const duration = 30; // in blocks
  const stepDuration = 2; // in blocks
  const startPrice = 10000;
  const floorPrice = 5000;
  const priceDelta = 500;

  beforeEach(async function () {
    GDA = await ethers.getContractFactory("GDATestable");
    gda = await GDA.deploy(name, symbol, collectionSize, duration, stepDuration, startPrice, floorPrice, priceDelta);

    await gda.deployed();

    const latestBlock = await ethers.provider.getBlock("latest");
    startBlock = latestBlock.number;
  });

  describe("constructor", function () {
    it("Is initialized", async function () {
      expect(await gda.name()).to.equal(name);
      expect(await gda.symbol()).to.equal(symbol);
      expect(await gda.collectionSize()).to.equal(collectionSize);
      expect(await gda.duration()).to.equal(duration);
      expect(await gda.startBlock()).to.equal(startBlock);
      expect(await gda.stepDuration()).to.equal(stepDuration);
      expect(await gda.startPrice()).to.equal(startPrice);
      expect(await gda.floorPrice()).to.equal(floorPrice);
      expect(await gda.priceDelta()).to.equal(priceDelta);
      expect(await gda.expectedStepMintRate()).to.equal(Math.floor(collectionSize / (duration / stepDuration)));
      expect(await gda.currentStep()).to.equal(1);
      expect(await gda.pricePerStep(1)).to.equal(startPrice);
      expect(await gda.mintsPerStep(1)).to.equal(0);
    });
  });

  describe("_getStep", function () {
    it("Returns first step if block number == `startBlock`", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.equal(await gda.startBlock());
      expect(await gda.getStep()).to.equal(1);
    });

    it("Returns first step if block number > `startBlock` and block number < `startBlock` + `stepDuration`", async function () {
      await network.provider.send("evm_mine");

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.be.gt(startBlock);
      expect(latestBlock.number).to.be.lt(startBlock + stepDuration);
      expect(await gda.getStep()).to.equal(1);
    });

    it("Returns first step if block number == `startBlock` + `stepDuration`", async function () {
      for (let i = 0; i < stepDuration; i++) {
        await network.provider.send("evm_mine");
      }

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.equal(startBlock + stepDuration);
      expect(await gda.getStep()).to.equal(1);
    });

    it("Returns second step if block number > `startBlock + `stepDuration` and block number < `startBlock` + `stepDuration` * 2", async function () {
      for (let i = 0; i < stepDuration + 1; i++) {
        await network.provider.send("evm_mine");
      }

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.be.gt(startBlock + stepDuration);
      expect(latestBlock.number).to.be.lt(startBlock + stepDuration * 2);
      expect(await gda.getStep()).to.equal(2);
    });

    it("Returns last step if block number == `startBlock` + `duration`", async function () {
      for (let i = 0; i < duration; i++) {
        await network.provider.send("evm_mine");
      }

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.equal(startBlock + duration);
      expect(await gda.getStep()).to.equal(duration / stepDuration);
    });

    it("Returns last step if block number > `startBlock` + `duration`", async function () {
      for (let i = 0; i < duration * 2; i++) {
        await network.provider.send("evm_mine");
      }

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.be.gt(startBlock + duration);
      expect(await gda.getStep()).to.equal(duration / stepDuration);
    });
  });

  describe("_getAuctionPrice", function () {
    it("Reverts if `prevStep` == 0", async function () {
      await expect(gda.getAuctionPrice(1, 0)).to.be.revertedWith("prevStep must > 0");
    });

    it("Reverts if `_currentStep` < `prevStep`", async function () {
      const _currentStep = await gda.currentStep();
      await expect(gda.getAuctionPrice(_currentStep.add(2), _currentStep.add(1))).to.be.revertedWith(
        "_currentStep must >= prevStep"
      );
    });

    it("Reverts if `currStep` < `prevStep`", async function () {
      await expect(gda.getAuctionPrice(0, 1)).to.be.revertedWith("currStep must >= prevStep");
    });

    it("Returns price at step if `currStep` == `prevStep`", async function () {
      expect(await gda.getAuctionPrice(1, 1)).to.equal(startPrice);
    });

    it("Returns lower price after 1 step if number minted < `expectedStepMintRate`", async function () {
      const quantity = (await gda.expectedStepMintRate()).sub(1);
      await gda.mint(quantity, { value: quantity.mul(startPrice) });

      expect(await gda.getAuctionPrice(2, 1)).to.equal(startPrice - priceDelta);
    });

    it("Returns same price after 1 step if number minted == `expectedStepMintRate`", async function () {
      const quantity = await gda.expectedStepMintRate();
      await gda.mint(quantity, { value: quantity.mul(startPrice) });

      expect(await gda.getAuctionPrice(2, 1)).to.equal(startPrice);
    });

    it("Returns higher price after 1 step if number minted > `expectedStepMintRate`", async function () {
      const quantity = (await gda.expectedStepMintRate()).add(1);
      await gda.mint(quantity, { value: quantity.mul(startPrice) });

      expect(await gda.getAuctionPrice(2, 1)).to.equal(startPrice + priceDelta);
    });

    it("Returns lower price after multiple steps if nothing minted", async function () {
      const prevStep = 1;
      const currStep = 4;
      expect(await gda.getAuctionPrice(currStep, prevStep)).to.equal(startPrice - priceDelta * (currStep - prevStep));
    });

    it("Returns floor price and stops decreasing price after multiple steps", async function () {
      const numStepsUntilFloor = (startPrice - floorPrice) / priceDelta;
      expect(await gda.getAuctionPrice(1 + numStepsUntilFloor, 1)).to.equal(floorPrice);
      expect(await gda.getAuctionPrice(1 + numStepsUntilFloor + 2, 1)).to.equal(floorPrice);
    });
  });

  describe("_getCurrentStepAndPrice", function () {
    it("Returns correct step and price if calculated step == `_currentStep`", async function () {
      const _currentStep = await gda.currentStep();
      expect(await gda.getStep()).to.equal(_currentStep);

      const [step, price] = await gda.getCurrentStepAndPrice();
      expect(step).to.equal(await gda.getStep());
      expect(price).to.equal(startPrice);
    });

    it("Returns correct step and price if calculated step > `_currentStep`", async function () {
      for (let i = 0; i < stepDuration + 1; i++) {
        await network.provider.send("evm_mine");
      }

      const _currentStep = await gda.currentStep();
      expect(await gda.getStep()).to.be.gt(_currentStep);

      const [step, price] = await gda.getCurrentStepAndPrice();
      expect(step).to.equal(await gda.getStep());
      expect(price).to.equal(startPrice - priceDelta);
    });

    it("Returns last step and price if block number > `startBlock` + `duration`", async function () {
      for (let i = 0; i < duration * 2; i++) {
        await network.provider.send("evm_mine");
      }

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.be.gt(startBlock + duration);

      const [step, price] = await gda.getCurrentStepAndPrice();
      expect(step).to.equal(duration / stepDuration);
      expect(price).to.equal(floorPrice);
    });
  });

  describe("getCurrentAuctionPrice", function () {
    it("Returns the current auction price", async function () {
      for (let i = 0; i < stepDuration + 1; i++) {
        await network.provider.send("evm_mine");
      }

      expect(await gda.getCurrentAuctionPrice()).to.equal(startPrice - priceDelta);
    });
  });

  describe("mint", function () {
    it("Reverts if `quantity` == 0", async function () {
      await expect(gda.mint(0)).to.be.revertedWith("Mint quantity must > 0");
    });

    it("Reverts if total minted + `quantity` > `collectionSize`", async function () {
      await gda.mint(collectionSize, { value: startPrice * collectionSize });
      await expect(gda.mint(1, { value: startPrice })).to.be.revertedWith("Will exceed maximum supply");
    });

    it("Reverts if insufficient payment", async function () {
      await expect(gda.mint(1, { value: startPrice - 1 })).to.be.revertedWith("Insufficient payment");
    });

    it("Mints 1 token", async function () {
      const [signer] = await ethers.getSigners();
      expect(await gda.balanceOf(signer.address)).to.equal(0);

      await gda.mint(1, { value: startPrice });
      expect(await gda.balanceOf(signer.address)).to.equal(1);
    });

    it("Mints multiple tokens", async function () {
      const [signer] = await ethers.getSigners();
      expect(await gda.balanceOf(signer.address)).to.equal(0);

      await gda.mint(5, { value: startPrice * 5 });
      expect(await gda.balanceOf(signer.address)).to.equal(5);
    });

    it("Sets _currentStep, _pricePerStep, and _mintsPerStep", async function () {
      for (let i = 0; i < stepDuration + 1; i++) {
        await network.provider.send("evm_mine");
      }

      const step = await gda.getStep();
      expect(await gda.currentStep()).to.not.equal(step);
      expect(await gda.pricePerStep(step)).to.equal(0);
      expect(await gda.mintsPerStep(step)).to.equal(0);

      await gda.mint(1, { value: startPrice });
      expect(await gda.currentStep()).to.equal(step);
      expect(await gda.pricePerStep(step)).to.equal(startPrice - priceDelta);
      expect(await gda.mintsPerStep(step)).to.equal(1);
    });

    it("Refunds overpayment", async function () {
      const [signer] = await ethers.getSigners();
      const balanceBefore = await signer.getBalance();
      const mintTx = await gda.mint(1, {
        value: startPrice * 3,
      });
      const mintTxReceipt = await mintTx.wait();
      const gasCost = mintTxReceipt.gasUsed.mul(mintTxReceipt.effectiveGasPrice);
      const balanceAfter = await signer.getBalance();
      // The (starting balance - gas cost - ending balance) should leave only the cost of the tokens
      // Since we mint one token and pay triple that, we should have been refunded the rest
      expect(balanceBefore.sub(gasCost).sub(balanceAfter)).to.equal(startPrice);
    });
  });
});
