# ================================================================
# PureMark Backend - Allergen Detection Service
# Detect major allergens in ingredient text
# ================================================================

import re
from typing import List, Optional
from .helpers import normalize_text, word_in_text, any_word_in_text

# Major allergens configuration
ALLERGENS_CONFIG = {
    "peanuts": {
        "terms": ["peanut", "peanuts", "groundnut", "groundnuts", "arachis", "cacahuete", "cacahuète", "erdnuss"],
        "display": "Peanuts"
    },
    "tree_nuts": {
        "terms": ["almond", "almonds", "cashew", "cashews", "walnut", "walnuts", "pecan", "pecans",
                  "pistachio", "pistachios", "hazelnut", "hazelnuts", "macadamia", "brazil nut",
                  "chestnut", "chestnuts", "pine nut", "pine nuts", "tree nut", "tree nuts"],
        "display": "Tree Nuts"
    },
    "milk": {
        "terms": ["milk", "dairy", "lactose", "casein", "whey", "cream", "butter", "cheese", "yogurt",
                  "lactalbumin", "lactoglobulin", "ghee", "leche", "lait", "milch", "latte"],
        "display": "Milk"
    },
    "eggs": {
        "terms": ["egg", "eggs", "albumin", "albumen", "globulin", "lysozyme", "mayonnaise",
                  "meringue", "ovalbumin", "ovomucin", "ovovitellin", "huevo", "oeuf", "ei"],
        "display": "Eggs"
    },
    "fish": {
        "terms": ["fish", "cod", "salmon", "tuna", "anchovy", "anchovies", "sardine", "sardines",
                  "mackerel", "herring", "bass", "trout", "tilapia", "haddock", "pollock",
                  "fish sauce", "fish oil", "omega-3", "pescado", "poisson", "fisch"],
        "display": "Fish"
    },
    "shellfish": {
        "terms": ["shellfish", "shrimp", "prawn", "prawns", "lobster", "crab", "crayfish",
                  "clam", "clams", "mussel", "mussels", "oyster", "oysters", "scallop", "scallops",
                  "squid", "calamari", "octopus", "crustacean", "crustaceans"],
        "display": "Shellfish"
    },
    "soy": {
        "terms": ["soy", "soya", "soybean", "soybeans", "edamame", "tofu", "tempeh", "miso",
                  "soy sauce", "soy lecithin", "soja"],
        "display": "Soy"
    },
    "wheat": {
        "terms": ["wheat", "flour", "bread", "pasta", "semolina", "durum", "spelt", "kamut",
                  "farina", "couscous", "bulgur", "seitan", "gluten", "trigo", "blé", "weizen"],
        "display": "Wheat"
    },
    "sesame": {
        "terms": ["sesame", "sesame seed", "sesame seeds", "sesame oil", "tahini", "halvah",
                  "hummus", "sésamo", "sésame", "sesam"],
        "display": "Sesame"
    },
    "mustard": {
        "terms": ["mustard", "mustard seed", "mustard seeds", "moutarde", "senf", "mostaza"],
        "display": "Mustard"
    },
    "celery": {
        "terms": ["celery", "celeriac", "céleri", "sellerie", "apio"],
        "display": "Celery"
    },
    "sulfites": {
        "terms": ["sulfite", "sulfites", "sulphite", "sulphites", "sulfur dioxide", "sulphur dioxide",
                  "sodium sulfite", "sodium bisulfite", "sodium metabisulfite",
                  "potassium bisulfite", "potassium metabisulfite", "e220", "e221", "e222",
                  "e223", "e224", "e225", "e226", "e227", "e228"],
        "display": "Sulfites"
    },
}

# Advisory patterns for "may contain" warnings
ADVISORY_PATTERNS = [
    r"may contain[:\s]+([^.]+)",
    r"produced in.*(?:facility|factory|plant).*(?:that|which).*(?:also|processes?).*([^.]+)",
    r"manufactured.*(?:equipment|line).*(?:that|which).*(?:also|processes?).*([^.]+)",
    r"traces of\s+([^.]+)",
    r"possible.*(?:cross[- ]?contact|contamination).*with\s+([^.]+)",
]


def check_allergy(text: str, user_allergens: List[str]) -> Optional[str]:
    """
    Check if text contains any of the user's specified allergens.

    Args:
        text: Text to check for allergens
        user_allergens: List of allergen names the user is allergic to

    Returns:
        Allergen name if found, None otherwise
    """
    if not text or not user_allergens:
        return None

    text_lower = normalize_text(text)

    for allergen in user_allergens:
        allergen_lower = allergen.lower().strip()

        # Check if allergen is in our config
        if allergen_lower in ALLERGENS_CONFIG:
            config = ALLERGENS_CONFIG[allergen_lower]
            if any(word_in_text(text_lower, term) for term in config["terms"]):
                return config["display"]
        else:
            # Direct match for custom allergens
            if word_in_text(text_lower, allergen_lower):
                return allergen.title()

    return None


def detect_allergens_in_text(text: str) -> List[str]:
    """
    Detect all allergens present in text.

    Args:
        text: Text to scan for allergens

    Returns:
        List of detected allergen names
    """
    if not text:
        return []

    text_lower = normalize_text(text)
    detected = []

    for allergen_key, config in ALLERGENS_CONFIG.items():
        if any(word_in_text(text_lower, term) for term in config["terms"]):
            detected.append(config["display"])

    return detected


def extract_allergens_from_advisory(advisory_text: str) -> List[str]:
    """
    Extract allergens from "may contain" advisory statements.

    Args:
        advisory_text: Advisory text (e.g., "May contain traces of nuts and milk")

    Returns:
        List of allergen names from advisory
    """
    if not advisory_text:
        return []

    text_lower = normalize_text(advisory_text)
    allergens = []

    # Try each pattern
    for pattern in ADVISORY_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            # Check which allergens are mentioned in the match
            for allergen_key, config in ALLERGENS_CONFIG.items():
                if any(term in match.lower() for term in config["terms"]):
                    if config["display"] not in allergens:
                        allergens.append(config["display"])

    return allergens


def format_allergen_warning(allergen: str, is_advisory: bool = False) -> str:
    """
    Format allergen for display.

    Args:
        allergen: Allergen name
        is_advisory: If True, this is from a "may contain" warning

    Returns:
        Formatted allergen string
    """
    if is_advisory:
        return f"{allergen} (may contain)"
    return allergen
