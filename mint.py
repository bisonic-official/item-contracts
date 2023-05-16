from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract
from utils.minter import get_token_id
from utils.minter import mint


def main():
    """The main function to mint and NFT."""

    # Load config and setup logger
    config = load_config('config.ini')
    logger = setup_custom_logger()

    # Connect to web3
    w3, status = connect_to_web3(network='goerli-arbitrum',
                                 api_key=config['network']['api_key'])

    if status:
        connection_msg = 'Web3 connection successful!'
        print(f'[INFO] {connection_msg}')
        logger.info(connection_msg)

        # Load the contract
        contract = load_contract(w3, config['contract']['address'],
                                 config['contract']['abi'])

        # Obtain a token ID from URL
        token_id_str = get_token_id(config['service']['url'])
        # token_id_str = '6463a74b20b59d8ada655875'
        token_id = int(token_id_str, 16)

        token_msg = f'Obtained Token ID: {token_id_str} / {token_id}'
        print(f'[INFO] {token_msg}')
        logger.info(token_msg)

        # Mint an NFT
        txn_receipt = mint(w3, contract, config['account']['address'],
                           config['account']['private_key'], token_id)

        txn_msg = f'Transaction receipt: {txn_receipt}'
        print(f'[INFO] {txn_msg}')
        logger.info(txn_msg)


if __name__ == '__main__':
    main()
