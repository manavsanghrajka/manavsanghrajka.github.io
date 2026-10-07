/**
 * Supabase client for the Medical School Dashboard
 * 
 * Uses a SEPARATE Supabase project from the main website.
 * Env vars: VITE_MEDSCHOOL_SUPABASE_URL, VITE_MEDSCHOOL_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_MEDSCHOOL_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_MEDSCHOOL_SUPABASE_ANON_KEY;

// Only create client if credentials are configured
export const medschoolSupabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Check if the Supabase backend is configured.
 */
export function isBackendConfigured() {
  return medschoolSupabase !== null;
}

/**
 * Fetch all medical school data from Supabase.
 * Returns null if backend is not configured (falls back to local data).
 */
export async function fetchSchoolsFromDb() {
  if (!medschoolSupabase) return null;
  
  try {
    const { data, error } = await medschoolSupabase
      .from('medical_schools')
      .select('*')
      .order('university', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Failed to fetch from Supabase, using local data:', err.message);
    return null;
  }
}
