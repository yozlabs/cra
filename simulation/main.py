import argparse

import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import pandas as pd
import seaborn as sns

from data import get_project_data
from cra import CRA

parser = argparse.ArgumentParser()
parser.add_argument("proj_name", type=str, help="A supported project name")


def main(proj_name):
    config, dataframe = get_project_data(proj_name)

    auction = CRA(
        config["start_block"],
        config["duration"],
        config["step_duration"],
        config["start_price"],
        config["floor_price"],
        config["price_delta"],
        config["esmr"],
    )

    tape = dataframe.to_dict("records")
    for t in tape:
        quantity = int(t["num_minted_in_block"])
        curr_block = int(t["block_number"])
        auction.mint(curr_block, quantity)

    auction_data = auction.get_auction_data()
    total_minted = sum([v["minted"] for k, v in auction_data.items()])
    print(f"Total minted: {total_minted}")
    plot(auction_data)


def plot(auction_data):
    # Set step to string: Plotting can use categorical or numeric
    data_dict = [{"step": str(k)} | v for k, v in auction_data.items() if v["price"]]
    # Create the pandas DataFrame
    dataframe = pd.DataFrame(data_dict)

    sns.set_theme()
    ax1 = sns.lineplot(x="step", y="price", data=dataframe)
    ax1.grid(False)
    ax2 = ax1.twinx()
    ax2.grid(False)
    sns.barplot(x="step", y="minted", ax=ax2, data=dataframe, color="g", alpha=0.25)

    num_steps = len(data_dict)
    if num_steps > 20:
        ax1.xaxis.set_major_locator(ticker.AutoLocator())
    plt.show()


if __name__ == "__main__":
    args = parser.parse_args()
    main(args.proj_name)
