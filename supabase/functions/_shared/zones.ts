// ================================================================
// PureMark Edge Functions - OCR Zone Segmentation
// Separates raw OCR text into: HEADER, INGREDIENTS, ALLERGEN_ADVISORY
// ================================================================

import {
  findHeaderPosition,
  detectLanguageFromHeaders,
  isNonIngredientLine,
  INGREDIENT_HEADERS,
  ALLERGEN_ADVISORY_HEADERS,
  COMMON_INGREDIENT_TERMS,
} from "./helpers.ts";

// ================================================================
// Types
// ================================================================

export interface OCRZoneResult {
  raw_text: string;
  header_zone: string;
  ingredient_zone: string;
  allergen_advisory_zone: string;
  detected_language: string | null;
  parse_status: string;  // "OK", "NO_INGREDIENTS", "UNVERIFIED"
  parse_notes: string[];
}

// ================================================================
// Helper Functions
// ================================================================

/**
 * Attempt to extract ingredients when no header is found (fallback).
 */
function attemptFallbackIngredientExtraction(rawText: string, allergenPos: number): string {
  if (!rawText) return "";

  const textLower = rawText.toLowerCase();

  // Check if text contains ingredient-like terms
  const ingredientTermCount = COMMON_INGREDIENT_TERMS.filter(
    term => textLower.includes(term)
  ).length;

  // Check for comma-separated structure
  const commaCount = (rawText.match(/,/g) || []).length;
  const wordCount = rawText.split(/\s+/).length;

  // Heuristics
  let isLikelyIngredients = (
    ingredientTermCount >= 2 &&
    commaCount >= 2 &&
    wordCount >= 5
  );

  if (!isLikelyIngredients) {
    // Also check for semicolon-separated
    const semicolonCount = (rawText.match(/;/g) || []).length;
    if (ingredientTermCount >= 2 && semicolonCount >= 2) {
      isLikelyIngredients = true;
    }
  }

  if (!isLikelyIngredients) return "";

  // Extract the ingredient portion
  let ingredientZone: string;
  if (allergenPos !== -1 && allergenPos > 10) {
    ingredientZone = rawText.substring(0, allergenPos).trim();
  } else {
    ingredientZone = rawText.trim();
  }

  // Remove product name prefix
  return removeProductNamePrefix(ingredientZone);
}

/**
 * Remove product name/metadata from the beginning of text.
 */
function removeProductNamePrefix(text: string): string {
  if (!text) return "";

  // Try to find where the actual ingredient list starts
  // Pattern: "Something XX% Something: " - ingredients start after the colon
  const match = text.match(/\d+\s*%[^:]*:\s*/);
  if (match && match.index !== undefined) {
    const remaining = text.substring(match.index + match[0].length);
    const remainingLower = remaining.toLowerCase();

    // Verify it has ingredient-like content
    const hasIngredients = COMMON_INGREDIENT_TERMS.slice(0, 20).some(
      term => remainingLower.includes(term)
    );
    if (hasIngredients && remaining.length > 20) {
      return remaining;
    }
  }

  // Pattern: Look for first comma and check if before it is a product name
  const firstComma = text.indexOf(',');
  if (firstComma > 0 && firstComma < 50) {
    const beforeComma = text.substring(0, firstComma).toLowerCase();
    const afterComma = text.substring(firstComma).toLowerCase();

    const hasPercentageBefore = beforeComma.includes('%');
    const hasIngredientAfter = COMMON_INGREDIENT_TERMS.slice(0, 20).some(
      term => afterComma.includes(term)
    );

    if (hasPercentageBefore && hasIngredientAfter) {
      // Find the first ingredient-like term
      for (const term of COMMON_INGREDIENT_TERMS) {
        const pos = text.toLowerCase().indexOf(term);
        if (pos !== -1 && pos < 100) {
          let startPos = pos;
          while (startPos > 0 && !",;:".includes(text[startPos - 1])) {
            startPos--;
          }
          if (startPos > 0) {
            startPos++;
          }
          return text.substring(startPos).trim();
        }
      }
    }
  }

  return text;
}

/**
 * Clean the ingredient zone by removing non-ingredient content.
 */
function cleanIngredientZone(text: string): string {
  if (!text) return "";

  const lines = text.split('\n');
  const cleanedLines: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (isNonIngredientLine(line)) continue;
    cleanedLines.push(line);
  }

  let result = cleanedLines.join(' ');
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/[,;]\s*[,;]/g, ',');

  return result.trim();
}

// ================================================================
// Main Zone Segmentation Function
// ================================================================

/**
 * Segment raw OCR text into semantic zones using deterministic rules.
 *
 * This is the CRITICAL function that ensures:
 * 1. Product names/metadata are NOT treated as ingredients
 * 2. Only text after "Ingredientes:" (or equivalent) is parsed
 * 3. Allergen advisories are separated from actual ingredients
 */
export function segmentOcrText(rawText: string): OCRZoneResult {
  const notes: string[] = [];

  if (!rawText || rawText.trim().length < 5) {
    return {
      raw_text: rawText || "",
      header_zone: "",
      ingredient_zone: "",
      allergen_advisory_zone: "",
      detected_language: null,
      parse_status: "NO_INGREDIENTS",
      parse_notes: ["Raw text too short or empty"]
    };
  }

  // Detect language from headers
  const detectedLang = detectLanguageFromHeaders(rawText);
  notes.push(`Detected language: ${detectedLang || 'unknown'}`);

  // Find ingredient header position
  const { pos: ingPos, header: ingHeader } = findHeaderPosition(rawText, INGREDIENT_HEADERS);

  // Find allergen advisory position
  const { pos: allergenPos, header: allergenHeader } = findHeaderPosition(rawText, ALLERGEN_ADVISORY_HEADERS);

  notes.push(`Ingredient header '${ingHeader}' at position ${ingPos}`);
  notes.push(`Allergen header '${allergenHeader}' at position ${allergenPos}`);

  // CASE 1: No ingredient header found
  if (ingPos === -1) {
    notes.push("WARNING: No ingredient header found");

    // FALLBACK: Check if text might contain ingredients
    const fallbackIngredientZone = attemptFallbackIngredientExtraction(rawText, allergenPos);

    if (fallbackIngredientZone) {
      notes.push(`FALLBACK: Extracted ${fallbackIngredientZone.length} chars as potential ingredients`);

      let allergenAdvisoryZone = "";
      if (allergenPos !== -1) {
        allergenAdvisoryZone = rawText.substring(allergenPos).trim();
      }

      return {
        raw_text: rawText,
        header_zone: "",
        ingredient_zone: fallbackIngredientZone,
        allergen_advisory_zone: allergenAdvisoryZone,
        detected_language: detectedLang,
        parse_status: "UNVERIFIED",
        parse_notes: notes
      };
    }

    notes.push("No ingredient-like content detected in fallback");

    // Still try to extract allergen advisory if present
    if (allergenPos !== -1) {
      return {
        raw_text: rawText,
        header_zone: rawText.substring(0, allergenPos).trim(),
        ingredient_zone: "",
        allergen_advisory_zone: rawText.substring(allergenPos).trim(),
        detected_language: detectedLang,
        parse_status: "NO_INGREDIENTS",
        parse_notes: notes
      };
    }

    return {
      raw_text: rawText,
      header_zone: rawText,
      ingredient_zone: "",
      allergen_advisory_zone: "",
      detected_language: detectedLang,
      parse_status: "NO_INGREDIENTS",
      parse_notes: notes
    };
  }

  // CASE 2: Ingredient header found
  const headerZone = rawText.substring(0, ingPos).trim();

  // Move past the header itself
  let ingStart = ingPos + ingHeader.length;

  // Skip any colon or whitespace after header
  while (ingStart < rawText.length && ": \t\n".includes(rawText[ingStart])) {
    ingStart++;
  }

  // Determine ingredient zone end
  let ingredientZone: string;
  let allergenAdvisoryZone: string;

  if (allergenPos !== -1 && allergenPos > ingStart) {
    ingredientZone = rawText.substring(ingStart, allergenPos).trim();
    allergenAdvisoryZone = rawText.substring(allergenPos).trim();
    notes.push(`Ingredient zone: chars ${ingStart}-${allergenPos}`);
  } else {
    ingredientZone = rawText.substring(ingStart).trim();
    allergenAdvisoryZone = "";
    notes.push(`Ingredient zone: chars ${ingStart}-end`);
  }

  // Post-process ingredient zone
  ingredientZone = cleanIngredientZone(ingredientZone);

  // Validate we got something
  if (ingredientZone.trim().length < 5) {
    notes.push("WARNING: Ingredient zone too short after extraction");
    return {
      raw_text: rawText,
      header_zone: headerZone,
      ingredient_zone: ingredientZone,
      allergen_advisory_zone: allergenAdvisoryZone,
      detected_language: detectedLang,
      parse_status: "UNVERIFIED",
      parse_notes: notes
    };
  }

  return {
    raw_text: rawText,
    header_zone: headerZone,
    ingredient_zone: ingredientZone,
    allergen_advisory_zone: allergenAdvisoryZone,
    detected_language: detectedLang,
    parse_status: "OK",
    parse_notes: notes
  };
}
