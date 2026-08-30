from datetime import datetime, timedelta, timezone
from typing import Any, Union

from jose import jwt

from app.core.config import settings
from app.domain.schemas.auth import TokenPayload


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None, role: str = None
) -> str:
    """
    Generate a JWT token for user authentication.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    if role:
        to_encode["role"] = role

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> TokenPayload:
    """
    Decode and cryptographically validate a JWT access token.
    Raises JWTError when the token is invalid or expired.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    return TokenPayload(**payload)
