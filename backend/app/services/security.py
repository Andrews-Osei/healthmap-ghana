"""Auth + user store (JWT, bcrypt) with admin-managed access.

Users are persisted to data/users.json. The FIRST admin is seeded from the
environment (ADMIN_USERNAME / ADMIN_PASSWORD, default admin/admin) the first
time the file is created. After that, ONLY an admin can create or change
accounts — there is no self-signup.

Roles: "admin" (full access + user management) and "analyst" (decision-maker
dashboard, no user management).
"""
from __future__ import annotations
import json, os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from ..config import settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

ALLOWED_ROLES = {"admin", "analyst"}
USERS_PATH = Path(settings.data_dir) / "users.json"


# --------------------------------------------------------------------------- #
# Password hashing
# --------------------------------------------------------------------------- #
def _hash(password: str) -> str:
    pw = password.encode("utf-8")[:72]               # bcrypt 72-byte limit
    return bcrypt.hashpw(pw, bcrypt.gensalt(rounds=12)).decode("ascii")


def _verify(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72],
                              hashed.encode("ascii"))
    except (ValueError, TypeError):
        return False


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# --------------------------------------------------------------------------- #
# Persistence
# --------------------------------------------------------------------------- #
def _seed_admin() -> dict:
    u = (os.environ.get("ADMIN_USERNAME", "") or "admin").strip()
    p = (os.environ.get("ADMIN_PASSWORD", "") or "admin").strip()
    return {"username": u, "hashed": _hash(p), "role": "admin",
            "active": True, "created_at": _now(), "created_by": "system"}


def _save(users: list) -> None:
    try:
        USERS_PATH.parent.mkdir(parents=True, exist_ok=True)
        USERS_PATH.write_text(json.dumps(users, indent=2))
    except Exception as e:
        print(f"[security] could not persist users: {e}")


def _load() -> list:
    if USERS_PATH.exists():
        try:
            data = json.loads(USERS_PATH.read_text())
            if isinstance(data, list) and data:
                return data
        except Exception as e:
            print(f"[security] users.json unreadable ({e}); reseeding")
    users = [_seed_admin()]
    _save(users)
    return users


_users: Optional[list] = None


def _all() -> list:
    global _users
    if _users is None:
        _users = _load()
    return _users


def _find(username: str) -> Optional[dict]:
    for u in _all():
        if u["username"].lower() == (username or "").lower():
            return u
    return None


def _active_admins() -> list:
    return [u for u in _all()
            if u.get("role") == "admin" and u.get("active", True)]


def _public(u: dict) -> dict:
    return {"username": u["username"], "role": u["role"],
            "active": u.get("active", True),
            "created_at": u.get("created_at"),
            "created_by": u.get("created_by")}


# --------------------------------------------------------------------------- #
# Auth
# --------------------------------------------------------------------------- #
def authenticate(username: str, password: str) -> Optional[dict]:
    u = _find(username)
    if not u or not u.get("active", True) or not _verify(password, u["hashed"]):
        return None
    return u


def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


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


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Administrator access required")
    return user


# --------------------------------------------------------------------------- #
# User management (admin only — enforced at the route layer)
# --------------------------------------------------------------------------- #
def list_users() -> list:
    return [_public(u) for u in _all()]


def create_user(username: str, password: str, role: str,
                created_by: str) -> dict:
    username = (username or "").strip()
    if not username or not password:
        raise ValueError("Username and password are required.")
    if role not in ALLOWED_ROLES:
        raise ValueError(f"Role must be one of: {', '.join(sorted(ALLOWED_ROLES))}.")
    if _find(username):
        raise ValueError("That username already exists.")
    u = {"username": username, "hashed": _hash(password), "role": role,
         "active": True, "created_at": _now(), "created_by": created_by}
    _all().append(u)
    _save(_all())
    return _public(u)


def update_user(username: str, *, role: Optional[str] = None,
                active: Optional[bool] = None, password: Optional[str] = None) -> dict:
    u = _find(username)
    if not u:
        raise ValueError("User not found.")
    # Protect the last active admin from demotion / deactivation
    if u.get("role") == "admin" and u.get("active", True):
        demoting = role is not None and role != "admin"
        deactivating = active is False
        if (demoting or deactivating) and len(_active_admins()) <= 1:
            raise ValueError("Cannot remove the last active administrator.")
    if role is not None:
        if role not in ALLOWED_ROLES:
            raise ValueError(f"Role must be one of: {', '.join(sorted(ALLOWED_ROLES))}.")
        u["role"] = role
    if active is not None:
        u["active"] = bool(active)
    if password:
        u["hashed"] = _hash(password)
    _save(_all())
    return _public(u)


def delete_user(username: str, actor: Optional[str] = None) -> bool:
    u = _find(username)
    if not u:
        raise ValueError("User not found.")
    if actor and actor.lower() == username.lower():
        raise ValueError("You cannot delete your own account.")
    if u.get("role") == "admin" and u.get("active", True) and len(_active_admins()) <= 1:
        raise ValueError("Cannot delete the last active administrator.")
    lst = _all()
    lst.remove(u)
    _save(lst)
    return True
