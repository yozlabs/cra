import { ethers } from "hardhat";

async function main() {
  const name = "nza";
  const symbol = "NZA";
  const collectionSize = 1000;
  const duration = 30; // in blocks
  const stepDuration = 2; // in blocks
  const startPrice = 10000;
  const floorPrice = 5000;
  const priceDelta = 500;

  const NZA = await ethers.getContractFactory("NZA");
  const nza = await NZA.deploy(
    name,
    symbol,
    collectionSize,
    duration,
    stepDuration,
    startPrice,
    floorPrice,
    priceDelta
  );

  await nza.deployed();

  console.log("NZA deployed to:", nza.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
