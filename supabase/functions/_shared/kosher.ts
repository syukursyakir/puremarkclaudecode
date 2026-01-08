// ================================================================
// PureMark Edge Functions - Kosher Analysis Engine
// Kosher evaluation for ingredients and products
// ================================================================

import {
  normalizeText,
  anyWordInText,
  containsEnumber,
  dedupe,
} from "./helpers.ts";

// ================================================================
// Status Constants
// ================================================================

export const KOSHER_CONFIRMED = "KOSHER_CONFIRMED";
export const NOT_KOSHER = "NOT_KOSHER";
export const REQUIRES_KOSHER_CERTIFICATION = "REQUIRES_KOSHER_CERTIFICATION";

export const CONF_KOSHER_HIGH = "HIGH";
export const CONF_KOSHER_MED = "MEDIUM";
export const CONF_KOSHER_LOW = "LOW";

// ================================================================
// Types
// ================================================================

export interface KosherResult {
  ingredient: string;
  status: string;
  confidence: string;
  reason_codes: string[];
  evidence: string[];
}

export interface ProductKosherVerdict {
  status: string;
  confidence: string;
  reason: string;
  failing_ingredients: string[];
  reason_codes: string[];
}

// ================================================================
// Kosher Knowledge Base
// ================================================================

const KOSHER_FORBIDDEN_LAND = [
  "pork", "pig", "swine", "rabbit", "horse", "camel"
] as const;

const KOSHER_FORBIDDEN_SEA = [
  "shrimp", "crab", "lobster", "clam", "mussel",
  "oyster", "scallop", "catfish", "eel", "shark"
] as const;

const KOSHER_INSECTS = [
  "carmine", "cochineal"
] as const;

const KOSHER_BLOOD = [
  "blood", "blood plasma", "hemoglobin"
] as const;

const KOSHER_GRAPE_PRODUCTS = [
  "wine", "wine vinegar", "grape juice",
  "grape extract", "brandy"
] as const;

const KOSHER_SOURCE_DEPENDENT = [
  "gelatin", "collagen",
  "mono and diglycerides", "fatty acids", "glycerin",
  "rennet", "enzymes", "starter cultures",
  "cheese", "whey", "casein",
  "natural flavor", "artificial flavor", "aroma"
] as const;

// ================================================================
// Kosher Certification Check
// ================================================================

function isStrongKosherCertSignal(text: string): boolean {
  const t = normalizeText(text);
  const strong = [
    "kosher certified",
    "certified kosher",
    "ou kosher", "ou",
    "ok kosher", "kof-k",
    "star-k", "crc kosher", "badatz"
  ];
  return anyWordInText(t, strong);
}

// ================================================================
// Main Kosher Evaluation Function
// ================================================================

export function evaluateKosherStrict(ingredientText: string): KosherResult {
  const ingRaw = ingredientText || "";
  const ing = normalizeText(ingRaw);

  const reasons: string[] = [];
  const evidence: string[] = [];

  const strongCert = isStrongKosherCertSignal(ing);

  // 1) Forbidden land animals
  if (anyWordInText(ing, KOSHER_FORBIDDEN_LAND)) {
    return {
      ingredient: ingRaw,
      status: NOT_KOSHER,
      confidence: CONF_KOSHER_HIGH,
      reason_codes: ["forbidden_land_animal"],
      evidence: ["Non-kosher land animal detected"]
    };
  }

  // 2) Forbidden seafood
  if (anyWordInText(ing, KOSHER_FORBIDDEN_SEA)) {
    return {
      ingredient: ingRaw,
      status: NOT_KOSHER,
      confidence: CONF_KOSHER_HIGH,
      reason_codes: ["forbidden_seafood_no_fins_scales"],
      evidence: ["Seafood without fins and scales detected"]
    };
  }

  // 3) Insects
  if (anyWordInText(ing, KOSHER_INSECTS) || containsEnumber(ing, "120")) {
    return {
      ingredient: ingRaw,
      status: NOT_KOSHER,
      confidence: CONF_KOSHER_HIGH,
      reason_codes: ["insect_derived_not_kosher"],
      evidence: ["Carmine / E120 insect-derived colorant detected"]
    };
  }

  // 4) Blood
  if (anyWordInText(ing, KOSHER_BLOOD)) {
    return {
      ingredient: ingRaw,
      status: NOT_KOSHER,
      confidence: CONF_KOSHER_HIGH,
      reason_codes: ["blood_not_kosher"],
      evidence: ["Blood-derived ingredient detected"]
    };
  }

  // 5) Grape products (strict supervision required)
  if (anyWordInText(ing, KOSHER_GRAPE_PRODUCTS)) {
    if (!strongCert) {
      return {
        ingredient: ingRaw,
        status: REQUIRES_KOSHER_CERTIFICATION,
        confidence: CONF_KOSHER_LOW,
        reason_codes: ["grape_product_requires_supervision"],
        evidence: ["Grape-derived product requires kosher supervision"]
      };
    }
  }

  // 6) Source-dependent ingredients
  if (anyWordInText(ing, KOSHER_SOURCE_DEPENDENT)) {
    if (strongCert) {
      return {
        ingredient: ingRaw,
        status: KOSHER_CONFIRMED,
        confidence: CONF_KOSHER_HIGH,
        reason_codes: ["kosher_certified_source_dependent"],
        evidence: ["Strong kosher certification detected"]
      };
    } else {
      return {
        ingredient: ingRaw,
        status: REQUIRES_KOSHER_CERTIFICATION,
        confidence: CONF_KOSHER_LOW,
        reason_codes: ["source_dependent_requires_certification"],
        evidence: ["Ingredient requires kosher-certified source"]
      };
    }
  }

  // 7) Default fallback
  if (strongCert) {
    return {
      ingredient: ingRaw,
      status: KOSHER_CONFIRMED,
      confidence: CONF_KOSHER_HIGH,
      reason_codes: ["kosher_certified"],
      evidence: ["Strong kosher certification detected"]
    };
  }

  return {
    ingredient: ingRaw,
    status: REQUIRES_KOSHER_CERTIFICATION,
    confidence: CONF_KOSHER_LOW,
    reason_codes: ["no_kosher_certification"],
    evidence: ["No evidence of kosher certification"]
  };
}

// ================================================================
// Product-Level Aggregation
// ================================================================

export function aggregateProductKosher(ingredientResults: KosherResult[]): ProductKosherVerdict {
  const notKosherHits: KosherResult[] = [];
  const unverifiedHits: KosherResult[] = [];

  for (const r of ingredientResults) {
    if (r.status === NOT_KOSHER) {
      notKosherHits.push(r);
    } else if (r.status === REQUIRES_KOSHER_CERTIFICATION) {
      unverifiedHits.push(r);
    }
  }

  // RULE 1 - HARD FAIL
  if (notKosherHits.length > 0) {
    const allReasonCodes = new Set<string>();
    for (const r of notKosherHits) {
      for (const rc of r.reason_codes) {
        allReasonCodes.add(rc);
      }
    }
    return {
      status: NOT_KOSHER,
      confidence: CONF_KOSHER_HIGH,
      reason: "Contains explicitly non-kosher ingredient(s).",
      failing_ingredients: notKosherHits.map(r => r.ingredient),
      reason_codes: Array.from(allReasonCodes).sort()
    };
  }

  // RULE 2 - NEEDS CERTIFICATION
  if (unverifiedHits.length > 0) {
    const allReasonCodes = new Set<string>();
    for (const r of unverifiedHits) {
      for (const rc of r.reason_codes) {
        allReasonCodes.add(rc);
      }
    }
    return {
      status: REQUIRES_KOSHER_CERTIFICATION,
      confidence: CONF_KOSHER_MED,
      reason: "All ingredients may be kosher, but kosher certification is required.",
      failing_ingredients: unverifiedHits.map(r => r.ingredient),
      reason_codes: Array.from(allReasonCodes).sort()
    };
  }

  // RULE 3 - PASS
  return {
    status: KOSHER_CONFIRMED,
    confidence: CONF_KOSHER_HIGH,
    reason: "All detected ingredients are kosher at ingredient level.",
    failing_ingredients: [],
    reason_codes: []
  };
}

// ================================================================
// Generate Kosher Tags
// ================================================================

export function kosherTags(result: KosherResult): string[] {
  const tags: string[] = [];

  if (result.status === NOT_KOSHER) {
    tags.push("Not Kosher");
  }

  if (result.status === REQUIRES_KOSHER_CERTIFICATION) {
    tags.push("Requires Kosher Certification");
  }

  if (result.reason_codes.some(rc => rc.includes("grape"))) {
    tags.push("Grape Product");
  }

  if (result.reason_codes.some(rc => rc.includes("source_dependent"))) {
    tags.push("Source Dependent");
  }

  return tags;
}

// ================================================================
// Convert result to violations list (for backward compatibility)
// ================================================================

export function kosherToViolations(result: KosherResult): string[] {
  const v: string[] = [];

  if (result.status === NOT_KOSHER) {
    v.push(...result.reason_codes);
  }

  if (result.status === REQUIRES_KOSHER_CERTIFICATION) {
    v.push("requires_kosher_certification");
  }

  return dedupe(v);
}
