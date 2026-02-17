import requests
from datetime import datetime, timedelta

class NewsCollector:
    
    COUNTRY_MAP = {
        "pa": "Panamá",
        "es": "España",
        "mx": "México",
        "ar": "Argentina",
        "co": "Colombia",
        "cl": "Chile",
        "pe": "Perú",
        "ve": "Venezuela",
        "ec": "Ecuador",
        "gt": "Guatemala",
        "us": "Estados Unidos"
    }

    def _format_article(self, article):
        title_lower = article.get("title", "").lower()
        sentiment = "neutral"
        if any(w in title_lower for w in ["muerte", "accidente", "crimen", "miedo", "terror", "desastre"]):
            sentiment = "negative"
        elif any(w in title_lower for w in ["esperanza", "vida", "amor", "paz", "milagro"]):
            sentiment = "positive"
            
        return {
            "title": article.get("title"),
            "source": article.get("source", {}).get("name"),
            "url": article.get("url"),
            "date": article.get("publishedAt"),
            "description": article.get("description"),
            "sentiment": sentiment,
            "type": "news"
        }

    def fetch_news(self, location_name: str, api_key: str, country_code: str = "pa", 
                   mediastack_api_key: str = "", keyword: str = "", extra_keywords: str = "", 
                   date_from: str = "", date_to: str = "", country_codes: list[str] = None):
        """
        Fetches news for a specific location using NewsAPI.org and Mediastack.
        Supports multiple countries for border regions.
        """
        if not api_key and not mediastack_api_key:
            return {"error": "No API Keys provided"}
            
        if not country_codes:
            country_codes = [country_code]

        articles = []
        
        # 0. Quick Location extraction
        location_parts = [p.strip() for p in location_name.split(',')]
        main_loc = location_parts[0]

        # 1. Fetch from NewsAPI.org
        if api_key:
            try:
                # Date range: Default to Last 7 days if not provided
                if not date_from:
                    today = datetime.now()
                    last_week = today - timedelta(days=7)
                    date_from = last_week.strftime('%Y-%m-%d')
                
                # Use full country names for better filtering
                country_names = []
                for code in country_codes:
                    name = self.COUNTRY_MAP.get(code.lower(), code.upper())
                    country_names.append(f'"{name}"')
                
                countries_filter = " OR ".join(country_names)

                # Sourcing keywords to find local community info
                sourcing_keywords = '"foro" OR "comunidad" OR "local" OR "vecinos"'

                # Prioritize extra_keywords if provided
                combined_keywords = f"{keyword} {extra_keywords}".strip()

                # --- STEP 1: Specific Location Search ---
                if combined_keywords:
                    query_core = f'({combined_keywords}) AND ("{main_loc}" OR "{location_name}")'
                else:
                    query_core = f'("{location_name}" OR "{main_loc}") AND ({sourcing_keywords})'
                
                final_query = f'({query_core}) AND ({countries_filter})'

                url = "https://newsapi.org/v2/everything"
                params = {
                    "q": final_query,
                    "from": date_from,
                    "sortBy": "relevance",
                    "language": "es",
                    "apiKey": api_key,
                    "pageSize": 50
                }
                if date_to:
                    params["to"] = date_to

                response = requests.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    for article in data.get("articles", []):
                        articles.append(self._format_article(article))

                # --- STEP 2: Broad Fallback (if few results) ---
                if len(articles) < 10:
                    broad_query = f'({combined_keywords or "suceso" or "noticia"}) AND ({countries_filter})'
                    params["q"] = broad_query
                    response = requests.get(url, params=params)
                    if response.status_code == 200:
                        data = response.json()
                        existing_urls = {a['url'] for a in articles}
                        for article in data.get("articles", []):
                            if article.get("url") not in existing_urls:
                                articles.append(self._format_article(article))

            except Exception as e:
                print(f"NewsAPI error: {e}")

        # 2. Fetch from Mediastack (Free fallback)
        if mediastack_api_key and len(articles) < 20:
            try:
                # Mediastack uses simple terms
                q_term = extra_keywords or main_loc
                ms_url = "http://api.mediastack.com/v1/news"
                ms_params = {
                    "access_key": mediastack_api_key,
                    "keywords": q_term,
                    "countries": ",".join(country_codes),
                    "languages": "es",
                    "limit": 25
                }
                ms_res = requests.get(ms_url, params=ms_params)
                if ms_res.status_code == 200:
                    ms_data = ms_res.json()
                    for item in ms_data.get("data", []):
                        articles.append({
                            "title": item.get("title"),
                            "source": item.get("source") or "Mediastack",
                            "url": item.get("url"),
                            "date": item.get("published_at"),
                            "description": item.get("description"),
                            "sentiment": "neutral",
                            "type": "news"
                        })
            except Exception as e:
                print(f"Mediastack error: {e}")

        # 3. Integrate Precision Scraper for Deep Intelligence (Dorking)
        try:
            from .scraper import PrecisionScraper
            scraper = PrecisionScraper()
            scraper_country = self.COUNTRY_MAP.get(country_code.lower(), "")
            scraped_intel = scraper.scrape_dorks(main_loc, 
                                                 country_name=scraper_country,
                                                 extra_keywords=extra_keywords)
            # Blend scraped intel as 'Intelligence' items
            for intel in scraped_intel:
                articles.append({
                    "title": f"[OSINT] {intel['title']}",
                    "source": intel['source'],
                    "url": intel['url'],
                    "date": intel['date'],
                    "description": intel['snippet'],
                    "sentiment": intel['sentiment'],
                    "type": "osint"
                })
        except Exception as se:
            print(f"Scraper error: {se}")

        # Sort by date (newest first)
        articles.sort(key=lambda x: x.get("date", "") or "", reverse=True)

        return {
            "source": "Blended Intelligence (NewsAPI + Mediastack + OSINT)", 
            "count": len(articles), 
            "articles": articles[:50]
        }

# Singleton
news_collector = NewsCollector()
