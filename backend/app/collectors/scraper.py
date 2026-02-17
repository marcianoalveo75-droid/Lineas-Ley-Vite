import requests
from bs4 import BeautifulSoup
import re
import urllib.parse
import time
from datetime import datetime

class PrecisionScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Dictionary of Signatures (Iniquity, Calamities, Spiritual, Social)
        self.signatures = {
            "spiritual": ["ritual", "altar", "ocultismo", "aparición", "templo", "esotérico"],
            "iniquity": ["accidente fatal", "crimen", "homicidio", "violación", "suicidio", "cementerio", "tragedia"],
            "calamities": ["incendio", "inundación", "tormenta", "desastre natural", "fuego", "sequía"],
            "social": ["queja", "insoportable", "caos", "inseguridad", "protesta", "descontento", "manifestación"]
        }

    def _get_google_dorks(self, location, country_name="", extra_keywords=""):
        """Constructs Google Dork queries for a given location."""
        loc_context = f'"{location}"'
        if country_name:
            loc_context = f'"{location}" "{country_name}"'
            
        extra_query = f' "{extra_keywords}"' if extra_keywords else ""
            
        dorks = [
            # Spiritual & Anomalies (Reddit)
            f'site:reddit.com {loc_context}{extra_query} (misterio OR raro OR paranormal OR aparición)',
            # Hyper-local Crimes/Accidents (FB Groups)
            f'site:facebook.com/groups {loc_context}{extra_query} (accidente OR crimen OR tragedia)',
            # Social Tension (X/Twitter)
            f'site:twitter.com {loc_context}{extra_query} (protesta OR inseguridad OR hartazgo)',
            # Local Forums
            f'inurl:forum {loc_context}{extra_query} news',
            # Generic News/Iniquity
            f'{loc_context}{extra_query} (homicidio OR ritual OR incendio)'
        ]
        return dorks

    def scrape_dorks(self, location, country_name="", extra_keywords="", limit=5):
        """Executes Google search dorks and parses results."""
        all_results = []
        dorks = self._get_google_dorks(location, country_name, extra_keywords)
        
        for dork in dorks[:3]: # Limit to first 3 dorks to avoid captcha/rate limits
            try:
                query = urllib.parse.quote(dork)
                url = f"https://www.google.com/search?q={query}"
                
                response = requests.get(url, headers=self.headers, timeout=10)
                if response.status_code != 200:
                    continue
                    
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Google search result blocks (this class name might change, it's brittle)
                # But it's a start for a custom scraper
                for g in soup.find_all('div', class_='g'):
                    anchors = g.find_all('a')
                    if anchors:
                        link = anchors[0]['href']
                        title = g.find('h3').text if g.find('h3') else 'No title'
                        snippet = g.find('div', class_='VwiC3b').text if g.find('div', class_='VwiC3b') else ''
                        
                        if not link.startswith('http'): continue
                        
                        all_results.append({
                            "title": title,
                            "url": link,
                            "snippet": snippet,
                            "source": self._extract_domain(link),
                            "date": datetime.now().strftime("%Y-%m-%d"),
                            "sentiment": self._analyze_sentiment(snippet + title)
                        })
                        
                    if len(all_results) >= limit * 3:
                        break
                
                time.sleep(1) # Polite delay
                
            except Exception as e:
                print(f"Scraping error for dork '{dork}': {e}")
                
        # Deduplicate
        unique_results = {res['url']: res for res in all_results}.values()
        return list(unique_results)[:limit * 5]

    def _extract_domain(self, url):
        try:
            domain = urllib.parse.urlparse(url).netloc
            return domain.replace('www.', '')
        except:
            return "Web"

    def _analyze_sentiment(self, text):
        """Simple keyword-based sentiment for social tension."""
        text = text.lower()
        negative_count = sum(1 for word in self.signatures["social"] + self.signatures["iniquity"] if word in text)
        if negative_count > 1:
            return "high_tension"
        elif negative_count == 1:
            return "medium_tension"
        return "neutral"

if __name__ == "__main__":
    scraper = PrecisionScraper()
    results = scraper.scrape_dorks("Villa El Salvador", "Peru")
    for r in results:
        print(f"[{r['source']}] {r['title']} - {r['sentiment']}")
