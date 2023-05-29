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


def verify_and_mint(w3, contract, private_key, message, signature, to_address,
                    token_id):
    """Mint an NFT.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    message : str
        The message.
    signature : str
        The signature.
    to_address : str
        The new owner address.
    token_id : int
        The token ID.
    
    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('minter')

    txn = contract.functions.verifyAndMint(
        message, signature, to_address, token_id).build_transaction({
            'nonce':
            w3.eth.get_transaction_count(to_address),
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


def transfer(w3, contract, from_address, to_address, private_key, token_id):
    """Mint an NFT.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    from_address : str
        The from address.
    to_address : str
        The to address.
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

    from_address = w3.to_checksum_address(from_address.lower())
    to_address = w3.to_checksum_address(to_address.lower())

    txn = contract.functions.safeTransferFrom(
        from_address, to_address, token_id).build_transaction({
            'nonce':
            w3.eth.get_transaction_count(from_address),
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
