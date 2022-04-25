import { expect } from "chai";
import { ethers, network } from "hardhat";
import { GDATestable, GDATestable__factory } from "../typechain";

describe("GDA", function () {
  let GDA: GDATestable__factory;
  let gda: GDATestable;
  const collectionSize = 10000;
  const duration = 1 * 60 * 60; // One hour
  const stepDuration = 5 * 60; // 5 minutes
  const startPrice = 10000;
  const floorPrice = 5000;
  const priceDelta = 500;

  beforeEach(async function () {
    GDA = await ethers.getContractFactory("GDATestable");
    gda = await GDA.deploy("gda", "GDA", collectionSize, duration, stepDuration, startPrice, floorPrice, priceDelta);

    await gda.deployed();
  });

  describe("_getStep", function () {
    it("Returns first step when block time == `startTime`", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(await gda.startTime());
      expect(await gda.getStep()).to.equal(1);
    });

    it("Returns first step when block time > `startTime` and block time < `startTime` + `stepDuration`", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [startTime.toNumber() + stepDuration / 2]);
      await network.provider.send("evm_mine");
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(startTime.add(stepDuration / 2));
      expect(await gda.getStep()).to.equal(1);
    });

    it("Returns first step when block time == `startTime` + `stepDuration`", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [startTime.toNumber() + stepDuration]);
      await network.provider.send("evm_mine");
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(startTime.add(stepDuration));
      expect(await gda.getStep()).to.equal(1);
    });

    it("Returns second step when block time > `startTime` + `stepDuration` and block time < `startTime` + `stepDuration` * 2", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [
        startTime.toNumber() + stepDuration + stepDuration / 2,
      ]);
      await network.provider.send("evm_mine");
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(startTime.add(stepDuration + stepDuration / 2));
      expect(await gda.getStep()).to.equal(2);
    });

    it("Returns last step when block time == `startTime` + `duration`", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [startTime.toNumber() + duration]);
      await network.provider.send("evm_mine");
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(startTime.add(duration));
      expect(await gda.getStep()).to.equal(duration / stepDuration);
    });

    it("Returns last step when block time > `startTime` + `duration`", async function () {
      const startTime = await gda.startTime();
      await network.provider.send("evm_setNextBlockTimestamp", [startTime.toNumber() + duration * 2]);
      await network.provider.send("evm_mine");
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.equal(startTime.add(duration * 2));
      expect(await gda.getStep()).to.equal(duration / stepDuration);
    });
  });
});
