from pydantic import BaseModel


class TokenData(BaseModel):
    """Token data model."""

    address: str
    token_id: str
