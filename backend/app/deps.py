import secrets

from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .core.db import get_db
from .core.security import hash_password
from .models import User

OWNER_EMAIL = "owner@arshab.app"


def current_user(db: Session = Depends(get_db)) -> User:
    """Single-user mode: every request belongs to the one owner account."""
    user = db.scalar(select(User).where(User.email == OWNER_EMAIL))
    if user:
        return user
    try:
        user = User(email=OWNER_EMAIL, name="Learner", role="admin",
                    password_hash=hash_password(secrets.token_urlsafe(32)))
        db.add(user)
        db.commit()
    except IntegrityError:  # two first requests at once: the other one created it
        db.rollback()
        user = db.scalar(select(User).where(User.email == OWNER_EMAIL))
    return user


def require_admin(user: User = Depends(current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    return user
