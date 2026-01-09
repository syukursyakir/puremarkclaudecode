// ================================================================
//  SUPABASE CLIENT - PureMark
// ================================================================

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase Configuration
const SUPABASE_URL = 'https://xnzgmgjuxisclvjvnppy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuemdtZ2p1eGlzY2x2anZucHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDM1MzcsImV4cCI6MjA4MzQ3OTUzN30.1NKWb6mjmbEVKsUhTfbHBE6LHlrf0-cDD9fz_n4J7YA';

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ================================================================
//  Types
// ================================================================

export interface UserProfile {
  diet: 'halal' | 'kosher' | null;
  allergies: string[];
}

export interface ScanHistoryItem {
  id: string;
  product_name: string;
  scan_timestamp: string;
  detected_language?: string;
  ingredients: any[];
  analysis: any[];
  diet_verdict: any;
  allergens: string[];
}

// ================================================================
//  Edge Function URL
// ================================================================

const SCAN_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/scan`;

// ================================================================
//  API Functions
// ================================================================

/**
 * Scan an ingredient list image using Supabase Edge Function
 */
export async function scanIngredients(
  imageBase64: string,
  profile: UserProfile
): Promise<any> {
  try {
    // Get current session for authenticated requests (optional)
    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    };

    // If user is logged in, use their token
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(SCAN_FUNCTION_URL, {
      method: 'POST',
      headers,
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

    return await response.json();
  } catch (error) {
    console.error('Supabase scan error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Check if the Supabase Edge Function is reachable
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scan`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ================================================================
//  Database Functions (for logged-in users)
// ================================================================

/**
 * Save user profile to Supabase (requires auth)
 */
export async function saveProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // User not logged in - save to anonymous_profiles
      const deviceId = await getDeviceId();
      const { error } = await supabase
        .from('anonymous_profiles')
        .upsert({
          device_id: deviceId,
          diet: profile.diet,
          allergies: profile.allergies,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return { success: true };
    }

    // User is logged in - save to profiles table
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        diet: profile.diet,
        allergies: profile.allergies,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Save profile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save profile',
    };
  }
}

/**
 * Load user profile from Supabase
 */
export async function loadProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // User not logged in - try anonymous_profiles
      const deviceId = await getDeviceId();
      const { data, error } = await supabase
        .from('anonymous_profiles')
        .select('diet, allergies')
        .eq('device_id', deviceId)
        .single();

      if (error || !data) return null;
      return { diet: data.diet, allergies: data.allergies || [] };
    }

    // User is logged in - load from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('diet, allergies')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;
    return { diet: data.diet, allergies: data.allergies || [] };
  } catch (error) {
    console.error('Load profile error:', error);
    return null;
  }
}

/**
 * Save scan to history (requires auth)
 */
export async function saveScanToHistory(scan: {
  product_name: string;
  detected_language?: string;
  ingredients: any[];
  analysis: any[];
  diet_verdict: any;
  allergens: string[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // User not logged in - skip cloud save, local storage will handle it
      return { success: true };
    }

    const { data, error } = await supabase
      .from('scan_history')
      .insert({
        user_id: user.id,
        product_name: scan.product_name,
        detected_language: scan.detected_language,
        ingredients: scan.ingredients,
        analysis: scan.analysis,
        diet_verdict: scan.diet_verdict,
        allergens: scan.allergens,
      })
      .select('id')
      .single();

    if (error) throw error;
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Save scan error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save scan',
    };
  }
}

/**
 * Load scan history from Supabase (requires auth)
 */
export async function loadScanHistory(limit: number = 50): Promise<ScanHistoryItem[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return []; // No cloud history for anonymous users
    }

    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('user_id', user.id)
      .order('scan_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Load history error:', error);
    return [];
  }
}

/**
 * Delete scan from history
 */
export async function deleteScan(scanId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('scan_history')
      .delete()
      .eq('id', scanId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete scan error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete scan',
    };
  }
}

/**
 * Submit feedback
 */
export async function submitFeedback(feedback: {
  category: string;
  message: string;
  images?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: user?.id || null,
        category: feedback.category,
        message: feedback.message,
        images: feedback.images || [],
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Submit feedback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit feedback',
    };
  }
}

// ================================================================
//  Auth Functions
// ================================================================

/**
 * Sign in with Google (for future use)
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  return { data, error };
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ================================================================
//  Helpers
// ================================================================

/**
 * Generate or retrieve a unique device ID for anonymous users
 */
async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem('@puremark_device_id');

  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
    await AsyncStorage.setItem('@puremark_device_id', deviceId);
  }

  return deviceId;
}

export default supabase;
