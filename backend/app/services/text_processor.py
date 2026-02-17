
import re
import logging

logger = logging.getLogger(__name__)

class TextProcessor:
    def __init__(self):
        # Regex patterns
        self.url_pattern = re.compile(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')
        self.emoji_pattern = re.compile(r'[^\x00-\x7F]+') # Simple non-ascii removal for now (includes emojis)
        self.whitespace_pattern = re.compile(r'\s+')

    def clean_text(self, text: str) -> str:
        """
        Basic cleaning: URLs, Emojis, Whitespace.
        """
        if not text:
            return ""
            
        # Remove URLs
        text = self.url_pattern.sub('', text)
        
        # Remove Emojis/Non-ASCII (aggressive cleaning for 'pure' symbolic analysis)
        text = self.emoji_pattern.sub(' ', text)
        
        # Normalize whitespace
        text = self.whitespace_pattern.sub(' ', text).strip()
        
        return text.lower()

    def tokenize_ideas(self, text: str) -> list[str]:
        """
        Splits text into 'ideas' or phrases based on punctuation.
        Better than word tokenization for sentiment context.
        """
        cleaned = self.clean_text(text)
        # Split by common sentence delimiters
        phrases = re.split(r'[.!?,;:]+', cleaned)
        return [p.strip() for p in phrases if p.strip()]
