from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.routes import auth, goals, manager, admin, reports
from app.seed.seed_data import seed_db

# Initialize database and seed data
Base.metadata.create_all(bind=engine)
try:
    seed_db()
except Exception as e:
    print(f"Seed error at startup: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="In-House Goal Setting & Tracking Portal - Hackathon MVP",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon/demo simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(manager.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": "1.0.0"
    }
