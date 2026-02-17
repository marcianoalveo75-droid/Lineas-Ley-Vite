
import asyncio
import feedparser
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class SpiritualCollector:
    def __init__(self):
        self.rss_sources = [
            "https://www.reddit.com/r/spirituality/top.rss?t=day",
            "https://www.reddit.com/r/collapse/top.rss?t=day",
            "https://news.google.com/rss/search?q=crisis+OR+hope+OR+change&hl=en-US&gl=US&ceid=US:en"
        ]
        # In a real app, these would be in a config or database

    async def fetch_rss(self, url: str) -> List[Dict[str, Any]]:
        """
        Fetches and parses an RSS feed.
        """
        try:
            # feedparser is blocking, so run in executor
            loop = asyncio.get_event_loop()
            feed = await loop.run_in_executor(None, feedparser.parse, url)
            
            items = []
            for entry in feed.entries[:10]: # Limit to top 10
                items.append({
                    "title": entry.get("title", ""),
                    "summary": entry.get("summary", ""),
                    "link": entry.get("link", ""),
                    "published": entry.get("published", ""),
                    "source": "rss",
                    "source_url": url
                })
            return items
        except Exception as e:
            logger.error(f"Error fetching RSS {url}: {e}")
            return []

    async def fetch_html_text(self, url: str) -> str:
        """
        Fetches HTML content and extracts main text.
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as response:
                    if response.status != 200:
                        return ""
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Remove scripts and styles
                    for script in soup(["script", "style"]):
                        script.extract()
                        
                    text = soup.get_text()
                    return text
        except Exception as e:
            logger.error(f"Error fetching HTML {url}: {e}")
            return ""

    async def collect_daily_pulse(self) -> List[Dict[str, Any]]:
        """
        Collects data from all configured sources to form a 'daily pulse'.
        """
        tasks = [self.fetch_rss(url) for url in self.rss_sources]
        results = await asyncio.gather(*tasks)
        
        # Flatten results
        all_items = []
        for result in results:
            all_items.extend(result)
            
        return all_items
