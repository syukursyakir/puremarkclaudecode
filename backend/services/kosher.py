# ================================================================
# PureMark Backend - Kosher Analysis Engine
# Kosher compliance evaluation for ingredients and products
# ================================================================

from typing import Dict, Any, List, Optional
from .helpers import normalize_text, word_in_text, any_word_in_text, dedupe

# Status constants
KOSHER_CONFIRMED = "KOSHER_CONFIRMED"
NOT_KOSHER = "NOT_KOSHER"
REQUIRES_CERTIFICATION = "REQUIRES_CERTIFICATION"

CONF_HIGH = "HIGH"
CONF_MED = "MEDIUM"
CONF_LOW = "LOW"

# ================================================================
# Kosher Configuration
# ================================================================

FORBIDDEN_LAND_ANIMALS = [
    "pork", "pig", "swine", "bacon", "ham", "lard", "porcine",
    "rabbit", "hare", "horse", "donkey", "camel",
]

FORBIDDEN_SEAFOOD = [
    "shellfish", "shrimp", "prawn", "lobster", "crab", "crayfish",
    "clam", "mussel", "oyster", "scallop", "squid", "octopus",
    "catfish", "shark", "eel", "sturgeon", "swordfish",
]

INSECT_DERIVED = [
    "carmine", "cochineal", "e120", "natural red 4",
    "shellac", "e904", "lac",
]

BLOOD_PRODUCTS = [
    "blood", "blood meal", "blood plasma", "black pudding",
]

GRAPE_PRODUCTS = [
    "wine", "grape juice", "wine vinegar", "champagne", "brandy", "cognac",
]

MEAT_DAIRY_MIX = [
    "cheeseburger", "meat and cheese", "bacon cheese",
]

# Certification signals
KOSHER_CERTIFICATIONS = [
    "ou", "ok", "star-k", "kof-k", "crc", "scroll k", "triangle k",
    "kosher certified", "certified kosher", "pareve", "parve",
    "dairy", "meat", "chalav yisrael",
]

# Known kosher-safe plant ingredients (no certification needed)
KOSHER_SAFE_INGREDIENTS = [
    # Sugars & sweeteners
    "sugar", "cane sugar", "beet sugar", "brown sugar", "powdered sugar",
    "honey", "maple syrup", "agave", "stevia", "sucralose", "aspartame",
    "glucose", "fructose", "dextrose", "maltodextrin", "corn syrup",
    # Grains & starches
    "flour", "wheat flour", "rice", "corn", "oats", "barley", "rye",
    "cornstarch", "corn starch", "potato starch", "tapioca", "starch",
    # Oils (plant-based)
    "vegetable oil", "sunflower oil", "canola oil", "olive oil", "palm oil",
    "coconut oil", "soybean oil", "corn oil", "rapeseed oil", "safflower oil",
    # Fruits & vegetables
    "tomato", "onion", "garlic", "carrot", "potato", "apple", "orange",
    "lemon", "lime", "banana", "berry", "berries", "fruit", "vegetable",
    # Nuts & seeds
    "almond", "peanut", "walnut", "cashew", "pistachio", "sesame",
    "sunflower seed", "pumpkin seed", "chia", "flax", "hemp seed",
    # Legumes
    "soy", "soybean", "chickpea", "lentil", "bean", "pea",
    # Spices & herbs
    "salt", "pepper", "cinnamon", "vanilla", "paprika", "turmeric",
    "cumin", "oregano", "basil", "thyme", "rosemary", "parsley",
    "ginger", "nutmeg", "clove", "cardamom", "coriander",
    # Common additives (plant-derived)
    "citric acid", "ascorbic acid", "vitamin c", "vitamin e", "tocopherol",
    "pectin", "agar", "carrageenan", "guar gum", "xanthan gum", "locust bean gum",
    "soy lecithin", "sunflower lecithin", "lecithin",
    "natural flavor", "natural flavoring", "artificial flavor",
    "color", "caramel color", "annatto", "beta carotene", "turmeric color",
    "baking soda", "baking powder", "yeast", "sodium bicarbonate",
    "calcium carbonate", "potassium sorbate", "sodium benzoate",
    "water", "carbonated water", "sparkling water",
    # Cocoa & coffee
    "cocoa", "cocoa powder", "cocoa butter", "chocolate", "coffee",
    # Vinegar (non-grape)
    "vinegar", "apple cider vinegar", "white vinegar", "rice vinegar",
    "distilled vinegar", "malt vinegar",
]

# Source-dependent ingredients
SOURCE_DEPENDENT_KOSHER = {
    "gelatin": {
        "terms": ["gelatin", "gelatine"],
        "kosher_terms": ["fish gelatin", "kosher gelatin"],
        "not_kosher_terms": ["pork gelatin", "porcine gelatin"],
    },
    "rennet": {
        "terms": ["rennet", "enzyme"],
        "kosher_terms": ["microbial rennet", "vegetable rennet", "microbial enzyme"],
        "not_kosher_terms": ["animal rennet", "calf rennet"],
    },
    "glycerin": {
        "terms": ["glycerin", "glycerol", "e422"],
        "kosher_terms": ["vegetable glycerin", "plant glycerin"],
        "not_kosher_terms": ["animal glycerin"],
    },
}


def has_kosher_certification(text: str) -> bool:
    """Check if text contains kosher certification signals."""
    text_lower = normalize_text(text)
    return any(word_in_text(text_lower, cert) for cert in KOSHER_CERTIFICATIONS)


def is_kosher_safe_ingredient(text: str) -> bool:
    """Check if ingredient is a known kosher-safe plant ingredient."""
    text_lower = normalize_text(text)
    return any(word_in_text(text_lower, safe) for safe in KOSHER_SAFE_INGREDIENTS)


def evaluate_kosher_strict(ingredient_text: str) -> Dict[str, Any]:
    """
    Evaluate kosher status of an ingredient.

    Args:
        ingredient_text: Ingredient text to evaluate

    Returns:
        Dict with status, confidence, reason_codes, evidence
    """
    ing_raw = ingredient_text or ""
    ing = normalize_text(ing_raw)

    reasons: List[str] = []
    evidence: List[str] = []

    # Check certification
    has_cert = has_kosher_certification(ing)

    # 0) Quick check for known kosher-safe ingredients (before checking forbidden items)
    # But still check for forbidden items first to catch things like "pork flavored chips"

    # 1) Forbidden land animals
    if any_word_in_text(ing, FORBIDDEN_LAND_ANIMALS):
        return {
            "ingredient": ing_raw,
            "status": NOT_KOSHER,
            "confidence": CONF_HIGH,
            "reason_codes": ["forbidden_land_animal"],
            "evidence": ["Contains forbidden land animal (non-kosher species)"]
        }

    # 2) Forbidden seafood
    if any_word_in_text(ing, FORBIDDEN_SEAFOOD):
        return {
            "ingredient": ing_raw,
            "status": NOT_KOSHER,
            "confidence": CONF_HIGH,
            "reason_codes": ["forbidden_seafood"],
            "evidence": ["Contains forbidden seafood (no fins/scales)"]
        }

    # 3) Insect-derived
    if any_word_in_text(ing, INSECT_DERIVED):
        return {
            "ingredient": ing_raw,
            "status": NOT_KOSHER,
            "confidence": CONF_HIGH,
            "reason_codes": ["insect_derived"],
            "evidence": ["Contains insect-derived ingredient"]
        }

    # 4) Blood products
    if any_word_in_text(ing, BLOOD_PRODUCTS):
        return {
            "ingredient": ing_raw,
            "status": NOT_KOSHER,
            "confidence": CONF_HIGH,
            "reason_codes": ["blood_product"],
            "evidence": ["Contains blood product"]
        }

    # 5) Grape products (require supervision)
    if any_word_in_text(ing, GRAPE_PRODUCTS):
        if has_cert:
            reasons.append("grape_product_certified")
            evidence.append("Grape product with kosher certification")
        else:
            return {
                "ingredient": ing_raw,
                "status": REQUIRES_CERTIFICATION,
                "confidence": CONF_MED,
                "reason_codes": ["grape_product_requires_supervision"],
                "evidence": ["Grape/wine product requires kosher supervision"]
            }

    # 6) Meat-dairy mix
    if any_word_in_text(ing, MEAT_DAIRY_MIX):
        return {
            "ingredient": ing_raw,
            "status": NOT_KOSHER,
            "confidence": CONF_HIGH,
            "reason_codes": ["meat_dairy_combination"],
            "evidence": ["Contains meat and dairy combination"]
        }

    # 7) Source-dependent ingredients
    for ing_type, config in SOURCE_DEPENDENT_KOSHER.items():
        if any_word_in_text(ing, config["terms"]):
            # Check for explicitly kosher version
            if any_word_in_text(ing, config["kosher_terms"]):
                reasons.append(f"{ing_type}_kosher")
                evidence.append(f"Kosher {ing_type} source confirmed")
                continue

            # Check for explicitly not kosher version
            if any_word_in_text(ing, config["not_kosher_terms"]):
                return {
                    "ingredient": ing_raw,
                    "status": NOT_KOSHER,
                    "confidence": CONF_HIGH,
                    "reason_codes": [f"{ing_type}_not_kosher"],
                    "evidence": [f"Non-kosher {ing_type} source"]
                }

            # Unknown source - check if it's a known safe variant
            if is_kosher_safe_ingredient(ing):
                reasons.append(f"{ing_type}_plant_source_likely")
                evidence.append(f"{ing_type.title()} appears to be plant-derived")
                continue

            if has_cert:
                reasons.append(f"{ing_type}_certified")
                evidence.append(f"{ing_type.title()} with kosher certification")
            else:
                # For gelatin specifically, be stricter
                if ing_type == "gelatin":
                    return {
                        "ingredient": ing_raw,
                        "status": REQUIRES_CERTIFICATION,
                        "confidence": CONF_LOW,
                        "reason_codes": [f"{ing_type}_source_unknown"],
                        "evidence": [f"{ing_type.title()} source unknown - may be animal-derived"]
                    }
                # For others like glycerin/enzyme, assume plant-based in modern food
                reasons.append(f"{ing_type}_likely_plant")
                evidence.append(f"{ing_type.title()} (commonly plant-derived in modern food)")

    # 8) Check for dairy/meat indicators
    is_dairy = any_word_in_text(ing, ["milk", "cream", "cheese", "butter", "whey", "casein", "lactose"])
    is_meat = any_word_in_text(ing, ["beef", "chicken", "lamb", "turkey", "meat", "poultry"])

    if is_dairy:
        reasons.append("dairy_ingredient")
        evidence.append("Dairy ingredient (affects meat/dairy separation)")

    if is_meat:
        if has_cert:
            reasons.append("meat_kosher_certified")
            evidence.append("Meat ingredient with kosher certification")
        else:
            reasons.append("meat_requires_certification")
            evidence.append("Meat ingredient requires kosher slaughter verification")
            return {
                "ingredient": ing_raw,
                "status": REQUIRES_CERTIFICATION,
                "confidence": CONF_MED,
                "reason_codes": reasons,
                "evidence": evidence
            }

    # Determine final status
    if has_cert:
        return {
            "ingredient": ing_raw,
            "status": KOSHER_CONFIRMED,
            "confidence": CONF_HIGH,
            "reason_codes": reasons if reasons else ["kosher_certified"],
            "evidence": evidence if evidence else ["Kosher certification detected"]
        }

    if reasons:
        return {
            "ingredient": ing_raw,
            "status": KOSHER_CONFIRMED,
            "confidence": CONF_MED,
            "reason_codes": dedupe(reasons),
            "evidence": dedupe(evidence)
        }

    # Check if it's a known kosher-safe ingredient
    if is_kosher_safe_ingredient(ing):
        return {
            "ingredient": ing_raw,
            "status": KOSHER_CONFIRMED,
            "confidence": CONF_HIGH,
            "reason_codes": ["plant_based_kosher"],
            "evidence": ["Plant-based ingredient, inherently kosher"]
        }

    # Default: No issues found
    return {
        "ingredient": ing_raw,
        "status": KOSHER_CONFIRMED,
        "confidence": CONF_MED,
        "reason_codes": ["no_kosher_concerns"],
        "evidence": ["No kosher concerns detected"]
    }


def kosher_tags(result: Dict[str, Any]) -> List[str]:
    """Extract kosher tags from result (pareve, dairy, meat)."""
    tags = []
    evidence = result.get("evidence", [])
    evidence_str = " ".join(evidence).lower()

    if "dairy" in evidence_str:
        tags.append("dairy")
    if "meat" in evidence_str or "poultry" in evidence_str:
        tags.append("meat")
    if not tags:
        tags.append("pareve")

    return tags


def aggregate_product_kosher(ingredient_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate ingredient-level kosher results to product verdict.

    Args:
        ingredient_results: List of ingredient kosher results

    Returns:
        Product-level kosher verdict
    """
    not_kosher_hits = []
    requires_cert_hits = []
    has_dairy = False
    has_meat = False

    for r in ingredient_results:
        if r["status"] == NOT_KOSHER:
            not_kosher_hits.append(r)
        elif r["status"] == REQUIRES_CERTIFICATION:
            requires_cert_hits.append(r)

        # Track dairy/meat for separation rules
        tags = kosher_tags(r)
        if "dairy" in tags:
            has_dairy = True
        if "meat" in tags:
            has_meat = True

    # RULE 1 - NOT KOSHER
    if not_kosher_hits:
        all_reason_codes = set()
        for r in not_kosher_hits:
            for rc in r.get("reason_codes", []):
                all_reason_codes.add(rc)

        return {
            "status": NOT_KOSHER,
            "confidence": CONF_HIGH,
            "reason": "Contains non-kosher ingredient(s).",
            "failing_ingredients": [r["ingredient"] for r in not_kosher_hits],
            "reason_codes": sorted(list(all_reason_codes))
        }

    # RULE 2 - MEAT/DAIRY COMBINATION
    if has_dairy and has_meat:
        return {
            "status": NOT_KOSHER,
            "confidence": CONF_HIGH,
            "reason": "Contains both meat and dairy ingredients.",
            "failing_ingredients": [],
            "reason_codes": ["meat_dairy_combination"]
        }

    # RULE 3 - REQUIRES CERTIFICATION
    if requires_cert_hits:
        all_reason_codes = set()
        for r in requires_cert_hits:
            for rc in r.get("reason_codes", []):
                all_reason_codes.add(rc)

        return {
            "status": REQUIRES_CERTIFICATION,
            "confidence": CONF_LOW,
            "reason": "Contains ingredient(s) requiring kosher certification verification.",
            "failing_ingredients": [r["ingredient"] for r in requires_cert_hits],
            "reason_codes": sorted(list(all_reason_codes))
        }

    # RULE 4 - KOSHER
    return {
        "status": KOSHER_CONFIRMED,
        "confidence": CONF_MED,
        "reason": "All detected ingredients appear kosher.",
        "failing_ingredients": [],
        "reason_codes": []
    }
