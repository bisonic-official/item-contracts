"""This module contains functions to consume API service locally."""

import requests


def consume_api(address, token_id):
    """The main function to consume API service.

    Parameters
    ----------
    address : str
        The wallet address.
    token_id : str
        The token ID to be signed.
    """

    url = 'http://127.0.0.1:8000/sign_message'

    data_json = {"address": address, "token_id": token_id}

    response = requests.post(url,
                             json=data_json,
                             timeout=5,
                             headers={'auth-token': 'XXXXXX'})

    if response.status_code == 200:
        return response.json()

    return None
