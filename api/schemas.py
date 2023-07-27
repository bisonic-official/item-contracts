from pydantic import BaseModel


class TokenData(BaseModel):
    """Token data model."""

    address: str
    token_id: str


class UnauthorizedMessage(BaseModel):
    """Unauthorized message model."""

    detail: str = "Auth token missing or unknown!"
