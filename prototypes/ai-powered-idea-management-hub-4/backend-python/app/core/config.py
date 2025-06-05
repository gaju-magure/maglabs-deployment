import json
import logging
from enum import Enum
from typing import List, Optional, Union

from pydantic import AnyHttpUrl, EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppEnvEnum(str, Enum):
    LOCAL = "local" # Added for local docker-compose convenience
    DEVELOPMENT = "development"
    TESTING = "testing" # Added for test environment
    STAGING = "staging"
    PRODUCTION = "production"


class GlobalConfig(BaseSettings):
    """
    Global application settings.
    These are automatically pulled from environment variables and .env files.
    """

    # Application Environment
    APP_ENV: AppEnvEnum = AppEnvEnum.DEVELOPMENT
    LOG_LEVEL: str = "INFO"
    PYTHONPATH: Optional[str] = "." # Ensure 'app' module can be found

    # Supabase Configuration
    SUPABASE_URL: AnyHttpUrl
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str # For verifying JWTs, found in Supabase project settings

    # LLM Configuration
    GEMINI_API_KEY: str  # Used for Gemini models via LiteLLM
    LLM_PROVIDER: str = "gemini"  # Default to Gemini, can be changed to other providers supported by LiteLLM
    LLM_MODEL: str = "gemini/gemini-pro"  # Default model in LiteLLM format

    # FastAPI Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    API_V1_STR: str = "/api/v1"

    # CORS Configuration
    # BACKEND_CORS_ORIGINS is a JSON string of a list of origins, e.g., '["http://localhost:3000", "https://example.com"]'
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            # If it's a string that looks like a JSON list, parse it
            if isinstance(v, str) and v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    raise ValueError("Invalid JSON string for BACKEND_CORS_ORIGINS")
            return v
        raise ValueError(v)

    # Project Information
    PROJECT_NAME: str = "AI-Powered Idea Management Hub - Backend"
    PROJECT_VERSION: str = "0.1.0"

    # Optional: Sentry for error tracking
    SENTRY_DSN: Optional[AnyHttpUrl] = None

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, extra="ignore"
    )


# Initialize settings
settings = GlobalConfig()

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL.upper())
logger = logging.getLogger(__name__)

# Log a subset of settings on startup for verification (be careful with sensitive data)
logger.info(f"Application Environment: {settings.APP_ENV}")
logger.info(f"Supabase URL: {settings.SUPABASE_URL}")
if settings.SENTRY_DSN:
    logger.info("Sentry DSN configured.")
else:
    logger.info("Sentry DSN not configured.")

# You can add more specific settings classes if needed, e.g., for different services
# class EmailSettings(BaseSettings):
#     SMTP_HOST: str
#     SMTP_PORT: int
#     SMTP_USER: EmailStr
#     SMTP_PASSWORD: str
#     EMAILS_FROM_EMAIL: EmailStr
#
#     model_config = SettingsConfigDict(env_prefix="EMAIL_")
#
# email_settings = EmailSettings()
