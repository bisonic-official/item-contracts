"""This script is used to transfer an NFT from one address to another."""

from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract
from utils.minter import transfer


def main():
    """The main function to mint and NFT."""

    # Load config and setup logger
    config = load_config('config.ini')
    logger = setup_custom_logger()

    # Connect to web3
    w3, status = connect_to_web3(network=config['network']['network'],
                                 api_key=config['network']['api_key'])

    if status:
        connection_msg = 'Web3 connection successful!'
        print(f'[INFO] {connection_msg}')
        logger.info(connection_msg)

        # Load the contract
        contract = load_contract(w3, config['contract']['address'],
                                 config['contract']['abi'])

        # Obtain a token ID from URL
        token_id = 31089949472538994791664778055  # TODO: Add token_id here!

        token_msg = f'Obtained Token ID: {token_id}'
        print(f'[INFO] {token_msg}')
        logger.info(token_msg)

        # Mint an NFT
        from_address = '0x0d72fD549214Eb53cC241f400B147364e926E15B'
        to_address = '0x030b1cddf635e9e71ad70b8668e235e8ec3c67c4'
        txn_receipt = transfer(w3, contract, from_address, to_address,
                               config['account']['private_key'], token_id)

        txn_msg = f'Transaction receipt: {txn_receipt}'
        print(f'[INFO] {txn_msg}')
        logger.info(txn_msg)


if __name__ == '__main__':
    main()
