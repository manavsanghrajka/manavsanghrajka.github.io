-- Migration: Add study content columns to Topic table
-- Run this in Supabase SQL Editor

ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "summary" TEXT;
ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "keyPoints" JSONB DEFAULT '[]';
ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "examples" JSONB DEFAULT '[]';
