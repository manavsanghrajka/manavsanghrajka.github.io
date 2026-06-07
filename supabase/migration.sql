-- Zen Slicer — Supabase Migration
-- Run this in your Supabase SQL Editor

-- Leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 20),
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow public reads (anyone can view the leaderboard)
CREATE POLICY "Public read access"
  ON leaderboard
  FOR SELECT
  USING (true);

-- Allow anonymous inserts (client-side score submission)
-- Table CHECK constraints enforce: name 1-20 chars, score >= 0
CREATE POLICY "Allow anonymous inserts"
  ON leaderboard
  FOR INSERT
  WITH CHECK (true);

-- No UPDATE or DELETE for anon — scores are immutable once submitted

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_score
  ON leaderboard (score DESC);
