[![ci](https://github.com/yozlabs/nza/actions/workflows/run_tests.yml/badge.svg)](https://github.com/yozlabs/gda/actions/workflows/run_tests.yml)
[![slither](https://github.com/yozlabs/nza/actions/workflows/run_static_analysis.yml/badge.svg)](https://github.com/yozlabs/gda/actions/workflows/run_static_analysis.yml)

# New Zealand Auction - (Reference Implementation)

This repository contains a variant of [the Gradual Duction Auction mechanism proposed by Paradigm](https://www.paradigm.xyz/2022/04/nza).

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

## Rationale - The Problem

When initially offering an NFT collection, you want to ensure as much value is captured by the collection creators. For NFT collections with a lot of hype - the large amount of demand on launch can cause a spike in gas fees - which represents value captured by miners that should really be directed to the NFT collection. For NFT mints where there is a large enough demand such that the "true" price of the NFT is above the mint price, but not a significant spike in gas fees, value is captured by community members who can resell the NFT on the secondary market for the "true" price. This is value that could have been captured by the collection creators by pricing the mint closer to the "true" price.

A dutch auction partially solves this problem by starting at a high mint price, and decreasing the price over time. This can help to spread out demand for the NFT collection over a longer period of time, and prevent a spike in gas fees.

However, a traditional dutch auction is still open to problems around having an incorrectly priced mint. For example, an NFT collection is minted through a dutch auction, with a starting price of 1 ETH - but demand for the NFT is high enough that people are willing to pay 3 ETH to mint that NFT. In this case, someone would be willing to pay 2 ETH in gas to mint, which is value captured by miners or resellers as opposed to the NFT project creators.

### Solution

A New Zealand Auction (NZA) varies from a traditional Dutch Auction in allowing the price to _increase_, as opposed to just decreasing the price.

If demand for the NFT collection is lower than expected, the minting contract automatically lowers the price to ensure sufficient demand - just like a traditional Dutch Auction. However, if demand is higher than expected, the contract can adjust the price upwards, to ensure value is captured by the project and not by resellers, or by miners through excessive gas fees.
