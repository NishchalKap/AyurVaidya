-- Ayurvaidya Supabase Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('M', 'F', 'O')),
  phone TEXT,
  district TEXT,
  state TEXT,
  prakriti TEXT CHECK (prakriti IN ('VATA', 'PITTA', 'KAPHA') OR prakriti IS NULL),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id),
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'REVIEWED', 'CLOSED')),
  priority TEXT DEFAULT 'ROUTINE' CHECK (priority IN ('ROUTINE', 'ELEVATED', 'URGENT')),
  chief_complaint TEXT NOT NULL,
  symptom_duration TEXT,
  raw_notes TEXT,
  vital_signs JSONB,
  source TEXT, -- 'BOOKING_BRIDGE', 'CHAT_BRIDGE', 'MANUAL'
  recommendation_id TEXT,
  doctor_notes TEXT,
  doctor_decision TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI SUMMARIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_summaries (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL,
  summary TEXT NOT NULL,
  risk_flags TEXT[] DEFAULT '{}',
  urgency_level TEXT CHECK (urgency_level IN ('ROUTINE', 'ELEVATED', 'URGENT')),
  key_symptoms TEXT[] DEFAULT '{}',
  suggested_follow_up TEXT,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  disclaimer TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT TRUE,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cases_patient_id ON cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_case_id ON ai_summaries(case_id);

-- ============================================
-- ROW LEVEL SECURITY (Optional for hackathon)
-- ============================================
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view own data" ON patients
--   FOR SELECT USING (auth.uid()::text = id);

-- CREATE POLICY "Users can create cases" ON cases
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
