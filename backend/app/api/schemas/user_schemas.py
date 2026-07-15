from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    hostel: Optional[str] = None
    role_id: UUID

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    hostel: Optional[str] = None
    role_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    role: str

class LoginRequest(BaseModel):
    email: EmailStr
