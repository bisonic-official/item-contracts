import sys

from fastapi import FastAPI

from utils.signer import sign_message
from api.schemas import TokenData
from api.connect import connect_to_network

# Connect to web3
w3, status, private_key = connect_to_network('config.ini')

if not status:
    sys.exit(1)

# Create app
app = FastAPI()


@app.get("/")
async def root():
    """Root path of the API."""

    return {"message": "This API is up and running!"}


# Post a message with parameters token_id and wallet_address
@app.post("/sign_message")
async def sign_message_route(token_data: TokenData):
    """Signs a message with the server's private key."""

    data = token_data.dict()
    token_id = int(data['token_id'], 16)
    wallet_address = data['address']

    message = f"{wallet_address}_{token_id}"

    # Sign the message
    message_hash, signature = sign_message(w3, private_key, message)

    response = {
        "message": message,
        "message_hash": message_hash,
        "signature": signature
    }

    return response
