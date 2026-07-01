import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Find the absolute path to the root directory where .env is located
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(current_dir))
dotenv_path = os.path.join(root_dir, ".env")

load_dotenv(dotenv_path)

class Settings(BaseSettings):
    DATABASE_URL: str
    QDRANT_URL: str
    QDRANT_API_KEY: str
    QDRANT_COLLECTION_PREFIX: str = "founderos"
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = dotenv_path
        extra = "ignore"

settings = Settings()
