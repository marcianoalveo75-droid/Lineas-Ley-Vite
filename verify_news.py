import sys
import os

# Adjust path to import from backend/app
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.collectors.news import news_collector

API_KEY = "65b75641f56247449a3df303217fba79"

print("--- Testing NewsCollector Localization ---")

# Test cases
test_cases = [
    ("Ciudad de Panamá", "pa"),
    ("Madrid", "es"),
    ("New York", "us")
]

for city, country in test_cases:
    print(f"\n--- Testing for {city} ({country}) ---")
    res = news_collector.fetch_news(city, API_KEY, country)
    
    if "error" in res:
        print(f"Error: {res['error']}")
    else:
        print(f"Results: {res.get('count', 0)} articles found.")
        for a in res.get('articles', [])[:3]:
            print(f"- {a['title']} ({a['source']})")
