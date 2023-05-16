from eth_account.messages import encode_defunct


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
    encoded_message = encode_defunct(text=message)
    signed_message = web3_obj.eth.account.sign_message(encoded_message,
                                                       private_key=private_key)

    message_hash = signed_message.messageHash.hex()
    signature = signed_message.signature.hex()

    return message_hash, signature
