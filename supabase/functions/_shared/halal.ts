// ================================================================
// PureMark Edge Functions - Halal Analysis Engine
// Certifier-grade halal evaluation for ingredients and products
// ================================================================

import {
  normalizeText,
  wordInText,
  anyWordInText,
  extractEnumbers,
  containsEnumber,
  dedupe,
} from "./helpers.ts";

import {
  E_NUMBERS_CONFIG,
  ALCOHOL_CONFIG,
  ANIMAL_DERIVATIVES_CONFIG,
  CERTIFIERS_CONFIG,
  INHERENTLY_HALAL_PLANT_SIMPLE,
  HARAM_COLORANTS,
} from "./config.ts";

import {
  detectLecithinSource,
  detectLecithinSourceCombined,
  LECITHIN_HALAL_STATUS,
} from "./lecithin.ts";

// ================================================================
// Status Constants
// ================================================================

export const HALAL_CONFIRMED = "HALAL_CONFIRMED";
export const HARAM = "HARAM";
export const MUSHBOOH = "MUSHBOOH";
export const NOT_HALAL_UNVERIFIED = "NOT_HALAL_UNVERIFIED";

export const CONF_HIGH = "HIGH";
export const CONF_MED = "MEDIUM";
export const CONF_LOW = "LOW";

// ================================================================
// Types
// ================================================================

export interface HalalResult {
  ingredient: string;
  status: string;
  confidence: string;
  reason_codes: string[];
  evidence: string[];
}

export interface ProductHalalVerdict {
  status: string;
  confidence: string;
  reason: string;
  failing_ingredients: string[];
  reason_codes: string[];
}

// ================================================================
// E-Number Lookup
// ================================================================

export function getENumberStatus(eNum: string): { status: string | null; details: Record<string, string> | null } {
  // Check always_haram first
  if (eNum in E_NUMBERS_CONFIG.always_haram) {
    const details = E_NUMBERS_CONFIG.always_haram[eNum as keyof typeof E_NUMBERS_CONFIG.always_haram];
    return { status: "HARAM", details };
  }

  // Check source_dependent (mushbooh)
  if (eNum in E_NUMBERS_CONFIG.source_dependent) {
    const details = E_NUMBERS_CONFIG.source_dependent[eNum as keyof typeof E_NUMBERS_CONFIG.source_dependent];
    return { status: "MUSHBOOH", details };
  }

  // Check halal
  if (eNum in E_NUMBERS_CONFIG.halal) {
    const details = E_NUMBERS_CONFIG.halal[eNum as keyof typeof E_NUMBERS_CONFIG.halal];
    return { status: "HALAL", details };
  }

  return { status: null, details: null };
}

// ================================================================
// Alcohol Check
// ================================================================

export function checkAlcoholStatus(text: string): { status: string | null; reasonCode: string | null; reason: string | null } {
  const textLower = normalizeText(text);

  // Check halal alternatives FIRST
  if (ALCOHOL_CONFIG.halal_alternatives.terms.some(term => wordInText(textLower, term))) {
    return {
      status: "HALAL",
      reasonCode: ALCOHOL_CONFIG.halal_alternatives.reason_code,
      reason: ALCOHOL_CONFIG.halal_alternatives.reason
    };
  }

  // Check low-risk fermented
  if (ALCOHOL_CONFIG.low_risk_fermented.terms.some(term => wordInText(textLower, term))) {
    return {
      status: "HALAL",
      reasonCode: ALCOHOL_CONFIG.low_risk_fermented.reason_code,
      reason: ALCOHOL_CONFIG.low_risk_fermented.reason
    };
  }

  // Check explicit alcohols
  if (ALCOHOL_CONFIG.explicit_alcohols.terms.some(term => wordInText(textLower, term))) {
    return {
      status: "HARAM",
      reasonCode: ALCOHOL_CONFIG.explicit_alcohols.reason_code,
      reason: ALCOHOL_CONFIG.explicit_alcohols.reason
    };
  }

  // Check alcoholic beverages
  if (ALCOHOL_CONFIG.alcoholic_beverages.terms.some(term => wordInText(textLower, term))) {
    return {
      status: "HARAM",
      reasonCode: ALCOHOL_CONFIG.alcoholic_beverages.reason_code,
      reason: ALCOHOL_CONFIG.alcoholic_beverages.reason
    };
  }

  // Check alcohol processing
  if (ALCOHOL_CONFIG.alcohol_processing.terms.some(term => wordInText(textLower, term))) {
    return {
      status: "HARAM",
      reasonCode: ALCOHOL_CONFIG.alcohol_processing.reason_code,
      reason: ALCOHOL_CONFIG.alcohol_processing.reason
    };
  }

  // Check high-risk extracts
  if (ALCOHOL_CONFIG.high_risk_extracts.terms.some(term => wordInText(textLower, term))) {
    return {
      status: "HARAM",
      reasonCode: ALCOHOL_CONFIG.high_risk_extracts.reason_code,
      reason: ALCOHOL_CONFIG.high_risk_extracts.reason
    };
  }

  return { status: null, reasonCode: null, reason: null };
}

// ================================================================
// Animal Derivative Check
// ================================================================

export function checkAnimalDerivativeStatus(text: string): { status: string | null; reasonCode: string | null; reason: string | null } {
  const textLower = normalizeText(text);

  // 1) Check always_haram first
  for (const [category, data] of Object.entries(ANIMAL_DERIVATIVES_CONFIG.always_haram)) {
    if ((data.terms as readonly string[]).some(term => wordInText(textLower, term))) {
      return {
        status: "HARAM",
        reasonCode: data.reason_code,
        reason: data.reason
      };
    }
  }

  // 2) Check source-dependent ingredients
  for (const [ingredientType, data] of Object.entries(ANIMAL_DERIVATIVES_CONFIG.source_dependent)) {
    const genericTerms = data.generic_terms as readonly string[];

    if (genericTerms.some(term => wordInText(textLower, term))) {
      const sources = data.sources as Record<string, { terms: readonly string[]; status: string; reason: string }>;

      for (const [sourceName, sourceData] of Object.entries(sources)) {
        if (sourceData.terms.some(term => wordInText(textLower, term))) {
          const status = sourceData.status;
          let reasonCode: string;
          if (status === "HALAL") {
            reasonCode = `${ingredientType}_${sourceName}_halal`;
          } else if (status === "HARAM") {
            reasonCode = `${ingredientType}_${sourceName}_haram`;
          } else {
            reasonCode = `${ingredientType}_${sourceName}_mushbooh`;
          }
          return { status, reasonCode, reason: sourceData.reason };
        }
      }

      // No specific source found - use default
      return {
        status: data.default_status,
        reasonCode: data.reason_code,
        reason: data.default_reason
      };
    }
  }

  // 3) Check processed dairy
  if ((ANIMAL_DERIVATIVES_CONFIG.processed_dairy.terms as readonly string[]).some(term => wordInText(textLower, term))) {
    const halalQualifiers = ANIMAL_DERIVATIVES_CONFIG.processed_dairy.halal_qualifiers as readonly string[];
    if (halalQualifiers.some(qual => wordInText(textLower, qual))) {
      return {
        status: "HALAL",
        reasonCode: "dairy_halal_qualified",
        reason: "Dairy with halal qualifier detected"
      };
    }
    return {
      status: ANIMAL_DERIVATIVES_CONFIG.processed_dairy.default_status,
      reasonCode: ANIMAL_DERIVATIVES_CONFIG.processed_dairy.reason_code,
      reason: ANIMAL_DERIVATIVES_CONFIG.processed_dairy.reason
    };
  }

  // 4) Check starter cultures
  if ((ANIMAL_DERIVATIVES_CONFIG.starter_cultures.terms as readonly string[]).some(term => wordInText(textLower, term))) {
    return {
      status: ANIMAL_DERIVATIVES_CONFIG.starter_cultures.default_status,
      reasonCode: ANIMAL_DERIVATIVES_CONFIG.starter_cultures.reason_code,
      reason: ANIMAL_DERIVATIVES_CONFIG.starter_cultures.reason
    };
  }

  // 5) Check other animal-derived
  for (const [category, data] of Object.entries(ANIMAL_DERIVATIVES_CONFIG.other_animal_derived)) {
    if ((data.terms as readonly string[]).some(term => wordInText(textLower, term))) {
      return {
        status: data.default_status,
        reasonCode: data.reason_code,
        reason: data.reason
      };
    }
  }

  return { status: null, reasonCode: null, reason: null };
}

// ================================================================
// Halal Certification Check
// ================================================================

export function checkHalalCertification(text: string): { strength: string; certifier: string | null; region: string | null } {
  const textLower = normalizeText(text);

  // 1) Check for specific certifiers
  for (const [region, certifiers] of Object.entries(CERTIFIERS_CONFIG.strong_certifiers)) {
    for (const [certCode, certData] of Object.entries(certifiers)) {
      if (certData.terms.some(term => wordInText(textLower, term))) {
        return {
          strength: certData.strength,
          certifier: certData.full_name,
          region
        };
      }
    }
  }

  // 2) Check for generic strong terms
  if (CERTIFIERS_CONFIG.generic_strong_terms.some(term => wordInText(textLower, term))) {
    return { strength: "HIGH", certifier: "Generic halal certification", region: null };
  }

  // 3) Check for certification phrases
  if (CERTIFIERS_CONFIG.certification_phrases.strong.some(phrase => wordInText(textLower, phrase))) {
    return { strength: "MEDIUM", certifier: "Certification phrase detected", region: null };
  }

  // 4) Check for weak signals
  if (CERTIFIERS_CONFIG.weak_signals.terms.some(term => wordInText(textLower, term))) {
    return { strength: "WEAK", certifier: null, region: null };
  }

  return { strength: "NONE", certifier: null, region: null };
}

export function isStrongHalalCertSignal(text: string): boolean {
  const { strength } = checkHalalCertification(text);
  return strength === "HIGH" || strength === "MEDIUM";
}

export function isWeakHalalSignal(text: string): boolean {
  const { strength } = checkHalalCertification(text);
  return strength === "WEAK";
}

// ================================================================
// Helper: Check if ingredient is inherently halal
// ================================================================

function isInherentlyHalal(ing: string): boolean {
  return anyWordInText(ing, INHERENTLY_HALAL_PLANT_SIMPLE);
}

// ================================================================
// Main Halal Evaluation Function
// ================================================================

export function evaluateHalalStrict(
  ingredientText: string,
  strictMode: boolean = true,
  originalText: string | null = null
): HalalResult {
  const ingRaw = ingredientText || "";
  const ing = normalizeText(ingRaw);
  const orig = originalText ? normalizeText(originalText) : "";

  const reasons: string[] = [];
  const evidence: string[] = [];
  let status: string | null = null;

  // 0) Certification handling
  const strongCert = isStrongHalalCertSignal(ing);
  const weakCert = isWeakHalalSignal(ing);

  // 1) Animal derivatives check
  const animalResult = checkAnimalDerivativeStatus(ing);

  if (animalResult.status === "HARAM") {
    reasons.push(animalResult.reasonCode!);
    evidence.push(animalResult.reason!);
    return {
      ingredient: ingRaw,
      status: HARAM,
      confidence: CONF_HIGH,
      reason_codes: dedupe(reasons),
      evidence: dedupe(evidence)
    };
  }

  if (animalResult.status === "MUSHBOOH") {
    if (strongCert) {
      reasons.push(`${animalResult.reasonCode}_but_certified`);
      evidence.push(`${animalResult.reason}; but strong halal certification detected`);
    } else {
      reasons.push(animalResult.reasonCode!);
      evidence.push(animalResult.reason!);
    }
  }

  if (animalResult.status === "HALAL") {
    reasons.push(animalResult.reasonCode!);
    evidence.push(animalResult.reason!);
  }

  // 2) Colorants check (fallback)
  if (anyWordInText(ing, HARAM_COLORANTS)) {
    if (!reasons.some(rc => rc.includes("insect"))) {
      reasons.push("haram_carmine_cochineal");
      evidence.push("Detected carmine/cochineal (commonly E120)");
      return {
        ingredient: ingRaw,
        status: HARAM,
        confidence: CONF_HIGH,
        reason_codes: dedupe(reasons),
        evidence: dedupe(evidence)
      };
    }
  }

  // 3) E-numbers check
  const eNums = extractEnumbers(ing);
  for (const e of eNums) {
    const { status: eStatus, details } = getENumberStatus(e);

    if (eStatus === "HARAM" && details) {
      const reasonCode = details.reason_code || `e${e}_haram`;
      const eName = details.name || `E${e}`;
      reasons.push(reasonCode);
      evidence.push(`Detected E${e} (${eName}) - ${details.reason || 'always haram'}`);
      return {
        ingredient: ingRaw,
        status: HARAM,
        confidence: CONF_HIGH,
        reason_codes: dedupe(reasons),
        evidence: dedupe(evidence)
      };
    }

    if (eStatus === "MUSHBOOH" && details) {
      const reasonCode = details.reason_code || `e${e}_source_unknown`;
      const eName = details.name || `E${e}`;
      reasons.push(reasonCode);
      evidence.push(`Detected E${e} (${eName}) - ${details.reason || 'source-dependent'}`);
    }
  }

  // 4) Alcohol check
  const alcoholResult = checkAlcoholStatus(ing);

  if (alcoholResult.status === "HALAL") {
    reasons.push(alcoholResult.reasonCode!);
    evidence.push(alcoholResult.reason!);
  } else if (alcoholResult.status === "HARAM") {
    if (strongCert) {
      reasons.push("alcohol_related_term_present_but_halal_cert_claim");
      evidence.push(`${alcoholResult.reason}; but strong halal certification phrase detected`);
    } else {
      reasons.push(alcoholResult.reasonCode!);
      evidence.push(alcoholResult.reason!);
      return {
        ingredient: ingRaw,
        status: HARAM,
        confidence: CONF_HIGH,
        reason_codes: dedupe(reasons),
        evidence: dedupe(evidence)
      };
    }
  }

  // 5) Gelatin handling (supports both "gelatin" and "gelatine" spellings)
  if (wordInText(ing, "gelatin") || wordInText(ing, "gelatine") || containsEnumber(ing, "441")) {
    // Check for porcine/pork source first - always HARAM
    if (anyWordInText(ing, ["porcine", "pig", "swine", "pork"])) {
      return {
        ingredient: ingRaw,
        status: HARAM,
        confidence: CONF_HIGH,
        reason_codes: ["haram_porcine_gelatin"],
        evidence: ["Porcine gelatin detected"]
      };
    }

    // Check for explicit "(halal)" marker anywhere in the ingredient - this takes priority
    // This handles cases like "Beef Gelatine (Halal)", "Gelatin (Halal)", etc.
    if (ing.includes("(halal)") || anyWordInText(ing, ["halal gelatin", "halal gelatine", "gelatin (halal)", "gelatine (halal)"])) {
      reasons.push("halal_gelatin_explicit");
      evidence.push("Gelatin explicitly labeled halal");
      return {
        ingredient: ingRaw,
        status: HALAL_CONFIRMED,
        confidence: CONF_HIGH,
        reason_codes: dedupe(reasons),
        evidence: dedupe(evidence)
      };
    }

    // Fish gelatin is halal
    if (anyWordInText(ing, ["fish gelatin", "fish gelatine", "marine gelatin", "marine gelatine"])) {
      reasons.push("fish_gelatin");
      evidence.push("Fish-derived gelatin");
      return {
        ingredient: ingRaw,
        status: HALAL_CONFIRMED,
        confidence: CONF_HIGH,
        reason_codes: dedupe(reasons),
        evidence: dedupe(evidence)
      };
    }

    // Bovine/beef gelatin without halal marker - requires verification
    if (anyWordInText(ing, ["bovine gelatin", "bovine gelatine", "beef gelatin", "beef gelatine"])) {
      reasons.push("bovine_gelatin_unverified");
      evidence.push("Bovine gelatin without explicit halal certification");
      status = MUSHBOOH;
    }
  }

  // 5.5) Lecithin handling
  let lecithinResult;
  if (orig) {
    lecithinResult = detectLecithinSourceCombined(orig, ing);
  } else {
    lecithinResult = detectLecithinSource(ing);
  }

  if (lecithinResult.isLecithin) {
    const lecithinSource = lecithinResult.source || "unspecified";
    const halalStatus = LECITHIN_HALAL_STATUS[lecithinSource] || "UNVERIFIED";

    if (lecithinSource === "sunflower") {
      reasons.push("sunflower_lecithin_halal");
      evidence.push("Sunflower lecithin detected - plant-based, halal");
      return {
        ingredient: ingRaw,
        status: HALAL_CONFIRMED,
        confidence: CONF_HIGH,
        reason_codes: dedupe(reasons),
        evidence: dedupe(evidence)
      };
    } else if (lecithinSource === "soy") {
      if (strongCert) {
        reasons.push("soy_lecithin_certified_halal");
        evidence.push("Soy lecithin with halal certification - verified halal");
        return {
          ingredient: ingRaw,
          status: HALAL_CONFIRMED,
          confidence: CONF_HIGH,
          reason_codes: dedupe(reasons),
          evidence: dedupe(evidence)
        };
      } else {
        reasons.push("soy_lecithin_unverified_mushbooh");
        evidence.push("Soy lecithin detected - processing may involve alcohol; requires halal certification");
        return {
          ingredient: ingRaw,
          status: NOT_HALAL_UNVERIFIED,
          confidence: CONF_MED,
          reason_codes: dedupe(reasons),
          evidence: dedupe(evidence)
        };
      }
    } else if (lecithinSource === "rapeseed") {
      reasons.push("rapeseed_lecithin_halal");
      evidence.push("Rapeseed/canola lecithin detected - plant-based, halal");
      return {
        ingredient: ingRaw,
        status: HALAL_CONFIRMED,
        confidence: CONF_HIGH,
        reason_codes: dedupe(reasons),
        evidence: dedupe(evidence)
      };
    } else if (lecithinSource === "egg") {
      reasons.push("egg_lecithin_halal");
      evidence.push("Egg lecithin detected - halal (note: egg allergen)");
      return {
        ingredient: ingRaw,
        status: HALAL_CONFIRMED,
        confidence: CONF_HIGH,
        reason_codes: dedupe(reasons),
        evidence: dedupe(evidence)
      };
    } else {
      // Unspecified source
      if (strongCert) {
        reasons.push("lecithin_unspecified_but_certified");
        evidence.push("Lecithin source unspecified, but product has halal certification");
      } else {
        reasons.push("lecithin_source_unspecified_mushbooh");
        evidence.push("Lecithin detected but source not specified - possible soy, egg, or plant origin");
        status = MUSHBOOH;
      }
    }
  }

  // 9) Flavourings
  if (anyWordInText(ing, ["natural flavor", "natural flavour"])) {
    reasons.push("natural_flavour_source_unknown_mushbooh");
    evidence.push("Natural flavours have undisclosed sources");
    status = MUSHBOOH;
  } else if (anyWordInText(ing, ["artificial flavor", "artificial flavour"])) {
    reasons.push("artificial_flavour");
    evidence.push("Artificial flavouring (no alcohol indicated)");
  }

  // 11) Determine final status
  let confidence: string;

  if (strongCert) {
    status = HALAL_CONFIRMED;
    confidence = CONF_HIGH;
  } else if (reasons.some(rc => rc.includes("haram_") || rc.endsWith("_haram"))) {
    status = HARAM;
    confidence = CONF_HIGH;
  } else if (reasons.some(rc => rc.includes("mushbooh") || rc.includes("unverified") || rc.includes("source_unknown"))) {
    const mushboohReasons = reasons.filter(rc =>
      rc.includes("mushbooh") || rc.includes("unverified") || rc.includes("source_unknown")
    );
    const halalReasons = reasons.filter(rc =>
      rc.endsWith("_halal") || rc.toLowerCase().includes("halal")
    );

    if (halalReasons.length > 0 && halalReasons.length >= mushboohReasons.length) {
      status = HALAL_CONFIRMED;
      confidence = CONF_HIGH;
    } else {
      status = MUSHBOOH;
      confidence = weakCert ? CONF_MED : CONF_LOW;
    }
  } else if (reasons.some(rc => rc.endsWith("_halal"))) {
    status = HALAL_CONFIRMED;
    confidence = CONF_HIGH;
  } else if (isInherentlyHalal(ing)) {
    status = HALAL_CONFIRMED;
    confidence = CONF_HIGH;
    reasons.push("inherently_halal_by_nature");
    evidence.push("Plant-based ingredient; halal by default");
  } else {
    status = HALAL_CONFIRMED;
    confidence = CONF_MED;
    reasons.push("no_haram_indicators_detected");
    evidence.push("No haram indicators detected; default halal");
  }

  // 12) Strict-mode conversion
  let finalStatus = status;
  if (strictMode && status === MUSHBOOH) {
    finalStatus = NOT_HALAL_UNVERIFIED;
  }

  return {
    ingredient: ingRaw,
    status: finalStatus!,
    confidence,
    reason_codes: dedupe(reasons),
    evidence: dedupe(evidence)
  };
}

// ================================================================
// Product-Level Aggregation
// ================================================================

export function aggregateProductHalal(
  ingredientResults: HalalResult[],
  strictMode: boolean = true
): ProductHalalVerdict {
  const haramHits: HalalResult[] = [];
  const mushboohHits: HalalResult[] = [];

  for (const r of ingredientResults) {
    if (r.status === HARAM) {
      haramHits.push(r);
    } else if (r.status === MUSHBOOH || r.status === NOT_HALAL_UNVERIFIED) {
      mushboohHits.push(r);
    }
  }

  // RULE 1 - HARD FAIL
  if (haramHits.length > 0) {
    const allReasonCodes = new Set<string>();
    for (const r of haramHits) {
      for (const rc of r.reason_codes) {
        allReasonCodes.add(rc);
      }
    }
    return {
      status: "HARAM",
      confidence: CONF_HIGH,
      reason: "Contains explicitly haram ingredient(s).",
      failing_ingredients: haramHits.map(r => r.ingredient),
      reason_codes: Array.from(allReasonCodes).sort()
    };
  }

  // RULE 2 - STRICT FAIL (MUSHBOOH)
  if (strictMode && mushboohHits.length > 0) {
    const allReasonCodes = new Set<string>();
    for (const r of mushboohHits) {
      for (const rc of r.reason_codes) {
        allReasonCodes.add(rc);
      }
    }
    return {
      status: "NOT_HALAL_UNVERIFIED",
      confidence: CONF_LOW,
      reason: "Contains ingredient(s) with unverified halal source or processing.",
      failing_ingredients: mushboohHits.map(r => r.ingredient),
      reason_codes: Array.from(allReasonCodes).sort()
    };
  }

  // RULE 3 - PASS
  return {
    status: "HALAL",
    confidence: CONF_MED,
    reason: "All detected ingredients are verified halal at ingredient level.",
    failing_ingredients: [],
    reason_codes: []
  };
}

// ================================================================
// Convert result to violations list (for backward compatibility)
// ================================================================

export function halalToViolations(result: HalalResult): string[] {
  const v: string[] = [];

  if (result.status === HARAM) {
    v.push("haram_ingredient_source_forbidden");
  }

  if (result.reason_codes.some(rc => rc.includes("alcohol"))) {
    v.push("alcohol_not_halal");
  }

  if (result.status === MUSHBOOH || result.status === NOT_HALAL_UNVERIFIED) {
    v.push("source_unverified_mushbooh");
  }

  if (wordInText(result.ingredient, "vanilla extract")) {
    v.push("vanilla_extract_may_contain_alcohol");
  }

  return dedupe(v);
}
