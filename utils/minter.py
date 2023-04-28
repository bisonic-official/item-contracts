import logging

import requests


def get_token_id(url):
    """Obtain a token ID from GET request in URL.
    
    Parameters
    ----------
    url : str
        The URL to GET request.
    """

    logger = logging.getLogger('minter')

    # Make a GET request to the URL
    r = requests.get(url, timeout=5)

    # Check if the request was successful
    if r.status_code != 200:
        logger.error('GET request failed!')
        return None

    # Get the token ID from the response
    token_id = r.json()['id']

    return token_id


def mint(w3, contract, account_address, private_key, token_id):
    """Mint an NFT.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    account_address : str
        The account address.
    private_key : str
        The private key.
    token_id : int
        The token ID.
    
    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('minter')

    txn = contract.functions.mint(account_address, token_id).buildTransaction({
        'nonce':
        w3.eth.get_transaction_count(account_address),
        'gas':
        1000000000
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN successful with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt
