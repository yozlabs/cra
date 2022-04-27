[![ci](https://github.com/yozlabs/gda/actions/workflows/run_tests.yml/badge.svg)](https://github.com/yozlabs/gda/actions/workflows/run_tests.yml)

# Gradual Dutch Auction - (Reference Implementation)

This repository contains a variant of [the Gradual Duction Auction mechanism proposed by Paradigm](https://www.paradigm.xyz/2022/04/gda).

## Getting Started (TODO)

I don't actually know how to run this thing - so Dino can write something here. How do you use `GDA.sol`?

### Testing (TODO)

Don't know how to run the tests either. :)
## Rationale - The Problem

When initially offering an NFT collection, you want to ensure as much value is captured by the collection creators, as opposed to miners. For NFT collections with a lot of hype - the large amount of demand on launch can cause a spike in gas fees - which represents value captured by miners that should really be directed to the NFT collection.

A dutch auction partially solves this problem by starting at a high mint price, and decreasing the price over time. This can help to spread out demand for the NFT collection over a longer period of time, and prevent a spike in gas fees. However, a traditional dutch auction is still open to problems around having an incorrectly priced mint.

For example, an NFT collection is minted through a dutch auction, with a starting price of 1 ETH - but demand for the NFT is high enough that people are willing to pay 3 ETH to mint that NFT. In this case, someone would be willing to pay 2 ETH in gas to mint, which is value captured by miners as opposed to the NFT project creators.

### Solution

A Gradual Dutch Auction (GDA) varies from a traditional dutch auction in allowing the price to _increase and move back up_, as opposed to just decreasing the price.

If demand for the NFT collection is lower than expected, the minting contract automatically lowers the price to ensure sufficient demand - just like a traditional dutch auction. However, if demand is higher than expected, the contract can adjust the price upwards, to ensure value is captured by the project and not in excessive gas fees.

> (Note: I feel like I want to discuss the relationship between price and time, but I don't actually like this paragraph I wrote.)

With this mechanism, price can also be adjusted to manage the length of time the minting period lasts. For example, if the project wanted the minting period to last 24 hours to give all community members around the world an equal opportunity to mint - the minting contract could adjust price upwards to decrease the amount of mints per hour.

## Production Readiness (TODO)

- What would you want to adjust to run this in production?
- What problems would you need to think about? How would you set the various parameters around the action?

## Further Thoughts (TODO)

Worth discussing some possible extensions that Dino and I brainstormed? Or should that wait for a YozLabs tech blog?
