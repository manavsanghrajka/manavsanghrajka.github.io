-- Migration: Add vibe_persona to existing User table
-- Run this in Supabase SQL Editor if you have existing data

-- Add vibe_persona column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vibe_persona" TEXT DEFAULT 'professional';

-- Add daily_capacity column  
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "daily_capacity" INTEGER DEFAULT 60;

-- Create index for faster persona lookups
CREATE INDEX IF NOT EXISTS idx_user_vibe_persona ON "User"("vibe_persona");

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name IN ('vibe_persona', 'daily_capacity');
