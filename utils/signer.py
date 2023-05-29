from eth_account.messages import encode_defunct


def set_signer(web3_obj, private_key, contract, signer_address):
    """Sets the signer address.
    
    Parameters
    ----------
    web3_obj : Web3
        The web3 object.
    private_key : str
        The private key loaded from config.
    contract
        The contract object.
    signer_address : str
        The signer address.
    """

    # Set the signer address
    txn = contract.functions.setSigner(signer_address).build_transaction({
        'nonce':
        web3_obj.eth.get_transaction_count(signer_address),
        'gas':
        100000
    })

    # Sign the transaction
    txn_signed = web3_obj.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = web3_obj.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = web3_obj.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    return txn_receipt


def sign_message(web3_obj, private_key, message):
    """Signs a message with the server's private key.
    
    Parameters
    ----------
    web3_obj : Web3
        The web3 object.
    private_key : str
        The private key loaded from config.
    message : str
        The message to sign.
    
    Returns
    -------
    message_hash : str
        The message hash.
    signature : str
        The signature.
    """

    # Sign the message
    base_message = web3_obj.keccak(text=message)
    message = encode_defunct(base_message)
    signed_message = web3_obj.eth.account.sign_message(message,
                                                       private_key=private_key)

    message_hash = signed_message.messageHash.hex()
    signature = signed_message.signature.hex()

    return message_hash, signature
