import csv

import pandas as pd

SIM_DATA_PATH = "./sim_data"

PROJ_CONFIG = {
    "azuki": {
        "csv_data_file": "azuki-6360cf85-97e9-4cb5-80e6-4240f2a2d59d.csv",
        "auction_config": {
            "collection_size": 9800,
            "start_time": 1642010410,  # timestamp
            "start_block": 13992202,  # block number
            "duration": 600,  # blocks
            "step_duration": 1,  # blocks
            "start_price": 1 * 10**18,
            "floor_price": 0.15 * 10**18,
            "price_delta": 0.05 * 10**18,
            "esmr": 200,
        },
    },
    "moonbirds": {
        "csv_data_file": "moonbirds-8f01836d-d6e5-44d0-94e3-3e9ef70855d8.csv",
        "auction_config": {
            "collection_size": 7875,
            "start_time": 1650121200,  # timestamp
            "start_block": 14597286,  # block number
            "duration": 200,  # blocks
            "step_duration": 3,  # blocks
            "start_price": 2.5 * 10**18,
            "floor_price": 0.1 * 10**18,
            "price_delta": 0.1 * 10**18,
            "esmr": 40,
        },
    },
}


def load_csv_data(filename):
    filepath = f"{SIM_DATA_PATH}/{filename}"

    with open(filepath) as f:
        data = [{k: v for k, v in row.items()} for row in csv.DictReader(f)]
    return data


def get_project_data(proj_name):
    config = PROJ_CONFIG.get(proj_name) or None
    if not config:
        print("Invalid project name.")
        exit(0)

    data = load_csv_data(config["csv_data_file"])
    dataframe = pd.DataFrame(data)
    dataframe = dataframe[
        dataframe["block_number"] >= str(config["auction_config"]["start_block"])
    ]

    return config["auction_config"], dataframe
