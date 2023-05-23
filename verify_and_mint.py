from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract
from utils.consumer import consume_api
from utils.consumer import get_token_id
from utils.minter import verify_and_mint


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
        token_id_str = get_token_id()['id']

        # Mint an NFT
        address = config['account']['address']
        data = consume_api(address, token_id_str)
        print(f' ▶️  Message:           {data["message"]}')
        print(f' ▶️  Hashed message:    {data["message_hash"]}')
        print(f' ▶️  Signature:         {data["signature"]}')

        # Message + signature data
        message = data['message']
        token_id = int(message.split('_')[1])
        print(f' ▶️  Token ID:          {token_id_str} / {token_id}')
        signature = w3.to_bytes(hexstr=data['signature'])

        txn_receipt = verify_and_mint(w3, contract,
                                      config['account']['private_key'],
                                      message, data["message_hash"], signature,
                                      address, token_id)
        txn_msg = f'Transaction receipt: {txn_receipt}'
        print(f'[INFO] {txn_msg}')
        logger.info(txn_msg)


if __name__ == '__main__':
    main()
