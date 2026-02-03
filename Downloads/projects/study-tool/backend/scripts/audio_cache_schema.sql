-- Audio Cache Table for Commute Mode
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "audio_cache" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "topic_id" TEXT NOT NULL,
    "topic_name" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_audio_cache_topic ON audio_cache(topic_id);
CREATE INDEX IF NOT EXISTS idx_audio_cache_hash ON audio_cache(source_hash);
