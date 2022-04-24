import csv

import pandas as pd

SIM_DATA_PATH = "./sim_data"

PROJ_CONFIG = {
    "azuki": {
        "csv_data_file": "azuki-6360cf85-97e9-4cb5-80e6-4240f2a2d59d.csv",
        # https://www.azuki.com/mintinfo
        "auction_config": {
            "collection_size": 9800,
            "start_time": 1642010410,  # timestamp
            "start_block": 13992202,  # block number
            "duration": 600,  # block
            "step_duration": 1,  # block
            "start_price": 1 * 10**18,
            "floor_price": 0.15 * 10**18,
            "price_delta": 0.05 * 10**18,
            "esmr": 200,
        },
    },
    # "kiwami": {
    #     "csv_data_file": "kiwami-ce98ff06-ccc9-46a6-b5f2-cd1ef4d1b7ec.csv",
    #     "auction_config": {
    #         "collection_size": 7000,
    #         "start_time": 1648080030,  # timestamp
    #         "start_block": 14445661,  # block number
    #         "duration": 10 * 60,  # blocks
    #         "step_duration": 3,  # blocks
    #         "start_price": 0.5 * 10**18,
    #         "floor_price": 0.1 * 10**18,
    #         "price_delta": 0.05 * 10**18,
    #         "esmr": 10,
    #     },
    # },
    "moonbirds": {
        "csv_data_file": "moonbirds-8f01836d-d6e5-44d0-94e3-3e9ef70855d8.csv",
        # https://twitter.com/Abraham_L_L/status/1510694478826246145
        "auction_config": {
            "collection_size": 7875,
            "start_time": 1650121200,  # timestamp
            "start_block": 14597004,  # block number
            # "duration": 6 * 60 * 60,  # 6 hrs
            # "step_duration": 5 * 60,  # 5 mins
            "duration": 600,  # 6 hrs
            "step_duration": 3,  # 5 mins
            "start_price": 2.5 * 10**18,
            "floor_price": 0.1 * 10**18,
            "price_delta": 0.1 * 10**18,
            "esmr": 40,
        },
    },
    # "taos": {
    #     "csv_data_file": "taos-1ec4d254-31bd-43a5-a814-7bd97b4add81.csv",
    #     "auction_config": {
    #         "collection_size": 6000,
    #         "start_time": 1648122940,  # timestamp
    #         "start_block": 14448808,  # block number
    #         # "duration": 96 * 60 * 60,  # 96 hrs
    #         # "step_duration": 30 * 60,  # 30 mins
    #         "duration": 100000,  # blocks
    #         "step_duration": 1,  # blocks
    #         "start_price": 1 * 10**18,
    #         "floor_price": 0.05 * 10**18,
    #         "price_delta": 0.01 * 10**18,
    #         "esmr": 2,
    #     },
    # },
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
