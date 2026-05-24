"""Auth + admin-managed user accounts (JWT).

Login is open (anyone with valid credentials). Account management is
admin-only — there is no self-signup; an administrator creates every account.
"""
from __future__ import annotations
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

from ..schemas import Token
from ..services.security import (
    authenticate, create_access_token, get_current_user, require_admin,
    list_users, create_user, update_user, delete_user,
)

router = APIRouter(prefix="/auth")


# ---- auth ---------------------------------------------------------------- #
@router.post("/login", response_model=Token,
             summary="OAuth2 password flow — returns JWT")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = authenticate(form.username, form.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid credentials or account disabled")
    token = create_access_token(user["username"], user["role"])
    return {"access_token": token}


@router.get("/me", summary="Return current user from JWT")
def me(user: dict = Depends(get_current_user)):
    return user


# ---- admin: user management --------------------------------------------- #
class NewUser(BaseModel):
    username: str
    password: str = Field(min_length=4)
    role: str = "analyst"


class EditUser(BaseModel):
    role:     Optional[str]  = None
    active:   Optional[bool] = None
    password: Optional[str]  = Field(default=None, min_length=4)


@router.get("/users", summary="List all accounts (admin only)")
def get_users(_: dict = Depends(require_admin)) -> List[dict]:
    return list_users()


@router.post("/users", summary="Create an account (admin only)")
def post_user(body: NewUser, admin: dict = Depends(require_admin)):
    try:
        return create_user(body.username, body.password, body.role,
                           created_by=admin["username"])
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/users/{username}", summary="Update an account (admin only)")
def patch_user(username: str, body: EditUser, _: dict = Depends(require_admin)):
    try:
        return update_user(username, role=body.role, active=body.active,
                           password=body.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/users/{username}", summary="Delete an account (admin only)")
def remove_user(username: str, admin: dict = Depends(require_admin)):
    try:
        delete_user(username, actor=admin["username"])
        return {"deleted": username}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
