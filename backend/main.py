from contextlib import asynccontextmanager

print("Imported: contextlib")

from fastapi import FastAPI
print("Imported: FastAPI")

from fastapi.middleware.cors import CORSMiddleware
print("Imported: CORSMiddleware")

print("1")
from backend.database.base import Base

print("2")
from backend.database.session import engine

print("3")
from backend.tools.qdrant_tool import QdrantTool

# Import all models to register with Base metadata
print("4")
from backend.models.user import User

print("5")
from backend.models.investor import Investor

print("6")
from backend.models.meeting import Meeting

print("7")
from backend.models.memory import Memory

print("8")
from backend.models.recommendation import Recommendation

print("9")
from backend.models.followup import FollowUp

# Import API Routers
print("10")
from backend.api import auth

print("11")
from backend.api import dashboard

print("12")
from backend.api import frontend

print("13")
from backend.api import investors

print("14")
from backend.api import memory

print("15")
from backend.api import matchmaking

print("16")
from backend.api import orchestrator

print("17")
from backend.api import startup_profile

print("========== ALL IMPORTS COMPLETED ==========")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize PostgreSQL tables on Supabase if they do not exist
    try:
        Base.metadata.create_all(bind=engine)
        print("FastAPI Startup: PostgreSQL tables checked/created.")
    except Exception as e:
        print(f"Warning: PostgreSQL table creation failed during startup: {e}")
    yield

app = FastAPI(
    title="FounderOS AI Backend",
    description="The brain and data layer of the FounderOS AI Fundraising assistant.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(investors.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
app.include_router(matchmaking.router, prefix="/api")
app.include_router(orchestrator.router, prefix="/api")
app.include_router(frontend.router, prefix="/api")
app.include_router(startup_profile.router, prefix="/api")


@app.get("/")
def read_root():
    return {
        "app": "FounderOS AI Backend",
        "status": "healthy",
        "docs_url": "/docs"
    }
