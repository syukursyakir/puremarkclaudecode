// ================================================================
// PureMark Edge Functions - Allergen Detection
// Comprehensive allergen checking with lecithin source awareness
// ================================================================

import { wordInText } from "./helpers.ts";
import { detectLecithinSource, getLecithinAllergens } from "./lecithin.ts";
import { ALLERGENS_CONFIG } from "./config.ts";

// ================================================================
// Types
// ================================================================

export interface AllergenCheckResult {
  isAllergen: boolean;
  allergenType: string | null;
  isConfirmed: boolean;
  explanation: string | null;
}

// ================================================================
// Allergen Term Lookup
// ================================================================

/**
 * Get all terms that indicate an ingredient contains the specified allergen.
 */
export function getAllergenTerms(allergenType: string): string[] {
  const allergenTypeLower = allergenType.toLowerCase().trim();

  // Handle common variations
  const allergenMap: Record<string, string> = {
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
  };

  // Normalize the allergen type
  const normalized = allergenMap[allergenTypeLower] || allergenTypeLower;

  const allergenData = ALLERGENS_CONFIG[normalized as keyof typeof ALLERGENS_CONFIG];

  if (!allergenData) {
    // If not in our config, return just the original term
    return [allergenTypeLower];
  }

  // Combine direct terms and derived ingredients
  const allTerms: string[] = [];
  allTerms.push(...(allergenData.direct_terms as unknown as string[]));
  allTerms.push(...(allergenData.derived_ingredients as unknown as string[]));

  return allTerms;
}

// ================================================================
// Simple Allergen Check
// ================================================================

/**
 * Check if an ingredient matches any user allergies.
 *
 * Special handling for lecithin:
 * - Only trigger soy allergen if lecithin is EXPLICITLY soy-derived
 * - Sunflower/rapeseed lecithin should NOT trigger soy allergen
 * - Egg lecithin should trigger egg allergen
 */
export function checkAllergy(ingredient: string, allergies: string[]): boolean {
  const ing = ingredient.toLowerCase();

  // Check for lecithin - use source-aware detection
  const lecithinResult = detectLecithinSource(ing);

  if (lecithinResult.isLecithin) {
    // For lecithin, only check allergens based on actual source
    const lecithinAllergens = getLecithinAllergens(lecithinResult.source || "unspecified");

    // Check if any user allergy matches the lecithin's actual allergens
    for (const allergy of allergies) {
      const allergyLower = allergy.toLowerCase().trim();
      if (lecithinAllergens.includes(allergyLower)) {
        return true;
      }
    }

    // If lecithin source is unspecified and user has soy allergy,
    // flag it as "possible" (conservative approach)
    if (lecithinResult.source === "unspecified") {
      for (const allergy of allergies) {
        if (["soy", "soya"].includes(allergy.toLowerCase().trim())) {
          return true;
        }
      }
    }

    // Lecithin is handled - don't fall through to generic check
    return false;
  }

  // Enhanced allergen check using config
  for (const allergy of allergies) {
    const allergenTerms = getAllergenTerms(allergy);

    for (const term of allergenTerms) {
      if (wordInText(ing, term)) {
        return true;
      }
    }
  }

  return false;
}

// ================================================================
// Detailed Allergen Check
// ================================================================

/**
 * Enhanced allergy check that returns detailed information.
 */
export function checkAllergyDetailed(ingredient: string, allergies: string[]): AllergenCheckResult {
  const ing = ingredient.toLowerCase();

  // Check for lecithin with source detection
  const lecithinResult = detectLecithinSource(ing);

  if (lecithinResult.isLecithin) {
    const lecithinAllergens = getLecithinAllergens(lecithinResult.source || "unspecified");

    for (const allergy of allergies) {
      const allergyLower = allergy.toLowerCase().trim();

      // Check confirmed allergens
      if (lecithinAllergens.includes(allergyLower)) {
        return {
          isAllergen: true,
          allergenType: allergyLower,
          isConfirmed: true,
          explanation: `${(lecithinResult.source || "Unknown").charAt(0).toUpperCase() + (lecithinResult.source || "unknown").slice(1)} lecithin contains ${allergyLower}`
        };
      }
    }

    // Check for possible allergen (unspecified source)
    if (lecithinResult.source === "unspecified") {
      for (const allergy of allergies) {
        if (allergy.toLowerCase().trim() === "soy") {
          return {
            isAllergen: true,
            allergenType: "soy",
            isConfirmed: false,
            explanation: "Lecithin source unspecified - may contain soy"
          };
        }
      }
    }

    return {
      isAllergen: false,
      allergenType: null,
      isConfirmed: false,
      explanation: `${lecithinResult.explanation} - no allergen match`
    };
  }

  // Standard check
  for (const allergy of allergies) {
    if (ing.includes(allergy.toLowerCase())) {
      return {
        isAllergen: true,
        allergenType: allergy.toLowerCase(),
        isConfirmed: true,
        explanation: `Contains ${allergy}`
      };
    }
  }

  return {
    isAllergen: false,
    allergenType: null,
    isConfirmed: false,
    explanation: null
  };
}

// ================================================================
// Extract Allergens from Advisory Text
// ================================================================

const ALLERGEN_TERMS: Record<string, string> = {
  // Nuts
  "nueces": "tree nuts", "nuts": "tree nuts", "noix": "tree nuts",
  "nüsse": "tree nuts", "frutos secos": "tree nuts",
  "almendras": "almonds", "almonds": "almonds", "amandes": "almonds",
  "avellanas": "hazelnuts", "hazelnuts": "hazelnuts", "noisettes": "hazelnuts",
  "cacahuetes": "peanuts", "peanuts": "peanuts", "cacahuètes": "peanuts",
  "arachides": "peanuts", "erdnüsse": "peanuts", "mani": "peanuts",
  "pistachos": "pistachios", "pistachios": "pistachios", "pistaches": "pistachios",
  "anacardos": "cashews", "cashews": "cashews", "noix de cajou": "cashews",

  // Dairy
  "leche": "milk", "milk": "milk", "lait": "milk", "milch": "milk",
  "lactosa": "lactose", "lactose": "lactose",
  "lácteos": "dairy", "dairy": "dairy", "laitiers": "dairy",

  // Gluten
  "gluten": "gluten", "trigo": "wheat", "wheat": "wheat", "blé": "wheat",
  "weizen": "wheat", "cebada": "barley", "barley": "barley",
  "centeno": "rye", "rye": "rye", "seigle": "rye",
  "avena": "oats", "oats": "oats", "avoine": "oats",

  // Soy
  "soja": "soy", "soy": "soy", "soya": "soy",

  // Eggs
  "huevo": "egg", "huevos": "egg", "egg": "egg", "eggs": "egg",
  "oeuf": "egg", "oeufs": "egg", "ei": "egg", "eier": "egg",

  // Seafood
  "pescado": "fish", "fish": "fish", "poisson": "fish", "fisch": "fish",
  "mariscos": "shellfish", "shellfish": "shellfish",
  "crustáceos": "crustaceans", "crustaceans": "crustaceans",
  "moluscos": "mollusks", "mollusks": "mollusks",

  // Sesame
  "sésamo": "sesame", "sesame": "sesame", "sésame": "sesame",

  // Sulfites
  "sulfitos": "sulfites", "sulfites": "sulfites", "sulphites": "sulfites",

  // Celery
  "apio": "celery", "celery": "celery", "céleri": "celery",

  // Mustard
  "mostaza": "mustard", "mustard": "mustard", "moutarde": "mustard",

  // Lupin
  "altramuces": "lupin", "lupin": "lupin", "lupine": "lupin",
};

/**
 * Extract allergen names from advisory text like "May contain: nuts, milk, soy"
 */
export function extractAllergensFromAdvisory(advisoryText: string): string[] {
  if (!advisoryText) return [];

  const text = advisoryText.toLowerCase();
  const foundAllergens = new Set<string>();

  for (const [term, normalized] of Object.entries(ALLERGEN_TERMS)) {
    if (text.includes(term)) {
      foundAllergens.add(normalized);
    }
  }

  return Array.from(foundAllergens);
}
