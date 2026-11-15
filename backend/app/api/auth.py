from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.db import get_db
from ..core.security import (create_access_token, create_refresh_token,
                             decode_token, hash_password, verify_password)
from ..deps import current_user
from ..models import User
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])
COOKIE = "refresh_token"
# Dummy hash so login timing doesn't reveal whether an email exists.
_DUMMY = hash_password("dummy-password")


def _issue(resp: Response, user: User) -> TokenOut:
    resp.set_cookie(
        COOKIE, create_refresh_token(user.id), httponly=True,
        secure=settings.cookie_secure, samesite="none" if settings.cookie_secure else "lax",
        max_age=settings.refresh_token_days * 86400, path="/api/auth",
    )
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, resp: Response, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Email already registered")
    user = User(email=email, name=body.name.strip(), password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    return _issue(resp, user)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, resp: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    ok = verify_password(body.password, user.password_hash if user else _DUMMY)
    if not user or not ok or not user.is_active:
        raise HTTPException(401, "Invalid email or password")
    return _issue(resp, user)


@router.post("/refresh", response_model=TokenOut)
def refresh(resp: Response, db: Session = Depends(get_db),
            refresh_token: Optional[str] = Cookie(default=None)):
    uid = decode_token(refresh_token, "refresh") if refresh_token else None
    user = db.get(User, uid) if uid else None
    if not user or not user.is_active:
        raise HTTPException(401, "Invalid refresh token")
    return _issue(resp, user)


@router.post("/logout", status_code=204)
def logout(resp: Response):
    resp.delete_cookie(COOKIE, path="/api/auth")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user
