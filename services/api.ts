// ================================================================
//  API SERVICE - Connects to PureMark Flask Backend
// ================================================================

// For Android Emulator: use 10.0.2.2 (special IP that routes to host's localhost)
// For physical device on same WiFi: use your computer's local IP address
// You can find your IP by running: ipconfig (Windows) or ifconfig (Mac/Linux)
export const API_BASE_URL = 'http://192.168.86.241:5000';

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
  allergy_flag: boolean;
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
 * Scan an ingredient list image and get analysis results
 * @param imageBase64 - Base64 encoded image (without data:image prefix)
 * @param profile - User's dietary profile
 */
export async function scanIngredients(
  imageBase64: string,
  profile: UserProfile
): Promise<ScanResponse> {
  try {
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
