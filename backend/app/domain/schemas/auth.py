from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
import uuid

class LoginRequest(BaseModel):
    """
    Schema for the login endpoint.
    Only requires the official GIKI email address.
    """
    email: EmailStr = Field(..., description="Official GIKI email address of the user.")

class Token(BaseModel):
    """
    Schema for the JWT token response.
    Matches the response format defined in API_design.md section 4.2.
    """
    access_token: str
    token_type: str = "Bearer"
    role: str

class TokenPayload(BaseModel):
    """
    Schema for the decoded JWT token payload.
    Used internally for authentication validation.
    """
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
