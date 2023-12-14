"""Script to verify owners of tokens."""

import logging
import json

from tqdm import tqdm

from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract


def owner_mint(w3, contract, private_key, owner_address, tokens, owners):
    """Mint tokens to owners.

    Parameters
    ----------
    w3 : web3
        Web3 connection.
    contract : contract
        Contract instance.
    private_key : str
        Private key of the account.
    owner_address : str
        Address of the owner.
    tokens : list
        List of tokens.
    owners : list
        List of owners.

    Returns
    -------
    txn_receipt : str
        Transaction receipt.
    """

    logger = logging.getLogger('minter')

    txn = contract.functions.ownerMint(tokens, owners).build_transaction({
        'nonce':
        w3.eth.get_transaction_count(owner_address),
        'gas':
        700000000,
        # 'maxFeePerGas': 100000000,
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


def parse_tokens(tokens):
    """Convert hex tokens to int."""

    tokens_int, owners = [], []
    for token, owner in tokens.items():
        tokens_int.append(int(token, 16))
        owners.append(owner)

    return tokens_int, owners


def verify_owners(tokens):
    """Verify owners of tokens."""

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
    else:
        assert False, 'Web3 connection failed!'

    # Load the contract
    contract = load_contract(w3, config['contract']['address'],
                             config['contract']['abi'])

    owners_verified = []
    for token, owner in tqdm(tokens.items()):
        token_number = int(token, 16)
        exists = contract.functions.exists(token_number).call()

        if not exists:
            break

        owner_of = contract.functions.ownerOf(token_number).call()
        owners_verified.append(owner_of == owner)

    return owners_verified


def transfer_tokens(tokens, owners):
    """Verify owners of tokens."""

    # Load config and setup logger
    config = load_config('config_transfer.ini')
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
    else:
        assert False, 'Web3 connection failed!'

    # Load the contract
    contract = load_contract(w3, config['contract']['address'],
                             config['contract']['abi'])

    txn = owner_mint(w3, contract, private_key, address, tokens, owners)
    print(f'Transaction receipt: { txn }')


def test_owner_mint(token, owner, config_file='config.ini'):
    """Verify owners of tokens."""

    # Load config and setup logger
    config = load_config(config_file)
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
    else:
        assert False, 'Web3 connection failed!'

    # Load the contract
    contract = load_contract(w3, config['contract']['address'],
                             config['contract']['abi'])

    txn = owner_mint(w3, contract, private_key, address, [token], [owner])
    print(f'Transaction receipt: { txn }')


if __name__ == '__main__':
    # Open JSON file
    with open('../event-listener/tokens.json', encoding='utf-8') as f:
        tokens_list = json.load(f)

    # Verify ownership and existence
    # owners_verification = verify_owners(tokens_list)
    # print('Total tokens verified:', len(owners_verification))
    # print('All owners correspond:', all(owners_verification))

    # Parse tokens
    token_ids, new_owners = parse_tokens(tokens_list)
    # for token, owner in zip(token_ids, new_owners):
    #     print(f'Token: { token } | Owner: { owner }')

    # Transfer tokens
    transfer_tokens(token_ids, new_owners)
