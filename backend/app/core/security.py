from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt

from app.core.config import settings

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
        
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt
