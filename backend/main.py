# ================================================================
# PureMark FastAPI Backend
# Railway Deployment - OCR + AI Scoring + Halal/Kosher Engine
# ================================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import services
from services.ocr import extract_text_with_gpt_vision, parse_ingredient_text
from services.zones import segment_ocr_text
from services.halal import evaluate_halal_strict, aggregate_product_halal
from services.kosher import evaluate_kosher_strict, aggregate_product_kosher, kosher_tags
from services.allergens import check_allergy, extract_allergens_from_advisory
from services.lecithin import detect_lecithin_source

# ================================================================
# App Configuration
# ================================================================

app = FastAPI(
    title="PureMark API",
    description="AI-powered ingredient analysis for Halal/Kosher compliance",
    version="2.0.0",
)

# CORS - Allow all origins for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
    }

# ================================================================
# Main Scan Endpoint
# ================================================================

@app.post("/scan", response_model=ScanResponse)
async def scan_ingredients(request: ScanRequest):
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
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

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
        print("[OCR] Starting GPT Vision extraction...")

        try:
            raw_ocr_text = await extract_text_with_gpt_vision(image_data, openai_api_key)
        except Exception as e:
            print(f"[OCR] GPT Vision error: {e}")
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

            if diet == "halal":
                halal_original = raw_ocr_text if (lecithin_result_orig["is_lecithin"] or lecithin_result_norm["is_lecithin"]) else original
                halal_result = evaluate_halal_strict(normalized, True, halal_original)
                halal_results.append(halal_result)

            if diet == "kosher":
                kosher_result = evaluate_kosher_strict(normalized)
                kosher_results.append(kosher_result)

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
async def submit_feedback(request: FeedbackRequest):
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
