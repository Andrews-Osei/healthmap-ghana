"""Lightweight JWT scaffolding using bcrypt directly (passlib-free).

passlib 1.7.4 is unmaintained and breaks against bcrypt >= 4.1; we use
the bcrypt library directly. The public API stays the same:
authenticate / create_access_token / get_current_user.
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from ..config import settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _hash(password: str) -> bytes:
    pw = password.encode("utf-8")[:72]   # bcrypt limit
    return bcrypt.hashpw(pw, bcrypt.gensalt(rounds=12))


def _verify(password: str, hashed: bytes) -> bool:
    pw = password.encode("utf-8")[:72]
    try:
        return bcrypt.checkpw(pw, hashed)
    except (ValueError, TypeError):
        return False


# DEMO ONLY -- replace with a real user store in v1.1
_DEMO_USERS = {
    "demo":  {"username": "demo",  "hashed": _hash("demo"),  "role": "analyst"},
    "admin": {"username": "admin", "hashed": _hash("admin"), "role": "admin"},
}


def authenticate(username: str, password: str) -> dict | None:
    user = _DEMO_USERS.get(username)
    if not user or not _verify(password, user["hashed"]):
        return None
    return user


def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.secret_key,
                      algorithm=settings.algorithm)


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    creds_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key,
                             algorithms=[settings.algorithm])
        sub = payload.get("sub")
        if sub is None:
            raise creds_exc
        return {"username": sub, "role": payload.get("role", "viewer")}
    except JWTError:
        raise creds_exc
