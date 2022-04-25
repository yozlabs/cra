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
  const name = "gda";
  const symbol = "GDA";
  const collectionSize = 10000;
  const duration = 1 * 60 * 60; // One hour
  const stepDuration = 5 * 60; // 5 minutes
  const startPrice = 10000;
  const floorPrice = 5000;
  const priceDelta = 500;

  beforeEach(async function () {
    GDA = await ethers.getContractFactory("GDATestable");
    gda = await GDA.deploy(name, symbol, collectionSize, duration, stepDuration, startPrice, floorPrice, priceDelta);

    await gda.deployed();
  });

  describe("constructor", function () {
    it("Is initialized", async function () {
      expect(await gda.name()).to.equal(name);
      expect(await gda.symbol()).to.equal(symbol);
      expect(await gda.collectionSize()).to.equal(collectionSize);
      expect(await gda.duration()).to.equal(duration);
      expect(await gda.stepDuration()).to.equal(stepDuration);
      expect(await gda.startPrice()).to.equal(startPrice);
      expect(await gda.floorPrice()).to.equal(floorPrice);
      expect(await gda.priceDelta()).to.equal(priceDelta);
      expect(await gda.expectedStepMintRate()).to.equal(Math.floor(collectionSize / (duration / stepDuration)));
      expect(await gda.currentStep()).to.equal(1);
      expect(await gda.pricePerStep(1)).to.equal(startPrice);
    });
  });

  describe("_getStep", function () {
    it("Returns first step if block time == `startTime`", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(await gda.startTime());
      expect(await gda.getStep()).to.equal(1);
    });

    it("Returns first step if block time > `startTime` and block time < `startTime` + `stepDuration`", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [startTime.toNumber() + stepDuration / 2]);
      await network.provider.send("evm_mine");

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(startTime.add(stepDuration / 2));
      expect(await gda.getStep()).to.equal(1);
    });

    it("Returns first step if block time == `startTime` + `stepDuration`", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [startTime.toNumber() + stepDuration]);
      await network.provider.send("evm_mine");

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(startTime.add(stepDuration));
      expect(await gda.getStep()).to.equal(1);
    });

    it("Returns second step if block time > `startTime` + `stepDuration` and block time < `startTime` + `stepDuration` * 2", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [
        startTime.toNumber() + stepDuration + stepDuration / 2,
      ]);
      await network.provider.send("evm_mine");

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(startTime.add(stepDuration + stepDuration / 2));
      expect(await gda.getStep()).to.equal(2);
    });

    it("Returns last step if block time == `startTime` + `duration`", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [startTime.toNumber() + duration]);
      await network.provider.send("evm_mine");

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(startTime.add(duration));
      expect(await gda.getStep()).to.equal(duration / stepDuration);
    });

    it("Returns last step if block time > `startTime` + `duration`", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [startTime.toNumber() + duration * 2]);
      await network.provider.send("evm_mine");

      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(startTime.add(duration * 2));
      expect(await gda.getStep()).to.equal(duration / stepDuration);
    });
  });

  describe("_getAuctionPrice", function () {
    it("Reverts if `prevStep` > `_currentStep`", async function () {
      expect(await gda.currentStep()).to.equal(1);
      await expect(gda.getAuctionPrice(3, 2)).to.be.revertedWith("prevStep must <= _currentStep");
    });

    it("Reverts if `prevStep` == 0", async function () {
      await expect(gda.getAuctionPrice(1, 0)).to.be.revertedWith("prevStep must > 0");
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

      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [
        startTime.toNumber() + stepDuration + stepDuration / 2,
      ]);
      await network.provider.send("evm_mine");

      expect(await gda.getAuctionPrice(2, 1)).to.equal(startPrice - priceDelta);
    });

    it("Returns same price after 1 step if number minted == `expectedStepMintRate`", async function () {
      const quantity = await gda.expectedStepMintRate();
      await gda.mint(quantity, { value: quantity.mul(startPrice) });

      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [
        startTime.toNumber() + stepDuration + stepDuration / 2,
      ]);
      await network.provider.send("evm_mine");

      expect(await gda.getAuctionPrice(2, 1)).to.equal(startPrice);
    });

    it("Returns higher price after 1 step if number minted > `expectedStepMintRate`", async function () {
      const quantity = (await gda.expectedStepMintRate()).add(1);
      await gda.mint(quantity, { value: quantity.mul(startPrice) });

      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [
        startTime.toNumber() + stepDuration + stepDuration / 2,
      ]);
      await network.provider.send("evm_mine");

      expect(await gda.getAuctionPrice(2, 1)).to.equal(startPrice + priceDelta);
    });

    it("Returns lower price after multiple steps if nothing minted", async function () {
      const prevStep = 1;
      const currStep = 4;
      expect(await gda.getAuctionPrice(currStep, prevStep)).to.equal(startPrice - priceDelta * (currStep - prevStep));
    });

    it("Returns floor price and stops decreasing price after multiple steps", async function () {
      const numStepsUntilFloor = (startPrice - floorPrice) / priceDelta;
      expect(await gda.getAuctionPrice(1 + numStepsUntilFloor + 2, 1)).to.equal(floorPrice);
    });
  });

  describe("_getCurrentStepAndPrice", function () {
    it("Returns current step and price if calculated step == `_currentStep`", async function () {
      const _currentStep = await gda.currentStep();
      expect(await gda.getStep()).to.equal(_currentStep);

      const [step, price] = await gda.getCurrentStepAndPrice();
      expect(step).to.equal(_currentStep);
      expect(price).to.equal(startPrice);
    });

    it("Returns current step and price if calculated step > `_currentStep`", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [
        startTime.toNumber() + stepDuration + stepDuration / 2,
      ]);
      await network.provider.send("evm_mine");

      const _currentStep = await gda.currentStep();
      expect(await gda.getStep()).to.be.gt(_currentStep);

      const [step, price] = await gda.getCurrentStepAndPrice();
      expect(step).to.equal(await gda.getStep());
      expect(price).to.equal(startPrice - priceDelta);
    });

    it("Returns last step and price if block time > `startTime` + `duration`", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [startTime.toNumber() + duration * 2]);
      await network.provider.send("evm_mine");

      const [step, price] = await gda.getCurrentStepAndPrice();
      expect(step).to.equal(duration / stepDuration);
      expect(price).to.equal(floorPrice);
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
  });
});
