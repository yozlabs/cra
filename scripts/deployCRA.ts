import { ethers } from "hardhat";

async function main() {
  const name = "cra";
  const symbol = "CRA";
  const collectionSize = 1000;
  const duration = 30; // in blocks
  const stepDuration = 2; // in blocks
  const startPrice = 10000;
  const floorPrice = 5000;
  const priceDelta = 500;

  const CRA = await ethers.getContractFactory("CRA");
  const cra = await CRA.deploy(
    name,
    symbol,
    collectionSize,
    duration,
    stepDuration,
    startPrice,
    floorPrice,
    priceDelta
  );

  await cra.deployed();

  console.log("CRA deployed to:", cra.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
