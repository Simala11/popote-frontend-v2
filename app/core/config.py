from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "Popote Listings API"
    ENVIRONMENT: str = "development"
    APP_ENV: str = "development"
    VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # Security / JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Admin — accepts both naming conventions
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@popotelistings.co.ke"
    ADMIN_PASSWORD: str = "Popote@2025!"

    # CORS — accepts both naming conventions
    CORS_ORIGINS: str = "http://localhost:3000"
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # WhatsApp
    WA_NUMBER: str = "254739101811"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def is_dev(self) -> bool:
        return self.ENVIRONMENT == "development" or self.APP_ENV == "development"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()