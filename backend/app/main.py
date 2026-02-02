from pathlib import Path
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
logger.info("Environment variables loaded")

from .database import init_db
from .routers import candidates, job_roles, auth, company, jobs, swipes, preferences, matches

logger.info("Routers imported successfully")

app = FastAPI(
    title="TalentGraph",
    description="Two-sided enterprise talent marketplace",
    version="2.0"
)

# Enable CORS for React frontend
raw_origins = os.getenv("CORS_ORIGINS")
if raw_origins:
    cors_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
else:
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
    max_age=600,
)


@app.on_event("startup")
def on_startup():
    logger.info("=== APPLICATION STARTUP ===")
    init_db()
    logger.info("Database initialized successfully")


@app.get("/")
def read_root():
    logger.info("GET / - Root endpoint accessed")
    return {
        "status": "ok",
        "message": "TalentGraph v2.0 - Two-sided marketplace",
        "docs": "/docs"
    }


# Include all routers
app.include_router(auth.router)
app.include_router(candidates.router)
app.include_router(preferences.router)
app.include_router(company.router)
app.include_router(jobs.router)
app.include_router(swipes.router)
app.include_router(matches.router)
app.include_router(job_roles.router)
