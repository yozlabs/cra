import { expect } from "chai";
import { ethers } from "hardhat";

describe("GDA", function () {
  it("Should deploy contract", async function () {
    const GDA = await ethers.getContractFactory("GDA");
    const collectionSize = 10000;
    const duration = 1 * 60 * 60; // One hour
    const stepDuration = 5 * 60; // 5 minutes 
    const startPrice = 10000; 
    const floorPrice = 5000;
    const priceDelta = 500;

    const gda = await GDA.deploy(
      "gda",
      "GDA",
      collectionSize,
      duration,
      stepDuration,
      startPrice,
      floorPrice,
      priceDelta);

    await gda.deployed();
  });
});
