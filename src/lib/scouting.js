import { supabase } from './supabase';

// Get scouting data for a team at an event
export async function getScoutingData(teamNumber, competitionKey) {
  const { data, error } = await supabase
    .from('scouting_data')
    .select('*')
    .eq('team_number', teamNumber)
    .eq('competition_key', competitionKey)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching scouting data:', error);
    return null;
  }
  return data;
}

// Get all scouting data for an event
export async function getEventScoutingData(competitionKey) {
  const { data, error } = await supabase
    .from('scouting_data')
    .select('*')
    .eq('competition_key', competitionKey);
  
  if (error) {
    console.error('Error fetching event scouting data:', error);
    return [];
  }
  return data || [];
}

// Upsert (insert or update) scouting data
export async function upsertScoutingData(scoutingData) {
  const { data, error } = await supabase
    .from('scouting_data')
    .upsert(scoutingData, {
      onConflict: 'team_number,competition_key',
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error upserting scouting data:', error);
    throw error;
  }
  return data;
}

// Shooter type options
export const SHOOTER_TYPES = [
  'Fixed - Single',
  'Fixed - Twin',
  'Fixed - Triple/Wide',
  'Turret - Single',
  'Turret - Twin',
];

// Climb options
export const CLIMB_OPTIONS = ['L1', 'L2', 'L3', 'N/A'];
