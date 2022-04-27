# Simulation of GDA

This folder contains a Python simulation of the pricing model for GDA. We applied our pricing model to historical mint data to see the impact the model has on the price curve. We used Dune analytics to pull the historical data and provide links to the original queries below.


The NFT project mints we use are the following:


Project Name | Dune Analytics | Mint Date
--- | --- | ---
azuki | https://dune.com/queries/632316 | 2022-01-12
moonbirds | https://dune.com/queries/632447 | 2022-04-15


## How to run the simulation

This requires Python 3 and Poetry for dependency management.


### Install Poetry

You can find instructions to install Poetry here:
https://python-poetry.org/docs/#installation


### Use Poetry to install dependencies

```bash
poetry install
```


### Run simulation

```bash
poetry run python main.py <project-name>
```
