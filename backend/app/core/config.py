import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "SecureMarks"
    PROJECT_TAGLINE: str = "Academic Integrity Through Cryptographic Verification"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5433"))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "securemarks_db")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "securemarks_secret_key_jwt_super_safe_2026_token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Device / Hardware IoT Key
    DEVICE_API_KEY: str = os.getenv("DEVICE_API_KEY", "esp32_securemarks_device_key_2026")

    # Controlled Demo Tampering Mode
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
