from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import init_db, AsyncSessionLocal
from app.routers import entities, environment, news, analysis
from app.scrapers.entity_scraper import seed_entities
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB
    await init_db()
    
    # Run Seeder
    async with AsyncSessionLocal() as session:
        await seed_entities(session)
        
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Ley Lines Spiritual Backend",
    description="API for analyzed spiritual data, entities, and geological correlations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(entities.router)
app.include_router(environment.router)
app.include_router(news.router)
app.include_router(analysis.router)

@app.get("/")
async def root():
    return {"message": "Spiritual Backend is Online", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
