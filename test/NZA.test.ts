import { expect } from "chai";
import { ethers, network } from "hardhat";
import { NZATestable, NZATestable__factory } from "../typechain";

// There is currently an open issue for ethers where inherited methods are missing revert data
// For those methods this only allows us to test if a contract call was reverted, not the message
// https://github.com/ethers-io/ethers.js/issues/2885
// TODO: Track this and see if messages are present once fixed

describe("NZA", function () {
  let NZA: NZATestable__factory;
  let nza: NZATestable;
  let startBlock: number;

  const name = "nza";
  const symbol = "NZA";
  const collectionSize = 1000;
  const duration = 30; // in blocks
  const stepDuration = 2; // in blocks
  const startPrice = 10000;
  const floorPrice = 5000;
  const priceDelta = 500;

  beforeEach(async function () {
    NZA = await ethers.getContractFactory("NZATestable");
    nza = await NZA.deploy(name, symbol, collectionSize, duration, stepDuration, startPrice, floorPrice, priceDelta);

    await nza.deployed();

    const latestBlock = await ethers.provider.getBlock("latest");
    startBlock = latestBlock.number;
  });

  describe("constructor", function () {
    it("Is initialized", async function () {
      expect(await nza.name()).to.equal(name);
      expect(await nza.symbol()).to.equal(symbol);
      expect(await nza.collectionSize()).to.equal(collectionSize);
      expect(await nza.duration()).to.equal(duration);
      expect(await nza.startBlock()).to.equal(startBlock);
      expect(await nza.stepDuration()).to.equal(stepDuration);
      expect(await nza.startPrice()).to.equal(startPrice);
      expect(await nza.floorPrice()).to.equal(floorPrice);
      expect(await nza.priceDelta()).to.equal(priceDelta);
      expect(await nza.expectedStepMintRate()).to.equal(Math.floor(collectionSize / (duration / stepDuration)));
      expect(await nza.currentStep()).to.equal(1);
      expect(await nza.pricePerStep(1)).to.equal(startPrice);
      expect(await nza.mintsPerStep(1)).to.equal(0);
    });
  });

  describe("_getStep", function () {
    it("Returns first step if block number == `startBlock`", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.equal(await nza.startBlock());
      expect(await nza.getStep()).to.equal(1);
    });

    it("Returns first step if block number > `startBlock` and block number < `startBlock` + `stepDuration`", async function () {
      await network.provider.send("evm_mine");

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.be.gt(startBlock);
      expect(latestBlock.number).to.be.lt(startBlock + stepDuration);
      expect(await nza.getStep()).to.equal(1);
    });

    it("Returns first step if block number == `startBlock` + `stepDuration`", async function () {
      for (let i = 0; i < stepDuration; i++) {
        await network.provider.send("evm_mine");
      }

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.equal(startBlock + stepDuration);
      expect(await nza.getStep()).to.equal(1);
    });

    it("Returns second step if block number > `startBlock + `stepDuration` and block number < `startBlock` + `stepDuration` * 2", async function () {
      for (let i = 0; i < stepDuration + 1; i++) {
        await network.provider.send("evm_mine");
      }

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.be.gt(startBlock + stepDuration);
      expect(latestBlock.number).to.be.lt(startBlock + stepDuration * 2);
      expect(await nza.getStep()).to.equal(2);
    });

    it("Returns last step if block number == `startBlock` + `duration`", async function () {
      for (let i = 0; i < duration; i++) {
        await network.provider.send("evm_mine");
      }

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.equal(startBlock + duration);
      expect(await nza.getStep()).to.equal(duration / stepDuration);
    });

    it("Returns last step if block number > `startBlock` + `duration`", async function () {
      for (let i = 0; i < duration * 2; i++) {
        await network.provider.send("evm_mine");
      }

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.be.gt(startBlock + duration);
      expect(await nza.getStep()).to.equal(duration / stepDuration);
    });
  });

  describe("_getAuctionPrice", function () {
    it("Reverts if `prevStep` == 0", async function () {
      await expect(nza.getAuctionPrice(1, 0)).to.be.revertedWith("prevStep must be > 0");
    });

    it("Reverts if `_currentStep` < `prevStep`", async function () {
      const _currentStep = await nza.currentStep();
      await expect(nza.getAuctionPrice(_currentStep.add(2), _currentStep.add(1))).to.be.revertedWith(
        "_currentStep must be >= prevStep"
      );
    });

    it("Reverts if `currStep` < `prevStep`", async function () {
      await expect(nza.getAuctionPrice(0, 1)).to.be.revertedWith("currStep must be >= prevStep");
    });

    it("Returns price at step if `currStep` == `prevStep`", async function () {
      expect(await nza.getAuctionPrice(1, 1)).to.equal(startPrice);
    });

    it("Returns lower price after 1 step if number minted < `expectedStepMintRate`", async function () {
      const quantity = (await nza.expectedStepMintRate()).sub(1);
      await nza.mint(quantity, { value: quantity.mul(startPrice) });

      expect(await nza.getAuctionPrice(2, 1)).to.equal(startPrice - priceDelta);
    });

    it("Returns same price after 1 step if number minted == `expectedStepMintRate`", async function () {
      const quantity = await nza.expectedStepMintRate();
      await nza.mint(quantity, { value: quantity.mul(startPrice) });

      expect(await nza.getAuctionPrice(2, 1)).to.equal(startPrice);
    });

    it("Returns higher price after 1 step if number minted > `expectedStepMintRate`", async function () {
      const quantity = (await nza.expectedStepMintRate()).add(1);
      await nza.mint(quantity, { value: quantity.mul(startPrice) });

      expect(await nza.getAuctionPrice(2, 1)).to.equal(startPrice + priceDelta);
    });

    it("Returns lower price after multiple steps if nothing minted", async function () {
      const prevStep = 1;
      const currStep = 4;
      expect(await nza.getAuctionPrice(currStep, prevStep)).to.equal(startPrice - priceDelta * (currStep - prevStep));
    });

    it("Returns floor price and stops decreasing price after multiple steps", async function () {
      const numStepsUntilFloor = (startPrice - floorPrice) / priceDelta;
      expect(await nza.getAuctionPrice(1 + numStepsUntilFloor, 1)).to.equal(floorPrice);
      expect(await nza.getAuctionPrice(1 + numStepsUntilFloor + 2, 1)).to.equal(floorPrice);
    });
  });

  describe("_getCurrentStepAndPrice", function () {
    it("Returns correct step and price if calculated step == `_currentStep`", async function () {
      const _currentStep = await nza.currentStep();
      expect(await nza.getStep()).to.equal(_currentStep);

      const [step, price] = await nza.getCurrentStepAndPrice();
      expect(step).to.equal(await nza.getStep());
      expect(price).to.equal(startPrice);
    });

    it("Returns correct step and price if calculated step > `_currentStep`", async function () {
      for (let i = 0; i < stepDuration + 1; i++) {
        await network.provider.send("evm_mine");
      }

      const _currentStep = await nza.currentStep();
      expect(await nza.getStep()).to.be.gt(_currentStep);

      const [step, price] = await nza.getCurrentStepAndPrice();
      expect(step).to.equal(await nza.getStep());
      expect(price).to.equal(startPrice - priceDelta);
    });

    it("Returns last step and price if block number > `startBlock` + `duration`", async function () {
      for (let i = 0; i < duration * 2; i++) {
        await network.provider.send("evm_mine");
      }

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.number).to.be.gt(startBlock + duration);

      const [step, price] = await nza.getCurrentStepAndPrice();
      expect(step).to.equal(duration / stepDuration);
      expect(price).to.equal(floorPrice);
    });
  });

  describe("mint", function () {
    it("Reverts if `quantity` == 0", async function () {
      await expect(nza.mint(0)).to.be.revertedWith("Mint quantity must be > 0");
    });

    it("Reverts if total minted + `quantity` > `collectionSize`", async function () {
      await nza.mint(collectionSize, { value: startPrice * collectionSize });
      await expect(nza.mint(1, { value: startPrice })).to.be.revertedWith("Will exceed maximum supply");
    });

    it("Reverts if insufficient payment", async function () {
      await expect(nza.mint(1, { value: startPrice - 1 })).to.be.revertedWith("Insufficient payment");
    });

    it("Mints 1 token", async function () {
      const [signer] = await ethers.getSigners();
      expect(await nza.balanceOf(signer.address)).to.equal(0);

      await nza.mint(1, { value: startPrice });
      expect(await nza.balanceOf(signer.address)).to.equal(1);
    });

    it("Mints multiple tokens", async function () {
      const [signer] = await ethers.getSigners();
      expect(await nza.balanceOf(signer.address)).to.equal(0);

      await nza.mint(5, { value: startPrice * 5 });
      expect(await nza.balanceOf(signer.address)).to.equal(5);
    });

    it("Sets _currentStep, _pricePerStep, and _mintsPerStep", async function () {
      for (let i = 0; i < stepDuration + 1; i++) {
        await network.provider.send("evm_mine");
      }

      const step = await nza.getStep();
      expect(await nza.currentStep()).to.not.equal(step);
      expect(await nza.pricePerStep(step)).to.equal(0);
      expect(await nza.mintsPerStep(step)).to.equal(0);

      await nza.mint(1, { value: startPrice });
      expect(await nza.currentStep()).to.equal(step);
      expect(await nza.pricePerStep(step)).to.equal(startPrice - priceDelta);
      expect(await nza.mintsPerStep(step)).to.equal(1);
    });

    it("Refunds overpayment", async function () {
      const [signer] = await ethers.getSigners();
      const balanceBefore = await signer.getBalance();
      const mintTx = await nza.mint(1, {
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
