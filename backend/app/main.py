from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .api import auth, learn
from .core.config import settings
from .core.db import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Dev convenience only. Production schema should be managed with Alembic migrations.
    if settings.app_env != "production":
        Base.metadata.create_all(engine)
    yield


app = FastAPI(title="ARSHAB API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_list, allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type"],
)
app.include_router(auth.router)
app.include_router(learn.router)


@app.get("/health")
def health():
    with engine.connect() as c:
        c.execute(text("SELECT 1"))
    return {"status": "ok"}
