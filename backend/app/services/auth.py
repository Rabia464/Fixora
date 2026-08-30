import uuid

from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.db.models.user import User
from app.db.repositories.user import user_repo


class AuthService:
    """
    Authentication service: validates JWTs and resolves the authenticated user.
    JWT mechanics live in core/security.py; this service owns auth business rules.
    """

    async def validate_token(self, db: AsyncSession, token: str) -> User:
        try:
            payload = decode_access_token(token)
        except JWTError:
            raise UnauthorizedException("Invalid or expired token.") from None

        if not payload.sub:
            raise UnauthorizedException("Invalid token payload.")

        try:
            user_id = uuid.UUID(payload.sub)
        except ValueError:
            raise UnauthorizedException("Invalid token payload.") from None

        user = await user_repo.get_with_role(db, user_id)
        if not user:
            raise UnauthorizedException("User not found.")

        if payload.role and payload.role != user.role.name:
            raise UnauthorizedException("Token role no longer valid.")

        return user


auth_service = AuthService()
