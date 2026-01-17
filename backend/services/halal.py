# ================================================================
# PureMark Backend - Halal Analysis Engine
# Certifier-grade halal evaluation for ingredients and products
# ================================================================

from typing import Dict, Any, List, Optional
from .helpers import normalize_text, word_in_text, any_word_in_text, extract_enumbers, dedupe
from .config import (
    E_NUMBERS_CONFIG,
    ALCOHOL_CONFIG,
    ANIMAL_DERIVATIVES_CONFIG,
    CERTIFIERS_CONFIG,
    INHERENTLY_HALAL_PLANT_SIMPLE,
    HARAM_COLORANTS,
)
from .lecithin import detect_lecithin_source, detect_lecithin_source_combined, LECITHIN_HALAL_STATUS

# Status constants
HALAL_CONFIRMED = "HALAL_CONFIRMED"
HARAM = "HARAM"
MUSHBOOH = "MUSHBOOH"
NOT_HALAL_UNVERIFIED = "NOT_HALAL_UNVERIFIED"

CONF_HIGH = "HIGH"
CONF_MED = "MEDIUM"
CONF_LOW = "LOW"


def get_enumber_status(e_num: str) -> Dict[str, Any]:
    """Get halal status for an E-number."""
    # Check always_haram
    if e_num in E_NUMBERS_CONFIG["always_haram"]:
        return {"status": "HARAM", "details": E_NUMBERS_CONFIG["always_haram"][e_num]}

    # Check source_dependent
    if e_num in E_NUMBERS_CONFIG["source_dependent"]:
        return {"status": "MUSHBOOH", "details": E_NUMBERS_CONFIG["source_dependent"][e_num]}

    # Check halal
    if e_num in E_NUMBERS_CONFIG["halal"]:
        return {"status": "HALAL", "details": E_NUMBERS_CONFIG["halal"][e_num]}

    return {"status": None, "details": None}


def check_alcohol_status(text: str) -> Dict[str, Optional[str]]:
    """Check for alcohol-related ingredients."""
    text_lower = normalize_text(text)

    # Check halal alternatives FIRST
    if any(word_in_text(text_lower, term) for term in ALCOHOL_CONFIG["halal_alternatives"]["terms"]):
        return {
            "status": "HALAL",
            "reason_code": ALCOHOL_CONFIG["halal_alternatives"]["reason_code"],
            "reason": ALCOHOL_CONFIG["halal_alternatives"]["reason"]
        }

    # Check low-risk fermented
    if any(word_in_text(text_lower, term) for term in ALCOHOL_CONFIG["low_risk_fermented"]["terms"]):
        return {
            "status": "HALAL",
            "reason_code": ALCOHOL_CONFIG["low_risk_fermented"]["reason_code"],
            "reason": ALCOHOL_CONFIG["low_risk_fermented"]["reason"]
        }

    # Check explicit alcohols
    if any(word_in_text(text_lower, term) for term in ALCOHOL_CONFIG["explicit_alcohols"]["terms"]):
        return {
            "status": "HARAM",
            "reason_code": ALCOHOL_CONFIG["explicit_alcohols"]["reason_code"],
            "reason": ALCOHOL_CONFIG["explicit_alcohols"]["reason"]
        }

    # Check alcoholic beverages
    if any(word_in_text(text_lower, term) for term in ALCOHOL_CONFIG["alcoholic_beverages"]["terms"]):
        return {
            "status": "HARAM",
            "reason_code": ALCOHOL_CONFIG["alcoholic_beverages"]["reason_code"],
            "reason": ALCOHOL_CONFIG["alcoholic_beverages"]["reason"]
        }

    # Check alcohol processing
    if any(word_in_text(text_lower, term) for term in ALCOHOL_CONFIG["alcohol_processing"]["terms"]):
        return {
            "status": "HARAM",
            "reason_code": ALCOHOL_CONFIG["alcohol_processing"]["reason_code"],
            "reason": ALCOHOL_CONFIG["alcohol_processing"]["reason"]
        }

    # Check high-risk extracts
    if any(word_in_text(text_lower, term) for term in ALCOHOL_CONFIG["high_risk_extracts"]["terms"]):
        return {
            "status": "HARAM",
            "reason_code": ALCOHOL_CONFIG["high_risk_extracts"]["reason_code"],
            "reason": ALCOHOL_CONFIG["high_risk_extracts"]["reason"]
        }

    return {"status": None, "reason_code": None, "reason": None}


def check_animal_derivative_status(text: str) -> Dict[str, Optional[str]]:
    """Check for animal-derived ingredients."""
    text_lower = normalize_text(text)

    # Check always_haram
    for category, data in ANIMAL_DERIVATIVES_CONFIG["always_haram"].items():
        if any(word_in_text(text_lower, term) for term in data["terms"]):
            return {
                "status": "HARAM",
                "reason_code": data["reason_code"],
                "reason": data["reason"]
            }

    # Check source-dependent
    for ingredient_type, data in ANIMAL_DERIVATIVES_CONFIG["source_dependent"].items():
        if any(word_in_text(text_lower, term) for term in data["generic_terms"]):
            # Check for specific sources
            for source_name, source_data in data["sources"].items():
                if any(word_in_text(text_lower, term) for term in source_data["terms"]):
                    status = source_data["status"]
                    reason_code = f"{ingredient_type}_{source_name}_{status.lower()}"
                    return {
                        "status": status,
                        "reason_code": reason_code,
                        "reason": source_data["reason"]
                    }

            # No specific source found - use default
            return {
                "status": data["default_status"],
                "reason_code": data["reason_code"],
                "reason": data["default_reason"]
            }

    # Check processed dairy
    dairy_config = ANIMAL_DERIVATIVES_CONFIG["processed_dairy"]
    if any(word_in_text(text_lower, term) for term in dairy_config["terms"]):
        if any(word_in_text(text_lower, qual) for qual in dairy_config["halal_qualifiers"]):
            return {
                "status": "HALAL",
                "reason_code": "dairy_halal_qualified",
                "reason": "Dairy with halal qualifier detected"
            }
        return {
            "status": dairy_config["default_status"],
            "reason_code": dairy_config["reason_code"],
            "reason": dairy_config["reason"]
        }

    # Check starter cultures
    culture_config = ANIMAL_DERIVATIVES_CONFIG["starter_cultures"]
    if any(word_in_text(text_lower, term) for term in culture_config["terms"]):
        return {
            "status": culture_config["default_status"],
            "reason_code": culture_config["reason_code"],
            "reason": culture_config["reason"]
        }

    # Check other animal-derived
    for category, data in ANIMAL_DERIVATIVES_CONFIG["other_animal_derived"].items():
        if any(word_in_text(text_lower, term) for term in data["terms"]):
            return {
                "status": data["default_status"],
                "reason_code": data["reason_code"],
                "reason": data["reason"]
            }

    return {"status": None, "reason_code": None, "reason": None}


def check_halal_certification(text: str) -> Dict[str, Any]:
    """Check for halal certification signals."""
    text_lower = normalize_text(text)

    # Check specific certifiers
    for region, certifiers in CERTIFIERS_CONFIG["strong_certifiers"].items():
        for cert_code, cert_data in certifiers.items():
            if any(word_in_text(text_lower, term) for term in cert_data["terms"]):
                return {
                    "strength": cert_data["strength"],
                    "certifier": cert_data["full_name"],
                    "region": region
                }

    # Check generic strong terms
    if any(word_in_text(text_lower, term) for term in CERTIFIERS_CONFIG["generic_strong_terms"]):
        return {"strength": "HIGH", "certifier": "Generic halal certification", "region": None}

    # Check certification phrases
    if any(word_in_text(text_lower, phrase) for phrase in CERTIFIERS_CONFIG["certification_phrases"]["strong"]):
        return {"strength": "MEDIUM", "certifier": "Certification phrase detected", "region": None}

    # Check weak signals
    if any(word_in_text(text_lower, term) for term in CERTIFIERS_CONFIG["weak_signals"]["terms"]):
        return {"strength": "WEAK", "certifier": None, "region": None}

    return {"strength": "NONE", "certifier": None, "region": None}


def is_inherently_halal(ing: str) -> bool:
    """Check if ingredient is inherently halal (plant-based)."""
    return any_word_in_text(ing, INHERENTLY_HALAL_PLANT_SIMPLE)


def evaluate_halal_strict(
    ingredient_text: str,
    strict_mode: bool = True,
    original_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluate halal status of an ingredient.

    Args:
        ingredient_text: Normalized ingredient text
        strict_mode: If True, MUSHBOOH becomes NOT_HALAL_UNVERIFIED
        original_text: Original text for context

    Returns:
        Dict with status, confidence, reason_codes, evidence
    """
    ing_raw = ingredient_text or ""
    ing = normalize_text(ing_raw)
    orig = normalize_text(original_text) if original_text else ""

    reasons: List[str] = []
    evidence: List[str] = []
    status: Optional[str] = None

    # Certification check
    cert_result = check_halal_certification(ing)
    strong_cert = cert_result["strength"] in ["HIGH", "MEDIUM"]
    weak_cert = cert_result["strength"] == "WEAK"

    # 1) Animal derivatives check
    animal_result = check_animal_derivative_status(ing)

    if animal_result["status"] == "HARAM":
        return {
            "ingredient": ing_raw,
            "status": HARAM,
            "confidence": CONF_HIGH,
            "reason_codes": [animal_result["reason_code"]],
            "evidence": [animal_result["reason"]]
        }

    if animal_result["status"] == "MUSHBOOH":
        if strong_cert:
            reasons.append(f"{animal_result['reason_code']}_but_certified")
            evidence.append(f"{animal_result['reason']}; but strong halal certification detected")
        else:
            reasons.append(animal_result["reason_code"])
            evidence.append(animal_result["reason"])

    if animal_result["status"] == "HALAL":
        reasons.append(animal_result["reason_code"])
        evidence.append(animal_result["reason"])

    # 2) Colorants check
    if any_word_in_text(ing, HARAM_COLORANTS):
        if not any("insect" in rc for rc in reasons):
            return {
                "ingredient": ing_raw,
                "status": HARAM,
                "confidence": CONF_HIGH,
                "reason_codes": ["haram_carmine_cochineal"],
                "evidence": ["Detected carmine/cochineal (E120)"]
            }

    # 3) E-numbers check
    e_nums = extract_enumbers(ing)
    for e in e_nums:
        result = get_enumber_status(e)

        if result["status"] == "HARAM" and result["details"]:
            details = result["details"]
            reason_code = details.get("reason_code", f"e{e}_haram")
            e_name = details.get("name", f"E{e}")
            return {
                "ingredient": ing_raw,
                "status": HARAM,
                "confidence": CONF_HIGH,
                "reason_codes": [reason_code],
                "evidence": [f"Detected E{e} ({e_name}) - {details.get('reason', 'always haram')}"]
            }

        if result["status"] == "MUSHBOOH" and result["details"]:
            details = result["details"]
            reason_code = details.get("reason_code", f"e{e}_source_unknown")
            e_name = details.get("name", f"E{e}")
            reasons.append(reason_code)
            evidence.append(f"Detected E{e} ({e_name}) - {details.get('reason', 'source-dependent')}")

    # 4) Alcohol check
    alcohol_result = check_alcohol_status(ing)

    if alcohol_result["status"] == "HALAL":
        reasons.append(alcohol_result["reason_code"])
        evidence.append(alcohol_result["reason"])
    elif alcohol_result["status"] == "HARAM":
        if strong_cert:
            reasons.append("alcohol_related_term_present_but_halal_cert_claim")
            evidence.append(f"{alcohol_result['reason']}; but strong halal certification detected")
        else:
            return {
                "ingredient": ing_raw,
                "status": HARAM,
                "confidence": CONF_HIGH,
                "reason_codes": [alcohol_result["reason_code"]],
                "evidence": [alcohol_result["reason"]]
            }

    # 5) Gelatin handling (supports both "gelatin" and "gelatine" spellings)
    if word_in_text(ing, "gelatin") or word_in_text(ing, "gelatine") or "441" in extract_enumbers(ing):
        # Check for porcine/pork source first - always HARAM
        if any_word_in_text(ing, ["porcine", "pig", "swine", "pork"]):
            return {
                "ingredient": ing_raw,
                "status": HARAM,
                "confidence": CONF_HIGH,
                "reason_codes": ["haram_porcine_gelatin"],
                "evidence": ["Porcine gelatin detected"]
            }

        # Check for explicit "(halal)" marker anywhere in the ingredient - this takes priority
        # This handles cases like "Beef Gelatine (Halal)", "Gelatin (Halal)", etc.
        if "(halal)" in ing or any_word_in_text(ing, ["halal gelatin", "halal gelatine", "gelatin (halal)", "gelatine (halal)"]):
            return {
                "ingredient": ing_raw,
                "status": HALAL_CONFIRMED,
                "confidence": CONF_HIGH,
                "reason_codes": ["halal_gelatin_explicit"],
                "evidence": ["Gelatin explicitly labeled halal"]
            }

        # Fish gelatin is halal
        if any_word_in_text(ing, ["fish gelatin", "fish gelatine", "marine gelatin", "marine gelatine"]):
            return {
                "ingredient": ing_raw,
                "status": HALAL_CONFIRMED,
                "confidence": CONF_HIGH,
                "reason_codes": ["fish_gelatin"],
                "evidence": ["Fish-derived gelatin"]
            }

        # Bovine/beef gelatin without halal marker - requires verification
        if any_word_in_text(ing, ["bovine gelatin", "bovine gelatine", "beef gelatin", "beef gelatine"]):
            reasons.append("bovine_gelatin_unverified")
            evidence.append("Bovine gelatin without explicit halal certification")
            status = MUSHBOOH

    # 6) Lecithin handling
    lecithin_result = detect_lecithin_source_combined(orig, ing) if orig else detect_lecithin_source(ing)

    if lecithin_result["is_lecithin"]:
        source = lecithin_result.get("source", "unspecified")

        if source == "sunflower":
            return {
                "ingredient": ing_raw,
                "status": HALAL_CONFIRMED,
                "confidence": CONF_HIGH,
                "reason_codes": ["sunflower_lecithin_halal"],
                "evidence": ["Sunflower lecithin - plant-based, halal"]
            }
        elif source == "soy":
            if strong_cert:
                return {
                    "ingredient": ing_raw,
                    "status": HALAL_CONFIRMED,
                    "confidence": CONF_HIGH,
                    "reason_codes": ["soy_lecithin_certified_halal"],
                    "evidence": ["Soy lecithin with halal certification"]
                }
            else:
                return {
                    "ingredient": ing_raw,
                    "status": NOT_HALAL_UNVERIFIED,
                    "confidence": CONF_MED,
                    "reason_codes": ["soy_lecithin_unverified_mushbooh"],
                    "evidence": ["Soy lecithin - processing may involve alcohol"]
                }
        elif source == "rapeseed":
            return {
                "ingredient": ing_raw,
                "status": HALAL_CONFIRMED,
                "confidence": CONF_HIGH,
                "reason_codes": ["rapeseed_lecithin_halal"],
                "evidence": ["Rapeseed lecithin - plant-based, halal"]
            }
        elif source == "egg":
            return {
                "ingredient": ing_raw,
                "status": HALAL_CONFIRMED,
                "confidence": CONF_HIGH,
                "reason_codes": ["egg_lecithin_halal"],
                "evidence": ["Egg lecithin - halal"]
            }
        else:
            # Unspecified source
            if strong_cert:
                reasons.append("lecithin_unspecified_but_certified")
                evidence.append("Lecithin source unspecified, but product has halal certification")
            else:
                reasons.append("lecithin_source_unspecified_mushbooh")
                evidence.append("Lecithin source not specified")
                status = MUSHBOOH

    # 7) Natural flavors
    if any_word_in_text(ing, ["natural flavor", "natural flavour"]):
        reasons.append("natural_flavour_source_unknown_mushbooh")
        evidence.append("Natural flavours have undisclosed sources")
        status = MUSHBOOH

    # Determine final status
    confidence: str

    if strong_cert:
        status = HALAL_CONFIRMED
        confidence = CONF_HIGH
    elif any("haram_" in rc or rc.endswith("_haram") for rc in reasons):
        status = HARAM
        confidence = CONF_HIGH
    elif any("mushbooh" in rc or "unverified" in rc or "source_unknown" in rc for rc in reasons):
        mushbooh_reasons = [rc for rc in reasons if "mushbooh" in rc or "unverified" in rc or "source_unknown" in rc]
        halal_reasons = [rc for rc in reasons if rc.endswith("_halal") or "halal" in rc.lower()]

        if halal_reasons and len(halal_reasons) >= len(mushbooh_reasons):
            status = HALAL_CONFIRMED
            confidence = CONF_HIGH
        else:
            status = MUSHBOOH
            confidence = CONF_MED if weak_cert else CONF_LOW
    elif any(rc.endswith("_halal") for rc in reasons):
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

    # Strict-mode conversion
    final_status = status
    if strict_mode and status == MUSHBOOH:
        final_status = NOT_HALAL_UNVERIFIED

    return {
        "ingredient": ing_raw,
        "status": final_status,
        "confidence": confidence,
        "reason_codes": dedupe(reasons),
        "evidence": dedupe(evidence)
    }


def aggregate_product_halal(
    ingredient_results: List[Dict[str, Any]],
    strict_mode: bool = True
) -> Dict[str, Any]:
    """
    Aggregate ingredient-level halal results to product verdict.

    Args:
        ingredient_results: List of ingredient halal results
        strict_mode: If True, any MUSHBOOH fails the product

    Returns:
        Product-level halal verdict
    """
    haram_hits = []
    mushbooh_hits = []

    for r in ingredient_results:
        if r["status"] == HARAM:
            haram_hits.append(r)
        elif r["status"] in [MUSHBOOH, NOT_HALAL_UNVERIFIED]:
            mushbooh_hits.append(r)

    # RULE 1 - HARD FAIL
    if haram_hits:
        all_reason_codes = set()
        for r in haram_hits:
            for rc in r.get("reason_codes", []):
                all_reason_codes.add(rc)

        return {
            "status": "HARAM",
            "confidence": CONF_HIGH,
            "reason": "Contains explicitly haram ingredient(s).",
            "failing_ingredients": [r["ingredient"] for r in haram_hits],
            "reason_codes": sorted(list(all_reason_codes))
        }

    # RULE 2 - STRICT FAIL (MUSHBOOH)
    if strict_mode and mushbooh_hits:
        all_reason_codes = set()
        for r in mushbooh_hits:
            for rc in r.get("reason_codes", []):
                all_reason_codes.add(rc)

        return {
            "status": "NOT_HALAL_UNVERIFIED",
            "confidence": CONF_LOW,
            "reason": "Contains ingredient(s) with unverified halal source or processing.",
            "failing_ingredients": [r["ingredient"] for r in mushbooh_hits],
            "reason_codes": sorted(list(all_reason_codes))
        }

    # RULE 3 - PASS
    return {
        "status": "HALAL",
        "confidence": CONF_MED,
        "reason": "All detected ingredients are verified halal at ingredient level.",
        "failing_ingredients": [],
        "reason_codes": []
    }
