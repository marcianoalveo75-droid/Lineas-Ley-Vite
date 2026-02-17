
from typing import Dict, List, Any
from collections import Counter
from app.services.text_processor import TextProcessor

class ArchetypalAnalyzer:
    def __init__(self):
        self.processor = TextProcessor()
        # Spiritual/Archetypal Dictionary
        self.archetypes = {
            "miedo": ["fear", "terror", "threat", "collapse", "crisis", "panic", "danger", "afraid", "scared", "doom"],
            "ira": ["anger", "rage", "fury", "hate", "unjust", "fight", "destroy", "burn", "revenge", "mad"],
            "esperanza": ["hope", "light", "future", "heal", "trust", "faith", "better", "grow", "solution", "dawn"],
            "confusion": ["confusion", "lost", "chaos", "uncertain", "why", "weird", "strange", "unknown", "blur", "maze"],
            "sacrificio": ["sacrifice", "give", "loss", "pain", "suffer", "martyr", "endure", "bear", "cost", "surrender"],
            "renacimiento": ["rebirth", "new", "born", "start", "awake", "rise", "transform", "shift", "change", "beginning"],
            "control": ["control", "power", "rule", "law", "force", "mandate", "order", "police", "restrict", "obey"],
            "liberacion": ["freedom", "free", "release", "escape", "open", "break", "fly", "unite", "expand", "sovereign"]
        }

    def analyze_collective_field(self, texts: List[str]) -> Dict[str, Any]:
        """
        Analyzes a list of texts to determine the collective emotional field.
        """
        total_phrases = 0
        archetype_counts = Counter()
        
        all_ideas = []
        for text in texts:
            ideas = self.processor.tokenize_ideas(text)
            all_ideas.extend(ideas)
            
        total_phrases = len(all_ideas)
        if total_phrases == 0:
            return self._empty_result()

        total_hits = 0
        for idea in all_ideas:
            matched_archetypes = self._match_archetypes(idea)
            for arch in matched_archetypes:
                archetype_counts[arch] += 1
                total_hits += 1

        # Calculate scores
        scores = {}
        for arch in self.archetypes.keys():
            count = archetype_counts[arch]
            # Score is a mix of absolute count and relative density
            # If 10% of all phrases mention 'fear', that's high density.
            density = (count / total_phrases) * 100 if total_phrases > 0 else 0
            scores[arch] = round(density, 2)

        # Determine dominant
        dominant = archetype_counts.most_common(1)[0][0] if archetype_counts else "neutral"

        return {
            "scores": scores,
            "dominant": dominant,
            "total_analyzed": total_phrases,
            "density_index": round((total_hits / total_phrases) * 100, 2) if total_phrases > 0 else 0
        }

    def _match_archetypes(self, phrase: str) -> List[str]:
        words = set(phrase.split())
        matches = []
        for arch, keywords in self.archetypes.items():
            # Check if any keyword matches any word in phrase
            # Simple containment check for now
            if any(k in phrase for k in keywords):
                matches.append(arch)
        return matches

    def _empty_result(self) -> Dict[str, Any]:
        return {
            "scores": {k: 0 for k in self.archetypes},
            "dominant": "neutral",
            "total_analyzed": 0,
            "density_index": 0
        }
