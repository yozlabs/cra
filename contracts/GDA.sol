// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract GDA is ERC721A {
    // Size of the collection
    uint256 public collectionSize;

    // Length of the auction in seconds
    uint256 public duration;

    // Start time as timestamp in seconds
    uint256 public startTime;

    // Length of an auction step in seconds
    uint256 public stepDuration;

    // Starting price of the auction in wei
    uint256 public startPrice;

    // Floor price of the auction in wei
    uint256 public floorPrice;

    // Magnitude of price change per step
    uint256 public priceDelta;

    // Expected rate of mints per step
    uint256 public expectedStepMintRate;

    // Current step in the auction, starts at 1
    uint256 private _currentStep;

    // Mapping from step to number of mints at that step
    mapping(uint256 => uint256) private _mintsPerStep;

    // Mapping from step to price at that step
    mapping(uint256 => uint256) private _pricePerStep;

    constructor (
        string memory name_,
        string memory symbol_,
        uint256 collectionSize_,
        uint256 duration_,
        uint256 stepDuration_,
        uint256 startPrice_,
        uint256 floorPrice_,
        uint256 priceDelta_
    ) ERC721A(name_, symbol_) {
        collectionSize = collectionSize_;
        duration = duration_;
        startTime = block.timestamp;
        stepDuration = stepDuration_;
        startPrice = startPrice_;
        floorPrice = floorPrice_;
        priceDelta = priceDelta_;

        expectedStepMintRate = collectionSize / (duration_ / stepDuration_);

        // Auction steps start at 1
        _currentStep = 1;
        _pricePerStep[1] = startPrice;
 
    }

    /**
     * @dev Get the current step of the auction based on the elapsed time.
     */
    function _getStep() internal view returns (uint256) {
        uint256 elapsedTime = duration;
        if (startTime + duration > block.timestamp) {
            elapsedTime = block.timestamp - startTime;
        }
        uint256 step = Math.ceilDiv(elapsedTime, stepDuration);

        // Steps start at 1
        return step > 0 ? step: 1;
    }

    /**
     * @dev Returns the current auction price given the current and previous step.
     */
    function _getAuctionPrice(uint256 currStep_, uint256 prevStep_)
        internal
        view
        returns (uint256)
    {
        uint256 price = _pricePerStep[prevStep_];
        uint256 passedSteps = currStep_ - prevStep_;
        uint256 numMinted;

        while (passedSteps > 0) {
            numMinted = _mintsPerStep[prevStep_];

            // More than the expected rate, raise the price
            if (numMinted > expectedStepMintRate) {
                price += priceDelta;
            }
            // Less than the expected rate, lower the price
            else if (numMinted < expectedStepMintRate) {
                if (priceDelta > price - floorPrice) {
                    price = floorPrice;
                } else {
                    price -= priceDelta;
                }
            }
            // If numMinted == expectedStepMintRate, keep the same price

            prevStep_ += 1;
            passedSteps -= 1;
        }

        return price;
    }

    /**
     * @dev Returns a tuple of the current step and price.
     */
    function _getCurrentStepAndPrice()
        internal
        view
        returns (
            uint256,
            uint256
        )
    {
        uint256 step = _getStep();

        if (step == _currentStep) {
            return (_currentStep, _pricePerStep[_currentStep]);
        } else if (step > _currentStep) {
            return (step, _getAuctionPrice(step, _currentStep));
        } else {
            revert("Step is < current step");
        }
    }

    /**
     * @dev Mints `quantity` of tokens and transfers them to the sender.
     * If the sender sends more ETH than needed, it refunds them.
     */
    function mint(uint256 quantity) external payable{
        require(quantity > 0, "Mint quantity must > 0");
        require(_totalMinted() + quantity <= collectionSize, "Will exceed maximum supply");

        (uint256 auctionStep, uint256 auctionPrice) = _getCurrentStepAndPrice();
        // Update auction state to the new step and new price
        if (auctionStep > _currentStep) {
            _pricePerStep[auctionStep] = auctionPrice;
            _currentStep = auctionStep;
        }
        uint256 cost = auctionPrice * quantity;
        require(msg.value >= cost, "Insufficient payment");

        _safeMint(msg.sender, quantity);
        _mintsPerStep[auctionStep] += quantity;

        if (msg.value > cost) {
            (bool success, ) = msg.sender.call{value: msg.value - cost}("");
            require(success, "Refund transfer failed");
        }
    }
}
