// ================================================================
// PureMark Supabase Edge Function - /scan Endpoint
// OCR + AI Scoring + Halal/Kosher Engine
// ================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import shared modules
import { extractTextWithGptVision, parseIngredientText } from "../_shared/ocr.ts";
import { segmentOcrText } from "../_shared/zones.ts";
import {
  evaluateHalalStrict,
  aggregateProductHalal,
  HALAL_CONFIRMED,
  HalalResult,
} from "../_shared/halal.ts";
import {
  evaluateKosherStrict,
  aggregateProductKosher,
  kosherTags,
  KosherResult,
} from "../_shared/kosher.ts";
import { checkAllergy, extractAllergensFromAdvisory } from "../_shared/allergens.ts";
import { detectLecithinSource } from "../_shared/lecithin.ts";

// ================================================================
// CORS Headers
// ================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ================================================================
// Main Handler
// ================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const data = await req.json();
    let imageData = data.image;
    const profile = data.profile || {};

    if (!imageData) {
      return new Response(
        JSON.stringify({ success: false, error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip data URL prefix if present
    if (imageData.startsWith("data:")) {
      imageData = imageData.split(",")[1];
    }

    // Validate base64
    try {
      const decoded = atob(imageData);
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (decoded.length > maxSize) {
        return new Response(
          JSON.stringify({ success: false, error: "Image too large. Maximum size is 10MB" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid image encoding" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // STEP 1: OCR - Extract raw text from image
    // ============================================================
    console.log("[OCR] Starting GPT Vision extraction...");

    let rawOcrText: string;
    try {
      rawOcrText = await extractTextWithGptVision(imageData, openaiApiKey);
    } catch (e) {
      console.error("[OCR] GPT Vision error:", e);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not extract text from image. Please take a clearer photo.",
          error_code: "OCR_FAILED"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic guardrail
    const tokenCount = (rawOcrText.match(/\w+/g) || []).length;
    if (tokenCount < 3) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not extract text from image. Please take a clearer photo of the ingredients list.",
          error_code: "OCR_FAILED"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[OCR] Extracted ${tokenCount} tokens`);

    // ============================================================
    // STEP 2: ZONE SEGMENTATION
    // ============================================================
    const zoneResult = segmentOcrText(rawOcrText);

    console.log(`[ZONES] Status: ${zoneResult.parse_status}`);
    console.log(`[ZONES] Language: ${zoneResult.detected_language}`);

    if (zoneResult.parse_status === "NO_INGREDIENTS") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No ingredient list found. Please crop to show 'Ingredientes:' or 'Ingredients:' section."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (zoneResult.parse_status === "UNVERIFIED" && zoneResult.ingredient_zone.trim().length < 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Ingredient list could not be verified. Please crop closer to the ingredient section."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // STEP 3: GPT PARSING
    // ============================================================
    let parsed;
    try {
      parsed = await parseIngredientText(
        zoneResult.ingredient_zone,
        zoneResult.detected_language,
        openaiApiKey
      );
    } catch (e) {
      console.error("[PARSE] Error:", e);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not understand ingredient list. Please crop closer."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ingredients = parsed.ingredients || [];

    // Quality check
    if (ingredients.length < 2) {
      if (zoneResult.allergen_advisory_zone && zoneResult.allergen_advisory_zone.length > 20) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Only allergen warnings were detected, but no ingredients. Please crop to include the full ingredient list."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (zoneResult.parse_status === "UNVERIFIED") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Could not read ingredient list clearly. Please: 1) Zoom in more, 2) Ensure good lighting, 3) Include the 'Ingredientes:' header if visible."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Very few ingredients detected. The text may be too small or blurry. Try zooming in closer."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // STEP 4: ALLERGEN EXTRACTION
    // ============================================================
    const ingredientAllergens = (parsed.allergens || []).map((a: string) => a.toLowerCase().trim());
    const advisoryAllergens = extractAllergensFromAdvisory(zoneResult.allergen_advisory_zone);

    // Correct lecithin allergens
    const correctedAllergens: string[] = [];
    const fullOriginalText = ingredients.map((ing: any) => (ing.original || "").toLowerCase()).join(" ");

    for (const allergen of ingredientAllergens) {
      if (allergen.includes("lecithin")) {
        const lecithinResultZone = detectLecithinSource(zoneResult.ingredient_zone.toLowerCase());
        const lecithinResultParsed = detectLecithinSource(fullOriginalText);

        let lecithinSource = "unspecified";
        if (lecithinResultZone.isLecithin && lecithinResultZone.source && lecithinResultZone.source !== "unspecified") {
          lecithinSource = lecithinResultZone.source;
        } else if (lecithinResultParsed.isLecithin && lecithinResultParsed.source) {
          lecithinSource = lecithinResultParsed.source;
        }

        if (lecithinSource === "soy") {
          correctedAllergens.push("soy");
        } else if (lecithinSource === "egg") {
          correctedAllergens.push("egg");
        } else if (lecithinSource === "sunflower" || lecithinSource === "rapeseed") {
          // Not an allergen
        } else {
          correctedAllergens.push("soy (possible)");
        }
      } else {
        correctedAllergens.push(allergen);
      }
    }

    // Add advisory allergens
    for (const advAllergen of advisoryAllergens) {
      const advisoryLabel = `${advAllergen} (may contain)`;
      if (!correctedAllergens.includes(advisoryLabel) && !correctedAllergens.includes(advAllergen)) {
        correctedAllergens.push(advisoryLabel);
      }
    }

    // Remove duplicates
    const allergens = [...new Set(correctedAllergens)];

    // ============================================================
    // STEP 5: ANALYSIS
    // ============================================================
    const diet = profile.diet;
    const profileAllergies = profile.allergies || [];

    const enhanced: any[] = [];
    const halalResults: HalalResult[] = [];
    const kosherResults: KosherResult[] = [];

    for (const ing of ingredients) {
      const normalized = (ing.normalized || ing.english || ing.original || "").toLowerCase();
      const original = (ing.original || "").toLowerCase();
      const englishFromGpt = (ing.english || "").toLowerCase();

      if (!normalized) continue;

      // Lecithin correction
      let displayName = normalized;
      let correctedEnglish = englishFromGpt;

      const lecithinResultOrig = detectLecithinSource(original);
      const lecithinResultNorm = detectLecithinSource(normalized);
      const lecithinResultRaw = detectLecithinSource(rawOcrText);

      if (lecithinResultOrig.isLecithin || lecithinResultNorm.isLecithin) {
        let correctSource = "unspecified";
        if (lecithinResultRaw.isLecithin && lecithinResultRaw.source && lecithinResultRaw.source !== "unspecified") {
          correctSource = lecithinResultRaw.source;
        } else if (lecithinResultOrig.isLecithin && lecithinResultOrig.source && lecithinResultOrig.source !== "unspecified") {
          correctSource = lecithinResultOrig.source;
        } else if (lecithinResultNorm.isLecithin && lecithinResultNorm.source && lecithinResultNorm.source !== "unspecified") {
          correctSource = lecithinResultNorm.source;
        }

        const sourceDisplayNames: Record<string, string> = {
          "sunflower": "sunflower lecithin",
          "soy": "soy lecithin",
          "rapeseed": "rapeseed lecithin",
          "egg": "egg lecithin",
          "unspecified": "lecithin (source unspecified)",
        };

        displayName = sourceDisplayNames[correctSource] || normalized;
        correctedEnglish = sourceDisplayNames[correctSource] || englishFromGpt;
      }

      let halalResult: HalalResult | null = null;
      let kosherResult: KosherResult | null = null;

      if (diet === "halal") {
        const halalOriginal = (lecithinResultOrig.isLecithin || lecithinResultNorm.isLecithin) ? rawOcrText : original;
        halalResult = evaluateHalalStrict(normalized, true, halalOriginal);
        halalResults.push(halalResult);
      }

      if (diet === "kosher") {
        kosherResult = evaluateKosherStrict(normalized);
        kosherResults.push(kosherResult);
      }

      // Allergen check
      const allergyCheckText = (lecithinResultOrig.isLecithin || lecithinResultNorm.isLecithin) ? rawOcrText : original;
      const allergyFlag = checkAllergy(allergyCheckText, profileAllergies);

      enhanced.push({
        name: displayName,
        original: ing.original,
        english: correctedEnglish,
        halal: halalResult ? {
          status: halalResult.status === HALAL_CONFIRMED ? "HALAL" : halalResult.status,
          confidence: halalResult.confidence,
          reason_codes: halalResult.reason_codes,
          evidence: halalResult.evidence,
        } : null,
        kosher: kosherResult ? {
          status: kosherResult.status,
          confidence: kosherResult.confidence,
          reason_codes: kosherResult.reason_codes,
          evidence: kosherResult.evidence,
          tags: kosherTags(kosherResult),
        } : null,
        allergy_flag: allergyFlag,
      });
    }

    // ============================================================
    // STEP 6: PRODUCT-LEVEL VERDICTS
    // ============================================================
    let productKosher = null;
    if (diet === "kosher") {
      productKosher = aggregateProductKosher(kosherResults);
    }

    let productHalal = null;
    if (diet === "halal") {
      productHalal = aggregateProductHalal(halalResults, true);
    }

    const dietVerdict: Record<string, any> = {};

    if (productHalal) {
      dietVerdict.halal = {
        status: productHalal.status,
        confidence: productHalal.confidence,
        reason: productHalal.reason,
        failing_ingredients: productHalal.failing_ingredients,
        reason_codes: productHalal.reason_codes,
      };
    }

    if (productKosher) {
      dietVerdict.kosher = {
        status: productKosher.status,
        confidence: productKosher.confidence,
        reason: productKosher.reason,
        failing_ingredients: productKosher.failing_ingredients,
        reason_codes: productKosher.reason_codes,
      };
    }

    // ============================================================
    // RESPONSE
    // ============================================================
    return new Response(
      JSON.stringify({
        success: true,
        detected_language: parsed.detected_language,
        ocr_source: "gpt_vision",
        diet_verdict: Object.keys(dietVerdict).length > 0 ? dietVerdict : null,
        ingredients: ingredients.map((ing: any) => ({
          original: ing.original,
          english: ing.english,
          normalized: ing.normalized,
        })),
        analysis: enhanced,
        allergens: allergens,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[ERROR]", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
