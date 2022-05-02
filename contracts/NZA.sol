// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract NZA is ERC721A {
    // Size of the collection
    uint256 public collectionSize;

    // Length of the auction in blocks
    uint256 public duration;

    // Starting block number of the auction
    uint256 public startBlock;

    // Length of an auction step in blocks
    uint256 public stepDuration;

    // Starting price of the auction in wei
    uint256 public startPrice;

    // Floor price of the auction in wei
    uint256 public floorPrice;

    // Magnitude of price change per step
    uint256 public priceDelta;

    // Expected rate of mints per step (calculated)
    uint256 public expectedStepMintRate;

    // Current step in the auction, starts at 1
    uint256 internal _currentStep;

    // Mapping from step to number of mints at that step
    mapping(uint256 => uint256) internal _mintsPerStep;

    // Mapping from step to price at that step
    mapping(uint256 => uint256) internal _pricePerStep;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 collectionSize_,
        uint256 duration_,
        uint256 stepDuration_,
        uint256 startPrice_,
        uint256 floorPrice_,
        uint256 priceDelta_
    ) ERC721A(name_, symbol_) {
        require(collectionSize_ > 0, "collectionSize_ must be > 0");
        require(duration_ > 0, "duration_ must be > 0");
        require(stepDuration_ > 0, "stepDuration_ must be > 0");
        require(startPrice_ >= floorPrice_, "startPrice_ must be >= floorPrice_");
        require(priceDelta_ > 0, "priceDelta_ must be > 0");

        collectionSize = collectionSize_;
        duration = duration_;
        startBlock = block.number;
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
        // Note: In this implementation, this can never happen
        // because startBlock is always set to the block.number on deploy
        // in the constructor - but a production version of this contract
        // would want to explicitly set the startBlock of the auction
        require(block.number >= startBlock, "Auction has not started!");

        uint256 elapsedBlocks = block.number - startBlock;

        // The auction can't last longer than the auction's duration
        if (elapsedBlocks > duration) {
            elapsedBlocks = duration;
        }

        uint256 step = Math.ceilDiv(elapsedBlocks, stepDuration);

        // Steps start at 1
        return step > 0 ? step : 1;
    }

    /**
     * @dev Returns the current auction price given the current and previous step.
     */
    function _getAuctionPrice(uint256 currStep, uint256 prevStep) internal view returns (uint256) {
        require(prevStep > 0, "prevStep must be > 0");
        require(_currentStep >= prevStep, "_currentStep must be >= prevStep");
        require(currStep >= prevStep, "currStep must be >= prevStep");

        uint256 price = _pricePerStep[prevStep];
        uint256 passedSteps = currStep - prevStep;
        uint256 numMinted;

        while (passedSteps > 0) {
            numMinted = _mintsPerStep[prevStep];

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

            prevStep += 1;
            passedSteps -= 1;
        }

        return price;
    }

    /**
     * @dev Returns a tuple of the current step and price.
     */
    function _getCurrentStepAndPrice() internal view returns (uint256, uint256) {
        uint256 step = _getStep();

        // '_currentStep' is stored in state
        // whileas 'step' is computed on-demand based on the current block.
        //
        // So, this statement is always true.
        assert(step >= _currentStep);

        // False positive guarding against using strict equality checks
        // Shouldn't be a problem here because we check for > and < cases
        // slither-disable-next-line incorrect-equality
        if (step == _currentStep) {
            return (_currentStep, _pricePerStep[_currentStep]);
        }

        // If not equal, it must be greater than the current step because of the assert above
        return (step, _getAuctionPrice(step, _currentStep));
    }

    /**
     * @dev Returns the current auction price.
     */
    function getCurrentAuctionPrice() external view returns (uint256) {
        (, uint256 price) = _getCurrentStepAndPrice();

        return price;
    }

    /**
     * @dev Mints `quantity` of tokens and transfers them to the sender.
     * If the sender sends more ETH than needed, it refunds them.
     */
    function mint(uint256 quantity) external payable {
        require(quantity > 0, "Mint quantity must be > 0");
        require(_totalMinted() + quantity <= collectionSize, "Will exceed maximum supply");

        (uint256 auctionStep, uint256 auctionPrice) = _getCurrentStepAndPrice();
        // Update auction state to the new step and new price
        if (auctionStep > _currentStep) {
            _pricePerStep[auctionStep] = auctionPrice;
            _currentStep = auctionStep;
        }
        uint256 cost = auctionPrice * quantity;
        require(msg.value >= cost, "Insufficient payment");

        _mintsPerStep[auctionStep] += quantity;
        _safeMint(msg.sender, quantity);

        if (msg.value > cost) {
            (bool success, ) = msg.sender.call{value: msg.value - cost}("");
            require(success, "Refund transfer failed");
        }
    }
}
