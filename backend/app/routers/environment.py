from fastapi import APIRouter, HTTPException, Query
from app.collectors.environment import environment_collector

router = APIRouter(
    prefix="/environment",
    tags=["environment"]
)

@router.get("/data")
async def get_environmental_data(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius: int = Query(100, description="Radius in km for earthquakes")
):
    """
    Get aggregated environmental data (Weather, Earthquakes) for a location.
    """
    weather = environment_collector.get_weather(lat, lon)
    earthquakes = environment_collector.get_earthquakes(lat, lon, radius)
    
    return {
        "location": {"lat": lat, "lon": lon},
        "weather": weather,
        "earthquakes": earthquakes
    }
