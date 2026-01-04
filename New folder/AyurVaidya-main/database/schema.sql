-- Ayurvaidya Database Schema
-- SQLite Database for Stage 1

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- PATIENTS TABLE
-- Demographic identity only, no medical history
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    gender TEXT NOT NULL CHECK (gender IN ('M', 'F', 'O')),
    phone TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    prakriti TEXT CHECK (prakriti IN ('VATA', 'PITTA', 'KAPHA', NULL)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- CASE FILES TABLE
-- Central object - one healthcare interaction
-- ============================================
CREATE TABLE IF NOT EXISTS case_files (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'DRAFT' 
        CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'REVIEWED', 'CLOSED')),
    priority TEXT NOT NULL DEFAULT 'ROUTINE'
        CHECK (priority IN ('ROUTINE', 'ELEVATED', 'URGENT')),
    
    -- Input data (messy, unstructured)
    chief_complaint TEXT NOT NULL,
    symptom_duration TEXT,
    raw_notes TEXT,
    
    -- Vital signs (JSON stored as TEXT)
    vital_signs TEXT, -- JSON: {temperature, bloodPressure, pulseRate, weight}
    
    -- Attachments (JSON stored as TEXT)
    attachments TEXT, -- JSON array: [{type, description, url}]
    
    -- AI-structured output (populated by AI service later)
    structured_summary TEXT,
    clinical_flags TEXT, -- JSON array: ["flag1", "flag2"]
    
    -- Recommendation reference
    recommendation_id TEXT,
    
    -- Doctor review
    doctor_notes TEXT,
    doctor_decision TEXT,
    reviewed_at TEXT,
    reviewed_by TEXT,
    
    -- Audit trail
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- RECOMMENDATIONS TABLE
-- AI-generated guidance (placeholder structure)
-- ============================================
CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    case_file_id TEXT NOT NULL REFERENCES case_files(id) ON DELETE CASCADE,
    
    -- Generation metadata
    generated_at TEXT NOT NULL DEFAULT (datetime('now')),
    ai_model_version TEXT NOT NULL DEFAULT 'stub-v0.1',
    confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Allopathy track (JSON stored as TEXT)
    allopathy TEXT NOT NULL, 
    -- JSON: {approach, suggestedActions[], genericFirst, referralNeeded, referralReason}
    
    -- Ayurveda track (JSON stored as TEXT)
    ayurveda TEXT NOT NULL,
    -- JSON: {constitutionalNote, dietaryGuidance[], lifestyleGuidance[], herbSuggestions[], yogaRecommendations[]}
    
    -- Safety layer (JSON arrays stored as TEXT)
    contraindications TEXT, -- JSON array
    red_flags TEXT, -- JSON array
    
    -- Cost optimization (JSON stored as TEXT)
    estimated_cost_range TEXT, -- JSON: {min, max, currency}
    
    -- Disclaimer
    disclaimer TEXT NOT NULL,
    
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_case_files_patient ON case_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_case_files_status ON case_files(status);
CREATE INDEX IF NOT EXISTS idx_case_files_priority ON case_files(priority);
CREATE INDEX IF NOT EXISTS idx_recommendations_case ON recommendations(case_file_id);

-- ============================================
-- TRIGGERS
-- Auto-update updated_at on changes
-- ============================================
CREATE TRIGGER IF NOT EXISTS update_patient_timestamp 
    AFTER UPDATE ON patients
BEGIN
    UPDATE patients SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_case_file_timestamp 
    AFTER UPDATE ON case_files
BEGIN
    UPDATE case_files SET updated_at = datetime('now') WHERE id = NEW.id;
END;
