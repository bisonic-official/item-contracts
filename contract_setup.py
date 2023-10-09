"""Setup the contract."""

import logging

from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract


def set_token_uri(w3, contract, private_key, owner_address, token_uri):
    """Set the vault address.
    
    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    owner_address : str
        The owner address.
    token_uri : str
        The token URI.
    
    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('minter')

    txn = contract.functions.setBaseURI(token_uri).build_transaction({
        'nonce':
        w3.eth.get_transaction_count(owner_address),
        'gas':
        1000000
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt


def main():
    """The main function to mint and NFT."""

    # Load config and setup logger
    config = load_config('config.ini')
    logger = setup_custom_logger()

    # Connect to web3
    w3, status = connect_to_web3(network=config['network']['network'],
                                 api_key=config['network']['api_key'])
    private_key = config['account']['private_key']
    address = config['account']['address']

    if status:
        connection_msg = 'Web3 connection successful!'
        print(f'[INFO] {connection_msg}')
        logger.info(connection_msg)

        # Load the contract
        contract = load_contract(w3, config['contract']['address'],
                                 config['contract']['abi'])

        # Get the base URI before setup
        base_uri = contract.functions.getBaseURI().call()
        print(f'[INFO] Base URI: {base_uri}')

        # Set the base URI
        token_uri = 'http://URI/GetItemInfo?ItemId='
        txn_receipt = set_token_uri(w3, contract, private_key, address,
                                    token_uri)
        print(f'[INFO] Transaction receipt: {txn_receipt}')

        # Get the base URI after setup
        base_uri = contract.functions.getBaseURI().call()
        print(f'[INFO] Base URI: {base_uri}')


if __name__ == '__main__':
    main()
