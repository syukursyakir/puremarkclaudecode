# ================================================================
#  PUREMARK BACKEND — OCR + AI SCORING + HALAL/KOSHER ENGINE
# ================================================================
#
# Dependencies:
#   pip install flask flask-cors openai
#   pip install paddleocr paddlepaddle opencv-python pillow numpy
#
# ================================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import traceback
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# ================================================================
#  LOGGING CONFIGURATION
# ================================================================
# Configure logging based on environment
log_level = logging.DEBUG if os.getenv("DEBUG", "false").lower() == "true" else logging.INFO
log_format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"

logging.basicConfig(
    level=log_level,
    format=log_format,
    handlers=[
        logging.StreamHandler(),  # Console output
    ]
)

# Create logger for this module
logger = logging.getLogger("puremark")
logger.setLevel(log_level)

# Reduce noise from third-party libraries
logging.getLogger("paddleocr").setLevel(logging.WARNING)
logging.getLogger("ppocr").setLevel(logging.WARNING)
logging.getLogger("PIL").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
import re
import json
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from io import BytesIO

# PaddleOCR + Image processing
import cv2
import numpy as np
from PIL import Image
from paddleocr import PaddleOCR

# ---------------- INIT OPENAI CLIENT ----------------
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------------- INIT PADDLEOCR (SINGLETON) ----------------
# PaddleOCR supports 80+ languages. For English+French, use "en" (covers Latin scripts).
# The "en" model handles all Latin-based languages including French, Spanish, German, etc.
# TODO: For Arabic labels, add separate PaddleOCR(lang="ar") instance.
#
# PaddleOCR v3+ Configuration:
# - use_angle_cls=True: Enables text angle classification for rotated labels
# - det_db_thresh=0.3: Detection threshold (lower = more detections, may include noise)
# - det_db_box_thresh=0.5: Box threshold (higher = stricter box filtering)
# PaddleOCR v3.3+ uses simplified API
logger.info("Loading PaddleOCR model (this may take a moment on first run)...")
_paddle_ocr = PaddleOCR(
    lang="en",
)
logger.info("PaddleOCR model loaded successfully.")

# Thread pool executor for parallel OCR operations
_executor = ThreadPoolExecutor(max_workers=4)

app = Flask(__name__)
CORS(app)

# ================================================================
#  HALAL CONFIG LOADER
# ================================================================

# Cache for loaded configs
_halal_config_cache = {}

def get_config_path(filename: str) -> str:
    """Get the full path to a config file in the halal_config directory."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "halal_config", filename)

def load_halal_config(config_name: str) -> dict:
    """
    Load a halal config JSON file with caching.
    
    Args:
        config_name: Name of the config file (e.g., "e_numbers.json")
    
    Returns:
        Parsed JSON as a dictionary
    """
    if config_name in _halal_config_cache:
        return _halal_config_cache[config_name]
    
    config_path = get_config_path(config_name)
    
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            _halal_config_cache[config_name] = config
            logger.info(f"[CONFIG] Loaded {config_name}: {len(config)} categories")
            return config
    except FileNotFoundError:
        logger.info(f"[CONFIG] WARNING: {config_name} not found at {config_path}")
        return {}
    except json.JSONDecodeError as e:
        logger.info(f"[CONFIG] ERROR: Invalid JSON in {config_name}: {e}")
        return {}

def get_e_number_status(e_num: str) -> Tuple[Optional[str], Optional[dict]]:
    """
    Look up an E-number in the config and return its halal status.
    
    Args:
        e_num: The E-number without the 'E' prefix (e.g., "471")
    
    Returns:
        Tuple of (status, details) where:
        - status: "HARAM", "MUSHBOOH", "HALAL", or None if not found
        - details: Dict with name, reason, reason_code (or None)
    """
    config = load_halal_config("e_numbers.json")
    
    # Check always_haram first
    if e_num in config.get("always_haram", {}):
        details = config["always_haram"][e_num]
        return ("HARAM", details)
    
    # Check source_dependent (mushbooh)
    if e_num in config.get("source_dependent", {}):
        details = config["source_dependent"][e_num]
        return ("MUSHBOOH", details)
    
    # Check halal
    if e_num in config.get("halal", {}):
        details = config["halal"][e_num]
        return ("HALAL", details)
    
    # Not found in config
    return (None, None)


def get_alcohol_terms() -> dict:
    """
    Load alcohol detection terms from JSON config.
    
    Returns:
        Dict with categories: explicit_alcohols, alcoholic_beverages, 
        alcohol_processing, high_risk_extracts, halal_alternatives, low_risk_fermented
    """
    return load_halal_config("alcohol.json")


def check_alcohol_status(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Check if text contains alcohol-related terms.
    
    Returns:
        Tuple of (status, reason_code, reason) where:
        - status: "HARAM", "HALAL", or None if no match
        - reason_code: The specific reason code
        - reason: Human-readable explanation
    """
    config = get_alcohol_terms()
    text_lower = normalize_text(text)
    
    # Check halal alternatives FIRST (e.g., "vanilla bean" should not trigger alcohol warning)
    halal_alts = config.get("halal_alternatives", {})
    if any(word_in_text(text_lower, term) for term in halal_alts.get("terms", [])):
        return ("HALAL", halal_alts.get("reason_code"), halal_alts.get("reason"))
    
    # Check low-risk fermented (vinegar, soy sauce, etc.) - these are halal
    low_risk = config.get("low_risk_fermented", {})
    if any(word_in_text(text_lower, term) for term in low_risk.get("terms", [])):
        return ("HALAL", low_risk.get("reason_code"), low_risk.get("reason"))
    
    # Check explicit alcohols
    explicit = config.get("explicit_alcohols", {})
    if any(word_in_text(text_lower, term) for term in explicit.get("terms", [])):
        return ("HARAM", explicit.get("reason_code"), explicit.get("reason"))
    
    # Check alcoholic beverages
    beverages = config.get("alcoholic_beverages", {})
    if any(word_in_text(text_lower, term) for term in beverages.get("terms", [])):
        return ("HARAM", beverages.get("reason_code"), beverages.get("reason"))
    
    # Check alcohol processing terms
    processing = config.get("alcohol_processing", {})
    if any(word_in_text(text_lower, term) for term in processing.get("terms", [])):
        return ("HARAM", processing.get("reason_code"), processing.get("reason"))
    
    # Check high-risk extracts (vanilla extract, etc.)
    extracts = config.get("high_risk_extracts", {})
    if any(word_in_text(text_lower, term) for term in extracts.get("terms", [])):
        return ("HARAM", extracts.get("reason_code"), extracts.get("reason"))
    
    # No alcohol-related terms found
    return (None, None, None)


def get_animal_derivatives_config() -> dict:
    """Load animal derivatives detection config from JSON."""
    return load_halal_config("animal_derivatives.json")


def get_certifiers_config() -> dict:
    """Load halal certifiers config from JSON."""
    return load_halal_config("certifiers.json")


def get_allergens_config() -> dict:
    """Load allergens detection config from JSON."""
    return load_halal_config("allergens.json")


def get_allergen_terms(allergen_type: str) -> List[str]:
    """
    Get all terms that indicate an ingredient contains the specified allergen.
    
    Args:
        allergen_type: The allergen type (e.g., "soy", "milk", "egg")
    
    Returns:
        List of all terms (direct + derived) that indicate this allergen
    """
    config = get_allergens_config()
    
    allergen_type_lower = allergen_type.lower().strip()
    
    # Handle common variations
    allergen_map = {
        "soy": "soy",
        "soya": "soy",
        "dairy": "milk",
        "lactose": "milk",
        "eggs": "egg",
        "peanuts": "peanut",
        "nuts": "tree_nuts",
        "tree nuts": "tree_nuts",
        "gluten": "wheat",
        "crustacean": "shellfish",
        "crustaceans": "shellfish",
    }
    
    # Normalize the allergen type
    normalized = allergen_map.get(allergen_type_lower, allergen_type_lower)
    
    allergen_data = config.get(normalized, {})
    
    if not allergen_data:
        # If not in our config, return just the original term
        return [allergen_type_lower]
    
    # Combine direct terms and derived ingredients
    all_terms = []
    all_terms.extend(allergen_data.get("direct_terms", []))
    all_terms.extend(allergen_data.get("derived_ingredients", []))
    
    return all_terms


def check_halal_certification(text: str) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Check if text contains halal certification signals.
    
    Returns:
        Tuple of (strength, certifier_name, region) where:
        - strength: "HIGH", "MEDIUM", "WEAK", or "NONE"
        - certifier_name: Name of the certifier if found, else None
        - region: Region of the certifier if found, else None
    """
    config = get_certifiers_config()
    text_lower = normalize_text(text)
    
    # 1) Check for specific certifiers (strongest signal)
    strong_certifiers = config.get("strong_certifiers", {})
    for region, certifiers in strong_certifiers.items():
        for cert_code, cert_data in certifiers.items():
            terms = cert_data.get("terms", [])
            if any(word_in_text(text_lower, term) for term in terms):
                strength = cert_data.get("strength", "HIGH")
                full_name = cert_data.get("full_name", cert_code)
                return (strength, full_name, region)
    
    # 2) Check for generic strong terms
    generic_strong = config.get("generic_strong_terms", [])
    if any(word_in_text(text_lower, term) for term in generic_strong):
        return ("HIGH", "Generic halal certification", None)
    
    # 3) Check for certification phrases
    cert_phrases = config.get("certification_phrases", {}).get("strong", [])
    if any(word_in_text(text_lower, phrase) for phrase in cert_phrases):
        return ("MEDIUM", "Certification phrase detected", None)
    
    # 4) Check for weak signals
    weak_signals = config.get("weak_signals", {}).get("terms", [])
    if any(word_in_text(text_lower, term) for term in weak_signals):
        return ("WEAK", None, None)
    
    # No certification signal found
    return ("NONE", None, None)


def check_animal_derivative_status(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Check if text contains animal derivative terms and determine halal status.
    
    This function handles source-aware detection for ingredients like gelatin,
    glycerin, enzymes, etc. - similar to how lecithin is handled.
    
    Returns:
        Tuple of (status, reason_code, reason) where:
        - status: "HARAM", "HALAL", "MUSHBOOH", or None if no match
        - reason_code: The specific reason code
        - reason: Human-readable explanation
    """
    config = get_animal_derivatives_config()
    text_lower = normalize_text(text)
    
    # 1) Check always_haram first (pork, blood, insects)
    always_haram = config.get("always_haram", {})
    for category, data in always_haram.items():
        if any(word_in_text(text_lower, term) for term in data.get("terms", [])):
            return ("HARAM", data.get("reason_code"), data.get("reason"))
    
    # 2) Check source-dependent ingredients with source detection
    source_dependent = config.get("source_dependent", {})
    for ingredient_type, data in source_dependent.items():
        generic_terms = data.get("generic_terms", [])
        
        # Check if this ingredient type is present
        if any(word_in_text(text_lower, term) for term in generic_terms):
            sources = data.get("sources", {})
            
            # Check each possible source
            for source_name, source_data in sources.items():
                source_terms = source_data.get("terms", [])
                if any(word_in_text(text_lower, term) for term in source_terms):
                    status = source_data.get("status", "MUSHBOOH")
                    reason = source_data.get("reason", f"{source_name} source detected")
                    # Use source-specific reason code to avoid "mushbooh" in halal cases
                    if status == "HALAL":
                        reason_code = f"{ingredient_type}_{source_name}_halal"
                    elif status == "HARAM":
                        reason_code = f"{ingredient_type}_{source_name}_haram"
                    else:
                        reason_code = f"{ingredient_type}_{source_name}_mushbooh"
                    return (status, reason_code, reason)
            
            # No specific source found - use default
            default_status = data.get("default_status", "MUSHBOOH")
            default_reason = data.get("default_reason", f"{ingredient_type} with unknown source")
            reason_code = data.get("reason_code", f"{ingredient_type}_source_unknown")
            return (default_status, reason_code, default_reason)
    
    # 3) Check processed dairy
    dairy = config.get("processed_dairy", {})
    if any(word_in_text(text_lower, term) for term in dairy.get("terms", [])):
        # Check for halal qualifiers
        halal_qualifiers = dairy.get("halal_qualifiers", [])
        if any(word_in_text(text_lower, qual) for qual in halal_qualifiers):
            return ("HALAL", "dairy_halal_qualified", "Dairy with halal qualifier detected")
        return (dairy.get("default_status", "MUSHBOOH"), 
                dairy.get("reason_code"), 
                dairy.get("reason"))
    
    # 4) Check starter cultures
    cultures = config.get("starter_cultures", {})
    if any(word_in_text(text_lower, term) for term in cultures.get("terms", [])):
        return (cultures.get("default_status", "MUSHBOOH"),
                cultures.get("reason_code"),
                cultures.get("reason"))
    
    # 5) Check other animal-derived ingredients
    other = config.get("other_animal_derived", {})
    for category, data in other.items():
        if any(word_in_text(text_lower, term) for term in data.get("terms", [])):
            return (data.get("default_status", "MUSHBOOH"),
                    data.get("reason_code"),
                    data.get("reason"))
    
    # No animal derivative found
    return (None, None, None)


# ================================================================
#  HELPERS
# ================================================================


def is_inherently_halal(ing: str) -> bool:
    return any_word_in_text(ing, INHERENTLY_HALAL_PLANT_SIMPLE)



def safe_extract_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    match = re.search(r"\{.*\}", cleaned, flags=re.S)
    if not match:
        raise ValueError("Model did not return a JSON object.")
    return json.loads(match.group(0))








# ============================================================
# HALAL RULE ENGINE (STRICT / CERTIFIER-GRADE)
# ============================================================

# ---------- Kosher status constants ----------
KOSHER_CONFIRMED = "KOSHER_CONFIRMED"
NOT_KOSHER = "NOT_KOSHER"
REQUIRES_KOSHER_CERTIFICATION = "REQUIRES_KOSHER_CERTIFICATION"

CONF_KOSHER_HIGH = "HIGH"
CONF_KOSHER_MED = "MEDIUM"
CONF_KOSHER_LOW = "LOW"

# ---------- Halal status constants ----------
HALAL_CONFIRMED = "HALAL_CONFIRMED"
HARAM = "HARAM"
MUSHBOOH = "MUSHBOOH"
NOT_HALAL_UNVERIFIED = "NOT_HALAL_UNVERIFIED"  # used when strict_mode treats mushbooh as fail

# ---------- Confidence constants ----------
CONF_HIGH = "HIGH"
CONF_MED = "MEDIUM"
CONF_LOW = "LOW"


@dataclass
class HalalResult:
    ingredient: str
    status: str
    confidence: str
    reason_codes: List[str] = field(default_factory=list)
    evidence: List[str] = field(default_factory=list)  # human-readable highlights

@dataclass
class KosherResult:
    ingredient: str
    status: str
    confidence: str
    reason_codes: List[str] = field(default_factory=list)
    evidence: List[str] = field(default_factory=list)


# ============================================================
# Text helpers (safe, strict)
# ============================================================



def kosher_tags(result: KosherResult) -> List[str]:
    tags = []

    if result.status == NOT_KOSHER:
        tags.append("Not Kosher")

    if result.status == REQUIRES_KOSHER_CERTIFICATION:
        tags.append("Requires Kosher Certification")

    if any("grape" in rc for rc in result.reason_codes):
        tags.append("Grape Product")

    if any("source_dependent" in rc for rc in result.reason_codes):
        tags.append("Source Dependent")


    return tags

def normalize_text(s: str) -> str:
    if not s:
        return ""
    s = s.lower().strip()
    # normalize common punctuation and separators
    s = s.replace("–", "-").replace("—", "-").replace("’", "'")
    s = re.sub(r"\s+", " ", s)
    return s


def word_in_text(text: str, phrase: str) -> bool:
    """
    Strict-ish phrase match with word boundaries where possible.
    Works for phrases like "vanilla extract" and tokens like "gelatin".
    """
    text = normalize_text(text)
    phrase = normalize_text(phrase)

    # exact substring check first (covers multi-word phrases)
    if phrase in text:
        # for single-token words, ensure it's a word boundary
        if " " not in phrase and phrase.isalnum():
            return re.search(rf"\b{re.escape(phrase)}\b", text) is not None
        return True

    # fall back to boundary-based for single tokens
    if " " not in phrase and phrase.isalnum():
        return re.search(rf"\b{re.escape(phrase)}\b", text) is not None

    return False


def any_word_in_text(text: str, phrases: List[str]) -> bool:
    return any(word_in_text(text, p) for p in phrases)


def extract_enumbers(text: str) -> List[str]:
    """
    Extract E numbers like E471, E-471, 471 (when clearly marked), etc.
    Returns normalized numeric strings (e.g., "471").
    """
    text = normalize_text(text)

    found = set()

    # E471 / E-471 / e 471
    for m in re.finditer(r"\be\s*[-]?\s*(\d{3,4})\b", text):
        found.add(m.group(1))

    # also catch "e-number 471" / "e number 471"
    for m in re.finditer(r"\be\s*number\s*(\d{3,4})\b", text):
        found.add(m.group(1))

    # DO NOT blindly treat any bare "471" as E-number; too many false hits.
    return sorted(found)


def contains_enumber(text: str, e_num: str) -> bool:
    return e_num in extract_enumbers(text)


# ============================================================
# Certification detection (strict: only accept strong signals)
# ============================================================

def is_strong_kosher_cert_signal(text: str) -> bool:
    t = normalize_text(text)
    strong = [
        "kosher certified",
        "certified kosher",
        "ou kosher", "ou",
        "ok kosher", "kof-k",
        "star-k", "crc kosher", "badatz"
    ]
    return any_word_in_text(t, strong)


def is_strong_halal_cert_signal(text: str) -> bool:
    """
    Strict: only treat as confirmed if we see strong terms.
    "halal" alone is too weak (could be marketing).
    
    Now uses certifiers.json for comprehensive global certifier detection.
    """
    strength, certifier, region = check_halal_certification(text)
    return strength in ("HIGH", "MEDIUM")


def is_weak_halal_signal(text: str) -> bool:
    """
    Weak signals that should NOT flip to HALAL_CONFIRMED, but can reduce uncertainty slightly.
    
    Now uses certifiers.json for weak signal detection.
    """
    strength, certifier, region = check_halal_certification(text)
    return strength == "WEAK"


def get_halal_certification_details(text: str) -> dict:
    """
    Get detailed halal certification information.
    
    Returns:
        Dict with:
        - is_certified: bool
        - strength: "HIGH", "MEDIUM", "WEAK", or "NONE"
        - certifier: Name of certifier if found
        - region: Region of certifier if found
    """
    strength, certifier, region = check_halal_certification(text)
    return {
        "is_certified": strength in ("HIGH", "MEDIUM"),
        "strength": strength,
        "certifier": certifier,
        "region": region
    }


# ============================================================
# LECITHIN SOURCE DETECTION (LANGUAGE-AWARE)
# ============================================================

# Lecithin source mapping - keys are terms that indicate a specific source
LECITHIN_SOURCES = {
    # Sunflower variants (multiple languages)
    "sunflower": "sunflower",
    "tournesol": "sunflower",      # French
    "sonnenblume": "sunflower",    # German
    "girasol": "sunflower",        # Spanish
    "girasole": "sunflower",       # Italian
    
    # Soy variants (multiple languages)
    "soy": "soy",
    "soya": "soy",
    "soja": "soy",                 # French/German/Spanish
    
    # Rapeseed / Canola variants
    "rapeseed": "rapeseed",
    "colza": "rapeseed",           # French
    "raps": "rapeseed",            # German
    "canola": "rapeseed",
    
    # Egg variants
    "egg": "egg",
    "oeuf": "egg",                 # French
    "ei": "egg",                   # German
    "huevo": "egg",                # Spanish
    "uovo": "egg",                 # Italian
}

# Lecithin halal status by source
# Conservative approach: only sunflower and rapeseed are inherently halal
# Soy lecithin processing may involve alcohol extraction - needs verification
LECITHIN_HALAL_STATUS = {
    "sunflower": "HALAL",           # Plant-based, inherently halal
    "soy": "UNVERIFIED",            # Plant-based BUT processing may involve alcohol - needs certification
    "rapeseed": "HALAL",            # Plant-based, inherently halal
    "egg": "HALAL",                 # Halal (eggs are halal), but allergen
    "unspecified": "UNVERIFIED",    # Unknown source, needs verification
}

# Lecithin allergen mapping
LECITHIN_ALLERGENS = {
    "soy": "soy",
    "egg": "egg",
}


def detect_lecithin_source(ingredient_text: str) -> Tuple[bool, str, str]:
    """
    Detect if ingredient contains lecithin and identify its source.
    
    Returns:
        Tuple of (is_lecithin, source, explanation)
        - is_lecithin: True if lecithin is detected
        - source: "sunflower", "soy", "rapeseed", "egg", or "unspecified"
        - explanation: Human-readable explanation
    
    Examples:
        - "lecithine de tournesol" -> (True, "sunflower", "Sunflower lecithin detected")
        - "soy lecithin" -> (True, "soy", "Soy lecithin detected")
        - "lecithin" -> (True, "unspecified", "Lecithin with unspecified source")
        - "sugar" -> (False, None, None)
    """
    text = normalize_text(ingredient_text)
    
    # Check if this ingredient contains lecithin
    lecithin_terms = [
        "lecithin", "lecithine", "lécithine", "lecitina",  # various spellings
        "e322"  # E-number for lecithin
    ]
    
    is_lecithin = any(term in text for term in lecithin_terms) or contains_enumber(text, "322")
    
    if not is_lecithin:
        return (False, None, None)
    
    # Try to identify the source
    detected_source = None
    
    for source_term, source_type in LECITHIN_SOURCES.items():
        if source_term in text:
            detected_source = source_type
            break
    
    # If no specific source found, it's unspecified
    if detected_source is None:
        return (True, "unspecified", "Lecithin with unspecified source")
    
    # Build explanation
    source_names = {
        "sunflower": "Sunflower lecithin",
        "soy": "Soy lecithin",
        "rapeseed": "Rapeseed/canola lecithin",
        "egg": "Egg lecithin",
    }
    
    explanation = f"{source_names.get(detected_source, detected_source.title() + ' lecithin')} detected"
    
    return (True, detected_source, explanation)


def get_lecithin_allergens(lecithin_source: str) -> List[str]:
    """
    Return allergens associated with a lecithin source.
    
    Only soy lecithin and egg lecithin are allergens.
    Sunflower/rapeseed lecithin are NOT allergens.
    """
    if lecithin_source in LECITHIN_ALLERGENS:
        return [LECITHIN_ALLERGENS[lecithin_source]]
    return []


def detect_lecithin_source_combined(original_text: str, normalized_text: str) -> Tuple[bool, str, str]:
    """
    Detect lecithin source by checking BOTH original and normalized text.
    
    This fixes the issue where GPT incorrectly normalizes "lécithine de tournesol"
    to "soy lecithin". We prioritize the original text for source detection since
    it contains the actual language-specific source indicator.
    
    Returns:
        Tuple of (is_lecithin, source, explanation)
    """
    # First check the original text (more reliable for source detection)
    is_lecithin_orig, source_orig, explanation_orig = detect_lecithin_source(original_text)
    
    # Then check normalized text
    is_lecithin_norm, source_norm, explanation_norm = detect_lecithin_source(normalized_text)
    
    # If neither contains lecithin, return early
    if not is_lecithin_orig and not is_lecithin_norm:
        return (False, None, None)
    
    # Prioritize original text source if it's specific (not unspecified)
    # This catches cases where GPT incorrectly translates the source
    if is_lecithin_orig and source_orig and source_orig != "unspecified":
        return (True, source_orig, f"{explanation_orig} (from original text)")
    
    # Fall back to normalized text source
    if is_lecithin_norm and source_norm and source_norm != "unspecified":
        return (True, source_norm, f"{explanation_norm} (from normalized text)")
    
    # If both are lecithin but source is unspecified in both
    if is_lecithin_orig or is_lecithin_norm:
        return (True, "unspecified", "Lecithin with unspecified source")
    
    return (False, None, None)


# ============================================================
# Halal knowledge base (strict, conservative)
# ============================================================

# Explicitly haram animal indicators
# NOTE: Animal derivatives are now loaded from halal_config/animal_derivatives.json
# These legacy lists are kept for backward compatibility fallback
HARAM_ANIMAL_TERMS_LEGACY = [
    "pork", "porcine", "swine", "pig", "boar",
    "lard", "ham", "bacon",
    "gelatin (porcine)", "porcine gelatin",
]
HARAM_CONCEPT_TERMS_LEGACY = [
    "blood", "blood plasma", "hemoglobin",
    "carrion",
]

# Alcohol / intoxicants (strict)
# NOTE: Alcohol terms are now loaded from halal_config/alcohol.json
# These legacy lists are kept for backward compatibility fallback
ALCOHOL_EXPLICIT_LEGACY = [
    "alcohol", "ethanol",
    "wine", "beer", "rum", "whisky", "whiskey", "vodka", "brandy", "gin", "tequila",
    "liqueur", "liquor",
]
ALCOHOL_PROCESS_CUES_LEGACY = [
    "alcohol extract", "extracted with alcohol", "ethanolic extract",
    "tincture", "in alcohol", "alcohol carrier", "alcohol based", "alcohol-based",
]
ALCOHOL_RISK_EXTRACTS_LEGACY = [
    "vanilla extract", "rum extract", "brandy extract", "wine extract",
]

# Mushbooh buckets (source dependent / process dependent)
# NOTE: These are now loaded from halal_config/animal_derivatives.json
# Legacy lists kept for backward compatibility
MUSHBOOH_ANIMAL_DERIVATIVES_LEGACY = [
    "gelatin", "glycerin", "glycerine", "glycerol",
    "mono and diglycerides", "monoglycerides", "diglycerides",
    "fatty acids", "stearic acid", "tallow", "shortening",
]
MUSHBOOH_ENZYMES_CULTURES_LEGACY = [
    "rennet", "enzymes", "enzyme", "pepsin", "lipase",
    "cultures", "culture", "starter culture",
]
MUSHBOOH_DAIRY_PROCESSED_LEGACY = [
    "cheese", "whey", "whey powder", "casein", "caseinate",
    "milk powder", "skim milk powder", "cream powder",
]

# Flavourings are mushbooh unless certified (common alcohol carrier risk + undisclosed sources)
MUSHBOOH_FLAVOURINGS = [
    "flavour", "flavouring", "flavor", "flavoring",
    "natural flavour", "natural flavor",
    "artificial flavour", "artificial flavor",
    "natural flavours", "natural flavors",
    "smoke flavour", "smoke flavor",
    "aroma",
]

# Known insect-derived colorant: treat as haram strict (many halal bodies consider it impermissible)
HARAM_COLORANTS = [
    "carmine", "cochineal",
]

# Vitamins / amino acids that are often bio-derived (mushbooh unless source specified/certified)
# NOTE: Bio-derived micros are now in animal_derivatives.json
MUSHBOOH_BIO_DERIVED_MICROS_LEGACY = [
    "l-cysteine", "lcysteine",
    "vitamin d3", "cholecalciferol",
    "omega-3", "omega 3",
    "collagen",
]

# E-number mapping (strict)
# NOTE: E-numbers are now loaded from halal_config/e_numbers.json
# These legacy dicts are kept for backward compatibility fallback
E_ALWAYS_HARAM_LEGACY = {
    "120": "e120_carmine_cochineal_haram",
}
E_SOURCE_DEPENDENT_LEGACY = {
    "441": "e441_gelatin_source_unknown",
    "471": "e471_mono_diglycerides_source_unknown",
    "472": "e472_fatty_acid_esters_source_unknown",
}

# Plant-based "safe" ingredients examples (not exhaustive). We use these only to raise confidence when no risks are found.
INHERENTLY_HALAL_PLANT_SIMPLE = [
    "water", "salt", "sugar",
    "wheat", "rice", "oats", "corn",
    "cocoa", "cocoa powder",
    "sunflower oil", "canola oil", "soybean oil", "olive oil", "palm oil",
    "spices", "onion powder", "garlic powder",
    "starch", "tapioca starch",
]

# Kosher Knowledge Base

# ============================================================
# KOSHER KNOWLEDGE BASE (STRICT)
# ============================================================

KOSHER_FORBIDDEN_LAND = [
    "pork", "pig", "swine", "rabbit", "horse", "camel"
]

KOSHER_FORBIDDEN_SEA = [
    "shrimp", "crab", "lobster", "clam", "mussel",
    "oyster", "scallop", "catfish", "eel", "shark"
]

KOSHER_INSECTS = [
    "carmine", "cochineal"
]

KOSHER_BLOOD = [
    "blood", "blood plasma", "hemoglobin"
]

KOSHER_GRAPE_PRODUCTS = [
    "wine", "wine vinegar", "grape juice",
    "grape extract", "brandy"
]

KOSHER_SOURCE_DEPENDENT = [
    "gelatin", "collagen",
    "mono and diglycerides", "fatty acids", "glycerin",
    "rennet", "enzymes", "starter cultures",
    "cheese", "whey", "casein",
    "natural flavor", "artificial flavor", "aroma"
]

KOSHER_E_ALWAYS_FORBIDDEN = {
    "120": "e120_carmine_insect_not_kosher"
}



def evaluate_kosher_strict(ingredient_text: str) -> KosherResult:
    ing_raw = ingredient_text or ""
    ing = normalize_text(ing_raw)

    reasons = []
    evidence = []

    strong_cert = is_strong_kosher_cert_signal(ing)

    # 1) Forbidden land animals
    if any_word_in_text(ing, KOSHER_FORBIDDEN_LAND):
        return KosherResult(
            ingredient=ing_raw,
            status=NOT_KOSHER,
            confidence=CONF_KOSHER_HIGH,
            reason_codes=["forbidden_land_animal"],
            evidence=["Non-kosher land animal detected"]
        )

    # 2) Forbidden seafood
    if any_word_in_text(ing, KOSHER_FORBIDDEN_SEA):
        return KosherResult(
            ingredient=ing_raw,
            status=NOT_KOSHER,
            confidence=CONF_KOSHER_HIGH,
            reason_codes=["forbidden_seafood_no_fins_scales"],
            evidence=["Seafood without fins and scales detected"]
        )

    # 3) Insects
    if any_word_in_text(ing, KOSHER_INSECTS) or contains_enumber(ing, "120"):
        return KosherResult(
            ingredient=ing_raw,
            status=NOT_KOSHER,
            confidence=CONF_KOSHER_HIGH,
            reason_codes=["insect_derived_not_kosher"],
            evidence=["Carmine / E120 insect-derived colorant detected"]
        )

    # 4) Blood
    if any_word_in_text(ing, KOSHER_BLOOD):
        return KosherResult(
            ingredient=ing_raw,
            status=NOT_KOSHER,
            confidence=CONF_KOSHER_HIGH,
            reason_codes=["blood_not_kosher"],
            evidence=["Blood-derived ingredient detected"]
        )

    # 5) Grape products (strict supervision required)
    if any_word_in_text(ing, KOSHER_GRAPE_PRODUCTS):
        if not strong_cert:
            return KosherResult(
                ingredient=ing_raw,
                status=REQUIRES_KOSHER_CERTIFICATION,
                confidence=CONF_KOSHER_LOW,
                reason_codes=["grape_product_requires_supervision"],
                evidence=["Grape-derived product requires kosher supervision"]
            )


    # 6) Source-dependent ingredients
    if any_word_in_text(ing, KOSHER_SOURCE_DEPENDENT):
        if strong_cert:
            return KosherResult(
                ingredient=ing_raw,
                status=KOSHER_CONFIRMED,
                confidence=CONF_KOSHER_HIGH,
                reason_codes=["kosher_certified_source_dependent"],
                evidence=["Strong kosher certification detected"]
            )
        else:
            return KosherResult(
                ingredient=ing_raw,
                status=REQUIRES_KOSHER_CERTIFICATION,
                confidence=CONF_KOSHER_LOW,
                reason_codes=["source_dependent_requires_certification"],
                evidence=["Ingredient requires kosher-certified source"]
            )

    # 7) Default fallback
    if strong_cert:
        return KosherResult(
            ingredient=ing_raw,
            status=KOSHER_CONFIRMED,
            confidence=CONF_KOSHER_HIGH,
            reason_codes=["kosher_certified"],
            evidence=["Strong kosher certification detected"]
        )

    return KosherResult(
        ingredient=ing_raw,
        status=REQUIRES_KOSHER_CERTIFICATION,
        confidence=CONF_KOSHER_LOW,
        reason_codes=["no_kosher_certification"],
        evidence=["No evidence of kosher certification"]
    )

# ============================================================
# HALAL EVALUATOR
# ============================================================

def evaluate_halal_strict(ingredient_text: str, strict_mode: bool = True, original_text: str = None) -> HalalResult:
    """
    Returns certifier-style halal evaluation for ONE ingredient line / token.
    strict_mode=True => treat mushbooh as NOT_HALAL_UNVERIFIED in final verdict.
    
    Args:
        ingredient_text: The normalized/English ingredient text
        strict_mode: If True, treat mushbooh as NOT_HALAL_UNVERIFIED
        original_text: Optional original text (before translation) for better source detection
    """
    ing_raw = ingredient_text or ""
    ing = normalize_text(ing_raw)
    
    # Store original text for lecithin source detection
    orig = normalize_text(original_text) if original_text else ""

    reasons: List[str] = []
    evidence: List[str] = []
    status = None


    # 0) Certification handling
    strong_cert = is_strong_halal_cert_signal(ing)
    weak_cert = is_weak_halal_signal(ing)

    # 1) Animal derivatives check (using JSON config)
    # This handles pork, blood, insects, gelatin sources, enzymes, etc.
    animal_status, animal_reason_code, animal_reason = check_animal_derivative_status(ing)
    
    if animal_status == "HARAM":
        reasons.append(animal_reason_code)
        evidence.append(animal_reason)
        return HalalResult(ingredient=ing_raw, status=HARAM, confidence=CONF_HIGH,
                          reason_codes=dedupe(reasons), evidence=dedupe(evidence))
    
    if animal_status == "MUSHBOOH":
        if strong_cert:
            reasons.append(f"{animal_reason_code}_but_certified")
            evidence.append(f"{animal_reason}; but strong halal certification detected")
        else:
            reasons.append(animal_reason_code)
            evidence.append(animal_reason)
            # Don't return yet - continue checking, will be handled in final status
    
    if animal_status == "HALAL":
        # Explicitly halal animal derivative (fish gelatin, lanolin, honey, etc.)
        reasons.append(animal_reason_code)
        evidence.append(animal_reason)
    
    # 2) Colorants: carmine/cochineal - now handled by animal_derivatives.json
    # Keeping as fallback in case config doesn't catch it
    if any_word_in_text(ing, HARAM_COLORANTS):
        if not any("insect" in rc for rc in reasons):  # Avoid duplicate
            reasons.append("haram_carmine_cochineal")
            evidence.append("Detected carmine/cochineal (commonly E120)")
            return HalalResult(ingredient=ing_raw, status=HARAM, confidence=CONF_HIGH,
                              reason_codes=dedupe(reasons), evidence=dedupe(evidence))

    # 3) E-numbers (now using JSON config)
    en = extract_enumbers(ing)
    for e in en:
        e_status, e_details = get_e_number_status(e)
        
        if e_status == "HARAM":
            reason_code = e_details.get("reason_code", f"e{e}_haram")
            e_name = e_details.get("name", f"E{e}")
            reasons.append(reason_code)
            evidence.append(f"Detected E{e} ({e_name}) - {e_details.get('reason', 'always haram')}")
            return HalalResult(ingredient=ing_raw, status=HARAM, confidence=CONF_HIGH,
                              reason_codes=dedupe(reasons), evidence=dedupe(evidence))
        
        if e_status == "MUSHBOOH":
            reason_code = e_details.get("reason_code", f"e{e}_source_unknown")
            e_name = e_details.get("name", f"E{e}")
            reasons.append(reason_code)
            evidence.append(f"Detected E{e} ({e_name}) - {e_details.get('reason', 'source-dependent')}")
            # do not return yet; could still be overridden by strong cert
        
        # E-numbers marked as HALAL in config don't need special handling - they pass through

    # 4) Alcohol: using JSON config for comprehensive detection
    alcohol_status, alcohol_reason_code, alcohol_reason = check_alcohol_status(ing)
    
    if alcohol_status == "HALAL":
        # Halal alternatives (vanilla bean, vinegar, etc.) - no action needed, just log
        reasons.append(alcohol_reason_code)
        evidence.append(alcohol_reason)
    elif alcohol_status == "HARAM":
        if strong_cert:
            # Still log evidence, but allow due to certification
            reasons.append("alcohol_related_term_present_but_halal_cert_claim")
            evidence.append(f"{alcohol_reason}; but strong halal certification phrase detected")
        else:
            reasons.append(alcohol_reason_code)
            evidence.append(alcohol_reason)
            return HalalResult(ingredient=ing_raw, status=HARAM, confidence=CONF_HIGH,
                              reason_codes=dedupe(reasons), evidence=dedupe(evidence))

    # 5) Gelatin handling (FIXED)
    if word_in_text(ing, "gelatin") or contains_enumber(ing, "441"):

        if any_word_in_text(ing, ["porcine", "pig", "swine"]):
            return HalalResult(
                ingredient=ing_raw,
                status=HARAM,
                confidence=CONF_HIGH,
                reason_codes=["haram_porine_gelatin"],
                evidence=["Porcine gelatin detected"]
            )

        if any_word_in_text(ing, ["halal gelatin", "gelatin (halal)"]):
            reasons.append("halal_gelatin_explicit")
            evidence.append("Gelatin explicitly labeled halal")
            return HalalResult(
                ingredient=ing_raw,
                status=HALAL_CONFIRMED,
                confidence=CONF_HIGH,
                reason_codes=dedupe(reasons),
                evidence=dedupe(evidence)
            )

        if any_word_in_text(ing, ["fish gelatin"]):
            reasons.append("fish_gelatin")
            evidence.append("Fish-derived gelatin")
            return HalalResult(
                ingredient=ing_raw,
                status=HALAL_CONFIRMED,
                confidence=CONF_HIGH,
                reason_codes=dedupe(reasons),
                evidence=dedupe(evidence)
            )

        if any_word_in_text(ing, ["bovine gelatin", "beef gelatin"]):
            reasons.append("bovine_gelatin_unverified")
            evidence.append("Bovine gelatin without explicit halal certification")
            status = MUSHBOOH

    # 5.5) LECITHIN HANDLING (SOURCE-AWARE)
    # This MUST come before generic mushbooh checks to prevent false positives
    # Use combined detection to check both original and normalized text
    # This catches cases where GPT incorrectly normalizes "tournesol" to "soy"
    if orig:
        is_lecithin, lecithin_source, lecithin_explanation = detect_lecithin_source_combined(orig, ing)
    else:
        is_lecithin, lecithin_source, lecithin_explanation = detect_lecithin_source(ing)
    
    if is_lecithin:
        halal_status = LECITHIN_HALAL_STATUS.get(lecithin_source, "UNVERIFIED")
        
        if lecithin_source == "sunflower":
            # Sunflower lecithin is plant-based and inherently halal
            reasons.append("sunflower_lecithin_halal")
            evidence.append("Sunflower lecithin detected - plant-based, halal")
            return HalalResult(
                ingredient=ing_raw,
                status=HALAL_CONFIRMED,
                confidence=CONF_HIGH,
                reason_codes=dedupe(reasons),
                evidence=dedupe(evidence)
            )
        
        elif lecithin_source == "soy":
            # Soy lecithin - plant-based BUT processing may involve alcohol extraction
            # Requires halal certification to confirm halal-compliant processing
            if strong_cert:
                reasons.append("soy_lecithin_certified_halal")
                evidence.append("Soy lecithin with halal certification - verified halal")
                return HalalResult(
                    ingredient=ing_raw,
                    status=HALAL_CONFIRMED,
                    confidence=CONF_HIGH,
                    reason_codes=dedupe(reasons),
                    evidence=dedupe(evidence)
                )
            else:
                reasons.append("soy_lecithin_unverified_mushbooh")
                evidence.append("Soy lecithin detected - processing may involve alcohol; requires halal certification")
                return HalalResult(
                    ingredient=ing_raw,
                    status=NOT_HALAL_UNVERIFIED,
                    confidence=CONF_MED,
                    reason_codes=dedupe(reasons),
                    evidence=dedupe(evidence)
                )
        
        elif lecithin_source == "rapeseed":
            # Rapeseed/canola lecithin is plant-based and halal
            reasons.append("rapeseed_lecithin_halal")
            evidence.append("Rapeseed/canola lecithin detected - plant-based, halal")
            return HalalResult(
                ingredient=ing_raw,
                status=HALAL_CONFIRMED,
                confidence=CONF_HIGH,
                reason_codes=dedupe(reasons),
                evidence=dedupe(evidence)
            )
        
        elif lecithin_source == "egg":
            # Egg lecithin is halal (eggs are halal), but it's an allergen
            reasons.append("egg_lecithin_halal")
            evidence.append("Egg lecithin detected - halal (note: egg allergen)")
            return HalalResult(
                ingredient=ing_raw,
                status=HALAL_CONFIRMED,
                confidence=CONF_HIGH,
                reason_codes=dedupe(reasons),
                evidence=dedupe(evidence)
            )
        
        else:
            # Unspecified lecithin source - mark as unverified (not haram, just unknown)
            # This is a conservative approach: we don't assume soy
            if strong_cert:
                reasons.append("lecithin_unspecified_but_certified")
                evidence.append("Lecithin source unspecified, but product has halal certification")
                # Don't return - let it flow through to final status determination
            else:
                reasons.append("lecithin_source_unspecified_mushbooh")
                evidence.append("Lecithin detected but source not specified - possible soy, egg, or plant origin")
                # Mark as mushbooh, not haram - requires verification
                status = MUSHBOOH

    # 6-8) NOTE: Mushbooh animal derivatives, enzymes/cultures, and processed dairy
    # are now handled by check_animal_derivative_status() in step 1 above
    # using the animal_derivatives.json config file

    # 9) Flavourings
    # NOTE: Vanilla extract and other alcohol-based extracts are now handled in step 4
    # via the alcohol.json config, so we only handle generic flavorings here
    
    if any_word_in_text(ing, ["natural flavor", "natural flavour"]):
        reasons.append("natural_flavour_source_unknown_mushbooh")
        evidence.append("Natural flavours have undisclosed sources")
        status = MUSHBOOH

    elif any_word_in_text(ing, ["artificial flavor", "artificial flavour"]):
        reasons.append("artificial_flavour")
        evidence.append("Artificial flavouring (no alcohol indicated)")


    # 10) NOTE: Bio-derived micros (vitamin D3, omega-3, l-cysteine, collagen)
    # are now handled by check_animal_derivative_status() in step 1 above
    # using the animal_derivatives.json config file

    # 11) Determine final status (FIXED LOGIC)
    if strong_cert:
        status = HALAL_CONFIRMED
        confidence = CONF_HIGH

    elif any("haram_" in rc or rc.endswith("_haram") for rc in reasons):
        status = HARAM
        confidence = CONF_HIGH

    elif any("mushbooh" in rc or "unverified" in rc or "source_unknown" in rc for rc in reasons):
        # Only mark as mushbooh if there's no explicit halal reason for the same ingredient
        # Check if all mushbooh reasons have a corresponding halal override
        mushbooh_reasons = [rc for rc in reasons if "mushbooh" in rc or "unverified" in rc or "source_unknown" in rc]
        halal_reasons = [rc for rc in reasons if rc.endswith("_halal") or "halal" in rc.lower()]
        
        # If we have halal reasons and they're for the same ingredient type, trust the halal
        if halal_reasons and len(halal_reasons) >= len(mushbooh_reasons):
            status = HALAL_CONFIRMED
            confidence = CONF_HIGH
        else:
            status = MUSHBOOH
            confidence = CONF_LOW if not weak_cert else CONF_MED

    elif any(rc.endswith("_halal") for rc in reasons):
        # Explicit halal source detected (fish gelatin, vegetable glycerin, etc.)
        status = HALAL_CONFIRMED
        confidence = CONF_HIGH

    elif is_inherently_halal(ing):
        status = HALAL_CONFIRMED
        confidence = CONF_HIGH
        reasons.append("inherently_halal_by_nature")
        evidence.append("Plant-based ingredient; halal by default")

    else:
        status = HALAL_CONFIRMED
        confidence = CONF_MED
        reasons.append("no_haram_indicators_detected")
        evidence.append("No haram indicators detected; default halal")

    # 12) Strict-mode conversion: mushbooh fails final halal
    # Keep MUSHBOOH as a meaningful internal state, but provide a strict final label if you want.
    if strict_mode and status == MUSHBOOH:
        # For strict user-facing "is it halal?" -> NOT HALAL
        # (internally keep mushbooh for explainability)
        # You can decide later whether to expose NOT_HALAL_UNVERIFIED or MUSHBOOH in UI.
        final_status = NOT_HALAL_UNVERIFIED
    else:
        final_status = status

    return HalalResult(
        ingredient=ing_raw,
        status=final_status,
        confidence=confidence,
        reason_codes=dedupe(reasons),
        evidence=dedupe(evidence),
    )


def dedupe(items: List[str]) -> List[str]:
    seen = set()
    out = []
    for x in items:
        if x and x not in seen:
            out.append(x)
            seen.add(x)
    return out


# ============================================================
# Backward-compatible adapter: your old "violations" list
# ============================================================

def kosher_to_violations(result: KosherResult) -> List[str]:
    v = []

    if result.status == NOT_KOSHER:
        v.extend(result.reason_codes)

    if result.status == REQUIRES_KOSHER_CERTIFICATION:
        v.append("requires_kosher_certification")

    return dedupe(v)


def halal_to_violations(result: HalalResult) -> List[str]:
    """
    Map detailed halal reason codes into your old style 'violations' list.
    This keeps your existing pipeline working while upgrading logic.
    """
    v = []

    if result.status == HARAM:
        # you can be more specific by mapping each reason, but keep it simple:
        v.append("haram_ingredient_source_forbidden")

    if any("alcohol" in rc for rc in result.reason_codes):
        v.append("alcohol_not_halal")

    if result.status in (MUSHBOOH, NOT_HALAL_UNVERIFIED):
        v.append("source_unverified_mushbooh")

    # Extra: keep special flag if vanilla extract
    if word_in_text(result.ingredient, "vanilla extract"):
        v.append("vanilla_extract_may_contain_alcohol")

    return dedupe(v)


# ================================================================
#  DIET VIOLATION ENGINE (FULL RESTORE)
# ================================================================

def check_diet_violations(ingredient, diet):
    ing = ingredient.lower()
    violations = []
    if not diet:
        return violations

    diet = diet.lower().strip()
    # ------------ HALAL ------------
    if diet == "halal":
        # Call the new certifier-grade halal engine
        halal_result = evaluate_halal_strict(
            ingredient_text=ingredient,
            strict_mode=True  # mushbooh = NOT HALAL
        )

        # Convert detailed result into old-style violations list
        return halal_to_violations(halal_result)

    # ------------ KOSHER ------------
    if diet == "kosher":
        kosher_result = evaluate_kosher_strict(
            ingredient_text=ingredient
        )
        return kosher_to_violations(kosher_result)

    return violations





# ============================================================
# PRODUCT-LEVEL AGGREGATION
# ============================================================

@dataclass
class ProductKosherVerdict:
    status: str               # KOSHER | NOT_KOSHER
    confidence: str
    reason: str
    failing_ingredients: List[str]
    reason_codes: List[str]

@dataclass
class ProductHalalVerdict:
    status: str               # HARAM | NOT_HALAL | HALAL
    confidence: str
    reason: str               # short human sentence
    failing_ingredients: List[str]
    reason_codes: List[str]

def aggregate_product_kosher(
    ingredient_results: List[KosherResult]
) -> ProductKosherVerdict:

    not_kosher_hits = []
    unverified_hits = []

    for r in ingredient_results:
        if r.status == NOT_KOSHER:
            not_kosher_hits.append(r)
        elif r.status == REQUIRES_KOSHER_CERTIFICATION:
            unverified_hits.append(r)

    # RULE 1 — HARD FAIL
    if not_kosher_hits:
        return ProductKosherVerdict(
            status=NOT_KOSHER,
            confidence=CONF_KOSHER_HIGH,
            reason="Contains explicitly non-kosher ingredient(s).",
            failing_ingredients=[r.ingredient for r in not_kosher_hits],
            reason_codes=sorted({rc for r in not_kosher_hits for rc in r.reason_codes}),
        )

    # RULE 2 — NEEDS CERTIFICATION (NOT A FAIL)
    if unverified_hits:
        return ProductKosherVerdict(
            status=REQUIRES_KOSHER_CERTIFICATION,
            confidence=CONF_KOSHER_MED,
            reason="All ingredients may be kosher, but kosher certification is required.",
            failing_ingredients=[r.ingredient for r in unverified_hits],
            reason_codes=sorted({rc for r in unverified_hits for rc in r.reason_codes}),
        )

    # RULE 3 — PASS
    return ProductKosherVerdict(
        status=KOSHER_CONFIRMED,
        confidence=CONF_KOSHER_HIGH,
        reason="All detected ingredients are kosher at ingredient level.",
        failing_ingredients=[],
        reason_codes=[],
    )



def aggregate_product_halal(
    ingredient_results: List[HalalResult],
    strict_mode: bool = True
) -> ProductHalalVerdict:
    """
    Certifier-grade product-level halal decision.
    Order of precedence:
    1) Any HARAM ingredient -> PRODUCT HARAM
    2) Any MUSHBOOH / NOT_HALAL_UNVERIFIED -> PRODUCT NOT HALAL (strict)
    3) Else -> HALAL
    """

    haram_hits = []
    mushbooh_hits = []

    for r in ingredient_results:
        if r.status == HARAM:
            haram_hits.append(r)
        elif r.status in (MUSHBOOH, NOT_HALAL_UNVERIFIED):
            mushbooh_hits.append(r)

    # RULE 1 — HARD FAIL
    if haram_hits:
        return ProductHalalVerdict(
            status="HARAM",
            confidence=CONF_HIGH,
            reason="Contains explicitly haram ingredient(s).",
            failing_ingredients=[r.ingredient for r in haram_hits],
            reason_codes=sorted({rc for r in haram_hits for rc in r.reason_codes}),
        )

    # RULE 2 — STRICT FAIL (MUSHBOOH)
    if strict_mode and mushbooh_hits:
        return ProductHalalVerdict(
            status="NOT_HALAL_UNVERIFIED",
            confidence=CONF_LOW,
            reason="Contains ingredient(s) with unverified halal source or processing.",
            failing_ingredients=[r.ingredient for r in mushbooh_hits],
            reason_codes=sorted({rc for r in mushbooh_hits for rc in r.reason_codes}),
        )

    # RULE 3 — PASS
    return ProductHalalVerdict(
        status="HALAL",
        confidence=CONF_MED,
        reason="All detected ingredients are verified halal at ingredient level.",
        failing_ingredients=[],
        reason_codes=[],
    )


# ================================================================
#  ALLERGY MATCHING
# ================================================================

def check_allergy(ingredient, allergies):
    """
    Check if an ingredient matches any user allergies.
    
    Now uses allergens.json for comprehensive detection of:
    - Direct allergen terms (e.g., "soy", "soya", "soybean")
    - Derived ingredients (e.g., "tofu", "tempeh", "miso" for soy)
    
    Special handling for lecithin:
    - Only trigger soy allergen if lecithin is EXPLICITLY soy-derived
    - Sunflower/rapeseed lecithin should NOT trigger soy allergen
    - Egg lecithin should trigger egg allergen
    """
    ing = ingredient.lower()
    
    # Check for lecithin - use source-aware detection
    is_lecithin, lecithin_source, _ = detect_lecithin_source(ing)
    
    if is_lecithin:
        # For lecithin, only check allergens based on actual source
        lecithin_allergens = get_lecithin_allergens(lecithin_source)
        
        # Check if any user allergy matches the lecithin's actual allergens
        for allergy in allergies:
            allergy_lower = allergy.lower().strip()
            if allergy_lower in lecithin_allergens:
                return True
        
        # If lecithin source is unspecified and user has soy allergy,
        # we should flag it as "possible" (conservative approach)
        if lecithin_source == "unspecified":
            for allergy in allergies:
                if allergy.lower().strip() in ["soy", "soya"]:
                    # Return True with a note - this is a possible allergen
                    return True  # Conservative: unspecified lecithin could be soy
        
        # Lecithin is handled - don't fall through to generic check
        # (prevents false positives from GPT mis-normalization)
        return False
    
    # Enhanced allergen check using allergens.json
    for allergy in allergies:
        # Get all terms for this allergen type
        allergen_terms = get_allergen_terms(allergy)
        
        # Check if any term matches the ingredient
        for term in allergen_terms:
            if word_in_text(ing, term):
                return True
    
    return False


def check_allergy_detailed(ingredient: str, allergies: List[str]) -> Dict[str, any]:
    """
    Enhanced allergy check that returns detailed information.
    
    Returns:
        Dict with:
        - is_allergen: bool
        - allergen_type: str or None
        - is_confirmed: bool (True if definitely contains allergen, False if possible)
        - explanation: str
    """
    ing = ingredient.lower()
    
    # Check for lecithin with source detection
    is_lecithin, lecithin_source, explanation = detect_lecithin_source(ing)
    
    if is_lecithin:
        lecithin_allergens = get_lecithin_allergens(lecithin_source)
        
        for allergy in allergies:
            allergy_lower = allergy.lower().strip()
            
            # Check confirmed allergens
            if allergy_lower in lecithin_allergens:
                return {
                    "is_allergen": True,
                    "allergen_type": allergy_lower,
                    "is_confirmed": True,
                    "explanation": f"{lecithin_source.title()} lecithin contains {allergy_lower}"
                }
        
        # Check for possible allergen (unspecified source)
        if lecithin_source == "unspecified":
            for allergy in allergies:
                if allergy.lower().strip() == "soy":
                    return {
                        "is_allergen": True,
                        "allergen_type": "soy",
                        "is_confirmed": False,
                        "explanation": "Lecithin source unspecified - may contain soy"
                    }
        
        return {
            "is_allergen": False,
            "allergen_type": None,
            "is_confirmed": False,
            "explanation": f"{explanation} - no allergen match"
        }
    
    # Standard check
    for allergy in allergies:
        if allergy.lower() in ing:
            return {
                "is_allergen": True,
                "allergen_type": allergy.lower(),
                "is_confirmed": True,
                "explanation": f"Contains {allergy}"
            }
    
    return {
        "is_allergen": False,
        "allergen_type": None,
        "is_confirmed": False,
        "explanation": None
    }


# ================================================================
#  PADDLEOCR HELPERS
# ================================================================

def decode_base64_image_to_cv2(image_data: str) -> np.ndarray:
    """
    Decode a base64 image string to an OpenCV BGR numpy array.
    
    Args:
        image_data: Base64 string, optionally with data URL prefix
                    (e.g., "data:image/jpeg;base64,...")
    
    Returns:
        numpy.ndarray: Image in BGR format (OpenCV standard)
    
    Raises:
        ValueError: If image cannot be decoded
    """
    # Strip data URL prefix if present
    if image_data.startswith("data:"):
        image_data = image_data.split(",", 1)[1]
    
    # Decode base64 to bytes
    try:
        image_bytes = base64.b64decode(image_data)
    except Exception as e:
        raise ValueError(f"Failed to decode base64: {e}")
    
    # Convert bytes to PIL Image
    try:
        pil_image = Image.open(BytesIO(image_bytes))
        # Convert to RGB if necessary (handles RGBA, P mode, etc.)
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")
    except Exception as e:
        raise ValueError(f"Failed to open image: {e}")
    
    # Convert PIL to numpy array (RGB)
    rgb_array = np.array(pil_image)
    
    # Convert RGB to BGR for OpenCV
    bgr_array = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
    
    return bgr_array


def preprocess_for_ocr(
    image: np.ndarray,
    upscale_factor: Optional[int] = None,
    target_min_dimension: int = 1500,
    debug: bool = False
) -> np.ndarray:
    """
    Preprocess image to improve OCR accuracy for small fonts and glare.

    Enhanced preprocessing pipeline:
    1. Dynamic upscaling based on image resolution (targets ~1500px minimum dimension)
    2. Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) on L channel
    3. Apply mild sharpening to enhance text edges
    4. Fast bilateral denoising (much faster than fastNlMeansDenoisingColored)
    5. Convert to RGB for PaddleOCR

    Key improvements over previous version:
    - Dynamic upscaling prevents over-upscaling large images (wastes CPU)
    - Bilateral filter is 5-10x faster than fastNlMeansDenoisingColored
    - Milder sharpening (1.3 vs 1.5) reduces artifacts on clean images
    - Preserves more color info which helps PaddleOCR with some fonts

    Args:
        image: BGR numpy array from OpenCV
        upscale_factor: Override automatic upscale calculation (None = auto)
        target_min_dimension: Target minimum dimension in pixels for OCR (default 1500)
        debug: If True, log preprocessing details

    Returns:
        numpy.ndarray: Preprocessed image in RGB format for PaddleOCR
    """
    height, width = image.shape[:2]
    min_dim = min(height, width)

    # Step 1: Dynamic upscaling based on input resolution
    # Small images (phone crops of ingredients) need more upscaling
    # Large images already have sufficient detail
    if upscale_factor is None:
        if min_dim < 300:
            upscale_factor = 4  # Very small image - aggressive upscale
        elif min_dim < 600:
            upscale_factor = 3  # Small image - standard upscale
        elif min_dim < 1200:
            upscale_factor = 2  # Medium image - mild upscale
        else:
            upscale_factor = 1  # Large image - no upscaling needed

    if debug:
        logger.debug(f"[OCR PREPROCESS] Input: {width}x{height}, min_dim={min_dim}, upscale={upscale_factor}x")

    if upscale_factor > 1:
        new_width = width * upscale_factor
        new_height = height * upscale_factor
        # Use INTER_LANCZOS4 for high-quality upscaling (better than CUBIC for text)
        image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
        if debug:
            logger.debug(f"[OCR PREPROCESS] Upscaled to: {new_width}x{new_height}")

    # Step 2: Apply CLAHE on L channel (LAB color space) for contrast enhancement
    # This helps with uneven lighting on ingredient labels
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    # CLAHE with moderate clip limit - higher values = more contrast but more noise
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)

    lab = cv2.merge([l_channel, a_channel, b_channel])
    image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    # Step 3: Mild sharpening using unsharp mask
    # Milder than before (1.3 vs 1.5) to reduce artifacts on clean images
    gaussian = cv2.GaussianBlur(image, (0, 0), 1.5)
    image = cv2.addWeighted(image, 1.3, gaussian, -0.3, 0)

    # Step 4: Fast denoising using bilateral filter
    # Much faster than fastNlMeansDenoisingColored (5-10x speedup)
    # Preserves edges while reducing noise
    image = cv2.bilateralFilter(image, d=5, sigmaColor=50, sigmaSpace=50)

    # Step 5: Convert BGR to RGB for PaddleOCR
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Ensure valid pixel range
    rgb_image = np.clip(rgb_image, 0, 255).astype(np.uint8)

    if debug:
        logger.debug(f"[OCR PREPROCESS] Output: {rgb_image.shape}")

    return rgb_image


def _is_garbage_token(text: str) -> bool:
    """
    Check if a text token is likely OCR garbage that should be filtered.

    Filters:
    - Very short tokens (1-2 chars) that are not valid single-letter ingredients
    - Tokens that are mostly non-alphanumeric
    - Common OCR artifacts

    Preserves:
    - Single letters that could be vitamins (A, B, C, D, E, K)
    - Short words that are valid (e.g., "OU", "K" for kosher)
    - Accented characters (é, í, ñ, etc.)
    """
    if not text or not text.strip():
        return True

    text = text.strip()

    # Allow single-letter vitamins
    if text.upper() in {'A', 'B', 'C', 'D', 'E', 'K'}:
        return False

    # Allow common 2-letter valid tokens
    if text.upper() in {'OU', 'CK', 'OK'}:  # Kosher symbols
        return False

    # Filter very short tokens that are mostly punctuation/numbers
    if len(text) <= 2:
        alpha_count = sum(1 for c in text if c.isalpha())
        if alpha_count == 0:
            return True

    # Filter tokens that are mostly non-alphanumeric (>70% non-alpha)
    if len(text) >= 3:
        alpha_count = sum(1 for c in text if c.isalpha())
        if alpha_count / len(text) < 0.3:
            return True

    return False


def _group_lines_by_row(
    lines: List[Tuple[float, float, float, float, str, float]],
    row_threshold_ratio: float = 0.5
) -> List[List[Tuple[float, float, float, float, str, float]]]:
    """
    Group OCR text lines that are on the same visual row.

    This handles multi-column ingredient lists by grouping text boxes
    that have overlapping Y coordinates into the same row.

    Args:
        lines: List of (y_min, y_max, x_min, x_max, text, confidence) tuples
        row_threshold_ratio: Ratio of height overlap to consider same row

    Returns:
        List of rows, where each row is a list of text boxes sorted left-to-right
    """
    if not lines:
        return []

    # Sort by y_min first
    sorted_lines = sorted(lines, key=lambda x: x[0])

    rows = []
    current_row = [sorted_lines[0]]
    current_row_y_min = sorted_lines[0][0]
    current_row_y_max = sorted_lines[0][1]

    for line in sorted_lines[1:]:
        y_min, y_max = line[0], line[1]
        line_height = y_max - y_min
        row_height = current_row_y_max - current_row_y_min

        # Check if this line overlaps with current row
        overlap_start = max(current_row_y_min, y_min)
        overlap_end = min(current_row_y_max, y_max)
        overlap = max(0, overlap_end - overlap_start)

        # If significant overlap, add to current row
        if overlap > min(line_height, row_height) * row_threshold_ratio:
            current_row.append(line)
            current_row_y_max = max(current_row_y_max, y_max)
        else:
            # Start new row
            rows.append(current_row)
            current_row = [line]
            current_row_y_min = y_min
            current_row_y_max = y_max

    # Don't forget the last row
    if current_row:
        rows.append(current_row)

    # Sort each row by x_min (left to right)
    for row in rows:
        row.sort(key=lambda x: x[2])

    return rows


def run_paddle_ocr(
    image: np.ndarray,
    min_confidence: float = 0.5,
    filter_garbage: bool = True,
    debug: bool = False,
    return_raw_boxes: bool = False
) -> str:
    """
    Run PaddleOCR on an image and return extracted text in reading order.

    Improvements over previous version:
    - Row-based grouping handles multi-column ingredient lists
    - Confidence filtering removes low-quality OCR results
    - Garbage token filtering removes OCR noise
    - Debug mode for inspecting raw OCR output
    - Returns raw boxes for debugging if requested

    Args:
        image: RGB numpy array (preprocessed for OCR)
        min_confidence: Minimum confidence score to accept (0.0-1.0)
        filter_garbage: If True, filter out likely OCR garbage tokens
        debug: If True, print detailed OCR debug info
        return_raw_boxes: If True, return JSON string with raw bounding boxes

    Returns:
        str: All detected text joined in reading order (top-to-bottom, left-to-right)
              If return_raw_boxes=True, returns JSON with boxes and text
    """
    global _paddle_ocr

    # Run OCR - PaddleOCR v3.3+ uses predict() method
    # The ocr() method is deprecated
    try:
        # Try the new predict() API first (PaddleOCR v3.3+)
        result = _paddle_ocr.predict(image)
    except AttributeError:
        # Fallback to legacy ocr() API for older versions
        try:
            result = _paddle_ocr.ocr(image, cls=True)
        except TypeError:
            result = _paddle_ocr.ocr(image)

    if debug:
        logger.debug(f"[OCR DEBUG] Raw result type: {type(result)}")

    # Handle empty results
    if not result or (isinstance(result, list) and len(result) == 0):
        if debug:
            logger.debug("[OCR DEBUG] Result is empty/None")
        return "" if not return_raw_boxes else json.dumps({"boxes": [], "text": ""})

    # Parse OCR results into structured format
    # Format: list of [box, (text, confidence)] or list of lists for batched
    lines = []  # (y_min, y_max, x_min, x_max, text, confidence)
    raw_boxes = []

    def parse_ocr_item(item):
        """Parse a single OCR result item."""
        if not item or len(item) < 2:
            return None

        bbox = item[0]
        text_info = item[1]

        if not bbox or not text_info:
            return None

        # Extract text and confidence
        if isinstance(text_info, (list, tuple)) and len(text_info) >= 2:
            text = str(text_info[0])
            confidence = float(text_info[1])
        elif isinstance(text_info, (list, tuple)) and len(text_info) == 1:
            text = str(text_info[0])
            confidence = 1.0
        else:
            text = str(text_info)
            confidence = 1.0

        # Get bounding box coordinates
        # bbox is typically [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        try:
            if isinstance(bbox, np.ndarray):
                bbox = bbox.tolist()
            xs = [p[0] for p in bbox]
            ys = [p[1] for p in bbox]
            x_min, x_max = min(xs), max(xs)
            y_min, y_max = min(ys), max(ys)
        except (IndexError, TypeError):
            return None

        return (y_min, y_max, x_min, x_max, text, confidence, bbox)

    # Handle different result formats
    if isinstance(result, list):
        for batch_item in result:
            if batch_item is None:
                continue
            if isinstance(batch_item, list):
                for item in batch_item:
                    parsed = parse_ocr_item(item)
                    if parsed:
                        y_min, y_max, x_min, x_max, text, conf, bbox = parsed

                        # Confidence filtering
                        if conf < min_confidence:
                            if debug:
                                logger.debug(f"[OCR DEBUG] Filtered low confidence ({conf:.2f}): '{text}'")
                            continue

                        # Garbage filtering
                        if filter_garbage and _is_garbage_token(text):
                            if debug:
                                logger.debug(f"[OCR DEBUG] Filtered garbage: '{text}'")
                            continue

                        lines.append((y_min, y_max, x_min, x_max, text, conf))
                        raw_boxes.append({
                            "bbox": bbox,
                            "text": text,
                            "confidence": round(conf, 3)
                        })

                        if debug:
                            logger.debug(f"[OCR DEBUG] Accepted ({conf:.2f}): '{text}' at y={y_min:.0f}")

    if not lines:
        if debug:
            logger.debug("[OCR DEBUG] No lines after filtering")
        return "" if not return_raw_boxes else json.dumps({"boxes": raw_boxes, "text": ""})

    # Return raw boxes if requested (for debugging)
    if return_raw_boxes:
        # Still construct the text for the response
        rows = _group_lines_by_row(lines)
        text_parts = []
        for row in rows:
            row_text = " ".join(item[4] for item in row)
            text_parts.append(row_text)
        full_text = " ".join(text_parts)
        full_text = re.sub(r"\s+", " ", full_text).strip()
        return json.dumps({
            "boxes": raw_boxes,
            "text": full_text,
            "num_segments": len(lines),
            "num_rows": len(rows)
        })

    # Group lines by visual row (handles multi-column layouts)
    rows = _group_lines_by_row(lines)

    if debug:
        logger.debug(f"[OCR DEBUG] Grouped into {len(rows)} rows")

    # Build text: join items in each row with space, rows with space
    text_parts = []
    for row in rows:
        row_text = " ".join(item[4] for item in row)
        text_parts.append(row_text)

    full_text = " ".join(text_parts)

    # Clean up multiple spaces and normalize
    full_text = re.sub(r"\s+", " ", full_text).strip()

    if debug:
        logger.debug(f"[OCR DEBUG] Final text ({len(full_text)} chars): {full_text[:200]}...")

    return full_text


# ================================================================
#  DETERMINISTIC OCR ZONE SEGMENTATION
#  Separates raw OCR text into: HEADER, INGREDIENTS, ALLERGEN_ADVISORY
#  This runs BEFORE GPT to ensure only real ingredients are parsed.
# ================================================================

@dataclass
class OCRZoneResult:
    """Result of OCR text zone segmentation."""
    raw_text: str                    # Original OCR text (for traceability)
    header_zone: str                 # Product name, metadata, certifications
    ingredient_zone: str             # Actual ingredient list
    allergen_advisory_zone: str      # "May contain..." warnings
    detected_language: Optional[str] # Detected language code
    parse_status: str                # "OK", "NO_INGREDIENTS", "UNVERIFIED"
    parse_notes: List[str]           # Debug notes about parsing decisions


# Multilingual ingredient section headers (lowercase)
# These mark the START of the ingredient list
INGREDIENT_HEADERS = [
    # Spanish
    "ingredientes:", "ingredientes", "ingredientes :",
    # English
    "ingredients:", "ingredients", "ingredients :",
    # French
    "ingrédients:", "ingrédients", "ingredients:", "ingredients :",
    # German
    "zutaten:", "zutaten", "zutaten :",
    # Italian
    "ingredienti:", "ingredienti", "ingredienti :",
    # Portuguese
    "ingredientes:", "ingredientes",
    # Dutch
    "ingrediënten:", "ingredienten:",
    # Polish
    "składniki:", "skladniki:",
    # Common OCR errors
    "ingredlentes:", "ingredlentes", "lngredientes:", "lngredients:",
]

# Allergen advisory headers (lowercase)
# These mark the END of the ingredient list and START of allergen warnings
ALLERGEN_ADVISORY_HEADERS = [
    # Spanish
    "puede contener", "puede contener:", "puede contener trazas",
    "contiene:", "contiene", "alérgenos:",
    # English
    "may contain", "may contain:", "may contain traces",
    "contains:", "contains", "allergens:", "allergy advice:",
    "for allergens", "for allergens,", "allergen information",
    # French
    "peut contenir", "peut contenir:", "peut contenir des traces",
    "contient:", "contient", "allergènes:",
    # German
    "kann enthalten", "kann enthalten:", "kann spuren enthalten",
    "enthält:", "enthält", "allergene:",
    # Italian
    "può contenere", "puo contenere", "può contenere:",
    "contiene:", "contiene", "allergeni:",
    # Portuguese
    "pode conter", "pode conter:",
    # Common OCR merged tokens (no spaces)
    "puedecontener", "maycontain", "peutcontenir", "kannenthalten",
]

# Patterns that indicate NON-ingredient text (product metadata)
# These should NEVER be parsed as ingredients
NON_INGREDIENT_PATTERNS = [
    # Percentages (cocoa content, etc.)
    r"\b\d+\s*%\s*(mínimo|minimo|minimum|min|máximo|maximo|maximum|max)?\b",
    r"\bcacao\s*:?\s*\d+\s*%",
    r"\bgrasa\s*:?\s*\d+\s*%",
    r"\bfat\s*:?\s*\d+\s*%",
    # Weight/volume
    r"\b\d+\s*(g|kg|ml|l|oz|lb)\b",
    # Barcodes
    r"\b\d{8,13}\b",
    # Certifications (should not be ingredients)
    r"\b(ean|upc|gtin)\s*:?\s*\d+",
    # Dates
    r"\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b",
    r"\b(best before|consumir antes|à consommer avant|mindestens haltbar)\b",
    # Batch/lot numbers
    r"\b(lote?|batch|lot)\s*:?\s*[a-z0-9]+\b",
    # Storage instructions (not ingredients)
    r"\b(conservar|store|conserver|aufbewahren|keep)\s+(en|in|au|im|at)\b",
    # Nutritional headers
    r"\b(nutrition|información nutricional|valeurs nutritionnelles|nährwerte)\b",
    r"\b(calories|calorías|kcal|kj)\b",
    # Country of origin (not ingredient)
    r"\b(made in|fabricado en|fabriqué|hergestellt in|hecho en)\b",
    r"\b(product of|producto de|produit de)\b",
]

# Product name patterns (typically at the start, before ingredients)
PRODUCT_NAME_PATTERNS = [
    r"^chocolate\s+(negro|noir|dark|milk|leche|lait|blanco|blanc|white)",
    r"^(dark|milk|white)\s+chocolate",
    r"^galletas?",
    r"^cookies?",
    r"^biscuits?",
]


def normalize_for_matching(text: str) -> str:
    """
    Normalize text for pattern matching.
    Handles OCR noise, missing accents, merged tokens.
    """
    if not text:
        return ""
    
    # Lowercase
    t = text.lower()
    
    # Normalize common accent variations (OCR often drops accents)
    accent_map = {
        'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
        'ñ': 'n', 'ç': 'c',
    }
    for accented, plain in accent_map.items():
        t = t.replace(accented, plain)
    
    # Normalize whitespace
    t = re.sub(r'\s+', ' ', t).strip()
    
    return t


def find_header_position(text: str, headers: List[str]) -> Tuple[int, str]:
    """
    Find the first occurrence of any header in the text.
    
    Returns:
        Tuple of (position, matched_header) or (-1, "") if not found
    """
    text_normalized = normalize_for_matching(text)
    text_lower = text.lower()
    
    best_pos = -1
    best_header = ""
    
    for header in headers:
        header_normalized = normalize_for_matching(header)
        
        # Try exact match first
        pos = text_lower.find(header)
        if pos != -1:
            if best_pos == -1 or pos < best_pos:
                best_pos = pos
                best_header = header
            continue
        
        # Try normalized match (handles missing accents)
        pos = text_normalized.find(header_normalized)
        if pos != -1:
            if best_pos == -1 or pos < best_pos:
                best_pos = pos
                best_header = header
            continue
        
        # Try matching merged tokens (e.g., "puedecontener" -> "puede contener")
        header_no_space = header.replace(" ", "")
        if len(header_no_space) >= 8:  # Only for longer phrases
            pos = text_normalized.replace(" ", "").find(header_no_space)
            if pos != -1:
                # Approximate position in original text
                approx_pos = int(pos * len(text) / max(1, len(text_normalized.replace(" ", ""))))
                if best_pos == -1 or approx_pos < best_pos:
                    best_pos = approx_pos
                    best_header = header
    
    return (best_pos, best_header)


def is_non_ingredient_line(line: str) -> bool:
    """
    Check if a line is clearly NOT an ingredient (metadata, percentages, etc.)
    """
    line_lower = line.lower().strip()
    
    # Empty or very short
    if len(line_lower) < 2:
        return True
    
    # Check against non-ingredient patterns
    for pattern in NON_INGREDIENT_PATTERNS:
        if re.search(pattern, line_lower, re.IGNORECASE):
            return True
    
    # Pure numbers (barcodes, weights)
    if re.match(r'^[\d\s.,]+$', line_lower):
        return True
    
    return False


def detect_language_from_headers(text: str) -> Optional[str]:
    """
    Detect language based on which ingredient/allergen headers are found.
    """
    text_lower = text.lower()
    
    # Spanish indicators
    if any(h in text_lower for h in ["ingredientes", "puede contener", "contiene"]):
        return "es"
    
    # French indicators
    if any(h in text_lower for h in ["ingrédients", "peut contenir", "contient"]):
        return "fr"
    
    # German indicators
    if any(h in text_lower for h in ["zutaten", "kann enthalten", "enthält"]):
        return "de"
    
    # Italian indicators
    if any(h in text_lower for h in ["ingredienti", "può contenere", "contiene"]):
        return "it"
    
    # English indicators (default)
    if any(h in text_lower for h in ["ingredients", "may contain", "contains"]):
        return "en"
    
    return None


# Common ingredient terms (multilingual) for fallback detection
# These help identify if text contains ingredient-like content even without a header
COMMON_INGREDIENT_TERMS = [
    # Sugars
    "sugar", "azúcar", "azucar", "sucre", "zucker", "zucchero",
    "glucose", "glucosa", "fructose", "fructosa",
    # Fats/Oils
    "oil", "aceite", "huile", "öl", "olio",
    "butter", "mantequilla", "beurre", "manteca",
    "fat", "grasa", "graisse", "fett",
    # Cocoa
    "cocoa", "cacao", "kakao",
    "chocolate",
    # Dairy
    "milk", "leche", "lait", "milch", "latte",
    "cream", "crema", "crème",
    "lactose", "lactosa",
    # Flour/Grains
    "flour", "harina", "farine", "mehl",
    "wheat", "trigo", "blé", "weizen",
    "starch", "almidón", "amidon",
    # Eggs
    "egg", "huevo", "oeuf", "ei", "uovo",
    # Emulsifiers
    "lecithin", "lecitina", "lécithine", "lezithin",
    "emulsifier", "emulsionante", "émulsifiant", "emulgator",
    # Common additives
    "salt", "sal", "sel", "salz",
    "vanilla", "vainilla", "vanille",
    "aroma", "flavor", "flavour",
    # E-numbers
    "e322", "e471", "e500", "e330",
]


def attempt_fallback_ingredient_extraction(raw_text: str, allergen_pos: int) -> str:
    """
    Attempt to extract ingredients when no header is found.
    
    This handles cases where:
    1. User cropped tightly to ingredient text (no header visible)
    2. OCR missed the "Ingredientes:" header but captured the list
    3. Non-standard label format
    
    Returns:
        Extracted ingredient text if it looks like ingredients, empty string otherwise
    """
    if not raw_text:
        return ""
    
    text_lower = raw_text.lower()
    
    # Check if text contains ingredient-like terms
    ingredient_term_count = sum(1 for term in COMMON_INGREDIENT_TERMS if term in text_lower)
    
    # Check for comma-separated structure (typical of ingredient lists)
    comma_count = raw_text.count(',')
    word_count = len(raw_text.split())
    
    # Heuristics:
    # - At least 2 ingredient-like terms found
    # - Has comma-separated structure (at least 2 commas for 3+ items)
    # - Not too short
    is_likely_ingredients = (
        ingredient_term_count >= 2 and
        comma_count >= 2 and
        word_count >= 5
    )
    
    if not is_likely_ingredients:
        # Also check for semicolon-separated (some EU labels use this)
        semicolon_count = raw_text.count(';')
        if ingredient_term_count >= 2 and semicolon_count >= 2:
            is_likely_ingredients = True
    
    if not is_likely_ingredients:
        return ""
    
    # Extract the ingredient portion (before allergen advisory if present)
    if allergen_pos != -1 and allergen_pos > 10:
        ingredient_zone = raw_text[:allergen_pos].strip()
    else:
        ingredient_zone = raw_text.strip()
    
    # Remove obvious non-ingredient prefixes (product names at start)
    # Look for patterns like "Product Name 85%" at the beginning
    cleaned = remove_product_name_prefix(ingredient_zone)
    
    return cleaned


def remove_product_name_prefix(text: str) -> str:
    """
    Remove product name/metadata from the beginning of text.
    
    Examples:
    - "Chocolate negro 85% Cacao: 78% pasta de cacao, azúcar..."
      → "pasta de cacao, azúcar..."
    """
    if not text:
        return ""
    
    # Patterns that indicate product metadata (should be removed)
    # Look for percentage patterns that typically appear in product names
    
    # Try to find where the actual ingredient list starts
    # Common patterns: after a percentage, after a colon following a percentage
    
    # Pattern: "Something XX% Something: " - the ingredients start after the colon
    match = re.search(r'\d+\s*%[^:]*:\s*', text)
    if match:
        # Check if what comes after looks like ingredients
        remaining = text[match.end():]
        remaining_lower = remaining.lower()
        
        # Verify it has ingredient-like content
        has_ingredients = any(term in remaining_lower for term in COMMON_INGREDIENT_TERMS[:20])
        if has_ingredients and len(remaining) > 20:
            return remaining
    
    # Pattern: Look for first comma and check if before it is a product name
    first_comma = text.find(',')
    if first_comma > 0 and first_comma < 50:
        before_comma = text[:first_comma].lower()
        after_comma = text[first_comma:].lower()
        
        # If before comma has percentage but after comma has ingredient terms
        has_percentage_before = '%' in before_comma
        has_ingredient_after = any(term in after_comma for term in COMMON_INGREDIENT_TERMS[:20])
        
        if has_percentage_before and has_ingredient_after:
            # The first item might be mixed with product name, but keep the rest
            # Try to salvage: find the first ingredient-like term
            for term in COMMON_INGREDIENT_TERMS:
                pos = text.lower().find(term)
                if pos != -1 and pos < 100:
                    # Found an ingredient term, start from there
                    # But look back for a comma or start of term
                    start_pos = pos
                    while start_pos > 0 and text[start_pos - 1] not in ',;:':
                        start_pos -= 1
                    if start_pos > 0:
                        start_pos += 1  # Skip the separator
                    return text[start_pos:].strip()
    
    # No clear pattern found, return as-is
    # The GPT parser will have to handle it
    return text


def segment_ocr_text(raw_text: str) -> OCRZoneResult:
    """
    Segment raw OCR text into semantic zones using deterministic rules.
    
    This is the CRITICAL function that ensures:
    1. Product names/metadata are NOT treated as ingredients
    2. Only text after "Ingredientes:" (or equivalent) is parsed
    3. Allergen advisories are separated from actual ingredients
    
    Args:
        raw_text: Raw OCR output from PaddleOCR
    
    Returns:
        OCRZoneResult with segmented zones
    """
    notes = []
    
    if not raw_text or len(raw_text.strip()) < 5:
        return OCRZoneResult(
            raw_text=raw_text or "",
            header_zone="",
            ingredient_zone="",
            allergen_advisory_zone="",
            detected_language=None,
            parse_status="NO_INGREDIENTS",
            parse_notes=["Raw text too short or empty"]
        )
    
    # Detect language from headers
    detected_lang = detect_language_from_headers(raw_text)
    notes.append(f"Detected language: {detected_lang or 'unknown'}")
    
    # Find ingredient header position
    ing_pos, ing_header = find_header_position(raw_text, INGREDIENT_HEADERS)
    
    # Find allergen advisory position
    allergen_pos, allergen_header = find_header_position(raw_text, ALLERGEN_ADVISORY_HEADERS)
    
    notes.append(f"Ingredient header '{ing_header}' at position {ing_pos}")
    notes.append(f"Allergen header '{allergen_header}' at position {allergen_pos}")
    
    # CASE 1: No ingredient header found
    if ing_pos == -1:
        notes.append("WARNING: No ingredient header found")
        
        # FALLBACK: Check if text looks like it might contain ingredients
        # (comma-separated food terms, no obvious non-food content)
        # This handles cases where:
        # 1. User cropped tightly to ingredient text (no header visible)
        # 2. OCR missed the header but got the ingredients
        # 3. Label uses non-standard format
        
        fallback_ingredient_zone = attempt_fallback_ingredient_extraction(raw_text, allergen_pos)
        
        if fallback_ingredient_zone:
            notes.append(f"FALLBACK: Extracted {len(fallback_ingredient_zone)} chars as potential ingredients")
            
            # Extract allergen advisory if present
            if allergen_pos != -1:
                allergen_advisory_zone = raw_text[allergen_pos:].strip()
            else:
                allergen_advisory_zone = ""
            
            return OCRZoneResult(
                raw_text=raw_text,
                header_zone="",  # No clear header
                ingredient_zone=fallback_ingredient_zone,
                allergen_advisory_zone=allergen_advisory_zone,
                detected_language=detected_lang,
                parse_status="UNVERIFIED",  # Mark as unverified since no header
                parse_notes=notes
            )
        
        # No fallback possible - truly no ingredients found
        notes.append("No ingredient-like content detected in fallback")
        
        # Still try to extract allergen advisory if present
        if allergen_pos != -1:
            return OCRZoneResult(
                raw_text=raw_text,
                header_zone=raw_text[:allergen_pos].strip(),
                ingredient_zone="",
                allergen_advisory_zone=raw_text[allergen_pos:].strip(),
                detected_language=detected_lang,
                parse_status="NO_INGREDIENTS",
                parse_notes=notes
            )
        
        return OCRZoneResult(
            raw_text=raw_text,
            header_zone=raw_text,
            ingredient_zone="",
            allergen_advisory_zone="",
            detected_language=detected_lang,
            parse_status="NO_INGREDIENTS",
            parse_notes=notes
        )
    
    # CASE 2: Ingredient header found
    # Extract header zone (everything before ingredient header)
    header_zone = raw_text[:ing_pos].strip()
    
    # Find where ingredient list ends
    # Move past the header itself
    ing_start = ing_pos + len(ing_header)
    
    # Skip any colon or whitespace after header
    while ing_start < len(raw_text) and raw_text[ing_start] in ': \t\n':
        ing_start += 1
    
    # Determine ingredient zone end
    if allergen_pos != -1 and allergen_pos > ing_start:
        # Allergen advisory found after ingredients
        ingredient_zone = raw_text[ing_start:allergen_pos].strip()
        allergen_advisory_zone = raw_text[allergen_pos:].strip()
        notes.append(f"Ingredient zone: chars {ing_start}-{allergen_pos}")
    else:
        # No allergen advisory, or it's before ingredients (ignore it)
        ingredient_zone = raw_text[ing_start:].strip()
        allergen_advisory_zone = ""
        notes.append(f"Ingredient zone: chars {ing_start}-end")
    
    # Post-process ingredient zone: remove any trailing non-ingredient lines
    ingredient_zone = clean_ingredient_zone(ingredient_zone)
    
    # Validate we got something
    if len(ingredient_zone.strip()) < 5:
        notes.append("WARNING: Ingredient zone too short after extraction")
        return OCRZoneResult(
            raw_text=raw_text,
            header_zone=header_zone,
            ingredient_zone=ingredient_zone,
            allergen_advisory_zone=allergen_advisory_zone,
            detected_language=detected_lang,
            parse_status="UNVERIFIED",
            parse_notes=notes
        )
    
    return OCRZoneResult(
        raw_text=raw_text,
        header_zone=header_zone,
        ingredient_zone=ingredient_zone,
        allergen_advisory_zone=allergen_advisory_zone,
        detected_language=detected_lang,
        parse_status="OK",
        parse_notes=notes
    )


def clean_ingredient_zone(text: str) -> str:
    """
    Clean the ingredient zone by removing obvious non-ingredient content.
    """
    if not text:
        return ""
    
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Skip lines that are clearly not ingredients
        if is_non_ingredient_line(line):
            continue
        
        cleaned_lines.append(line)
    
    # Rejoin, preserving original separators where possible
    result = ' '.join(cleaned_lines)
    
    # Clean up multiple spaces/punctuation
    result = re.sub(r'\s+', ' ', result)
    result = re.sub(r'[,;]\s*[,;]', ',', result)  # Fix double commas
    
    return result.strip()


def extract_allergens_from_advisory(advisory_text: str) -> List[str]:
    """
    Extract allergen names from advisory text like "May contain: nuts, milk, soy"
    
    Returns list of allergen names (lowercase, normalized)
    """
    if not advisory_text:
        return []
    
    text = advisory_text.lower()
    
    # Remove the header phrase
    for header in ALLERGEN_ADVISORY_HEADERS:
        text = text.replace(header, " ")
    
    # Common allergen terms (multilingual)
    allergen_terms = {
        # Nuts
        "nueces": "tree nuts", "nuts": "tree nuts", "noix": "tree nuts",
        "nüsse": "tree nuts", "frutos secos": "tree nuts",
        "almendras": "almonds", "almonds": "almonds", "amandes": "almonds",
        "avellanas": "hazelnuts", "hazelnuts": "hazelnuts", "noisettes": "hazelnuts",
        "cacahuetes": "peanuts", "peanuts": "peanuts", "cacahuètes": "peanuts",
        "arachides": "peanuts", "erdnüsse": "peanuts", "mani": "peanuts",
        "pistachos": "pistachios", "pistachios": "pistachios", "pistaches": "pistachios",
        "anacardos": "cashews", "cashews": "cashews", "noix de cajou": "cashews",
        
        # Dairy
        "leche": "milk", "milk": "milk", "lait": "milk", "milch": "milk",
        "lactosa": "lactose", "lactose": "lactose",
        "lácteos": "dairy", "dairy": "dairy", "laitiers": "dairy",
        
        # Gluten
        "gluten": "gluten", "trigo": "wheat", "wheat": "wheat", "blé": "wheat",
        "weizen": "wheat", "cebada": "barley", "barley": "barley",
        "centeno": "rye", "rye": "rye", "seigle": "rye",
        "avena": "oats", "oats": "oats", "avoine": "oats",
        
        # Soy
        "soja": "soy", "soy": "soy", "soya": "soy",
        
        # Eggs
        "huevo": "egg", "huevos": "egg", "egg": "egg", "eggs": "egg",
        "oeuf": "egg", "oeufs": "egg", "ei": "egg", "eier": "egg",
        
        # Seafood
        "pescado": "fish", "fish": "fish", "poisson": "fish", "fisch": "fish",
        "mariscos": "shellfish", "shellfish": "shellfish",
        "crustáceos": "crustaceans", "crustaceans": "crustaceans",
        "moluscos": "mollusks", "mollusks": "mollusks",
        
        # Sesame
        "sésamo": "sesame", "sesame": "sesame", "sésame": "sesame",
        
        # Sulfites
        "sulfitos": "sulfites", "sulfites": "sulfites", "sulphites": "sulfites",
        
        # Celery
        "apio": "celery", "celery": "celery", "céleri": "celery",
        
        # Mustard
        "mostaza": "mustard", "mustard": "mustard", "moutarde": "mustard",
        
        # Lupin
        "altramuces": "lupin", "lupin": "lupin", "lupine": "lupin",
    }
    
    found_allergens = set()
    
    for term, normalized in allergen_terms.items():
        if term in text:
            found_allergens.add(normalized)
    
    return list(found_allergens)


def extract_ingredient_block(
    image_data: str,
    debug: bool = False,
    return_raw_boxes: bool = False,
    min_confidence: float = 0.5
) -> str:
    """
    Extract text from ingredient label image using PaddleOCR (local OCR).

    Args:
        image_data: Base64 encoded image string (with or without data URL prefix)
        debug: If True, enable verbose OCR debug logging
        return_raw_boxes: If True, return JSON with raw bounding boxes (for debugging)
        min_confidence: Minimum OCR confidence score (0.0-1.0), default 0.5

    Returns:
        str: Extracted text from the image
             If return_raw_boxes=True, returns JSON with boxes and text

    Raises:
        ValueError: If image cannot be decoded or processed
        Exception: If OCR fails (will be caught by caller and return 500)
    """
    logger.info("[OCR] Starting PaddleOCR extraction...")

    # Step 1: Decode base64 to OpenCV image
    try:
        cv2_image = decode_base64_image_to_cv2(image_data)
        height, width = cv2_image.shape[:2]
        logger.info(f"[OCR] Image decoded: {width}x{height}")
    except ValueError as e:
        logger.info(f"[OCR] Image decode error: {e}")
        raise

    # Step 2: Preprocess for better OCR accuracy
    # upscale_factor=None enables automatic dynamic upscaling based on image size
    try:
        preprocessed = preprocess_for_ocr(cv2_image, upscale_factor=None, debug=debug)
        prep_h, prep_w = preprocessed.shape[:2]
        logger.info(f"[OCR] Image preprocessed: {prep_w}x{prep_h}")
    except Exception as e:
        logger.info(f"[OCR] Preprocessing error: {e}")
        raise

    # Step 3: Run PaddleOCR with improved configuration
    try:
        extracted_text = run_paddle_ocr(
            preprocessed,
            min_confidence=min_confidence,
            filter_garbage=True,
            debug=debug,
            return_raw_boxes=return_raw_boxes
        )
        if not return_raw_boxes:
            logger.info(f"[OCR] Extracted {len(extracted_text)} chars")
            preview = extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text
            logger.info(f"[OCR] Text: {preview}")
        else:
            logger.info(f"[OCR] Returned raw boxes JSON")
    except Exception as e:
        logger.info(f"[OCR] PaddleOCR error: {e}")
        traceback.print_exc()
        raise

    return extracted_text


def extract_text_with_gpt_vision(image_data: str) -> str:
    """
    Fallback OCR using GPT-4 Vision when PaddleOCR fails to extract sufficient text.

    Args:
        image_data: Base64 encoded image string (with or without data URL prefix)

    Returns:
        str: Extracted text from the image

    Raises:
        Exception: If GPT Vision API call fails
    """
    logger.info("[OCR] Starting GPT Vision fallback OCR...")

    # Ensure proper base64 format for OpenAI Vision API
    if not image_data.startswith("data:"):
        image_data = f"data:image/jpeg;base64,{image_data}"

    response = client.chat.completions.create(
        model="gpt-4o",  # Use full gpt-4o for better OCR accuracy (not mini)
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant that reads text from images of food product labels. "
                    "Your task is to transcribe the text exactly as it appears. This is used to help "
                    "people with dietary restrictions (halal, kosher, allergies) understand what's in their food."
                )
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Please read and transcribe all the text from this food ingredient label. "
                            "Include:\n"
                            "- The ingredient list\n"
                            "- Any allergen warnings (May contain, Peut contenir, etc.)\n"
                            "- Nutritional percentages if visible\n\n"
                            "Keep the original language, don't translate. Just return the text you see."
                        )
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data,
                            "detail": "high"
                        }
                    }
                ]
            }
        ],
        max_tokens=2000
    )

    extracted_text = response.choices[0].message.content.strip()
    logger.info(f"[OCR] GPT Vision extracted {len(extracted_text)} chars")
    preview = extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text
    logger.info(f"[OCR] GPT Vision text: {preview}")

    return extracted_text


# ================================================================
#  PARALLEL OCR - Run PaddleOCR and GPT Vision concurrently
# ================================================================

async def async_paddle_ocr(image_data: str, debug: bool = False, min_confidence: float = 0.5) -> tuple:
    """Async wrapper for PaddleOCR. Returns (text, 'paddleocr')"""
    loop = asyncio.get_event_loop()
    text = await loop.run_in_executor(
        _executor,
        lambda: extract_ingredient_block(image_data, debug=debug, min_confidence=min_confidence)
    )
    return (text, "paddleocr")


async def async_gpt_vision(image_data: str) -> tuple:
    """Async wrapper for GPT Vision. Returns (text, 'gpt_vision')"""
    loop = asyncio.get_event_loop()
    text = await loop.run_in_executor(
        _executor,
        lambda: extract_text_with_gpt_vision(image_data)
    )
    return (text, "gpt_vision")


async def parallel_ocr(image_data: str, debug: bool = False, min_confidence: float = 0.5, min_tokens: int = 5) -> tuple:
    """
    Run PaddleOCR and GPT Vision in parallel.
    Waits for BOTH results and returns the one with more content.

    Returns:
        tuple: (extracted_text, source) where source is 'paddleocr' or 'gpt_vision'
    """
    # Create both tasks
    paddle_task = asyncio.create_task(async_paddle_ocr(image_data, debug, min_confidence))
    gpt_task = asyncio.create_task(async_gpt_vision(image_data))

    # Wait for ALL results to complete (with timeout)
    results = []

    try:
        # Wait for both with a reasonable timeout
        done, pending = await asyncio.wait(
            {paddle_task, gpt_task},
            timeout=30.0,  # 30 second timeout
            return_when=asyncio.ALL_COMPLETED
        )

        # Cancel any that didn't complete
        for task in pending:
            task.cancel()

        # Collect results
        for task in done:
            try:
                text, source = task.result()
                token_count = len(re.findall(r"\w+", text))
                char_count = len(text)
                results.append((text, source, token_count, char_count))
                logger.info(f"[PARALLEL OCR] {source} returned {token_count} tokens, {char_count} chars")
            except Exception as e:
                logger.warning(f"[PARALLEL OCR] Task failed: {e}")

    except asyncio.TimeoutError:
        logger.warning("[PARALLEL OCR] Timeout waiting for OCR tasks")
        # Try to get any completed results
        for task in [paddle_task, gpt_task]:
            if task.done() and not task.cancelled():
                try:
                    text, source = task.result()
                    token_count = len(re.findall(r"\w+", text))
                    char_count = len(text)
                    results.append((text, source, token_count, char_count))
                except:
                    pass

    # Pick the best result (most characters, as that likely means more complete extraction)
    if results:
        # Sort by character count (descending) - more chars = more complete OCR
        best = max(results, key=lambda x: x[3])
        logger.info(f"[PARALLEL OCR] Selected {best[1]} with {best[2]} tokens, {best[3]} chars")
        return (best[0], best[1])

    return ("", "none")


def parse_ingredient_text(ingredient_zone: str, detected_language: Optional[str] = None) -> dict:
    """
    Parse PRE-SEGMENTED ingredient zone text into structured ingredient data using GPT.
    
    IMPORTANT: This function receives ONLY the ingredient zone text,
    NOT the full OCR output. Zone segmentation is done by segment_ocr_text() first.
    
    This function handles:
    - Splitting ingredients by commas/semicolons
    - Translation to English
    - Normalization of ingredient names
    - OCR noise cleanup within the ingredient zone
    
    Args:
        ingredient_zone: Pre-segmented ingredient text (after "Ingredientes:" header)
        detected_language: Optional language code from zone segmentation
    
    Returns:
        dict with detected_language, ingredients[], allergens[]
    """
    # If ingredient zone is empty or too short, return empty result
    if not ingredient_zone or len(ingredient_zone.strip()) < 5:
        return {
            "detected_language": detected_language or "unknown",
            "ingredients": [],
            "allergens": [],
            "parse_status": "EMPTY_ZONE"
        }
    
    lang_hint = f"The text is likely in {detected_language}. " if detected_language else ""
    
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Return ONLY valid JSON. You are an expert at parsing ingredient lists from OCR text."
            },
            {
                "role": "user",
                "content": (
                    "You are given a PRE-EXTRACTED ingredient list from a food product label.\n"
                    "This text has ALREADY been segmented - it contains ONLY ingredients, "
                    "NOT product names, NOT allergen warnings, NOT nutritional info.\n\n"
                    f"{lang_hint}"
                    "Tasks:\n"
                    "1. Confirm/detect the language\n"
                    "2. Split individual ingredients (separated by commas, semicolons, or periods)\n"
                    "3. Translate each ingredient to English ACCURATELY\n"
                    "4. Normalize ingredient names (lowercase, standard spelling)\n"
                    "5. Identify allergens PRESENT IN THE INGREDIENTS (not advisory warnings)\n\n"
                    "OCR NOISE HANDLING:\n"
                    "- Fix common OCR errors: '0' vs 'O', '1' vs 'l' vs 'I', 'rn' vs 'm'\n"
                    "- Ignore stray characters: |, *, #, @, random punctuation\n"
                    "- Ignore partial words at start/end that are clearly cut off\n"
                    "- Handle merged words (e.g., 'azucarsal' -> 'azucar, sal')\n\n"
                    "CRITICAL TRANSLATION RULES:\n"
                    "- 'tournesol' = SUNFLOWER (NOT soy)\n"
                    "- 'lécithine de tournesol' = sunflower lecithin (NOT soy lecithin)\n"
                    "- 'soja' = soy\n"
                    "- 'colza' = rapeseed/canola\n"
                    "- 'huile de palme' = palm oil\n"
                    "- 'manteca de cacao' / 'beurre de cacao' = cocoa butter\n"
                    "- 'pasta de cacao' / 'pâte de cacao' = cocoa mass\n"
                    "- 'azúcar' / 'sucre' = sugar\n"
                    "- 'lait' / 'leche' = milk\n"
                    "- 'oeuf' / 'oeufs' / 'huevo' = egg\n"
                    "- 'blé' / 'trigo' = wheat\n"
                    "- 'arachide' / 'cacahuete' = peanut\n"
                    "- Do NOT assume lecithin is soy unless the original explicitly says 'soja' or 'soy'\n"
                    "- Keep lecithin source accurate in translation\n\n"
                    "WHAT IS NOT AN INGREDIENT (ignore if present):\n"
                    "- Percentages like 'Cacao: 78%' or '85% cacao'\n"
                    "- Weight/volume like '100g', '200ml'\n"
                    "- Product names like 'Chocolate Negro'\n"
                    "- Certifications like 'UTZ', 'Fairtrade'\n"
                    "- 'May contain' warnings\n\n"
                    "Return JSON:\n"
                    "{\n"
                    "  \"detected_language\": \"<language code: en, fr, de, es, it, etc.>\",\n"
                    "  \"ingredients\": [\n"
                    "    { \"original\": \"<original text>\", \"english\": \"<english translation>\", \"normalized\": \"<normalized lowercase>\" }\n"
                    "  ],\n"
                    "  \"allergens\": [\"<allergen1>\", \"<allergen2>\"]\n"
                    "}\n\n"
                    f"Ingredient zone text:\n{ingredient_zone}"
                )
            }
        ],
        max_completion_tokens=600
    )

    raw = resp.choices[0].message.content

    try:
        result = safe_extract_json(raw)
        result["parse_status"] = "OK"
        return result
    except Exception:
        logger.error("ERROR: JSON PARSE FAILED")
        logger.error("----- RAW MODEL OUTPUT -----")
        logger.error(raw)
        logger.error("----------------------------")
        raise

# ================================================================
#  /OCR-DEBUG  — Debug endpoint for OCR inspection
# ================================================================

@app.route("/ocr-debug", methods=["POST"])
def ocr_debug():
    """
    Debug endpoint for inspecting raw OCR results.

    Request body:
    {
        "image": "base64 image data",
        "min_confidence": 0.5,     // optional, default 0.5
        "return_raw_boxes": true   // optional, default true
    }

    Returns:
    {
        "success": true,
        "ocr_result": {
            "boxes": [...],      // raw bounding boxes with text and confidence
            "text": "...",       // extracted text in reading order
            "num_segments": N,   // number of text segments
            "num_rows": N        // number of text rows
        },
        "preprocessing": {
            "input_size": "WxH",
            "output_size": "WxH",
            "upscale_factor": N
        }
    }
    """
    try:
        data = request.json or {}
        image_data = data.get("image")
        min_confidence = data.get("min_confidence", 0.5)
        return_raw_boxes = data.get("return_raw_boxes", True)

        if not image_data:
            return jsonify({"success": False, "error": "No image provided"}), 400

        # Strip data URL prefix
        if image_data.startswith("data:"):
            image_data = image_data.split(",", 1)[1]

        # Decode image
        cv2_image = decode_base64_image_to_cv2(image_data)
        input_h, input_w = cv2_image.shape[:2]

        # Preprocess with debug info
        preprocessed = preprocess_for_ocr(cv2_image, upscale_factor=None, debug=True)
        output_h, output_w = preprocessed.shape[:2]

        # Calculate effective upscale factor
        upscale_factor = output_w / input_w

        # Run OCR with debug and raw boxes
        ocr_result = run_paddle_ocr(
            preprocessed,
            min_confidence=min_confidence,
            filter_garbage=True,
            debug=True,
            return_raw_boxes=return_raw_boxes
        )

        # Parse the JSON result if raw boxes were requested
        if return_raw_boxes:
            ocr_result = json.loads(ocr_result)

        return jsonify({
            "success": True,
            "ocr_result": ocr_result if isinstance(ocr_result, dict) else {"text": ocr_result},
            "preprocessing": {
                "input_size": f"{input_w}x{input_h}",
                "output_size": f"{output_w}x{output_h}",
                "upscale_factor": round(upscale_factor, 2)
            }
        })

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ================================================================
#  /SCAN  — OCR + Scoring + Diet + Allergy
# ================================================================

@app.route("/scan", methods=["POST"])
def scan():
    # Image size limits from environment
    MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE", 10 * 1024 * 1024))  # 10MB default
    MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", 4096))

    try:
        data = request.json or {}
        image_data = data.get("image")
        profile = data.get("profile", {})

        if not image_data:
            return jsonify({"success": False, "error": "No image provided"}), 400

        # DEBUG: Log image data info
        logger.debug(f"Image data received: {len(image_data)} chars")
        logger.debug(f"Starts with data: prefix: {image_data.startswith('data:')}")

        if image_data.startswith("data:"):
            image_data = image_data.split(",", 1)[1]
            logger.debug(f"After stripping prefix: {len(image_data)} chars")

        # Validate base64 and decode
        try:
            import base64 as b64
            decoded = b64.b64decode(image_data)
            logger.debug(f"Decoded image size: {len(decoded)} bytes")
        except Exception as e:
            logger.warning(f"Base64 decode FAILED: {e}")
            return jsonify({"success": False, "error": "Invalid image encoding"}), 400

        # Validate image size
        if len(decoded) > MAX_IMAGE_SIZE:
            max_mb = MAX_IMAGE_SIZE / (1024 * 1024)
            logger.warning(f"Image too large: {len(decoded)} bytes (max: {MAX_IMAGE_SIZE})")
            return jsonify({
                "success": False,
                "error": f"Image too large. Maximum size is {max_mb:.0f}MB"
            }), 400

        # Validate image format using magic bytes
        magic_bytes = decoded[:10]
        is_jpeg = magic_bytes[:2] == b'\xff\xd8'
        is_png = magic_bytes[:8] == b'\x89PNG\r\n\x1a\n'
        is_webp = magic_bytes[:4] == b'RIFF' and decoded[8:12] == b'WEBP'

        if not (is_jpeg or is_png or is_webp):
            logger.warning(f"Invalid image format. Magic bytes: {magic_bytes.hex()}")
            return jsonify({
                "success": False,
                "error": "Invalid image format. Supported formats: JPEG, PNG, WebP"
            }), 400

        # Validate image dimensions
        try:
            from PIL import Image as PILImage
            from io import BytesIO as BIO
            img = PILImage.open(BIO(decoded))
            width, height = img.size
            if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
                logger.warning(f"Image dimensions too large: {width}x{height} (max: {MAX_IMAGE_DIMENSION})")
                return jsonify({
                    "success": False,
                    "error": f"Image dimensions too large. Maximum is {MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION} pixels"
                }), 400
            logger.debug(f"Image validated: {width}x{height}, format={img.format}")
        except Exception as e:
            logger.warning(f"Failed to validate image dimensions: {e}")
            # Continue anyway - OCR might still work

        # ============================================================
        #  STEP 1: OCR - Extract raw text from image
        # ============================================================
        # Optional debug mode: set "ocr_debug": true in request to enable verbose logging
        ocr_debug = data.get("ocr_debug", False)
        ocr_min_confidence = data.get("ocr_min_confidence", 0.5)
        ocr_mode = data.get("ocr_mode", "parallel")  # "parallel", "paddle_only", "gpt_only"

        if ocr_mode == "paddle_only":
            raw_ocr_text = extract_ingredient_block(image_data, debug=ocr_debug, min_confidence=ocr_min_confidence)
            ocr_source = "paddleocr"
        elif ocr_mode == "gpt_only":
            raw_ocr_text = extract_text_with_gpt_vision(image_data)
            ocr_source = "gpt_vision"
        else:  # parallel (default)
            raw_ocr_text, ocr_source = asyncio.run(
                parallel_ocr(
                    image_data,
                    debug=ocr_debug,
                    min_confidence=ocr_min_confidence,
                    min_tokens=5
                )
            )

        # Basic guardrail - reject if OCR returned almost nothing
        token_count = len(re.findall(r"\w+", raw_ocr_text))
        if token_count < 3:
            return jsonify({
                "success": False,
                "error": "Could not extract text from image. Please take a clearer photo of the ingredients list.",
                "error_code": "OCR_FAILED"
            }), 400

        # ============================================================
        #  STEP 2: ZONE SEGMENTATION - Deterministic pre-processing
        #  This separates: HEADER | INGREDIENTS | ALLERGEN_ADVISORY
        #  CRITICAL: Only the ingredient zone is sent to GPT for parsing
        # ============================================================
        zone_result = segment_ocr_text(raw_ocr_text)
        
        # DEBUG: Log zone segmentation results
        import sys
        logger.debug("=" * 60)
        logger.debug("DEBUG: RAW OCR TEXT FROM IMAGE:")
        logger.debug(raw_ocr_text)
        logger.debug("=" * 60)
        logger.debug("DEBUG: ZONE SEGMENTATION RESULT:")
        logger.debug(f"Parse Status: {zone_result.parse_status}")
        logger.debug(f"Detected Language: {zone_result.detected_language}")
        logger.debug(f"Header Zone: {zone_result.header_zone[:100]}..." if len(zone_result.header_zone) > 100 else f"  Header Zone: {zone_result.header_zone}")
        logger.debug(f"Ingredient Zone: {zone_result.ingredient_zone[:200]}..." if len(zone_result.ingredient_zone) > 200 else f"  Ingredient Zone: {zone_result.ingredient_zone}")
        logger.debug(f"Allergen Advisory: {zone_result.allergen_advisory_zone[:100]}..." if len(zone_result.allergen_advisory_zone) > 100 else f"  Allergen Advisory: {zone_result.allergen_advisory_zone}")
        logger.debug(f"Parse Notes: {zone_result.parse_notes}")
        logger.debug("=" * 60)
        sys.stdout.flush()

        # Handle zone segmentation failures
        if zone_result.parse_status == "NO_INGREDIENTS":
            return jsonify({
                "success": False,
                "error": "No ingredient list found. Please crop to show 'Ingredientes:' or 'Ingredients:' section."
            }), 400
        
        if zone_result.parse_status == "UNVERIFIED" and len(zone_result.ingredient_zone.strip()) < 10:
            return jsonify({
                "success": False,
                "error": "Ingredient list could not be verified. Please crop closer to the ingredient section."
            }), 400

        # ============================================================
        #  STEP 3: GPT PARSING - Parse ONLY the ingredient zone
        # ============================================================
        try:
            parsed = parse_ingredient_text(
                ingredient_zone=zone_result.ingredient_zone,
                detected_language=zone_result.detected_language
            )
        except Exception:
            return jsonify({
                "success": False,
                "error": "Could not understand ingredient list. Please crop closer."
            }), 400

        # DEBUG: Log what GPT extracted
        logger.debug("DEBUG: PARSED INGREDIENTS:")
        for ing in parsed.get("ingredients", []):
            logger.debug(f"Original: {ing.get('original')}")
            logger.debug(f"English:  {ing.get('english')}")
            logger.debug(f"Normalized: {ing.get('normalized')}")
            logger.debug("---")
        logger.debug(f"DETECTED ALLERGENS (from ingredients): {parsed.get('allergens', [])}")
        logger.debug("=" * 60)
        sys.stdout.flush()

        ingredients = parsed.get("ingredients", [])
        
        # ============================================================
        #  QUALITY CHECK: Verify we actually got ingredients
        #  If GPT returned empty/minimal ingredients, the OCR likely
        #  didn't capture the real ingredient text
        # ============================================================
        if len(ingredients) < 2:
            # Check if we have allergen advisory but no ingredients
            # This suggests the OCR missed the ingredient section
            if zone_result.allergen_advisory_zone and len(zone_result.allergen_advisory_zone) > 20:
                return jsonify({
                    "success": False,
                    "error": "Only allergen warnings were detected, but no ingredients. Please crop to include the full ingredient list (usually starts with 'Ingredientes:' or 'Ingredients:')."
                }), 400
            
            # Check if zone was marked as UNVERIFIED
            if zone_result.parse_status == "UNVERIFIED":
                return jsonify({
                    "success": False,
                    "error": "Could not read ingredient list clearly. Please: 1) Zoom in more on the ingredient text, 2) Ensure good lighting, 3) Include the 'Ingredientes:' header if visible."
                }), 400
            
            return jsonify({
                "success": False,
                "error": "Very few ingredients detected. The text may be too small or blurry. Try zooming in closer to the ingredient list."
            }), 400
        
        # ============================================================
        #  STEP 4: ALLERGEN EXTRACTION
        #  Combine: allergens FROM ingredients + allergens FROM advisory
        # ============================================================
        
        # Allergens detected in actual ingredients (from GPT)
        ingredient_allergens = [a.strip().lower() for a in parsed.get("allergens", [])]
        
        # Allergens from "May contain" advisory (deterministic extraction)
        advisory_allergens = extract_allergens_from_advisory(zone_result.allergen_advisory_zone)
        
        logger.debug(f"Advisory allergens extracted: {advisory_allergens}")
        
        # ============================================================
        # ALLERGEN CORRECTION: Fix lecithin allergen detection
        # GPT may list "lecithin" as an allergen, but we need to check
        # the actual source to determine if it's a real allergen.
        # ============================================================
        corrected_allergens = []
        
        # Get the full original ingredient text to check lecithin source
        full_original_text = " ".join([
            (ing.get("original") or "").lower() 
            for ing in ingredients
        ])
        
        for allergen in ingredient_allergens:
            if "lecithin" in allergen:
                # Check ingredient zone for lecithin source
                is_lecithin_zone, lecithin_source_zone, _ = detect_lecithin_source(zone_result.ingredient_zone.lower())
                
                # Also check parsed originals as fallback
                is_lecithin_parsed, lecithin_source_parsed, _ = detect_lecithin_source(full_original_text)
                
                # Use zone source if specific, otherwise fall back to parsed
                if is_lecithin_zone and lecithin_source_zone and lecithin_source_zone != "unspecified":
                    lecithin_source = lecithin_source_zone
                elif is_lecithin_parsed and lecithin_source_parsed:
                    lecithin_source = lecithin_source_parsed
                else:
                    lecithin_source = "unspecified"
                
                # Map lecithin source to actual allergen
                if lecithin_source == "soy":
                    corrected_allergens.append("soy")
                elif lecithin_source == "egg":
                    corrected_allergens.append("egg")
                elif lecithin_source in ["sunflower", "rapeseed"]:
                    # Sunflower/rapeseed lecithin are NOT allergens - don't add anything
                    pass
                else:
                    # Unspecified source - add as possible soy (conservative)
                    corrected_allergens.append("soy (possible)")
            else:
                # Non-lecithin allergen - keep as is
                corrected_allergens.append(allergen)
        
        # Add advisory allergens (these are "may contain" warnings, mark them)
        for adv_allergen in advisory_allergens:
            advisory_label = f"{adv_allergen} (may contain)"
            if advisory_label not in corrected_allergens and adv_allergen not in corrected_allergens:
                corrected_allergens.append(advisory_label)
        
        # Remove duplicates while preserving order
        allergens = list(dict.fromkeys(corrected_allergens))


        diet = profile.get("diet")
        profile_allergies = profile.get("allergies", [])

        # ============================================================
        #  ANALYSIS (USE NORMALIZED ENGLISH INGREDIENTS)
        # ============================================================
        enhanced = []
        halal_results = []
        kosher_results = []



        for ing in ingredients:
            normalized = (
                ing.get("normalized")
                or ing.get("english")
                or ing.get("original")
                or ""
            ).lower()
            
            # Keep original text for lecithin source detection
            # This prevents false positives when GPT incorrectly normalizes sources
            original = (ing.get("original") or "").lower()
            english_from_gpt = (ing.get("english") or "").lower()

            if not normalized:
                continue
            
            # ============================================================
            # LECITHIN CORRECTION: Fix GPT mis-normalization
            # If original contains lecithin, detect actual source and correct the name.
            # We also check the raw OCR text in case GPT dropped the source during parsing.
            # ============================================================
            display_name = normalized
            corrected_english = english_from_gpt
            
            is_lecithin_orig, source_orig, _ = detect_lecithin_source(original)
            is_lecithin_norm, source_norm, _ = detect_lecithin_source(normalized)
            
            # Also check raw OCR text for lecithin source (in case GPT dropped it)
            is_lecithin_raw, source_raw, _ = detect_lecithin_source(raw_ocr_text)
            
            if is_lecithin_orig or is_lecithin_norm:
                # Priority order for determining correct source:
                # 1. Raw OCR text (most reliable - before any GPT processing)
                # 2. Original parsed text
                # 3. Normalized text
                if is_lecithin_raw and source_raw and source_raw != "unspecified":
                    correct_source = source_raw
                elif is_lecithin_orig and source_orig and source_orig != "unspecified":
                    correct_source = source_orig
                elif is_lecithin_norm and source_norm and source_norm != "unspecified":
                    correct_source = source_norm
                else:
                    correct_source = "unspecified"
                
                # Build corrected display name
                source_display_names = {
                    "sunflower": "sunflower lecithin",
                    "soy": "soy lecithin",
                    "rapeseed": "rapeseed lecithin",
                    "egg": "egg lecithin",
                    "unspecified": "lecithin (source unspecified)",
                }
                
                # Always use the correct source for display
                display_name = source_display_names.get(correct_source, normalized)
                corrected_english = source_display_names.get(correct_source, english_from_gpt)
            
            halal_result = None
            kosher_result = None

            if diet == "halal":
                # For lecithin, use raw OCR text to get correct source
                halal_original = raw_ocr_text if (is_lecithin_orig or is_lecithin_norm) else original
                halal_result = evaluate_halal_strict(
                    ingredient_text=normalized,
                    strict_mode=True,
                    original_text=halal_original  # Pass raw OCR for lecithin detection
                )
                halal_results.append(halal_result)

            if diet == "kosher":
                kosher_result = evaluate_kosher_strict(
                    ingredient_text=normalized
                )
                kosher_results.append(kosher_result)

            # For lecithin ingredients, use raw OCR text to check allergens correctly
            # This prevents false positives when GPT drops the source during parsing
            if is_lecithin_orig or is_lecithin_norm:
                allergy_check_text = raw_ocr_text
            else:
                allergy_check_text = original
            
            enhanced.append({
                "name": display_name,  # Use corrected display name
                "original": ing["original"],
                "english": corrected_english,  # Use corrected English

                # HALAL DETAILS
                "halal": {
                    "status": (
                        "HALAL" if halal_result.status == HALAL_CONFIRMED
                        else halal_result.status
                    ),
                    "confidence": halal_result.confidence,
                    "reason_codes": halal_result.reason_codes,
                    "evidence": halal_result.evidence,
                } if halal_result else None,

                # KOSHER DETAILS
                "kosher": {
                    "status": kosher_result.status,
                    "confidence": kosher_result.confidence,
                    "reason_codes": kosher_result.reason_codes,
                    "evidence": kosher_result.evidence,
                    "tags": kosher_tags(kosher_result),
                } if kosher_result else None,

                # Use raw OCR text for lecithin allergen check to avoid GPT errors
                "allergy_flag": check_allergy(allergy_check_text, profile_allergies),
            })


        product_kosher = None

        if diet == "kosher":
            product_kosher = aggregate_product_kosher(
                ingredient_results=kosher_results
            )

        product_halal = None

        if diet == "halal":
            product_halal = aggregate_product_halal(
                ingredient_results=halal_results,
                strict_mode=True
            )

        diet_verdict = {}

        if product_halal:
            diet_verdict["halal"] = {
                "status": product_halal.status,
                "confidence": product_halal.confidence,
                "reason": product_halal.reason,
                "failing_ingredients": product_halal.failing_ingredients,
                "reason_codes": product_halal.reason_codes,
            }

        if product_kosher:
            diet_verdict["kosher"] = {
                "status": product_kosher.status,
                "confidence": product_kosher.confidence,
                "reason": product_kosher.reason,
                "failing_ingredients": product_kosher.failing_ingredients,
                "reason_codes": product_kosher.reason_codes,
            }

        return jsonify({
            "success": True,
            "detected_language": parsed.get("detected_language"),
            "ocr_source": ocr_source,  # "paddleocr" or "gpt_vision"

            # ✅ UNIFIED DIET VERDICT
            "diet_verdict": diet_verdict or None,

            "ingredients": [
                {
                    "original": ing["original"],
                    "english": ing["english"],
                    "normalized": ing["normalized"]
                }
                for ing in ingredients
            ],
            "analysis": enhanced,
            "allergens": allergens
        })



    except Exception as e:
        logger.error("===== BACKEND ERROR =====")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500



# ================================================================
#  SAVE PROFILE
# ================================================================

@app.route("/save_profile", methods=["POST"])
def save_profile():
    data = request.json or {}

    logger.info("===== USER PROFILE UPDATED =====")
    logger.info(f"Diet: {data.get('diet')}")
    logger.info(f"Allergies: {data.get('allergies')}")
    logger.info("================================")

    with open("profile.json", "w") as f:
        json.dump(data, f, indent=2)

    return jsonify({"success": True})


# ================================================================
#  HEALTH CHECK
# ================================================================

@app.route("/health")
def health():
    return jsonify({"status": "ok"})



# ================================================================
#  FEEDBACK SUBMISSION ENDPOINT
# ================================================================
@app.route("/submit_feedback", methods=["POST"])
def submit_feedback():
    try:
        data = request.json or {}

        entry = {
            "id": data.get("id"),
            "timestamp": data.get("timestamp"),
            "category": data.get("category"),
            "message": data.get("message"),
            "images": data.get("images", [])
        }

        # ---- Load existing feedback ----
        try:
            with open("feedback.json", "r") as f:
                all_feedback = json.load(f)
        except:
            all_feedback = []

        # ---- Save new entry ----
        all_feedback.insert(0, entry)
        with open("feedback.json", "w") as f:
            json.dump(all_feedback, f, indent=2)

        logger.info("===== NEW FEEDBACK RECEIVED =====")
        logger.info(str(entry))
        logger.info("================================")

        return jsonify({"success": True})

    except Exception as e:
        logger.error("ERROR: Error saving feedback:", e)
        return jsonify({"success": False, "error": str(e)}), 500

# ================================================================
#  LECITHIN TEST CASES
# ================================================================

def test_lecithin_detection():
    """
    Test cases for lecithin source detection and halal/allergen evaluation.
    Run with: python -c "from app import test_lecithin_detection; test_lecithin_detection()"
    """
    print("\n" + "=" * 60)
    print("LECITHIN DETECTION TEST CASES")
    print("=" * 60)
    
    test_cases = [
        # (ingredient_text, expected_source, expected_halal_status, expected_soy_allergen)
        ("lecithine de tournesol", "sunflower", "HALAL_CONFIRMED", False),
        ("lécithine de tournesol", "sunflower", "HALAL_CONFIRMED", False),
        ("sunflower lecithin", "sunflower", "HALAL_CONFIRMED", False),
        ("soy lecithin", "soy", "NOT_HALAL_UNVERIFIED", True),  # Soy lecithin needs halal cert
        ("soja lecithin", "soy", "NOT_HALAL_UNVERIFIED", True),  # Soy lecithin needs halal cert
        ("lecithin", "unspecified", "NOT_HALAL_UNVERIFIED", True),  # Conservative: unspecified -> possible soy
        ("rapeseed lecithin", "rapeseed", "HALAL_CONFIRMED", False),
        ("egg lecithin", "egg", "HALAL_CONFIRMED", False),  # Not soy allergen, but egg allergen
        ("E322 (sunflower)", "sunflower", "HALAL_CONFIRMED", False),
        ("émulsifiant (lécithine de tournesol)", "sunflower", "HALAL_CONFIRMED", False),
    ]
    
    # Additional test: simulate GPT mis-normalization scenario
    print("\n" + "-" * 60)
    print("COMBINED DETECTION TEST (Original vs Normalized)")
    print("-" * 60)
    
    # This simulates the bug: GPT incorrectly normalized "tournesol" to "soy"
    combined_test_cases = [
        # (original, normalized, expected_source, expected_halal, expected_soy_alert)
        ("lécithine de tournesol", "soy lecithin", "sunflower", "HALAL_CONFIRMED", False),
        ("emulsifiant (lecithine de tournesol)", "emulsifier (soy lecithin)", "sunflower", "HALAL_CONFIRMED", False),
        ("soja lecithin", "soy lecithin", "soy", "NOT_HALAL_UNVERIFIED", True),
        ("lecithin", "lecithin", "unspecified", "NOT_HALAL_UNVERIFIED", True),
    ]
    
    for original, normalized, expected_source, expected_halal, expected_soy_allergen in combined_test_cases:
        # Use combined detection
        is_lecithin, source, explanation = detect_lecithin_source_combined(original, normalized)
        
        # Test halal with original text
        halal_result = evaluate_halal_strict(normalized, strict_mode=True, original_text=original)
        
        # Check allergen (using original)
        is_soy_allergen = check_allergy(original, ["soy"])
        
        source_ok = source == expected_source
        halal_ok = halal_result.status == expected_halal
        allergen_ok = is_soy_allergen == expected_soy_allergen
        
        status_icon = "[PASS]" if (source_ok and halal_ok and allergen_ok) else "[FAIL]"
        
        if not (source_ok and halal_ok and allergen_ok):
            all_passed = False
        
        print(f"\n{status_icon} Original: \"{original}\" -> Normalized: \"{normalized}\"")
        logger.debug(f" Source:    {source} (expected: {expected_source}) {'OK' if source_ok else 'WRONG'}")
        logger.debug(f" Halal:     {halal_result.status} (expected: {expected_halal}) {'OK' if halal_ok else 'WRONG'}")
        logger.debug(f" Soy Alert: {is_soy_allergen} (expected: {expected_soy_allergen}) {'OK' if allergen_ok else 'WRONG'}")
    
    all_passed = True
    
    for ingredient, expected_source, expected_halal, expected_soy_allergen in test_cases:
        # Test lecithin detection
        is_lecithin, source, explanation = detect_lecithin_source(ingredient)
        
        # Test halal evaluation
        halal_result = evaluate_halal_strict(ingredient, strict_mode=True)
        
        # Test allergen detection (for soy allergy)
        is_soy_allergen = check_allergy(ingredient, ["soy"])
        
        # Check results
        source_ok = source == expected_source
        halal_ok = halal_result.status == expected_halal
        allergen_ok = is_soy_allergen == expected_soy_allergen
        
        status_icon = "[PASS]" if (source_ok and halal_ok and allergen_ok) else "[FAIL]"
        
        if not (source_ok and halal_ok and allergen_ok):
            all_passed = False
        
        print(f"\n{status_icon} Test: \"{ingredient}\"")
        logger.debug(f" Source:    {source} (expected: {expected_source}) {'OK' if source_ok else 'WRONG'}")
        logger.debug(f" Halal:     {halal_result.status} (expected: {expected_halal}) {'OK' if halal_ok else 'WRONG'}")
        logger.debug(f" Soy Alert: {is_soy_allergen} (expected: {expected_soy_allergen}) {'OK' if allergen_ok else 'WRONG'}")
        
        if halal_result.evidence:
            logger.debug(f" Evidence:  {halal_result.evidence[0]}")
    
    print("\n" + "=" * 60)
    if all_passed:
        print("ALL TESTS PASSED")
    else:
        print("SOME TESTS FAILED")
    print("=" * 60 + "\n")
    
    return all_passed


# ================================================================
#  ZONE SEGMENTATION TEST CASES
# ================================================================

def test_zone_segmentation():
    """
    Test cases for OCR zone segmentation.
    
    This demonstrates how the system separates:
    - HEADER (product name, metadata)
    - INGREDIENTS (actual ingredient list)
    - ALLERGEN ADVISORY ("may contain" warnings)
    
    Run with: python -c "from app import test_zone_segmentation; test_zone_segmentation()"
    """
    print("\n" + "=" * 70)
    print("ZONE SEGMENTATION TEST CASES")
    print("=" * 70)
    
    # Test cases: (raw_ocr_text, expected_status, expected_has_ingredients, expected_advisory_allergens)
    test_cases = [
        # Case 1: Spanish chocolate label with clear sections
        (
            "Chocolate negro 85% Cacao: 85% mínimo Ingredientes: pasta de cacao, "
            "azúcar, manteca de cacao, emulgente (lecitina de soja), aroma. "
            "Puede contener: leche, frutos secos.",
            "OK",
            True,
            ["milk", "tree nuts"]
        ),
        
        # Case 2: French label
        (
            "Chocolat Noir 70% Ingrédients: pâte de cacao, sucre, beurre de cacao, "
            "émulsifiant (lécithine de tournesol). Peut contenir: lait, noisettes.",
            "OK",
            True,
            ["milk", "hazelnuts"]
        ),
        
        # Case 3: English label
        (
            "Dark Chocolate 72% Cocoa Ingredients: cocoa mass, sugar, cocoa butter, "
            "emulsifier (soy lecithin), vanilla. May contain: milk, nuts, wheat.",
            "OK",
            True,
            ["milk", "tree nuts", "wheat"]
        ),
        
        # Case 4: German label
        (
            "Zartbitterschokolade Zutaten: Kakaomasse, Zucker, Kakaobutter, "
            "Emulgator (Sojalecithin). Kann enthalten: Milch, Haselnüsse.",
            "OK",
            True,
            ["milk", "hazelnuts"]
        ),
        
        # Case 5: No ingredient header - should fail
        (
            "Chocolate Negro Premium 200g Cacao: 78% Fabricado en España",
            "NO_INGREDIENTS",
            False,
            []
        ),
        
        # Case 6: OCR with merged tokens (no spaces)
        (
            "Chocolate Ingredientes:azucar,cacao,lecitina Puedecontenerleche",
            "OK",
            True,
            ["milk"]
        ),
        
        # Case 7: Italian label
        (
            "Cioccolato Fondente Ingredienti: pasta di cacao, zucchero, burro di cacao. "
            "Può contenere: latte, frutta a guscio.",
            "OK",
            True,
            ["milk"]
        ),
    ]
    
    all_passed = True
    
    for i, (raw_text, expected_status, expected_has_ing, expected_allergens) in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i} ---")
        print(f"Raw OCR: {raw_text[:80]}...")
        
        result = segment_ocr_text(raw_text)
        
        status_ok = result.parse_status == expected_status
        has_ing_ok = bool(result.ingredient_zone.strip()) == expected_has_ing
        
        # Check advisory allergens
        extracted_allergens = extract_allergens_from_advisory(result.allergen_advisory_zone)
        allergens_ok = set(extracted_allergens) >= set(expected_allergens)  # Should contain at least expected
        
        passed = status_ok and has_ing_ok and allergens_ok
        if not passed:
            all_passed = False
        
        status_icon = "[PASS]" if passed else "[FAIL]"
        print(f"{status_icon}")
        logger.debug(f"Status: {result.parse_status} (expected: {expected_status}) {'✓' if status_ok else '✗'}")
        logger.debug(f"Has Ingredients: {bool(result.ingredient_zone.strip())} (expected: {expected_has_ing}) {'✓' if has_ing_ok else '✗'}")
        logger.debug(f"Ingredient Zone: {result.ingredient_zone[:60]}..." if len(result.ingredient_zone) > 60 else f"  Ingredient Zone: {result.ingredient_zone}")
        logger.debug(f"Advisory Allergens: {extracted_allergens} (expected to include: {expected_allergens}) {'✓' if allergens_ok else '✗'}")
        logger.debug(f"Language: {result.detected_language}")
    
    print("\n" + "=" * 70)
    print("ZONE SEGMENTATION TEST TABLE")
    print("=" * 70)
    print(f"{'RAW OCR (truncated)':<40} | {'ingredients[]':<25} | {'allergens[]':<20}")
    print("-" * 90)
    
    for raw_text, _, _, _ in test_cases[:4]:  # Show first 4 as examples
        result = segment_ocr_text(raw_text)
        advisory_allergens = extract_allergens_from_advisory(result.allergen_advisory_zone)
        
        # Extract ingredient names (simplified - just show first 3)
        ing_preview = result.ingredient_zone[:40] + "..." if len(result.ingredient_zone) > 40 else result.ingredient_zone
        allergen_str = ", ".join(advisory_allergens[:3]) if advisory_allergens else "(none)"
        
        print(f"{raw_text[:38]:<40} | {ing_preview:<25} | {allergen_str:<20}")
    
    print("\n" + "=" * 70)
    if all_passed:
        print("ALL ZONE SEGMENTATION TESTS PASSED")
    else:
        print("SOME TESTS FAILED - Review output above")
    print("=" * 70 + "\n")
    
    return all_passed


# ================================================================
#  RUN SERVER
# ================================================================

if __name__ == "__main__":
    # Run tests if --test flag is passed
    import sys
    if "--test" in sys.argv or "--test-lecithin" in sys.argv:
        test_lecithin_detection()
        sys.exit(0)
    
    if "--test-zones" in sys.argv:
        test_zone_segmentation()
        sys.exit(0)
    
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "true").lower() == "true"

    logger.info("=" * 46)
    logger.info("PUREMARK BACKEND RUNNING")
    logger.info("OCR Engine: PaddleOCR (local)")
    logger.info("Parsing: GPT-4o-mini (ingredient zone only)")
    logger.info("Zone Segmentation: Deterministic rules")
    logger.info("Diet Rules: Halal & Kosher")
    logger.info(f"Server: http://{host}:{port}")
    logger.info(f"Debug Mode: {debug}")
    logger.info("=" * 46)

    # Run on 0.0.0.0 to allow connections from mobile devices on the network
    app.run(host=host, port=port, debug=debug)


