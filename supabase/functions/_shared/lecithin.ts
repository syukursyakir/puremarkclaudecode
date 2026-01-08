// ================================================================
// PureMark Edge Functions - Lecithin Source Detection
// Language-aware lecithin detection for halal and allergen analysis
// ================================================================

import { normalizeText, containsEnumber } from "./helpers.ts";

// Lecithin source mapping - keys are terms that indicate a specific source
export const LECITHIN_SOURCES: Record<string, string> = {
  // Sunflower variants (multiple languages)
  "sunflower": "sunflower",
  "tournesol": "sunflower",      // French
  "sonnenblume": "sunflower",    // German
  "girasol": "sunflower",        // Spanish
  "girasole": "sunflower",       // Italian

  // Soy variants (multiple languages)
  "soy": "soy",
  "soya": "soy",
  "soja": "soy",                 // French/German/Spanish

  // Rapeseed / Canola variants
  "rapeseed": "rapeseed",
  "colza": "rapeseed",           // French
  "raps": "rapeseed",            // German
  "canola": "rapeseed",

  // Egg variants
  "egg": "egg",
  "oeuf": "egg",                 // French
  "ei": "egg",                   // German
  "huevo": "egg",                // Spanish
  "uovo": "egg",                 // Italian
};

// Lecithin halal status by source
export const LECITHIN_HALAL_STATUS: Record<string, string> = {
  "sunflower": "HALAL",           // Plant-based, inherently halal
  "soy": "UNVERIFIED",            // Plant-based BUT processing may involve alcohol
  "rapeseed": "HALAL",            // Plant-based, inherently halal
  "egg": "HALAL",                 // Halal (eggs are halal), but allergen
  "unspecified": "UNVERIFIED",    // Unknown source, needs verification
};

// Lecithin allergen mapping
export const LECITHIN_ALLERGENS: Record<string, string> = {
  "soy": "soy",
  "egg": "egg",
};

export interface LecithinDetectionResult {
  isLecithin: boolean;
  source: string | null;
  explanation: string | null;
}

/**
 * Detect if ingredient contains lecithin and identify its source.
 *
 * @param ingredientText - The ingredient text to analyze
 * @returns Detection result with source and explanation
 */
export function detectLecithinSource(ingredientText: string): LecithinDetectionResult {
  const text = normalizeText(ingredientText);

  // Check if this ingredient contains lecithin
  const lecithinTerms = [
    "lecithin", "lecithine", "lécithine", "lecitina",
    "e322"
  ];

  const isLecithin = lecithinTerms.some(term => text.includes(term)) || containsEnumber(text, "322");

  if (!isLecithin) {
    return { isLecithin: false, source: null, explanation: null };
  }

  // Try to identify the source
  let detectedSource: string | null = null;

  for (const [sourceTerm, sourceType] of Object.entries(LECITHIN_SOURCES)) {
    if (text.includes(sourceTerm)) {
      detectedSource = sourceType;
      break;
    }
  }

  // If no specific source found, it's unspecified
  if (detectedSource === null) {
    return {
      isLecithin: true,
      source: "unspecified",
      explanation: "Lecithin with unspecified source"
    };
  }

  // Build explanation
  const sourceNames: Record<string, string> = {
    "sunflower": "Sunflower lecithin",
    "soy": "Soy lecithin",
    "rapeseed": "Rapeseed/canola lecithin",
    "egg": "Egg lecithin",
  };

  const explanation = `${sourceNames[detectedSource] || detectedSource.charAt(0).toUpperCase() + detectedSource.slice(1) + ' lecithin'} detected`;

  return { isLecithin: true, source: detectedSource, explanation };
}

/**
 * Return allergens associated with a lecithin source.
 * Only soy lecithin and egg lecithin are allergens.
 */
export function getLecithinAllergens(lecithinSource: string): string[] {
  if (lecithinSource in LECITHIN_ALLERGENS) {
    return [LECITHIN_ALLERGENS[lecithinSource]];
  }
  return [];
}

/**
 * Detect lecithin source by checking BOTH original and normalized text.
 * Fixes issues where GPT incorrectly normalizes source terms.
 */
export function detectLecithinSourceCombined(
  originalText: string,
  normalizedText: string
): LecithinDetectionResult {
  // First check the original text (more reliable for source detection)
  const origResult = detectLecithinSource(originalText);

  // Then check normalized text
  const normResult = detectLecithinSource(normalizedText);

  // If neither contains lecithin, return early
  if (!origResult.isLecithin && !normResult.isLecithin) {
    return { isLecithin: false, source: null, explanation: null };
  }

  // Prioritize original text source if it's specific (not unspecified)
  if (origResult.isLecithin && origResult.source && origResult.source !== "unspecified") {
    return {
      isLecithin: true,
      source: origResult.source,
      explanation: `${origResult.explanation} (from original text)`
    };
  }

  // Fall back to normalized text source
  if (normResult.isLecithin && normResult.source && normResult.source !== "unspecified") {
    return {
      isLecithin: true,
      source: normResult.source,
      explanation: `${normResult.explanation} (from normalized text)`
    };
  }

  // If both are lecithin but source is unspecified in both
  if (origResult.isLecithin || normResult.isLecithin) {
    return {
      isLecithin: true,
      source: "unspecified",
      explanation: "Lecithin with unspecified source"
    };
  }

  return { isLecithin: false, source: null, explanation: null };
}
