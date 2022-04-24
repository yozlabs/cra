import math
from collections import defaultdict


class GDA:
    """This class simulates the pricing logic for the GDA."""

    # Internal state of the auction that tracks the step to tokens minted and price.
    _step_minted_price_dict = defaultdict(lambda: {"minted": 0, "price": None})

    def __init__(
        self,
        start_time,
        duration,
        step_duration,
        start_price,
        floor_price,
        price_delta,
        expected_step_mint_rate,
    ):
        self.start_time = start_time
        self.duration = duration
        self.step_duration = step_duration
        self.start_price = start_price
        self.floor_price = floor_price
        self.price_delta = price_delta
        self.expected_step_mint_rate = expected_step_mint_rate

        # Initialze the first step
        self._current_step = 1
        self._step_minted_price_dict[1]["price"] = start_price

    def _get_step(self, curr_time):
        """Get the current step based on current time and elapsed time."""
        if curr_time > self.start_time + self.duration:
            elapsed_time = self.duration
        else:
            elapsed_time = curr_time - self.start_time

        return math.ceil(elapsed_time / self.step_duration) or 1

    def _get_auction_price(self, curr_step, prev_step):
        """Calculate the auction price at the current step from the current step and the previous one."""
        price = self._step_minted_price_dict[prev_step]["price"]
        passed_steps = curr_step - prev_step

        while passed_steps > 0:
            minted = self._step_minted_price_dict[prev_step]["minted"]

            # More than the expected rate, increase price
            if minted > self.expected_step_mint_rate:
                price += self.price_delta
            # Less than the expected rate, decrease price
            elif minted < self.expected_step_mint_rate:
                if self.floor_price > price - self.price_delta:
                    price = self.floor_price
                else:
                    price -= self.price_delta
            else:
                # Keep the same price
                pass

            prev_step += 1
            passed_steps -= 1

        return price

    def _get_curr_step_and_price(self, curr_time):
        """Get the current step and price of the auction."""
        step = self._get_step(curr_time)

        assert step >= self._current_step

        if step == self._current_step:
            return (
                self._current_step,
                self._step_minted_price_dict[self._current_step]["price"],
            )
        elif step > self._current_step:
            return (step, self._get_auction_price(step, self._current_step))

    def get_auction_data(self):
        """Get the step data from the auction."""
        return self._step_minted_price_dict

    def mint(self, curr_time, quantity):
        """Fake mint a quantity of tokens at the current time."""
        if curr_time > self.start_time + self.duration:
            # Auction is over
            return

        step, price = self._get_curr_step_and_price(curr_time)
        if step > self._current_step:
            self._step_minted_price_dict[step]["price"] = price
            self._current_step = step

        self._step_minted_price_dict[step]["minted"] += quantity
