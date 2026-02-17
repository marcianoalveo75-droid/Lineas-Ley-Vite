from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.analysis.processor import analysis_processor
from app.collectors.spiritual_collector import SpiritualCollector
from app.analysis.archetypes import ArchetypalAnalyzer
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/analysis",
    tags=["analysis"]
)

class AnalysisRequest(BaseModel):
    lat: float
    lon: float
    location_name: str
    country_code: str = "pa"
    country_codes: list[str] = ["pa"]
    news_api_key: str = ""
    mediastack_api_key: str = ""
    keyword: str = ""
    extra_keywords: str = ""
    date_from: str = ""
    date_to: str = ""

# Singleton instances for now
collector = SpiritualCollector()
archetype_analyzer = ArchetypalAnalyzer()

@router.post("/analyze")
async def analyze_area(
    request: AnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Perform a complete spiritual analysis of the area.
    """
    return await analysis_processor.analyze_location(
        request.lat, 
        request.lon, 
        request.location_name, 
        request.country_code,
        request.news_api_key, 
        db,
        mediastack_api_key=request.mediastack_api_key,
        keyword=request.keyword,
        extra_keywords=request.extra_keywords,
        date_from=request.date_from,
        date_to=request.date_to,
        country_codes=request.country_codes
    )

@router.get("/collective-field")
async def get_collective_field():
    """
    Analyzes the global/collective spiritual field based on news and forums.
    """
    try:
        # 1. Collect Data
        raw_items = await collector.collect_daily_pulse()
        
        # 2. Extract Texts
        texts = [item.get("title", "") + " " + item.get("summary", "") for item in raw_items]
        texts = [t for t in texts if t.strip()]
        
        # 3. Analyze
        analysis = archetype_analyzer.analyze_collective_field(texts)
        
        return {
            "status": "success",
            "data": analysis,
            "sources_count": len(raw_items)
        }
    except Exception as e:
        logger.error(f"Error in collective analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
