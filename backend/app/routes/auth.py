"""Auth scaffolding (JWT). v1 ships demo users; v1.1 will use real user store."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ..schemas import Token
from ..services.security import (
    authenticate, create_access_token, get_current_user,
)

router = APIRouter(prefix="/auth")


@router.post("/login", response_model=Token,
             summary="OAuth2 password flow — returns JWT")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = authenticate(form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials")
    token = create_access_token(user["username"], user["role"])
    return {"access_token": token}


@router.get("/me", summary="Return current user from JWT")
def me(user: dict = Depends(get_current_user)):
    return user
