// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./GDA.sol";

contract GDATestable is GDA {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 collectionSize_,
        uint256 duration_,
        uint256 stepDuration_,
        uint256 startPrice_,
        uint256 floorPrice_,
        uint256 priceDelta_
    ) GDA(name_, symbol_, collectionSize_, duration_, stepDuration_, startPrice_, floorPrice_, priceDelta_) {}

    function getStep() public view returns (uint256) {
        return _getStep();
    }

    function getAuctionPrice(uint256 currStep, uint256 prevStep) public view returns (uint256) {
        return _getAuctionPrice(currStep, prevStep);
    }

    function getCurrentStepAndPrice() public view returns (uint256, uint256) {
        return _getCurrentStepAndPrice();
    }
}