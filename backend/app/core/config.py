from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    database_url: str = "sqlite:///./dev.db"
    jwt_secret: str = "dev-only-secret-change-me"
    access_token_minutes: int = 15
    refresh_token_days: int = 14
    cors_origins: str = "http://localhost:5173"
    cookie_secure: bool = False
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.1-flash-lite"

    @field_validator("database_url")
    @classmethod
    def _use_psycopg_driver(cls, v: str) -> str:
        # Render gives postgres:// or postgresql://; SQLAlchemy needs the psycopg driver name.
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix):]
        return v

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

if settings.app_env == "production" and settings.jwt_secret.startswith("dev-only"):
    raise RuntimeError("JWT_SECRET must be set in production")
