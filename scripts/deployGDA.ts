import { ethers } from "hardhat";

async function main() {
  const name = "gda";
  const symbol = "GDA";
  const collectionSize = 1000;
  const duration = 30; // in blocks
  const stepDuration = 2; // in blocks
  const startPrice = 10000;
  const floorPrice = 5000;
  const priceDelta = 500;

  const GDA = await ethers.getContractFactory("GDA");
  const gda = await GDA.deploy(
    name,
    symbol,
    collectionSize,
    duration,
    stepDuration,
    startPrice,
    floorPrice,
    priceDelta
  );

  await gda.deployed();

  console.log("GDA deployed to:", gda.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
