// ================================================================
// PureMark Edge Functions - OCR via OpenAI GPT Vision
// Uses GPT-4o/GPT-5 Vision API for text extraction from images
// ================================================================

// ================================================================
// Types
// ================================================================

export interface OCRResult {
  text: string;
  source: string;
}

// ================================================================
// GPT Vision OCR
// ================================================================

/**
 * Extract text from image using OpenAI GPT Vision API.
 * This is the primary OCR method for Supabase Edge Functions.
 *
 * @param imageData - Base64 encoded image string (with or without data URL prefix)
 * @param openaiApiKey - OpenAI API key
 * @returns Extracted text from the image
 */
export async function extractTextWithGptVision(
  imageData: string,
  openaiApiKey: string
): Promise<string> {
  // Ensure proper base64 format for OpenAI Vision API
  let imageUrl = imageData;
  if (!imageData.startsWith("data:")) {
    // Detect format from magic bytes
    let mediaType = "image/jpeg";
    if (imageData.startsWith("iVBOR")) {
      mediaType = "image/png";
    } else if (imageData.startsWith("UklGR")) {
      mediaType = "image/webp";
    }
    imageUrl = `data:${mediaType};base64,${imageData}`;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",  // Use gpt-4o for best vision capabilities
      messages: [
        {
          role: "system",
          content: (
            "You are a helpful assistant that reads text from images of food product labels. " +
            "Your task is to transcribe the text exactly as it appears. This is used to help " +
            "people with dietary restrictions (halal, kosher, allergies) understand what's in their food."
          )
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: (
                "Please read and transcribe all the text from this food ingredient label. " +
                "Include:\n" +
                "- The ingredient list\n" +
                "- Any allergen warnings (May contain, Peut contenir, etc.)\n" +
                "- Nutritional percentages if visible\n\n" +
                "Keep the original language, don't translate. Just return the text you see."
              )
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const extractedText = data.choices?.[0]?.message?.content?.trim() || "";

  return extractedText;
}

// ================================================================
// GPT Ingredient Parser
// ================================================================

/**
 * Parse pre-segmented ingredient zone text into structured data using GPT.
 *
 * @param ingredientZone - Pre-segmented ingredient text
 * @param detectedLanguage - Optional language code
 * @param openaiApiKey - OpenAI API key
 * @returns Parsed ingredient data
 */
export async function parseIngredientText(
  ingredientZone: string,
  detectedLanguage: string | null,
  openaiApiKey: string
): Promise<{
  detected_language: string;
  ingredients: Array<{
    original: string;
    english: string;
    normalized: string;
  }>;
  allergens: string[];
  parse_status: string;
}> {
  if (!ingredientZone || ingredientZone.trim().length < 5) {
    return {
      detected_language: detectedLanguage || "unknown",
      ingredients: [],
      allergens: [],
      parse_status: "EMPTY_ZONE"
    };
  }

  const langHint = detectedLanguage ? `The text is likely in ${detectedLanguage}. ` : "";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Return ONLY valid JSON. You are an expert at parsing ingredient lists from OCR text."
        },
        {
          role: "user",
          content: (
            "You are given a PRE-EXTRACTED ingredient list from a food product label.\n" +
            "This text has ALREADY been segmented - it contains ONLY ingredients, " +
            "NOT product names, NOT allergen warnings, NOT nutritional info.\n\n" +
            langHint +
            "Tasks:\n" +
            "1. Confirm/detect the language\n" +
            "2. Split individual ingredients (separated by commas, semicolons, or periods)\n" +
            "3. Translate each ingredient to English ACCURATELY\n" +
            "4. Normalize ingredient names (lowercase, standard spelling)\n" +
            "5. Identify allergens PRESENT IN THE INGREDIENTS (not advisory warnings)\n\n" +
            "OCR NOISE HANDLING:\n" +
            "- Fix common OCR errors: '0' vs 'O', '1' vs 'l' vs 'I', 'rn' vs 'm'\n" +
            "- Ignore stray characters: |, *, #, @, random punctuation\n" +
            "- Ignore partial words at start/end that are clearly cut off\n" +
            "- Handle merged words (e.g., 'azucarsal' -> 'azucar, sal')\n\n" +
            "CRITICAL TRANSLATION RULES:\n" +
            "- 'tournesol' = SUNFLOWER (NOT soy)\n" +
            "- 'lécithine de tournesol' = sunflower lecithin (NOT soy lecithin)\n" +
            "- 'soja' = soy\n" +
            "- 'colza' = rapeseed/canola\n" +
            "- 'huile de palme' = palm oil\n" +
            "- 'manteca de cacao' / 'beurre de cacao' = cocoa butter\n" +
            "- 'pasta de cacao' / 'pâte de cacao' = cocoa mass\n" +
            "- 'azúcar' / 'sucre' = sugar\n" +
            "- 'lait' / 'leche' = milk\n" +
            "- 'oeuf' / 'oeufs' / 'huevo' = egg\n" +
            "- 'blé' / 'trigo' = wheat\n" +
            "- 'arachide' / 'cacahuete' = peanut\n" +
            "- Do NOT assume lecithin is soy unless the original explicitly says 'soja' or 'soy'\n" +
            "- Keep lecithin source accurate in translation\n\n" +
            "WHAT IS NOT AN INGREDIENT (ignore if present):\n" +
            "- Percentages like 'Cacao: 78%' or '85% cacao'\n" +
            "- Weight/volume like '100g', '200ml'\n" +
            "- Product names like 'Chocolate Negro'\n" +
            "- Certifications like 'UTZ', 'Fairtrade'\n" +
            "- 'May contain' warnings\n\n" +
            "Return JSON:\n" +
            "{\n" +
            "  \"detected_language\": \"<language code: en, fr, de, es, it, etc.>\",\n" +
            "  \"ingredients\": [\n" +
            "    { \"original\": \"<original text>\", \"english\": \"<english translation>\", \"normalized\": \"<normalized lowercase>\" }\n" +
            "  ],\n" +
            "  \"allergens\": [\"<allergen1>\", \"<allergen2>\"]\n" +
            "}\n\n" +
            `Ingredient zone text:\n${ingredientZone}`
          )
        }
      ],
      max_tokens: 600
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";

  // Parse JSON from response
  const result = safeExtractJson(raw);
  result.parse_status = "OK";
  return result;
}

/**
 * Safely extract JSON from model output that may contain markdown formatting.
 */
function safeExtractJson(raw: string): any {
  // Remove markdown code blocks
  let cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();

  // Find JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Model did not return a JSON object.");
  }

  return JSON.parse(match[0]);
}
