from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncAttrs

# SQLite URL for aiosqlite
DATABASE_URL = "sqlite+aiosqlite:///./spiritual.db"

class Base(AsyncAttrs, DeclarativeBase):
    pass

engine = create_async_engine(
    DATABASE_URL,
    echo=True, # Log SQL for debugging
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
