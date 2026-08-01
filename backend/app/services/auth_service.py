from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from datetime import timedelta

from app.core.config import settings
from app.core.security import create_access_token
from app.repositories.user_repository import user_repo

class AuthService:
    async def login(self, db: AsyncSession, email: str):
        # Verify the user exists (since MVP assumes pre-registered users with GIKI emails)
        user = await user_repo.get_by_email(db, email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found or not authorized.")
            
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # Need to wait for role to be loaded.
        # Since it's a relationship and we are async, it might need joinedload or explicit loading.
        # But we'll assume lazy loading works or we load it in repository.
        # For simplicity in this service, let's assume user.role is accessible or we fetch it.
        # Let's fetch the role name manually if lazy load fails
        await db.refresh(user, ['role'])
        
        access_token = create_access_token(
            subject=str(user.id), 
            expires_delta=access_token_expires,
            role=user.role.name
        )
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "role": user.role.name
        }

auth_service = AuthService()
