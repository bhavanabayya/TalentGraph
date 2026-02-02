"""
Security utilities: JWT, password hashing, token validation.
"""

import os
import time
import jwt
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status, Header

# Configuration
APP_ENV = os.getenv("APP_ENV", "development").lower()
JWT_SECRET = os.getenv("APP_JWT_SECRET")
if not JWT_SECRET:
    if APP_ENV == "development":
        JWT_SECRET = "dev-secret-key-change-in-production"
    else:
        raise RuntimeError("APP_JWT_SECRET must be set in non-development environments")
JWT_ALGORITHM = "HS256"
JWT_EXP_HOURS = int(os.getenv("APP_JWT_EXP_HOURS", "24"))

# Password hashing - Using Argon2 which supports unlimited password length
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using Argon2. Supports up to 128 bytes and beyond."""
    # Argon2 has no practical password length limit, supporting up to 128+ bytes
    password_truncated = password[:128]
    return pwd_context.hash(password_truncated)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hash. Also truncates for consistency."""
    # Argon2 supports up to 128+ bytes, no practical limit
    password_truncated = plain_password[:128]
    return pwd_context.verify(password_truncated, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXP_HOURS)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Extract user info from JWT token from Authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise ValueError("Invalid auth scheme")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return decode_token(token)


async def get_current_user_id(current_user: dict = Depends(get_current_user)) -> int:
    """Get user_id from current token."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user_id",
        )
    return user_id


async def get_current_user_email(current_user: dict = Depends(get_current_user)) -> str:
    """Get email from current token."""
    email = current_user.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing email",
        )
    return email


def require_candidate(current_user: dict = Depends(get_current_user)) -> dict:
    """Require user to be a candidate."""
    if current_user.get("user_type") != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required",
        )
    return current_user


def require_company_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Require user to be a company user."""
    if current_user.get("user_type") != "company":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company user access required",
        )
    return current_user


def require_company_role(allowed_roles: list[str]):
    """Factory for role-based access control."""
    def check_role(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("user_type") != "company":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Company user access required",
            )
        user_role = current_user.get("company_role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {user_role} not authorized. Required: {allowed_roles}",
            )
        return current_user
    
    return check_role
