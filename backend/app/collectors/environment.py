import requests
from datetime import datetime, timedelta

class EnvironmentCollector:
    
    def get_weather(self, lat: float, lon: float):
        """
        Fetches current weather and short-term forecast from OpenMeteo.
        Does not require API Key.
        """
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=sunrise,sunset&timezone=auto"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                return {
                    "source": "OpenMeteo",
                    "current": data.get("current", {}),
                    "daily": data.get("daily", {})
                }
            return {"error": f"OpenMeteo status {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}

    def get_earthquakes(self, lat: float, lon: float, radius_km: int = 100):
        """
        Fetches recent earthquakes (last 30 days) within radius from USGS.
        """
        try:
            # USGS API parameters
            start_time = (datetime.now() - timedelta(days=30)).isoformat()
            
            url = f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude={lat}&longitude={lon}&maxradiuskm={radius_km}&starttime={start_time}&minmagnitude=2.5"
            
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                events = []
                for feature in data.get("features", []):
                    props = feature.get("properties", {})
                    # Calculate distance roughly or just return the event
                    events.append({
                        "id": feature.get("id"),
                        "place": props.get("place"),
                        "mag": props.get("mag"),
                        "time": datetime.fromtimestamp(props.get("time") / 1000).isoformat(),
                        "url": props.get("url"),
                        "coordinates": feature.get("geometry", {}).get("coordinates")
                    })
                return {
                    "source": "USGS",
                    "count": len(events),
                    "events": events
                }
            return {"error": f"USGS status {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}

    def get_moon_phase(self, date_obj=None):
        """
        Calculates the moon phase roughly using Julian Date.
        Returns phase name, illumination, and spiritual sentiment.
        """
        if date_obj is None:
            date_obj = datetime.now()
            
        # Reference: 2000-01-06 18:14:00 was a New Moon
        diff = date_obj - datetime(2000, 1, 6, 18, 14)
        days = diff.total_seconds() / 86400
        lunation = 29.53058867
        phase_pos = (days / lunation) % 1.0
        
        if phase_pos < 0.06 or phase_pos > 0.94:
            name, sentiment = "Nueva", "neutral (Reinicio)"
        elif phase_pos < 0.19:
            name, sentiment = "Creciente Cóncava", "positive (Crecimiento)"
        elif phase_pos < 0.31:
            name, sentiment = "Cuarto Creciente", "positive (Acción)"
        elif phase_pos < 0.44:
            name, sentiment = "Creciente Convexa", "positive (Afinamiento)"
        elif phase_pos < 0.56:
            name, sentiment = "Llena", "negative (Tensión/Poder)"
        elif phase_pos < 0.69:
            name, sentiment = "Menguante Convexa", "neutral (Gratitud)"
        elif phase_pos < 0.81:
            name, sentiment = "Cuarto Menguante", "neutral (Soltar)"
        else:
            name, sentiment = "Menguante Cóncava", "neutral (Introspección)"
            
        # Rough illumination
        illumination = abs(phase_pos - 0.5) * 2 # 0 at 0.5 (Full), 1 at 0/1 (New) - wait
        # Illumination is 0% at New (0), 100% at Full (0.5)
        illumination = (1 - abs(phase_pos - 0.5) * 2) * 100
        
        return {
            "name": name,
            "illumination": round(illumination, 1),
            "sentiment": sentiment,
            "position": round(phase_pos, 3)
        }

# Singleton instance
environment_collector = EnvironmentCollector()
