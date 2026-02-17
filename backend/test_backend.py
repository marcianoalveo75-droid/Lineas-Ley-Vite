
import asyncio
from app.collectors.spiritual_collector import SpiritualCollector
from app.analysis.archetypes import ArchetypalAnalyzer

async def test_flow():
    print("--- Testing Spiritual Collector ---")
    collector = SpiritualCollector()
    data = await collector.collect_daily_pulse()
    print(f"Collected {len(data)} items.")
    if data:
        print(f"Sample item: {data[0]['title']}")

    print("\n--- Testing Archetypal Analyzer ---")
    analyzer = ArchetypalAnalyzer()
    
    # Test with real data
    texts = [item.get("title", "") + " " + item.get("summary", "") for item in data]
    result = analyzer.analyze_collective_field(texts)
    print("Analysis Result:", result)
    
    # Test with dummy data to ensure detection works
    dummy_texts = [
        "The crisis is imminent and everybody is afraid.",
        "We need to fight for our rights with anger.",
        "There is hope for a new beginning and healing."
    ]
    print("\n--- Testing Dummy Data ---")
    dummy_result = analyzer.analyze_collective_field(dummy_texts)
    print("Dummy Analysis:", dummy_result['scores'])

if __name__ == "__main__":
    asyncio.run(test_flow())
