import requests


def get_token_id():
    """Obtain a token ID from GET request in URL."""

    url = 'http://ec2-18-208-114-170.compute-1.amazonaws.com:9080/GetMintRandomItem'

    response = requests.get(url, timeout=5)

    if response.status_code == 200:
        return response.json()


def consume_api(address, token_id):
    """The main function to consume API service.
    
    Parameters
    ----------
    address : str
        The wallet address.
    token_id : str
        The token ID to be signed.
    """

    url = 'http://localhost:8000/sign_message'

    data_json = {"address": address, "token_id": token_id}

    response = requests.post(url, json=data_json, timeout=5)

    if response.status_code == 200:
        return response.json()


if __name__ == '__main__':
    ADDRESS = '0x0000000000000000000000000000000000000000'
    token_id = get_token_id()['id']
    print(f' ▶️  Token_id:       {token_id}')

    data = consume_api(ADDRESS, token_id)
    print(f' ▶️  Message:        {data["message"]}')
    print(f' ▶️  Hashed message: {data["message_hash"]}')
    print(f' ▶️  signature:      {data["signature"]}')
