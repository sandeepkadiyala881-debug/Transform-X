"""Application configuration via pydantic-settings.

All runtime configuration comes from environment variables (optionally a
backend/.env file). No credentials are ever hardcoded here.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly-typed application settings loaded from the environment."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "TRANSFORM-X API"
    app_version: str = "1.0.0"
    environment: str = "development"
    database_url: str
    test_database_url: str | None = None
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"

    # Phase 3A: document upload settings
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 25
    # Extensions accepted by the document upload endpoint.
    allowed_document_extensions: str = "pdf,docx,txt"

    @property
    def cors_origin_list(self) -> list[str]:
        """CORS origins as a list (comma-separated in the environment)."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def allowed_document_extension_list(self) -> list[str]:
        """Allowed upload extensions as a lowercase list (comma-separated env)."""
        return [ext.strip().lower().lstrip(".") for ext in self.allowed_document_extensions.split(",") if ext.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance shared across the application."""
    return Settings()
