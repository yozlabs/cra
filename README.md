[![ci](https://github.com/yozlabs/nza/actions/workflows/run_tests.yml/badge.svg)](https://github.com/yozlabs/nza/actions/workflows/run_tests.yml)
[![slither](https://github.com/yozlabs/nza/actions/workflows/run_static_analysis.yml/badge.svg)](https://github.com/yozlabs/nza/actions/workflows/run_static_analysis.yml)

# New Zealand Auction (Reference Implementation)

This repository contains a variant of [the Gradual Duction Auction mechanism proposed by Paradigm](https://www.paradigm.xyz/2022/04/gda).

The fundamental concept is that, unlike a Dutch Auction, the price of the asset can vary both up and down over the length of the auction based on expected demand for the asset. If demand is higher than expected, the price goes up, if demand is lower than expected, the price goes down.

Expected demand is currently calculated as `collectionSize / (duration / stepDuration)`

Where:

- `collectionSize` is the total number of NFTs in the collection
- `duration` is the total duration of the initial mint auction in blocks
- `stepDuration` is how many blocks make up a step / phase of the auction (i.e. how frequently to update the mint price)

**This contract is a proof of concept and is not production ready. Yoz Labs is not liable for any outcomes as a result of using NZA. DYOR.**

## Getting Started

Clone the repository and download dependencies with:

```
git clone git@github.com:yozlabs/nza.git
cd nza
yarn install
```

### Usage

From the `nza` repo, run a Hardhat node with:

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

From the Hardhat console, mint an NFT from the contract:

```
let nza = await ethers.getContractAt("NZA", "<contract address>");
let currentPrice = await nza.getCurrentAuctionPrice();
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
