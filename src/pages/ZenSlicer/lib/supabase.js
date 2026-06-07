import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'YOUR_FULL_ANON_KEY_HERE')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Fetch top 20 leaderboard scores
export async function fetchLeaderboard() {
  if (!supabase) {
    console.warn('Supabase not configured — leaderboard unavailable');
    return [];
  }

  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, player_name, score, created_at')
    .order('score', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Leaderboard fetch error:', error);
    return [];
  }

  return data || [];
}

// Submit score via direct insert with client-side validation
export async function submitScore(playerName, gameStats) {
  if (!supabase) {
    console.warn('Supabase not configured — score submission unavailable');
    return { success: false, error: 'Supabase not configured' };
  }

  // --- Client-side anti-cheat validation ---
  const name = playerName.trim().substring(0, 20);
  if (!name || name.length === 0) {
    return { success: false, error: 'Invalid player name' };
  }

  const { score, fruitsSpawned, fruitsSliced, elapsedTime } = gameStats;

  if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
    return { success: false, error: 'Invalid score' };
  }

  // Can't slice more than what spawned
  if (fruitsSliced > fruitsSpawned) {
    return { success: false, error: 'Invalid game stats' };
  }

  // Game must be at least 2s
  if (elapsedTime < 2) {
    return { success: false, error: 'Invalid game duration' };
  }

  // Score rate sanity check
  const scoreRate = score / Math.max(1, elapsedTime);
  if (scoreRate > 5) {
    return { success: false, error: 'Score rate too high' };
  }

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert({
        player_name: name,
        score: score,
      })
      .select()
      .single();

    if (error) {
      console.error('Score submit error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Score submit error:', err);
    return { success: false, error: err.message };
  }
}

// Check if Supabase is configured
export function isSupabaseConfigured() {
  return supabase !== null;
}
