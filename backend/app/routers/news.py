from fastapi import APIRouter, Query
from app.collectors.news import news_collector

router = APIRouter(
    prefix="/news",
    tags=["news"]
)

@router.get("/search")
async def search_news(
    q: str = Query(..., description="Query or Location name"),
    apiKey: str = Query(..., description="NewsAPI Key")
):
    """
    Search news for a specific location to analyze spiritual climate.
    """
    return news_collector.fetch_news(q, apiKey)
