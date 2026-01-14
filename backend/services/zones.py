# ================================================================
# PureMark Backend - Zone Segmentation Service
# Identify ingredient sections from OCR text
# ================================================================

import re
from typing import Dict, Any

# Language patterns for ingredient headers
INGREDIENT_HEADERS = {
    "en": ["ingredients:", "ingredients", "contains:", "made with:"],
    "es": ["ingredientes:", "ingredientes", "contiene:"],
    "fr": ["ingrédients:", "ingredients:", "ingrédients", "contient:"],
    "de": ["zutaten:", "zutaten", "enthält:"],
    "it": ["ingredienti:", "ingredienti", "contiene:"],
    "pt": ["ingredientes:", "ingredientes", "contém:"],
    "nl": ["ingrediënten:", "ingredienten:", "bevat:"],
    "ar": ["المكونات:", "المكونات"],
    "tr": ["içindekiler:", "içerikler:"],
    "id": ["komposisi:", "bahan:"],
    "ms": ["ramuan:", "bahan:"],
}

# Allergen advisory patterns
ALLERGEN_PATTERNS = [
    r"may contain[:\s]",
    r"produced in.*(?:contains|with)",
    r"traces of",
    r"manufactured.*(?:nuts|peanuts|milk|eggs)",
    r"allergy (?:advice|information|warning)",
    r"allergen[s]?[:\s]",
    r"contains[:\s]",  # At end of ingredient list
]


def detect_language(text: str) -> str:
    """Detect language based on ingredient header patterns."""
    text_lower = text.lower()

    # Check each language's patterns
    for lang, patterns in INGREDIENT_HEADERS.items():
        for pattern in patterns:
            if pattern in text_lower:
                return lang

    # Default to English
    return "en"


def segment_ocr_text(raw_text: str) -> Dict[str, Any]:
    """
    Segment OCR text into ingredient zone and allergen advisory zone.

    Args:
        raw_text: Raw OCR text from image

    Returns:
        Dict with ingredient_zone, allergen_advisory_zone, detected_language, parse_status
    """
    if not raw_text or len(raw_text.strip()) < 5:
        return {
            "ingredient_zone": "",
            "allergen_advisory_zone": "",
            "detected_language": "unknown",
            "parse_status": "NO_INGREDIENTS"
        }

    text = raw_text.strip()
    text_lower = text.lower()

    # Detect language
    detected_language = detect_language(text)

    # Find ingredient section
    ingredient_zone = ""
    parse_status = "UNVERIFIED"

    # Try to find ingredient header
    all_headers = []
    for patterns in INGREDIENT_HEADERS.values():
        all_headers.extend(patterns)

    header_pos = -1
    for header in all_headers:
        pos = text_lower.find(header)
        if pos != -1:
            if header_pos == -1 or pos < header_pos:
                header_pos = pos

    if header_pos != -1:
        # Found ingredient header
        ingredient_zone = text[header_pos:]
        parse_status = "VERIFIED"

        # Try to find end of ingredient section (before nutrition facts, allergens, etc.)
        end_markers = [
            "nutrition facts", "nutritional information", "valeur nutritive",
            "información nutricional", "nährwertangaben",
            "may contain", "allergy", "allergen", "produced in", "manufactured",
            "storage:", "store ", "best before", "use by", "expiry",
        ]

        for marker in end_markers:
            marker_pos = ingredient_zone.lower().find(marker)
            if marker_pos > 50:  # Only cut if we have enough content
                ingredient_zone = ingredient_zone[:marker_pos].strip()
                break
    else:
        # No header found - use full text but mark as unverified
        ingredient_zone = text
        parse_status = "UNVERIFIED"

    # Extract allergen advisory zone
    allergen_advisory_zone = ""
    for pattern in ALLERGEN_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            start_pos = match.start()
            # Get text from match to end of sentence/section
            remaining = text[start_pos:]
            # Find end of allergen statement (period, newline, or end)
            end_match = re.search(r'[.\n]', remaining[len(match.group()):])
            if end_match:
                allergen_advisory_zone = remaining[:len(match.group()) + end_match.end()]
            else:
                allergen_advisory_zone = remaining[:200]  # Limit length
            break

    # Final validation
    if len(ingredient_zone.strip()) < 10:
        parse_status = "NO_INGREDIENTS"

    return {
        "ingredient_zone": ingredient_zone.strip(),
        "allergen_advisory_zone": allergen_advisory_zone.strip(),
        "detected_language": detected_language,
        "parse_status": parse_status
    }
