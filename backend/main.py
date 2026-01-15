# ================================================================
# PureMark FastAPI Backend
# Railway Deployment - OCR + AI Scoring + Halal/Kosher Engine
# ================================================================

from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import base64
from dotenv import load_dotenv

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Error tracking
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

# Load environment variables
load_dotenv()

# ================================================================
# Sentry Error Tracking
# ================================================================
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,  # 10% of requests for performance monitoring
        profiles_sample_rate=0.1,
    )
    print("[SENTRY] Error tracking initialized")
else:
    print("[SENTRY] No DSN configured, error tracking disabled")

# ================================================================
# Rate Limiter Setup
# ================================================================
limiter = Limiter(key_func=get_remote_address)

# Import services
from services.ocr import extract_text_with_gpt_vision, parse_ingredient_text
from services.zones import segment_ocr_text
from services.halal import evaluate_halal_strict, aggregate_product_halal
from services.kosher import evaluate_kosher_strict, aggregate_product_kosher, kosher_tags
from services.allergens import check_allergy, extract_allergens_from_advisory
from services.lecithin import detect_lecithin_source
from services.diets import (
    evaluate_vegan, evaluate_vegetarian, evaluate_pescetarian,
    aggregate_vegan, aggregate_vegetarian, aggregate_pescetarian
)

# ================================================================
# App Configuration
# ================================================================

app = FastAPI(
    title="PureMark API",
    description="AI-powered ingredient analysis for Halal/Kosher compliance",
    version="2.0.0",
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - Allow all origins for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Set to False for public API without cookies
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ================================================================
# API Key Authentication
# ================================================================
API_SECRET_KEY = os.getenv("API_SECRET_KEY")

async def verify_api_key(x_api_key: Optional[str] = Header(None)):
    """
    Verify API key if one is configured.
    If API_SECRET_KEY is not set, authentication is disabled (development mode).
    """
    if not API_SECRET_KEY:
        # No API key configured - allow all requests (development mode)
        return True

    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Include X-API-Key header."
        )

    if x_api_key != API_SECRET_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )

    return True

# ================================================================
# Request/Response Models
# ================================================================

class UserProfile(BaseModel):
    diet: Optional[str] = None  # "halal" or "kosher"
    allergies: Optional[List[str]] = []

class ScanRequest(BaseModel):
    image: str  # Base64 encoded image
    profile: Optional[UserProfile] = None

class IngredientAnalysis(BaseModel):
    name: str
    original: Optional[str] = None
    english: Optional[str] = None
    halal: Optional[Dict[str, Any]] = None
    kosher: Optional[Dict[str, Any]] = None
    allergy_flag: Optional[str] = None

class ScanResponse(BaseModel):
    success: bool
    detected_language: Optional[str] = None
    ocr_source: Optional[str] = None
    diet_verdict: Optional[Dict[str, Any]] = None
    ingredients: Optional[List[Dict[str, str]]] = None
    analysis: Optional[List[Dict[str, Any]]] = None
    allergens: Optional[List[str]] = None
    error: Optional[str] = None
    error_code: Optional[str] = None

# ================================================================
# Health Check
# ================================================================

@app.get("/")
async def root():
    return {"status": "ok", "service": "PureMark API", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "openrouter_configured": bool(os.getenv("OPENROUTER_API_KEY")),
        "api_auth_enabled": bool(API_SECRET_KEY),
        "sentry_enabled": bool(sentry_dsn),
        "rate_limiting": "enabled",
    }

# ================================================================
# Main Scan Endpoint
# ================================================================

@app.post("/scan", response_model=ScanResponse)
@limiter.limit("30/minute")  # 30 scans per minute per IP
async def scan_ingredients(
    request: ScanRequest,
    req: Request,  # Required for rate limiter
    authenticated: bool = Depends(verify_api_key)
):
    """
    Scan ingredient label image and analyze for Halal/Kosher compliance.

    Process:
    1. OCR - Extract text from image using GPT-4o Vision
    2. Zone Segmentation - Identify ingredient section
    3. Parsing - Structure ingredients with translation
    4. Allergen Detection - Find user's specified allergens
    5. Halal Analysis - E-numbers, alcohol, animal derivatives
    6. Kosher Analysis - Forbidden animals, certification signals
    """

    # Get API keys
    openai_api_key = os.getenv("OPENAI_API_KEY")
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

    if not openrouter_api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured (required for OCR)")
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured (required for parsing)")

    try:
        # Get image data
        image_data = request.image
        profile = request.profile or UserProfile()

        if not image_data:
            return ScanResponse(success=False, error="No image provided")

        # Strip data URL prefix if present
        if image_data.startswith("data:"):
            image_data = image_data.split(",")[1]

        # Validate base64
        try:
            decoded = base64.b64decode(image_data)
            max_size = 10 * 1024 * 1024  # 10MB
            if len(decoded) > max_size:
                return ScanResponse(
                    success=False,
                    error="Image too large. Maximum size is 10MB"
                )
        except Exception:
            return ScanResponse(success=False, error="Invalid image encoding")

        # ============================================================
        # STEP 1: OCR - Extract raw text from image
        # ============================================================
        print("[OCR] Starting Gemini 2.0 Flash extraction via OpenRouter...")

        try:
            raw_ocr_text = await extract_text_with_gpt_vision(image_data, openrouter_api_key)
        except Exception as e:
            print(f"[OCR] OpenRouter/Gemini error: {e}")
            return ScanResponse(
                success=False,
                error="Could not extract text from image. Please take a clearer photo.",
                error_code="OCR_FAILED"
            )

        # Basic guardrail
        token_count = len(raw_ocr_text.split())
        if token_count < 3:
            return ScanResponse(
                success=False,
                error="Could not extract text from image. Please take a clearer photo of the ingredients list.",
                error_code="OCR_FAILED"
            )

        print(f"[OCR] Extracted {token_count} tokens")

        # ============================================================
        # STEP 2: ZONE SEGMENTATION
        # ============================================================
        zone_result = segment_ocr_text(raw_ocr_text)

        print(f"[ZONES] Status: {zone_result['parse_status']}")
        print(f"[ZONES] Language: {zone_result['detected_language']}")

        if zone_result["parse_status"] == "NO_INGREDIENTS":
            return ScanResponse(
                success=False,
                error="No ingredient list found. Please crop to show 'Ingredientes:' or 'Ingredients:' section."
            )

        if zone_result["parse_status"] == "UNVERIFIED" and len(zone_result["ingredient_zone"].strip()) < 10:
            return ScanResponse(
                success=False,
                error="Ingredient list could not be verified. Please crop closer to the ingredient section."
            )

        # ============================================================
        # STEP 3: GPT PARSING
        # ============================================================
        try:
            parsed = await parse_ingredient_text(
                zone_result["ingredient_zone"],
                zone_result["detected_language"],
                openai_api_key
            )
        except Exception as e:
            print(f"[PARSE] Error: {e}")
            return ScanResponse(
                success=False,
                error="Could not understand ingredient list. Please crop closer."
            )

        ingredients = parsed.get("ingredients", [])

        # Quality check
        if len(ingredients) < 2:
            if zone_result.get("allergen_advisory_zone") and len(zone_result["allergen_advisory_zone"]) > 20:
                return ScanResponse(
                    success=False,
                    error="Only allergen warnings were detected, but no ingredients. Please crop to include the full ingredient list."
                )

            if zone_result["parse_status"] == "UNVERIFIED":
                return ScanResponse(
                    success=False,
                    error="Could not read ingredient list clearly. Please: 1) Zoom in more, 2) Ensure good lighting, 3) Include the 'Ingredientes:' header if visible."
                )

            return ScanResponse(
                success=False,
                error="Very few ingredients detected. The text may be too small or blurry. Try zooming in closer."
            )

        # ============================================================
        # STEP 4: ALLERGEN EXTRACTION
        # ============================================================
        ingredient_allergens = [a.lower().strip() for a in parsed.get("allergens", [])]
        advisory_allergens = extract_allergens_from_advisory(zone_result.get("allergen_advisory_zone", ""))

        # Correct lecithin allergens
        corrected_allergens = []
        full_original_text = " ".join([(ing.get("original") or "").lower() for ing in ingredients])

        for allergen in ingredient_allergens:
            if "lecithin" in allergen:
                lecithin_result_zone = detect_lecithin_source(zone_result["ingredient_zone"].lower())
                lecithin_result_parsed = detect_lecithin_source(full_original_text)

                lecithin_source = "unspecified"
                if lecithin_result_zone["is_lecithin"] and lecithin_result_zone.get("source") and lecithin_result_zone["source"] != "unspecified":
                    lecithin_source = lecithin_result_zone["source"]
                elif lecithin_result_parsed["is_lecithin"] and lecithin_result_parsed.get("source"):
                    lecithin_source = lecithin_result_parsed["source"]

                if lecithin_source == "soy":
                    corrected_allergens.append("soy")
                elif lecithin_source == "egg":
                    corrected_allergens.append("egg")
                elif lecithin_source in ["sunflower", "rapeseed"]:
                    pass  # Not an allergen
                else:
                    corrected_allergens.append("soy (possible)")
            else:
                corrected_allergens.append(allergen)

        # Add advisory allergens
        for adv_allergen in advisory_allergens:
            advisory_label = f"{adv_allergen} (may contain)"
            if advisory_label not in corrected_allergens and adv_allergen not in corrected_allergens:
                corrected_allergens.append(advisory_label)

        # Remove duplicates
        allergens = list(set(corrected_allergens))

        # ============================================================
        # STEP 5: ANALYSIS
        # ============================================================
        diet = profile.diet
        profile_allergies = profile.allergies or []

        enhanced = []
        halal_results = []
        kosher_results = []
        vegan_results = []
        vegetarian_results = []
        pescetarian_results = []

        for ing in ingredients:
            normalized = (ing.get("normalized") or ing.get("english") or ing.get("original") or "").lower()
            original = (ing.get("original") or "").lower()
            english_from_gpt = (ing.get("english") or "").lower()

            if not normalized:
                continue

            # Lecithin correction
            display_name = normalized
            corrected_english = english_from_gpt

            lecithin_result_orig = detect_lecithin_source(original)
            lecithin_result_norm = detect_lecithin_source(normalized)
            lecithin_result_raw = detect_lecithin_source(raw_ocr_text)

            if lecithin_result_orig["is_lecithin"] or lecithin_result_norm["is_lecithin"]:
                correct_source = "unspecified"
                if lecithin_result_raw["is_lecithin"] and lecithin_result_raw.get("source") and lecithin_result_raw["source"] != "unspecified":
                    correct_source = lecithin_result_raw["source"]
                elif lecithin_result_orig["is_lecithin"] and lecithin_result_orig.get("source") and lecithin_result_orig["source"] != "unspecified":
                    correct_source = lecithin_result_orig["source"]
                elif lecithin_result_norm["is_lecithin"] and lecithin_result_norm.get("source") and lecithin_result_norm["source"] != "unspecified":
                    correct_source = lecithin_result_norm["source"]

                source_display_names = {
                    "sunflower": "sunflower lecithin",
                    "soy": "soy lecithin",
                    "rapeseed": "rapeseed lecithin",
                    "egg": "egg lecithin",
                    "unspecified": "lecithin (source unspecified)",
                }

                display_name = source_display_names.get(correct_source, normalized)
                corrected_english = source_display_names.get(correct_source, english_from_gpt)

            halal_result = None
            kosher_result = None
            vegan_result = None
            vegetarian_result = None
            pescetarian_result = None

            if diet == "halal":
                halal_original = raw_ocr_text if (lecithin_result_orig["is_lecithin"] or lecithin_result_norm["is_lecithin"]) else original
                halal_result = evaluate_halal_strict(normalized, True, halal_original)
                halal_results.append(halal_result)

            if diet == "kosher":
                kosher_result = evaluate_kosher_strict(normalized)
                kosher_results.append(kosher_result)

            if diet == "vegan":
                vegan_result = evaluate_vegan(normalized)
                vegan_results.append(vegan_result)

            if diet == "vegetarian":
                vegetarian_result = evaluate_vegetarian(normalized)
                vegetarian_results.append(vegetarian_result)

            if diet == "pescetarian":
                pescetarian_result = evaluate_pescetarian(normalized)
                pescetarian_results.append(pescetarian_result)

            # Allergen check
            allergy_check_text = raw_ocr_text if (lecithin_result_orig["is_lecithin"] or lecithin_result_norm["is_lecithin"]) else original
            allergy_flag = check_allergy(allergy_check_text, profile_allergies)

            enhanced.append({
                "name": display_name,
                "original": ing.get("original"),
                "english": corrected_english,
                "halal": {
                    "status": "HALAL" if halal_result and halal_result["status"] == "HALAL_CONFIRMED" else halal_result["status"] if halal_result else None,
                    "confidence": halal_result["confidence"] if halal_result else None,
                    "reason_codes": halal_result["reason_codes"] if halal_result else None,
                    "evidence": halal_result["evidence"] if halal_result else None,
                } if halal_result else None,
                "kosher": {
                    "status": kosher_result["status"] if kosher_result else None,
                    "confidence": kosher_result["confidence"] if kosher_result else None,
                    "reason_codes": kosher_result["reason_codes"] if kosher_result else None,
                    "evidence": kosher_result["evidence"] if kosher_result else None,
                    "tags": kosher_tags(kosher_result) if kosher_result else None,
                } if kosher_result else None,
                "vegan": {
                    "status": vegan_result["status"] if vegan_result else None,
                    "confidence": vegan_result["confidence"] if vegan_result else None,
                    "reason_codes": vegan_result["reason_codes"] if vegan_result else None,
                    "evidence": vegan_result["evidence"] if vegan_result else None,
                } if vegan_result else None,
                "vegetarian": {
                    "status": vegetarian_result["status"] if vegetarian_result else None,
                    "confidence": vegetarian_result["confidence"] if vegetarian_result else None,
                    "reason_codes": vegetarian_result["reason_codes"] if vegetarian_result else None,
                    "evidence": vegetarian_result["evidence"] if vegetarian_result else None,
                } if vegetarian_result else None,
                "pescetarian": {
                    "status": pescetarian_result["status"] if pescetarian_result else None,
                    "confidence": pescetarian_result["confidence"] if pescetarian_result else None,
                    "reason_codes": pescetarian_result["reason_codes"] if pescetarian_result else None,
                    "evidence": pescetarian_result["evidence"] if pescetarian_result else None,
                } if pescetarian_result else None,
                "allergy_flag": allergy_flag,
            })

        # ============================================================
        # STEP 6: PRODUCT-LEVEL VERDICTS
        # ============================================================
        product_kosher = None
        if diet == "kosher":
            product_kosher = aggregate_product_kosher(kosher_results)

        product_halal = None
        if diet == "halal":
            product_halal = aggregate_product_halal(halal_results, True)

        product_vegan = None
        if diet == "vegan":
            product_vegan = aggregate_vegan(vegan_results)

        product_vegetarian = None
        if diet == "vegetarian":
            product_vegetarian = aggregate_vegetarian(vegetarian_results)

        product_pescetarian = None
        if diet == "pescetarian":
            product_pescetarian = aggregate_pescetarian(pescetarian_results)

        diet_verdict = {}

        if product_halal:
            diet_verdict["halal"] = {
                "status": product_halal["status"],
                "confidence": product_halal["confidence"],
                "reason": product_halal["reason"],
                "failing_ingredients": product_halal["failing_ingredients"],
                "reason_codes": product_halal["reason_codes"],
            }

        if product_kosher:
            diet_verdict["kosher"] = {
                "status": product_kosher["status"],
                "confidence": product_kosher["confidence"],
                "reason": product_kosher["reason"],
                "failing_ingredients": product_kosher["failing_ingredients"],
                "reason_codes": product_kosher["reason_codes"],
            }

        if product_vegan:
            diet_verdict["vegan"] = {
                "status": product_vegan["status"],
                "confidence": product_vegan["confidence"],
                "reason": product_vegan["reason"],
                "failing_ingredients": product_vegan["failing_ingredients"],
                "reason_codes": product_vegan["reason_codes"],
            }

        if product_vegetarian:
            diet_verdict["vegetarian"] = {
                "status": product_vegetarian["status"],
                "confidence": product_vegetarian["confidence"],
                "reason": product_vegetarian["reason"],
                "failing_ingredients": product_vegetarian["failing_ingredients"],
                "reason_codes": product_vegetarian["reason_codes"],
            }

        if product_pescetarian:
            diet_verdict["pescetarian"] = {
                "status": product_pescetarian["status"],
                "confidence": product_pescetarian["confidence"],
                "reason": product_pescetarian["reason"],
                "failing_ingredients": product_pescetarian["failing_ingredients"],
                "reason_codes": product_pescetarian["reason_codes"],
            }

        # ============================================================
        # RESPONSE
        # ============================================================
        return ScanResponse(
            success=True,
            detected_language=parsed.get("detected_language"),
            ocr_source="gpt_vision",
            diet_verdict=diet_verdict if diet_verdict else None,
            ingredients=[
                {
                    "original": ing.get("original"),
                    "english": ing.get("english"),
                    "normalized": ing.get("normalized"),
                }
                for ing in ingredients
            ],
            analysis=enhanced,
            allergens=allergens,
        )

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return ScanResponse(success=False, error=str(e))

# ================================================================
# Feedback Endpoint
# ================================================================

class FeedbackRequest(BaseModel):
    category: str
    message: str
    images: Optional[List[str]] = []

@app.post("/feedback")
@limiter.limit("5/hour")  # 5 feedback submissions per hour per IP
async def submit_feedback(
    request: FeedbackRequest,
    req: Request,  # Required for rate limiter
    authenticated: bool = Depends(verify_api_key)
):
    """Submit user feedback."""
    # TODO: Store in Supabase
    print(f"[FEEDBACK] {request.category}: {request.message}")
    return {"success": True, "message": "Feedback received"}

# ================================================================
# Run with Uvicorn
# ================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
