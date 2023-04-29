# Item Contracts 📃

This repository contains some explorations of basic Item contracts depoyed to the [Nitro Goerli Rollup Testnet](https://developer.arbitrum.io/public-chains).

## Setup

1. Clone this repository
2. Install dependencies:
    - NPM Dependencies: `npm install`
    - Python dependencies: `pip install -r requirements.txt`

### Deploying the Item Contract to Goerli

1. Add your `GOERLI_PRIVATE_KEY` in `hardhat.config.js`.
2. Run `npx hardhat compile` to compile the contracts.
3. Run `npx hardhat run scripts/deploy.js --network goerli` to deploy the contract to Goerli.
4. Once the contract is deployed, copy the address of the contract and paste it in the ´[contract]´ section of the `config.ini` file.

### Running the Python Script

1. Add your `api_key` in the `config.ini` file. Fill missing fields with the information of your choice.
2. Run `python mint.py` to run the script and mint an Item.