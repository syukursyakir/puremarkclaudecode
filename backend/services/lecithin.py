# ================================================================
# PureMark Backend - Lecithin Detection Service
# Detect lecithin source for accurate halal/allergen classification
# ================================================================

import re
from typing import Dict, Any

# Lecithin source patterns
LECITHIN_PATTERNS = {
    "sunflower": [
        r"sunflower\s*lecithin",
        r"lecithin\s*\(?\s*sunflower\s*\)?",
        r"lecithine?\s*(?:de\s*)?(?:tournesol|girasol)",  # French/Spanish
        r"sonnenblumen\s*lecithin",  # German
    ],
    "soy": [
        r"soy\s*lecithin",
        r"soya\s*lecithin",
        r"lecithin\s*\(?\s*soy(?:a)?\s*\)?",
        r"lecithine?\s*(?:de\s*)?soja",  # French/Spanish
        r"soja\s*lecithin",  # German
    ],
    "rapeseed": [
        r"rapeseed\s*lecithin",
        r"canola\s*lecithin",
        r"lecithin\s*\(?\s*(?:rapeseed|canola)\s*\)?",
        r"lecithine?\s*(?:de\s*)?colza",  # French
        r"raps\s*lecithin",  # German
    ],
    "egg": [
        r"egg\s*lecithin",
        r"lecithin\s*\(?\s*egg\s*\)?",
        r"lecithine?\s*(?:d['']?\s*)?(?:oeuf|huevo)",  # French/Spanish
    ],
}

# Generic lecithin patterns (source unknown)
GENERIC_LECITHIN = [
    r"\blecithin\b",
    r"\blecithine?\b",
    r"\be322\b",
    r"\be\s*322\b",
]

# Halal status by lecithin source
LECITHIN_HALAL_STATUS = {
    "sunflower": "HALAL",
    "soy": "UNVERIFIED",  # May involve alcohol processing
    "rapeseed": "HALAL",
    "egg": "HALAL",
    "unspecified": "UNVERIFIED",
}


def detect_lecithin_source(text: str) -> Dict[str, Any]:
    """
    Detect if text contains lecithin and identify its source.

    Args:
        text: Text to search for lecithin

    Returns:
        Dict with is_lecithin, source, halal_status
    """
    if not text:
        return {"is_lecithin": False, "source": None, "halal_status": None}

    text_lower = text.lower()

    # Check for specific sources first
    for source, patterns in LECITHIN_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return {
                    "is_lecithin": True,
                    "source": source,
                    "halal_status": LECITHIN_HALAL_STATUS.get(source, "UNVERIFIED")
                }

    # Check for generic lecithin
    for pattern in GENERIC_LECITHIN:
        if re.search(pattern, text_lower):
            return {
                "is_lecithin": True,
                "source": "unspecified",
                "halal_status": "UNVERIFIED"
            }

    return {"is_lecithin": False, "source": None, "halal_status": None}


def detect_lecithin_source_combined(original_text: str, normalized_text: str) -> Dict[str, Any]:
    """
    Detect lecithin source from multiple text sources.

    Args:
        original_text: Original text (may be in foreign language)
        normalized_text: Normalized/translated text

    Returns:
        Dict with is_lecithin, source, halal_status
    """
    # Try original text first
    result = detect_lecithin_source(original_text)
    if result["is_lecithin"] and result["source"] != "unspecified":
        return result

    # Try normalized text
    result_norm = detect_lecithin_source(normalized_text)
    if result_norm["is_lecithin"] and result_norm["source"] != "unspecified":
        return result_norm

    # Return whatever we found
    if result["is_lecithin"]:
        return result
    return result_norm
