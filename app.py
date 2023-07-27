import sys

from fastapi import FastAPI
from fastapi import Header
from fastapi import HTTPException
from starlette import status

from utils.signer import sign_message
from api.schemas import TokenData
from api.schemas import UnauthorizedMessage
from api.connect import connect_to_network

# Connect to web3
w3, connection, private_key = connect_to_network('config.ini')

if not connection:
    sys.exit(1)

# Create app
app = FastAPI()

# Set access tokens
known_tokens = set([''])


@app.get("/")
async def root() -> dict:
    """Root path of the API."""

    return {"message": "This API is up and running!"}


# Post a message with parameters token_id and wallet_address
@app.post(
    "/sign_message",
    response_model=dict,
    responses={status.HTTP_401_UNAUTHORIZED: {
        'model': UnauthorizedMessage
    }},
)
async def sign_message_route(
    token_data: TokenData, auth_token: str = Header()) -> str:
    """Protected path of the API."""

    if auth_token not in known_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=UnauthorizedMessage().detail,
        )

    data = token_data.dict()

    try:
        token_id = int(data['token_id'], 16)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token_id!",
        ) from exc

    wallet_address = data['address']

    if len(wallet_address) != 42:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Address is probably wrong!",
        )

    message = f"{wallet_address}_{token_id}"

    # Sign the message
    message_hash, signature = sign_message(w3, private_key, message)

    response = {
        "message": message,
        "message_hash": message_hash,
        "signature": signature
    }

    return response
