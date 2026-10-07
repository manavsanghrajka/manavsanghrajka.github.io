-- UK Medical School Dashboard — Supabase Migration
-- Run this in the SQL Editor of your NEW Supabase project

-- ============================================================
-- Table: medical_schools
-- Core table storing all school/course data (~40 rows)
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_schools (
  id TEXT PRIMARY KEY,
  university TEXT NOT NULL,
  course TEXT NOT NULL DEFAULT 'A100 Medicine',
  country TEXT NOT NULL,
  
  -- Tuition
  annual_tuition_home INTEGER DEFAULT 0,
  annual_tuition_intl INTEGER DEFAULT 0,
  total_years INTEGER DEFAULT 5,
  
  -- UCAT data (current 2700 scale)
  ucat_cutoff INTEGER,
  ucat_avg_interview INTEGER,
  ucat_offer_avg INTEGER,
  
  -- Legacy UCAT data (3600 scale, for harmonization)
  legacy_ucat_cutoff INTEGER,
  legacy_ucat_avg_interview INTEGER,
  legacy_ucat_offer_avg INTEGER,
  is_legacy_scale BOOLEAN DEFAULT FALSE,
  
  -- SJT
  min_sjt_band INTEGER DEFAULT 3,
  sjt_band4_reject BOOLEAN DEFAULT TRUE,
  
  -- Admission method
  admission_method TEXT,
  admission_method_tags TEXT[], -- Array of tags
  ucat_weight DECIMAL(3,2) DEFAULT 0.40,
  grades_weight DECIMAL(3,2) DEFAULT 0.30,
  sjt_weight DECIMAL(3,2) DEFAULT 0.05,
  
  -- Interview
  interview_style TEXT DEFAULT 'MMI',
  interview_spots_home INTEGER,
  interview_spots_intl INTEGER,
  offers_given INTEGER,
  interviews_extended INTEGER,
  total_applicants INTEGER,
  
  -- Grade requirements
  grade_req_alevel TEXT,
  grade_req_ossd INTEGER,
  chem_required BOOLEAN DEFAULT TRUE,
  bio_required BOOLEAN DEFAULT TRUE,
  
  -- Sources
  official_url TEXT,
  source_status TEXT DEFAULT 'estimated', -- 'official', 'aggregator', 'estimated'
  
  -- Override controls (V2)
  -- locked_fields TEXT[], -- Fields locked from scraper overwrites
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Table: ucat_percentile_tables
-- Stores percentile distributions for score harmonization
-- ============================================================
CREATE TABLE IF NOT EXISTS ucat_percentile_tables (
  id TEXT PRIMARY KEY, -- 'current_2700' or 'legacy_3600'
  scale_max INTEGER NOT NULL,
  percentile_data JSONB NOT NULL, -- { "percentile": score, ... }
  source TEXT, -- 'UCAT Consortium 2025', etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Table: scraper_logs
-- Audit trail for data scraping/updating
-- ============================================================
CREATE TABLE IF NOT EXISTS scraper_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id TEXT REFERENCES medical_schools(id),
  scraped_at TIMESTAMPTZ DEFAULT now(),
  source_url TEXT,
  fields_updated TEXT[],
  status TEXT DEFAULT 'success', -- 'success', 'partial', 'error'
  error_message TEXT,
  raw_html_excerpt TEXT -- First 500 chars for debugging
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE medical_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE ucat_percentile_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read: medical_schools"
  ON medical_schools FOR SELECT USING (true);

CREATE POLICY "Public read: ucat_percentile_tables"
  ON ucat_percentile_tables FOR SELECT USING (true);

CREATE POLICY "Public read: scraper_logs"
  ON scraper_logs FOR SELECT USING (true);

-- Service role (Edge Functions) can insert/update
-- Note: Service role bypasses RLS by default in Supabase

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_medical_schools_country
  ON medical_schools (country);

CREATE INDEX IF NOT EXISTS idx_medical_schools_source
  ON medical_schools (source_status);

CREATE INDEX IF NOT EXISTS idx_scraper_logs_school
  ON scraper_logs (school_id, scraped_at DESC);

-- ============================================================
-- Seed: Percentile Tables
-- ============================================================
INSERT INTO ucat_percentile_tables (id, scale_max, percentile_data, source)
VALUES (
  'current_2700',
  2700,
  '{
    "1": 1350, "5": 1480, "10": 1580, "15": 1630, "20": 1680,
    "25": 1720, "30": 1760, "35": 1790, "40": 1820, "45": 1850,
    "50": 1880, "55": 1915, "60": 1950, "65": 1980, "70": 2010,
    "75": 2055, "80": 2100, "85": 2150, "90": 2220, "95": 2340,
    "97": 2400, "99": 2520, "100": 2700
  }'::jsonb,
  'UCAT Consortium 2025 Official Deciles (interpolated)'
),
(
  'legacy_3600',
  3600,
  '{
    "1": 1800, "5": 1970, "10": 2100, "15": 2190, "20": 2260,
    "25": 2320, "30": 2370, "35": 2420, "40": 2460, "45": 2500,
    "50": 2530, "55": 2570, "60": 2610, "65": 2650, "70": 2690,
    "75": 2740, "80": 2800, "85": 2860, "90": 2940, "95": 3080,
    "97": 3160, "99": 3310, "100": 3600
  }'::jsonb,
  'Historical UCAT data (2020-2024 composite averages)'
)
ON CONFLICT (id) DO NOTHING;
