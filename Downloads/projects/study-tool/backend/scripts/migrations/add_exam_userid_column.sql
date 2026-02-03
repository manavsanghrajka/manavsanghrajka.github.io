-- Migration: Add userId column to Exam table for private vs global visibility
-- Run this in Supabase SQL Editor

-- Add the userId column
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE;

-- Drop the old unique constraint on name only
ALTER TABLE "Exam" DROP CONSTRAINT IF EXISTS "Exam_name_key";

-- Add new unique constraint: same name allowed for different users
-- For global courses (userId IS NULL), we need a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS "Exam_userId_name_unique" 
ON "Exam" ("userId", "name") 
WHERE "userId" IS NOT NULL;

-- For global courses (userId IS NULL), name must still be unique
CREATE UNIQUE INDEX IF NOT EXISTS "Exam_global_name_unique" 
ON "Exam" ("name") 
WHERE "userId" IS NULL;
