from eth_account.messages import encode_defunct

from utils.config import load_config
from utils.contract import connect_to_web3


def main():
    """The main function to mint and NFT."""

    # Load config and setup logger
    config = load_config('config.ini')

    # Connect to web3
    w3, status = connect_to_web3(network='goerli-arbitrum',
                                 api_key=config['network']['api_key'])

    if status:
        connection_msg = 'Web3 connection successful!'
        print(f'[INFO] {connection_msg}')

        # Message test
        msg = "0x0000000000000000000000000000000000000000_1234567890"
        private_key = w3.to_bytes(hexstr=config['account']['private_key'])

        # Sign the message
        message = encode_defunct(text=msg)
        signed_message = w3.eth.account.sign_message(message,
                                                     private_key=private_key)

        print("Message hash:", signed_message.messageHash.hex())
        print("Signature:   ", signed_message.signature.hex())

        # Verify the message
        message = encode_defunct(text=msg)
        signer = w3.eth.account.recover_message(
            message, signature=signed_message.signature)
        print("Signer:      ", signer)


if __name__ == '__main__':
    main()
