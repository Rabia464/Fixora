from fastapi import HTTPException, status

class BusinessLogicException(HTTPException):
    """
    Base exception for business logic errors. 
    Prevents leaking internal logic into HTTP routers.
    """
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)

class NotFoundException(BusinessLogicException):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with ID {resource_id} not found."
        )

class UnauthorizedException(BusinessLogicException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )
        self.headers = {"WWW-Authenticate": "Bearer"}

class ForbiddenException(BusinessLogicException):
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )
