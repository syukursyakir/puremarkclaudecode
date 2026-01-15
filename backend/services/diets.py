# ================================================================
# PureMark Backend - Diet Analysis Engines
# Vegan, Vegetarian, Pescetarian compliance evaluation
# ================================================================

from typing import Dict, Any, List
from .helpers import normalize_text, word_in_text, any_word_in_text, dedupe

# Status constants
COMPLIANT = "COMPLIANT"
NOT_COMPLIANT = "NOT_COMPLIANT"
UNCERTAIN = "UNCERTAIN"

CONF_HIGH = "HIGH"
CONF_MED = "MEDIUM"
CONF_LOW = "LOW"

# ================================================================
# Ingredient Categories
# ================================================================

# All meat (land animals and poultry)
MEAT_INGREDIENTS = [
    # Common meats
    "beef", "pork", "chicken", "turkey", "lamb", "veal", "goat", "mutton",
    "duck", "goose", "rabbit", "venison", "bison", "buffalo",
    # Processed meats
    "bacon", "ham", "sausage", "salami", "pepperoni", "prosciutto",
    "hot dog", "bologna", "pastrami", "corned beef", "jerky",
    # Generic terms
    "meat", "poultry", "flesh", "carcass",
    # Byproducts
    "lard", "tallow", "suet", "dripping", "schmaltz",
    "bone broth", "beef broth", "chicken broth", "meat broth",
    "bone meal", "meat extract", "meat powder",
]

# All fish and seafood
FISH_SEAFOOD_INGREDIENTS = [
    # Fish
    "fish", "salmon", "tuna", "cod", "tilapia", "trout", "bass", "halibut",
    "mackerel", "sardine", "anchovy", "herring", "haddock", "pollock",
    "catfish", "carp", "perch", "snapper", "grouper", "flounder", "sole",
    "swordfish", "mahi", "eel", "caviar", "roe",
    # Shellfish
    "shellfish", "shrimp", "prawn", "lobster", "crab", "crayfish", "crawfish",
    "clam", "mussel", "oyster", "scallop", "squid", "calamari", "octopus",
    # Fish products
    "fish sauce", "fish oil", "fish paste", "fish stock", "dashi",
    "omega-3", "fish gelatin", "isinglass", "surimi",
    "worcestershire",  # Contains anchovies
]

# Dairy products
DAIRY_INGREDIENTS = [
    "milk", "cream", "butter", "cheese", "yogurt", "yoghurt", "kefir",
    "whey", "casein", "lactose", "lactalbumin", "lactoglobulin",
    "ghee", "buttermilk", "sour cream", "creme fraiche", "mascarpone",
    "ricotta", "mozzarella", "parmesan", "cheddar", "brie", "feta",
    "ice cream", "gelato", "custard", "pudding",
    "milk powder", "dried milk", "skim milk", "whole milk",
    "condensed milk", "evaporated milk",
    "dairy", "milkfat", "milk fat", "milk solids",
]

# Eggs
EGG_INGREDIENTS = [
    "egg", "eggs", "egg white", "egg yolk", "albumin", "albumen",
    "globulin", "lysozyme", "mayonnaise", "meringue", "aioli",
    "ovalbumin", "ovomucin", "ovomucoid", "ovovitellin",
    "egg powder", "dried egg", "liquid egg",
]

# Honey and bee products
BEE_PRODUCTS = [
    "honey", "bee pollen", "royal jelly", "beeswax", "propolis",
]

# Animal-derived additives (non-vegan/vegetarian)
ANIMAL_DERIVED_ADDITIVES = [
    # Gelatin
    "gelatin", "gelatine",
    # Colorants
    "carmine", "cochineal", "e120", "natural red 4",
    "shellac", "e904",
    # Other
    "isinglass", "rennet", "animal rennet",
    "bone char", "bone phosphate",
    "lanolin", "tallow",
    "castoreum",
    "civet",
    "musk",
    "ambergris",
    "l-cysteine",  # Often from feathers/hair
]

# Possibly animal-derived (uncertain source)
POSSIBLY_ANIMAL_DERIVED = [
    "glycerin", "glycerol", "e422",
    "stearic acid", "e570",
    "mono and diglycerides", "e471",
    "natural flavors", "natural flavoring",
    "vitamin d3", "cholecalciferol",
    "omega-3",  # Could be fish or algae
    "lecithin",  # Usually soy, sometimes egg
]

# Known vegan-safe versions
VEGAN_SAFE_VERSIONS = [
    "vegetable glycerin", "plant glycerin",
    "soy lecithin", "sunflower lecithin", "rapeseed lecithin",
    "vegan", "plant-based", "dairy-free", "egg-free",
    "algae omega", "algal omega", "flaxseed omega",
    "agar", "agar-agar", "pectin", "carrageenan",
    "vegetable rennet", "microbial rennet",
    "vegan d3", "lichen d3", "plant d3",
]


# ================================================================
# Vegan Analysis
# ================================================================

def evaluate_vegan(ingredient_text: str) -> Dict[str, Any]:
    """
    Evaluate vegan compliance of an ingredient.
    Vegans avoid ALL animal products including dairy, eggs, honey.
    """
    ing_raw = ingredient_text or ""
    ing = normalize_text(ing_raw)

    # Check for explicitly vegan versions first
    if any_word_in_text(ing, VEGAN_SAFE_VERSIONS):
        return {
            "ingredient": ing_raw,
            "status": COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["explicitly_vegan"],
            "evidence": ["Explicitly vegan/plant-based ingredient"]
        }

    # Check meat
    if any_word_in_text(ing, MEAT_INGREDIENTS):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["contains_meat"],
            "evidence": ["Contains meat - not vegan"]
        }

    # Check fish/seafood
    if any_word_in_text(ing, FISH_SEAFOOD_INGREDIENTS):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["contains_seafood"],
            "evidence": ["Contains fish/seafood - not vegan"]
        }

    # Check dairy
    if any_word_in_text(ing, DAIRY_INGREDIENTS):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["contains_dairy"],
            "evidence": ["Contains dairy - not vegan"]
        }

    # Check eggs
    if any_word_in_text(ing, EGG_INGREDIENTS):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["contains_egg"],
            "evidence": ["Contains egg - not vegan"]
        }

    # Check honey/bee products
    if any_word_in_text(ing, BEE_PRODUCTS):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["contains_bee_product"],
            "evidence": ["Contains honey/bee product - not vegan"]
        }

    # Check animal-derived additives
    if any_word_in_text(ing, ANIMAL_DERIVED_ADDITIVES):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["animal_derived_additive"],
            "evidence": ["Contains animal-derived additive"]
        }

    # Check possibly animal-derived
    if any_word_in_text(ing, POSSIBLY_ANIMAL_DERIVED):
        return {
            "ingredient": ing_raw,
            "status": UNCERTAIN,
            "confidence": CONF_LOW,
            "reason_codes": ["possibly_animal_derived"],
            "evidence": ["May be animal-derived - source unclear"]
        }

    # Default: Appears vegan
    return {
        "ingredient": ing_raw,
        "status": COMPLIANT,
        "confidence": CONF_HIGH,
        "reason_codes": ["plant_based"],
        "evidence": ["Plant-based ingredient"]
    }


# ================================================================
# Vegetarian Analysis
# ================================================================

def evaluate_vegetarian(ingredient_text: str) -> Dict[str, Any]:
    """
    Evaluate vegetarian compliance of an ingredient.
    Vegetarians avoid meat and fish but allow dairy, eggs, honey.
    """
    ing_raw = ingredient_text or ""
    ing = normalize_text(ing_raw)

    # Check for explicitly vegetarian versions first
    if any_word_in_text(ing, ["vegetarian", "vegan", "plant-based"]):
        return {
            "ingredient": ing_raw,
            "status": COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["explicitly_vegetarian"],
            "evidence": ["Explicitly vegetarian/plant-based"]
        }

    # Check meat
    if any_word_in_text(ing, MEAT_INGREDIENTS):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["contains_meat"],
            "evidence": ["Contains meat - not vegetarian"]
        }

    # Check fish/seafood
    if any_word_in_text(ing, FISH_SEAFOOD_INGREDIENTS):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["contains_seafood"],
            "evidence": ["Contains fish/seafood - not vegetarian"]
        }

    # Check animal-derived additives (except those acceptable to some vegetarians)
    # Gelatin and carmine are not vegetarian
    strict_animal_additives = [
        "gelatin", "gelatine", "carmine", "cochineal", "e120",
        "isinglass", "animal rennet", "bone char", "bone phosphate",
        "lard", "tallow", "suet",
    ]
    if any_word_in_text(ing, strict_animal_additives):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["animal_derived"],
            "evidence": ["Contains animal-derived ingredient"]
        }

    # Check possibly animal-derived (uncertain)
    uncertain_for_vegetarian = ["glycerin", "glycerol", "stearic acid", "mono and diglycerides"]
    if any_word_in_text(ing, uncertain_for_vegetarian):
        if any_word_in_text(ing, ["vegetable", "plant"]):
            return {
                "ingredient": ing_raw,
                "status": COMPLIANT,
                "confidence": CONF_HIGH,
                "reason_codes": ["plant_derived"],
                "evidence": ["Plant-derived source confirmed"]
            }
        return {
            "ingredient": ing_raw,
            "status": UNCERTAIN,
            "confidence": CONF_LOW,
            "reason_codes": ["possibly_animal_derived"],
            "evidence": ["May be animal-derived - source unclear"]
        }

    # Default: Appears vegetarian (dairy, eggs, honey are OK)
    return {
        "ingredient": ing_raw,
        "status": COMPLIANT,
        "confidence": CONF_HIGH,
        "reason_codes": ["vegetarian_compliant"],
        "evidence": ["Vegetarian-compliant ingredient"]
    }


# ================================================================
# Pescetarian Analysis
# ================================================================

def evaluate_pescetarian(ingredient_text: str) -> Dict[str, Any]:
    """
    Evaluate pescetarian compliance of an ingredient.
    Pescetarians avoid meat but allow fish, seafood, dairy, eggs, honey.
    """
    ing_raw = ingredient_text or ""
    ing = normalize_text(ing_raw)

    # Check meat (the only thing pescetarians avoid)
    if any_word_in_text(ing, MEAT_INGREDIENTS):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["contains_meat"],
            "evidence": ["Contains meat - not pescetarian"]
        }

    # Fish and seafood are allowed for pescetarians
    if any_word_in_text(ing, FISH_SEAFOOD_INGREDIENTS):
        return {
            "ingredient": ing_raw,
            "status": COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["fish_allowed"],
            "evidence": ["Fish/seafood - allowed for pescetarians"]
        }

    # Check animal-derived additives from land animals
    meat_derived = ["lard", "tallow", "suet", "beef gelatin", "pork gelatin", "bone broth", "meat extract"]
    if any_word_in_text(ing, meat_derived):
        return {
            "ingredient": ing_raw,
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason_codes": ["meat_derived"],
            "evidence": ["Derived from land animal - not pescetarian"]
        }

    # Gelatin is uncertain (could be fish or meat)
    if any_word_in_text(ing, ["gelatin", "gelatine"]):
        if any_word_in_text(ing, ["fish gelatin"]):
            return {
                "ingredient": ing_raw,
                "status": COMPLIANT,
                "confidence": CONF_HIGH,
                "reason_codes": ["fish_gelatin"],
                "evidence": ["Fish gelatin - allowed for pescetarians"]
            }
        if any_word_in_text(ing, ["pork", "beef", "meat"]):
            return {
                "ingredient": ing_raw,
                "status": NOT_COMPLIANT,
                "confidence": CONF_HIGH,
                "reason_codes": ["meat_gelatin"],
                "evidence": ["Meat-derived gelatin - not pescetarian"]
            }
        return {
            "ingredient": ing_raw,
            "status": UNCERTAIN,
            "confidence": CONF_LOW,
            "reason_codes": ["gelatin_source_unknown"],
            "evidence": ["Gelatin source unknown - may be meat-derived"]
        }

    # Default: Compliant (dairy, eggs, honey, plants all OK)
    return {
        "ingredient": ing_raw,
        "status": COMPLIANT,
        "confidence": CONF_HIGH,
        "reason_codes": ["pescetarian_compliant"],
        "evidence": ["Pescetarian-compliant ingredient"]
    }


# ================================================================
# Aggregation Functions
# ================================================================

def aggregate_diet_results(
    ingredient_results: List[Dict[str, Any]],
    diet_name: str
) -> Dict[str, Any]:
    """
    Aggregate ingredient-level results to product verdict.

    Args:
        ingredient_results: List of ingredient diet results
        diet_name: Name of diet for display

    Returns:
        Product-level diet verdict
    """
    not_compliant = []
    uncertain = []

    for r in ingredient_results:
        if r["status"] == NOT_COMPLIANT:
            not_compliant.append(r)
        elif r["status"] == UNCERTAIN:
            uncertain.append(r)

    # NOT COMPLIANT
    if not_compliant:
        all_reason_codes = set()
        for r in not_compliant:
            for rc in r.get("reason_codes", []):
                all_reason_codes.add(rc)

        return {
            "status": NOT_COMPLIANT,
            "confidence": CONF_HIGH,
            "reason": f"Contains non-{diet_name} ingredient(s).",
            "failing_ingredients": [r["ingredient"] for r in not_compliant],
            "reason_codes": sorted(list(all_reason_codes))
        }

    # UNCERTAIN
    if uncertain:
        all_reason_codes = set()
        for r in uncertain:
            for rc in r.get("reason_codes", []):
                all_reason_codes.add(rc)

        return {
            "status": UNCERTAIN,
            "confidence": CONF_LOW,
            "reason": f"Contains ingredient(s) with uncertain {diet_name} status.",
            "failing_ingredients": [r["ingredient"] for r in uncertain],
            "reason_codes": sorted(list(all_reason_codes))
        }

    # COMPLIANT
    return {
        "status": COMPLIANT,
        "confidence": CONF_HIGH,
        "reason": f"All ingredients appear {diet_name}-compliant.",
        "failing_ingredients": [],
        "reason_codes": []
    }


def aggregate_vegan(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    return aggregate_diet_results(results, "vegan")


def aggregate_vegetarian(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    return aggregate_diet_results(results, "vegetarian")


def aggregate_pescetarian(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    return aggregate_diet_results(results, "pescetarian")
