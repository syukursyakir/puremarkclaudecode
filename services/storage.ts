// ================================================================
//  STORAGE SERVICE - AsyncStorage helpers for persistence
// ================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanResponse, UserProfile, DietVerdict, IngredientAnalysis } from './api';

// ================================================================
//  Storage Keys
// ================================================================

const KEYS = {
  USER_PROFILE: '@puremark_user_profile',
  SCAN_HISTORY: '@puremark_scan_history',
};

// ================================================================
//  Types
// ================================================================

export type ComplianceStatus = 'compliant' | 'conditionally' | 'not_compliant';

export interface ScanHistoryItem {
  id: string;
  productName: string;
  date: string;
  time: string;
  timestamp: number;
  ingredientsCount: number;
  status: ComplianceStatus;
  imageColor: string;
  diet: 'halal' | 'kosher' | null;
  dietVerdict?: DietVerdict;
  ingredients: {
    name: string;
    status: ComplianceStatus;
    halal?: IngredientAnalysis['halal'];
    kosher?: IngredientAnalysis['kosher'];
  }[];
  allergens: string[];
  detectedLanguage?: string;
}

// ================================================================
//  Profile Functions
// ================================================================

/**
 * Get the user's saved profile
 */
export async function getProfile(): Promise<UserProfile> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
  
  // Default profile
  return {
    diet: 'halal',
    allergies: [],
  };
}

/**
 * Save the user's profile
 */
export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}

// ================================================================
//  Scan History Functions
// ================================================================

/**
 * Get all scan history
 */
export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SCAN_HISTORY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading scan history:', error);
  }
  
  return [];
}

/**
 * Add a new scan to history
 */
export async function addScanToHistory(
  scanResponse: ScanResponse,
  diet: 'halal' | 'kosher' | null
): Promise<ScanHistoryItem> {
  const history = await getScanHistory();
  
  // Determine overall compliance status
  const status = determineComplianceStatus(scanResponse, diet);
  
  // Generate a product name from first few ingredients
  const productName = generateProductName(scanResponse);
  
  // Generate a random pastel color for the history item
  const colors = ['#E8D4B8', '#F5E1E9', '#E5E0D5', '#D4E8D8', '#E1E5F5'];
  const imageColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Format date and time
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  // Map ingredients to history format
  const ingredients = (scanResponse.analysis || []).map((ing) => ({
    name: ing.english || ing.name,
    status: mapIngredientStatus(ing, diet),
    halal: ing.halal,
    kosher: ing.kosher,
  }));
  
  const newItem: ScanHistoryItem = {
    id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    productName,
    date,
    time,
    timestamp: Date.now(),
    ingredientsCount: ingredients.length,
    status,
    imageColor,
    diet,
    dietVerdict: scanResponse.diet_verdict,
    ingredients,
    allergens: scanResponse.allergens || [],
    detectedLanguage: scanResponse.detected_language,
  };
  
  // Add to beginning of history
  history.unshift(newItem);
  
  // Limit history to 50 items
  if (history.length > 50) {
    history.pop();
  }
  
  await AsyncStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(history));
  
  return newItem;
}

/**
 * Get a single scan by ID
 */
export async function getScanById(id: string): Promise<ScanHistoryItem | null> {
  const history = await getScanHistory();
  return history.find((item) => item.id === id) || null;
}

/**
 * Delete a scan from history
 */
export async function deleteScan(id: string): Promise<void> {
  const history = await getScanHistory();
  const filtered = history.filter((item) => item.id !== id);
  await AsyncStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(filtered));
}

/**
 * Rename a scan in history
 */
export async function renameScan(id: string, newName: string): Promise<void> {
  const history = await getScanHistory();
  const updated = history.map((item) => 
    item.id === id ? { ...item, productName: newName.trim() } : item
  );
  await AsyncStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(updated));
}

/**
 * Clear all scan history
 */
export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SCAN_HISTORY);
}

// ================================================================
//  Helper Functions
// ================================================================

function determineComplianceStatus(
  scanResponse: ScanResponse,
  diet: 'halal' | 'kosher' | null
): ComplianceStatus {
  if (!scanResponse.diet_verdict) {
    return 'conditionally';
  }
  
  if (diet === 'halal' && scanResponse.diet_verdict.halal) {
    const status = scanResponse.diet_verdict.halal.status;
    if (status === 'HALAL') return 'compliant';
    if (status === 'HARAM') return 'not_compliant';
    return 'conditionally'; // NOT_HALAL_UNVERIFIED
  }
  
  if (diet === 'kosher' && scanResponse.diet_verdict.kosher) {
    const status = scanResponse.diet_verdict.kosher.status;
    if (status === 'KOSHER_CONFIRMED') return 'compliant';
    if (status === 'NOT_KOSHER') return 'not_compliant';
    return 'conditionally'; // REQUIRES_KOSHER_CERTIFICATION
  }
  
  return 'conditionally';
}

function mapIngredientStatus(
  ing: IngredientAnalysis,
  diet: 'halal' | 'kosher' | null
): ComplianceStatus {
  if (diet === 'halal' && ing.halal) {
    if (ing.halal.status === 'HALAL') return 'compliant';
    if (ing.halal.status === 'HARAM') return 'not_compliant';
    return 'conditionally';
  }
  
  if (diet === 'kosher' && ing.kosher) {
    if (ing.kosher.status === 'KOSHER_CONFIRMED') return 'compliant';
    if (ing.kosher.status === 'NOT_KOSHER') return 'not_compliant';
    return 'conditionally';
  }
  
  return 'conditionally';
}

function generateProductName(scanResponse: ScanResponse): string {
  // Try to create a name from the first few ingredients
  const ingredients = scanResponse.ingredients || [];
  
  if (ingredients.length === 0) {
    return 'Unknown Product';
  }
  
  // Use the first ingredient as a hint
  const firstIng = ingredients[0].english || ingredients[0].normalized || 'Food';
  
  // Clean up and capitalize
  const cleaned = firstIng.split(',')[0].trim();
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  return `${capitalized} Product`;
}
