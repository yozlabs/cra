[![ci](https://github.com/yozlabs/nza-reference/actions/workflows/run_tests.yml/badge.svg)](https://github.com/yozlabs/nza-reference/actions/workflows/run_tests.yml)
[![slither](https://github.com/yozlabs/nza-reference/actions/workflows/run_static_analysis.yml/badge.svg)](https://github.com/yozlabs/nza-reference/actions/workflows/run_static_analysis.yml)

# New Zealand Auction - (Reference Implementation)

This repository contains a variant of [the Gradual Duction Auction mechanism proposed by Paradigm](https://www.paradigm.xyz/2022/04/gda).

The fundamental concept is that, unlike a Dutch Auction, the price of the asset can vary both up and down over the length of the auction based on expected demand for the asset. If demand is higher than expected, the price goes up, if demand is lower than expected, the price goes down.

Expected demand is currently calculated as `collectionSize / (duration / stepDuration)`

Where:

- `collectionSize` is the total number of NFTs in the collection
- `duration` is the total duration of the initial mint auction in blocks
- `stepDuration` is how many blocks make up a step / phase of the auction (i.e. how frequently to update the mint price)

## Getting Started

Clone the repository with:

```
git clone git@github.com:yozlabs/nza-reference.git
```

From the `nza-reference` repo run a Hardhat node with:

```
npx hardhat node
```

In another terminal, deploy the contract with:

```
npx hardhat run scripts/deployNZA.ts --network localhost
```

Make sure to copy the contract address to your clipboard.

To make contract calls and test the contract, run:

```
npx hardhat console --network localhost
```

### Usage

Load the contract using the contract address from above:

```
let nza = await ethers.getContractAt("NZA", "<contract address>");
```

Get the current auction price:

```
let currentPrice = await nza.getCurrentAuctionPrice();
```

Mint an NFT:

```
await nza.mint(1, {value: currentPrice})
```

Confirm an NFT was minted to your address:

```
const [signer] = await ethers.getSigners();

// Should return 1
await nza.balanceOf(signer.address);
```

### Testing

Compile the contract with:

```
yarn compile
```

Run tests with:

```
yarn test
```
