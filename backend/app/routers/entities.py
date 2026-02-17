from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database.database import get_db
from app.database.models import Entity
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(
    prefix="/entities",
    tags=["entities"]
)

# Pydantic Schema for Response
# Pydantic Schema for Response
class EntitySchema(BaseModel):
    id: int
    name: str
    type: str
    influence: str
    description: str
    biblical_reference: Optional[str] = None
    countermeasures: Optional[str] = None
    source: Optional[str] = "Unknown"
    contributor: Optional[str] = "System"

    class Config:
        from_attributes = True

# Pydantic Schema for Creation
class EntityCreate(BaseModel):
    name: str
    type: str
    influence: str
    description: str
    biblical_reference: Optional[str] = None
    countermeasures: Optional[str] = None
    source: str
    contributor: str

@router.get("/", response_model=List[EntitySchema])
async def read_entities(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Entity).offset(skip).limit(limit))
    entities = result.scalars().all()
    return entities

@router.post("/", response_model=EntitySchema)
async def create_entity(entity: EntityCreate, db: AsyncSession = Depends(get_db)):
    # Check if exists
    result = await db.execute(select(Entity).filter(Entity.name == entity.name))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Entity already exists")
    
    db_entity = Entity(**entity.dict())
    db.add(db_entity)
    await db.commit()
    await db.refresh(db_entity)
    return db_entity

@router.get("/{entity_id}", response_model=EntitySchema)
async def read_entity(entity_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Entity).filter(Entity.id == entity_id))
    entity = result.scalars().first()
    if entity is None:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity

@router.post("/scrape")
async def trigger_scrape(db: AsyncSession = Depends(get_db)):
    from app.scrapers.entity_scraper import run_wiki_scraper
    count = await run_wiki_scraper(db)
    return {"message": "Scraping completed", "new_entities": count}
