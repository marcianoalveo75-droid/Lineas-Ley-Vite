from app.collectors.environment import environment_collector
from app.collectors.news import news_collector
from sqlalchemy.future import select
from sqlalchemy import or_
from app.database.models import Entity
from app.analysis.archetypes import ArchetypalAnalyzer

class AnalysisProcessor:
    def __init__(self):
        self.archetype_analyzer = ArchetypalAnalyzer()
    
    async def analyze_location(self, lat: float, lon: float, location_name: str, country_code: str, news_api_key: str, db_session, 
                               keyword: str = "", extra_keywords: str = "", mediastack_api_key: str = "", 
                               date_from: str = "", date_to: str = "", country_codes: list[str] = None):
        """
        Conducts a full spiritual analysis of a location.
        1. Gathers environmental data (Weather, Quakes).
        2. Gathers social/news data.
        3. Calculates spiritual indices.
        4. Suggests relevant entities from the DB.
        """
        if not country_codes:
            country_codes = [country_code]
            
        # 1. Gather Data
        weather_data = environment_collector.get_weather(lat, lon)
        quake_data = environment_collector.get_earthquakes(lat, lon)
        moon_data = environment_collector.get_moon_phase()
        news_data = news_collector.fetch_news(
            location_name, news_api_key, country_code, 
            mediastack_api_key=mediastack_api_key,
            keyword=keyword, 
            extra_keywords=extra_keywords,
            date_from=date_from, 
            date_to=date_to,
            country_codes=country_codes
        )
        
        # 2. Calculate Indices
        chaos_score = 0
        despair_score = 0
        oppression_score = 0
        
        # Astral factor: Full moon increases tension (+10)
        if moon_data["name"] == "Llena":
            chaos_score += 10
            oppression_score += 5
        elif moon_data["name"] == "Nueva":
            # New moon might lower tension but add a bit of 'mystery' (oppression/shadow)
            chaos_score -= 5
            oppression_score += 5
        
        # Environmental factors
        if "events" in quake_data:
            chaos_score += len(quake_data["events"]) * 10
            
        current_weather = weather_data.get("current", {})
        weather_code = current_weather.get("weather_code", 0)
        # Stormy weather codes (approx)
        if weather_code > 50: 
            chaos_score += 5
            despair_score += 2
            
        # News factors
        if "articles" in news_data:
            for article in news_data["articles"]:
                sentiment = article.get("sentiment", "neutral")
                if sentiment == "negative":
                    despair_score += 5
                    oppression_score += 3
        
        # Normalize (0-100 cap)
        chaos_score = min(100, chaos_score)
        despair_score = min(100, despair_score)
        oppression_score = min(100, oppression_score)
        
        total_intensity = (chaos_score + despair_score + oppression_score) / 3
        
        # 3. Correlate with Entities
        # Determine dominant influence
        dominant_factor = "Generic"
        if chaos_score > despair_score and chaos_score > oppression_score:
            dominant_factor = "Caos"
        elif despair_score > chaos_score and despair_score > oppression_score:
            dominant_factor = "Desesperación"
        elif oppression_score > chaos_score and oppression_score > despair_score:
            dominant_factor = "Opresión"
            
        # Query DB for matching entities
        # We look for entities whose description or influence matches keywords
        keywords = []
        if chaos_score > 30: keywords.extend(["caos", "tormenta", "guerra", "destrucción"])
        if despair_score > 30: keywords.extend(["muerte", "tristeza", "soledad"])
        if oppression_score > 30: keywords.extend(["miedo", "control", "mentira"])
        
        suggested_entities = []
        
        if keywords:
            # Construct a query to find entities containing ANY of the keywords
            conditions = [Entity.description.ilike(f"%{kw}%") for kw in keywords]
            conditions.extend([Entity.influence.ilike(f"%{kw}%") for kw in keywords])
            
            query = select(Entity).filter(or_(*conditions)).limit(5)
            result = await db_session.execute(query)
            suggested_entities = result.scalars().all()
            
        # If no specific matches, get deterministic ones based on coordinates
        if not suggested_entities:
            # Fetch all and pick based on a seed derived from coordinates
            query = select(Entity)
            result = await db_session.execute(query)
            all_entities = result.scalars().all()
            
            if all_entities:
                seed = int(abs(lat * 1000 + lon * 1000))
                count = (seed % 3) + 2 # Pick 2 to 4
                for i in range(count):
                    index = (seed + i * 17) % len(all_entities)
                    suggested_entities.append(all_entities[index])
                    
        # Deduplicate entities (in case of double matches or multiple index hits)
        unique_entities = {e.id: e for e in suggested_entities}.values()
        suggested_entities = list(unique_entities)

        # Convert to dicts and add coordinates
        transformed_entities = []
        import random
        for e in suggested_entities:
            # Jitter within ~500m
            lat_j = lat + (random.random() - 0.5) * 0.005
            lon_j = lon + (random.random() - 0.5) * 0.005
            
            e_dict = {
                "id": str(e.id),
                "name": e.name,
                "type": e.type,
                "influence": e.influence,
                "description": e.description,
                "biblicalReference": e.biblical_reference,
                "alignment": e.alignment,
                "coordinates": [lat_j, lon_j]
            }
            transformed_entities.append(e_dict)
            
        # 4. Calculate Collective Sentiment for this location
        news_texts = [a.get("title", "") + " " + a.get("description", "") for a in news_data.get("articles", []) if a.get("title")]
        collective_result = self.archetype_analyzer.analyze_collective_field(news_texts)

        return {
            "indices": {
                "chaos": min(100, chaos_score),
                "despair": min(100, despair_score),
                "oppression": min(100, oppression_score),
                "intensity": total_intensity
            },
            "dominant_influence": dominant_factor,
            "detected_entities": transformed_entities,
            "environmental_context": {
                "weather": current_weather,
                "quakes": quake_data.get("count", 0),
                "quake_details": quake_data.get("events", [])[:5], # Latest 5 specific quakes
                "moon": moon_data
            },
            "news_context": {
                "negative_articles": sum(1 for a in news_data.get("articles", []) if a.get("sentiment") == "negative"),
                "articles": news_data.get("articles", [])
            },
            "collective_field": collective_result
        }

analysis_processor = AnalysisProcessor()
