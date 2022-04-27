# Simulation of GDA

This folder contains a python port of the pricing model for GDA. We use it to simulate this pricing model on historical mint data.
The two data sets that are included are from the Azuki 1/12/2022 mint and the Moonbirds 4/16/2022 mint.

To run the simulation, you can do the following:

1. We use Poetry for Python depedency management so install Poetry if you haven't already.

https://python-poetry.org/docs/#installation

2. Use Poetry to install dependencies

    ```poetry install```

3. Run the script `main.py` with a project name:

    ```poetry run python main.py azuki```
