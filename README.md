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

### Running the Python Scripts

#### Verifying + minting an Item

1. Add your `api_key` in the `config.ini` file. Fill missing fields with the information of your choice.
2. Run `python verify_and_mint.py` to run the script and mint an Item.

#### Transferring an Item

1. Add your `api_key` in the `config.ini` file. Fill missing fields with the information of your choice.
2. Edit the `transfer.py` script to add the owner address, new owner address and `token_id` of the NFT.
3. Run `python transfer.py` to run the script and transfer an Item.

#### Running the API service

1. Add your `api_key` in the `config.ini` file. Fill missing fields with the information of your choice.
2. Run `uvicorn app:app --reload` to run the script and start the API service.
3. You can consume the API with the base route ([http://127.0.0.1:8000/](http://127.0.0.1:8000/)) and open the docs in the following route: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Consume the API service to obtain messages + signatures

1. Add your `api_key` in the `config.ini` file. Fill missing fields with the information of your choice.
2. Edit the `consumer.py` script to add the owner address to be used in the signature.
3. Run `python consumer.py` to consume the `token_id` obtainer service and our API service. This will print the message and signature of the `token_id` in the console.