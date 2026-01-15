// ================================================================
//  API SERVICE - Connects to PureMark Backend
//  Supports: Railway (FastAPI), Supabase Edge Functions, Local
// ================================================================

import { API_URL, BACKEND_TYPE, config } from '../config';
import {
  scanIngredients as supabaseScan,
  checkHealth as supabaseHealth,
  submitFeedback as supabaseFeedback,
} from './supabase';

// API Base URL from config
export const API_BASE_URL = API_URL;

// Backend selection based on config
const USE_SUPABASE = BACKEND_TYPE === 'supabase';
const USE_RAILWAY = BACKEND_TYPE === 'railway' || BACKEND_TYPE === 'local';

// ================================================================
//  Types
// ================================================================

export interface UserProfile {
  diet: 'halal' | 'kosher' | null;
  allergies: string[];
}

export interface IngredientAnalysis {
  name: string;
  original: string;
  english: string;
  halal?: {
    status: 'HALAL' | 'HARAM' | 'MUSHBOOH' | 'NOT_HALAL_UNVERIFIED';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reason_codes: string[];
    evidence: string[];
  };
  kosher?: {
    status: 'KOSHER_CONFIRMED' | 'NOT_KOSHER' | 'REQUIRES_KOSHER_CERTIFICATION';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reason_codes: string[];
    evidence: string[];
    tags: string[];
  };
  allergy_flag: string | null;
}

export interface DietVerdict {
  halal?: {
    status: 'HALAL' | 'HARAM' | 'NOT_HALAL_UNVERIFIED';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    failing_ingredients: string[];
    reason_codes: string[];
  };
  kosher?: {
    status: 'KOSHER_CONFIRMED' | 'NOT_KOSHER' | 'REQUIRES_KOSHER_CERTIFICATION';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    failing_ingredients: string[];
    reason_codes: string[];
  };
}

export interface ScanResponse {
  success: boolean;
  error?: string;
  detected_language?: string;
  diet_verdict?: DietVerdict;
  ingredients?: {
    original: string;
    english: string;
    normalized: string;
  }[];
  analysis?: IngredientAnalysis[];
  allergens?: string[];
}

// ================================================================
//  API Functions
// ================================================================

/**
 * Validate image before sending to API
 * @param imageBase64 - Base64 encoded image
 * @returns Error message if invalid, null if valid
 */
function validateImage(imageBase64: string): string | null {
  // Check if image data exists
  if (!imageBase64 || imageBase64.length === 0) {
    return 'No image data provided';
  }

  // Estimate decoded size (base64 is ~33% larger than binary)
  const estimatedSize = (imageBase64.length * 3) / 4;
  if (estimatedSize > config.image.maxSizeBytes) {
    const maxMB = config.image.maxSizeBytes / (1024 * 1024);
    return `Image too large. Maximum size is ${maxMB}MB`;
  }

  // Check for valid base64 image format by looking at magic bytes
  // JPEG: /9j/, PNG: iVBOR, WebP: UklGR
  const validPrefixes = ['/9j/', 'iVBOR', 'UklGR'];
  const hasValidFormat = validPrefixes.some(prefix => imageBase64.startsWith(prefix));

  if (!hasValidFormat) {
    // Also check if it has a data URL prefix that needs stripping
    if (imageBase64.startsWith('data:')) {
      return 'Image appears to have data URL prefix. Please provide raw base64.';
    }
    return 'Invalid image format. Supported formats: JPEG, PNG, WebP';
  }

  return null;
}

/**
 * Scan an ingredient list image and get analysis results
 * @param imageBase64 - Base64 encoded image (without data:image prefix)
 * @param profile - User's dietary profile
 */
export async function scanIngredients(
  imageBase64: string,
  profile: UserProfile
): Promise<ScanResponse> {
  // Validate image before sending
  const validationError = validateImage(imageBase64);
  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  // Use Supabase Edge Functions
  if (USE_SUPABASE) {
    return supabaseScan(imageBase64, profile);
  }

  // Use Railway FastAPI backend (or local development server)
  try {
    console.log(`[API] Using ${BACKEND_TYPE} backend at ${API_BASE_URL}`);
    const response = await fetch(`${API_BASE_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        profile: {
          diet: profile.diet,
          allergies: profile.allergies,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Server error (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error. Make sure the backend is running.',
    };
  }
}

/**
 * Check if the backend is reachable
 */
export async function checkHealth(): Promise<boolean> {
  if (USE_SUPABASE) {
    return supabaseHealth();
  }

  // Railway/Local FastAPI health check
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Submit user feedback
 */
export async function submitFeedback(feedback: {
  id: string;
  timestamp: string;
  category: string;
  message: string;
  images?: string[];
}): Promise<{ success: boolean; error?: string }> {
  if (USE_SUPABASE) {
    return supabaseFeedback({
      category: feedback.category,
      message: feedback.message,
      images: feedback.images,
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/submit_feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
