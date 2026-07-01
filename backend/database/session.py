from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.utils.config import settings

# Configure connection pooling and pre-ping to ensure active connection
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
