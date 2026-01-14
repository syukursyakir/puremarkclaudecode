# ================================================================
# PureMark Backend - Helper Functions
# ================================================================

import re
from typing import List, Set


def normalize_text(text: str) -> str:
    """Normalize text for consistent matching."""
    if not text:
        return ""
    # Lowercase and normalize whitespace
    result = text.lower().strip()
    result = re.sub(r'\s+', ' ', result)
    return result


def word_in_text(text: str, word: str) -> bool:
    """Check if a word/phrase exists in text (word boundary aware)."""
    if not text or not word:
        return False
    # Escape special regex characters in word
    escaped_word = re.escape(word.lower())
    pattern = r'\b' + escaped_word + r'\b'
    return bool(re.search(pattern, text.lower()))


def any_word_in_text(text: str, words: List[str]) -> bool:
    """Check if any word from list exists in text."""
    for word in words:
        if word_in_text(text, word):
            return True
    return False


def extract_enumbers(text: str) -> List[str]:
    """Extract E-numbers from text (e.g., E120, E471, E322)."""
    if not text:
        return []
    # Match E followed by digits, with optional letter suffix
    pattern = r'\b[eE][-\s]?(\d{3,4}[a-z]?)\b'
    matches = re.findall(pattern, text)
    return list(set(matches))


def contains_enumber(text: str, enumber: str) -> bool:
    """Check if specific E-number is in text."""
    enumbers = extract_enumbers(text)
    return enumber in enumbers


def dedupe(items: List[str]) -> List[str]:
    """Remove duplicates while preserving order."""
    seen: Set[str] = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result
