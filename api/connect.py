from utils.config import load_config
from utils.contract import connect_to_web3


def connect_to_network(config_file):
    """Connect to web3.

    Parameters
    ----------
    config_file : str
        The config file.
    
    Returns
    -------
    w3 : Web3
        The web3 object.
    status : bool
        The status of the connection.
    private_key : str
        The private key.
    """
    # Load config
    config = load_config(config_file)
    network = config['network']['network']
    api_key = config['network']['api_key']

    # Connect to web3
    w3, status = connect_to_web3(network, api_key)

    # Load the private key
    private_key = w3.to_bytes(hexstr=config['account']['private_key'])

    return w3, status, private_key
