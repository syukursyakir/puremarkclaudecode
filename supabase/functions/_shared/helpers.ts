// ================================================================
// PureMark Edge Functions - Helper Functions
// Text processing, E-number extraction, matching utilities
// ================================================================

/**
 * Normalize text for matching - lowercase, handle punctuation, collapse whitespace
 */
export function normalizeText(s: string): string {
  if (!s) return "";
  let text = s.toLowerCase().trim();
  // Normalize common punctuation and separators
  text = text.replace(/–/g, "-").replace(/—/g, "-").replace(/'/g, "'");
  text = text.replace(/\s+/g, " ");
  return text;
}

/**
 * Strict-ish phrase match with word boundaries where possible
 */
export function wordInText(text: string, phrase: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedPhrase = normalizeText(phrase);

  // Exact substring check first (covers multi-word phrases)
  if (normalizedText.includes(normalizedPhrase)) {
    // For single-token words, ensure it's a word boundary
    if (!normalizedPhrase.includes(" ") && /^\w+$/.test(normalizedPhrase)) {
      const regex = new RegExp(`\\b${escapeRegExp(normalizedPhrase)}\\b`);
      return regex.test(normalizedText);
    }
    return true;
  }

  // Fall back to boundary-based for single tokens
  if (!normalizedPhrase.includes(" ") && /^\w+$/.test(normalizedPhrase)) {
    const regex = new RegExp(`\\b${escapeRegExp(normalizedPhrase)}\\b`);
    return regex.test(normalizedText);
  }

  return false;
}

/**
 * Check if any phrase from the list is in the text
 */
export function anyWordInText(text: string, phrases: readonly string[]): boolean {
  return phrases.some(p => wordInText(text, p));
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract E-numbers like E471, E-471, e 471, etc.
 * Returns normalized numeric strings (e.g., "471")
 */
export function extractEnumbers(text: string): string[] {
  const normalized = normalizeText(text);
  const found = new Set<string>();

  // E471 / E-471 / e 471
  const ePattern = /\be\s*[-]?\s*(\d{3,4})\b/g;
  let match;
  while ((match = ePattern.exec(normalized)) !== null) {
    found.add(match[1]);
  }

  // Also catch "e-number 471" / "e number 471"
  const eNumberPattern = /\be\s*number\s*(\d{3,4})\b/g;
  while ((match = eNumberPattern.exec(normalized)) !== null) {
    found.add(match[1]);
  }

  return Array.from(found).sort();
}

/**
 * Check if text contains a specific E-number
 */
export function containsEnumber(text: string, eNum: string): boolean {
  return extractEnumbers(text).includes(eNum);
}

/**
 * Remove duplicates from an array while preserving order
 */
export function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of items) {
    if (x && !seen.has(x)) {
      out.push(x);
      seen.add(x);
    }
  }
  return out;
}

/**
 * Normalize text for pattern matching - handles accents, OCR noise
 */
export function normalizeForMatching(text: string): string {
  if (!text) return "";

  let t = text.toLowerCase();

  // Normalize common accent variations (OCR often drops accents)
  const accentMap: Record<string, string> = {
    'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ñ': 'n', 'ç': 'c',
  };

  for (const [accented, plain] of Object.entries(accentMap)) {
    t = t.split(accented).join(plain);
  }

  // Normalize whitespace
  t = t.replace(/\s+/g, ' ').trim();

  return t;
}

/**
 * Find header position in text
 */
export function findHeaderPosition(text: string, headers: readonly string[]): { pos: number; header: string } {
  const textNormalized = normalizeForMatching(text);
  const textLower = text.toLowerCase();

  let bestPos = -1;
  let bestHeader = "";

  for (const header of headers) {
    const headerNormalized = normalizeForMatching(header);

    // Try exact match first
    let pos = textLower.indexOf(header);
    if (pos !== -1) {
      if (bestPos === -1 || pos < bestPos) {
        bestPos = pos;
        bestHeader = header;
      }
      continue;
    }

    // Try normalized match (handles missing accents)
    pos = textNormalized.indexOf(headerNormalized);
    if (pos !== -1) {
      if (bestPos === -1 || pos < bestPos) {
        bestPos = pos;
        bestHeader = header;
      }
      continue;
    }

    // Try matching merged tokens (e.g., "puedecontener" -> "puede contener")
    const headerNoSpace = header.replace(/ /g, "");
    if (headerNoSpace.length >= 8) {
      const textNoSpace = textNormalized.replace(/ /g, "");
      pos = textNoSpace.indexOf(headerNoSpace);
      if (pos !== -1) {
        // Approximate position in original text
        const approxPos = Math.floor(pos * text.length / Math.max(1, textNoSpace.length));
        if (bestPos === -1 || approxPos < bestPos) {
          bestPos = approxPos;
          bestHeader = header;
        }
      }
    }
  }

  return { pos: bestPos, header: bestHeader };
}

// ================================================================
// Zone Segmentation - Headers and Patterns
// ================================================================

// Multilingual ingredient section headers (lowercase)
export const INGREDIENT_HEADERS = [
  // Spanish
  "ingredientes:", "ingredientes", "ingredientes :",
  // English
  "ingredients:", "ingredients", "ingredients :",
  // French
  "ingrédients:", "ingrédients", "ingredients:", "ingredients :",
  // German
  "zutaten:", "zutaten", "zutaten :",
  // Italian
  "ingredienti:", "ingredienti", "ingredienti :",
  // Portuguese
  "ingredientes:", "ingredientes",
  // Dutch
  "ingrediënten:", "ingredienten:",
  // Polish
  "składniki:", "skladniki:",
  // Common OCR errors
  "ingredlentes:", "ingredlentes", "lngredientes:", "lngredients:",
] as const;

// Allergen advisory headers (lowercase)
export const ALLERGEN_ADVISORY_HEADERS = [
  // Spanish
  "puede contener", "puede contener:", "puede contener trazas",
  "contiene:", "contiene", "alérgenos:",
  // English
  "may contain", "may contain:", "may contain traces",
  "contains:", "contains", "allergens:", "allergy advice:",
  "for allergens", "for allergens,", "allergen information",
  // French
  "peut contenir", "peut contenir:", "peut contenir des traces",
  "contient:", "contient", "allergènes:",
  // German
  "kann enthalten", "kann enthalten:", "kann spuren enthalten",
  "enthält:", "enthält", "allergene:",
  // Italian
  "può contenere", "puo contenere", "può contenere:",
  "contiene:", "contiene", "allergeni:",
  // Portuguese
  "pode conter", "pode conter:",
  // Common OCR merged tokens
  "puedecontener", "maycontain", "peutcontenir", "kannenthalten",
] as const;

// Common ingredient terms for fallback detection
export const COMMON_INGREDIENT_TERMS = [
  // Sugars
  "sugar", "azúcar", "azucar", "sucre", "zucker", "zucchero",
  "glucose", "glucosa", "fructose", "fructosa",
  // Fats/Oils
  "oil", "aceite", "huile", "öl", "olio",
  "butter", "mantequilla", "beurre", "manteca",
  "fat", "grasa", "graisse", "fett",
  // Cocoa
  "cocoa", "cacao", "kakao", "chocolate",
  // Dairy
  "milk", "leche", "lait", "milch", "latte",
  "cream", "crema", "crème", "lactose", "lactosa",
  // Flour/Grains
  "flour", "harina", "farine", "mehl",
  "wheat", "trigo", "blé", "weizen",
  "starch", "almidón", "amidon",
  // Eggs
  "egg", "huevo", "oeuf", "ei", "uovo",
  // Emulsifiers
  "lecithin", "lecitina", "lécithine", "lezithin",
  "emulsifier", "emulsionante", "émulsifiant", "emulgator",
  // Common additives
  "salt", "sal", "sel", "salz",
  "vanilla", "vainilla", "vanille",
  "aroma", "flavor", "flavour",
  // E-numbers
  "e322", "e471", "e500", "e330",
] as const;

// Non-ingredient patterns
export const NON_INGREDIENT_PATTERNS = [
  /\b\d+\s*%\s*(mínimo|minimo|minimum|min|máximo|maximo|maximum|max)?\b/i,
  /\bcacao\s*:?\s*\d+\s*%/i,
  /\bgrasa\s*:?\s*\d+\s*%/i,
  /\bfat\s*:?\s*\d+\s*%/i,
  /\b\d+\s*(g|kg|ml|l|oz|lb)\b/i,
  /\b\d{8,13}\b/,
  /\b(ean|upc|gtin)\s*:?\s*\d+/i,
  /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/,
  /\b(best before|consumir antes|à consommer avant|mindestens haltbar)\b/i,
  /\b(lote?|batch|lot)\s*:?\s*[a-z0-9]+\b/i,
  /\b(conservar|store|conserver|aufbewahren|keep)\s+(en|in|au|im|at)\b/i,
  /\b(nutrition|información nutricional|valeurs nutritionnelles|nährwerte)\b/i,
  /\b(calories|calorías|kcal|kj)\b/i,
  /\b(made in|fabricado en|fabriqué|hergestellt in|hecho en)\b/i,
  /\b(product of|producto de|produit de)\b/i,
];

/**
 * Check if a line is clearly NOT an ingredient
 */
export function isNonIngredientLine(line: string): boolean {
  const lineLower = line.toLowerCase().trim();

  if (lineLower.length < 2) return true;

  for (const pattern of NON_INGREDIENT_PATTERNS) {
    if (pattern.test(lineLower)) return true;
  }

  // Pure numbers (barcodes, weights)
  if (/^[\d\s.,]+$/.test(lineLower)) return true;

  return false;
}

/**
 * Detect language from headers in text
 */
export function detectLanguageFromHeaders(text: string): string | null {
  const textLower = text.toLowerCase();

  // Spanish indicators
  if (["ingredientes", "puede contener", "contiene"].some(h => textLower.includes(h))) {
    return "es";
  }

  // French indicators
  if (["ingrédients", "peut contenir", "contient"].some(h => textLower.includes(h))) {
    return "fr";
  }

  // German indicators
  if (["zutaten", "kann enthalten", "enthält"].some(h => textLower.includes(h))) {
    return "de";
  }

  // Italian indicators
  if (["ingredienti", "può contenere", "contiene"].some(h => textLower.includes(h))) {
    return "it";
  }

  // English indicators (default)
  if (["ingredients", "may contain", "contains"].some(h => textLower.includes(h))) {
    return "en";
  }

  return null;
}
