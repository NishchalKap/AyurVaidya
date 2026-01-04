/**
 * Supabase Client Configuration
 * 
 * Connects to Supabase for persistent storage.
 * Falls back gracefully if Supabase is unavailable.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
let isConnected = false;

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize Supabase client
 * @returns {object|null} Supabase client or null if not configured
 */
export function initSupabase() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.log('⚠️  Supabase not configured - using JSON fallback only');
        return null;
    }

    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isConnected = true;
        console.log('✅ Supabase client initialized');
        return supabase;
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error.message);
        return null;
    }
}

/**
 * Get Supabase client
 * @returns {object|null}
 */
export function getSupabase() {
    return supabase;
}

/**
 * Check if Supabase is available
 * @returns {boolean}
 */
export function isSupabaseAvailable() {
    return isConnected && supabase !== null;
}

// ============================================
// PATIENT OPERATIONS
// ============================================

/**
 * Save patient to Supabase
 * @param {object} patient - Patient data
 * @returns {Promise<object|null>}
 */
export async function savePatientToSupabase(patient) {
    if (!isSupabaseAvailable()) return null;

    try {
        const { data, error } = await supabase
            .from('patients')
            .upsert({
                id: patient.id,
                full_name: patient.fullName,
                age: patient.age,
                gender: patient.gender,
                phone: patient.phone,
                district: patient.district,
                state: patient.state,
                prakriti: patient.prakriti
            }, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        console.log(`📤 Supabase: Patient ${patient.id} saved`);
        return data;
    } catch (error) {
        console.error('❌ Supabase patient save failed:', error.message);
        return null;
    }
}

// ============================================
// CASE OPERATIONS
// ============================================

/**
 * Save case to Supabase
 * @param {object} caseData - Case data
 * @returns {Promise<object|null>}
 */
export async function saveCaseToSupabase(caseData) {
    if (!isSupabaseAvailable()) return null;

    try {
        // Parse raw notes to extract source
        let source = 'MANUAL';
        try {
            const notes = JSON.parse(caseData.rawNotes || '{}');
            source = notes.source || 'MANUAL';
        } catch (e) { }

        const { data, error } = await supabase
            .from('cases')
            .upsert({
                id: caseData.id,
                patient_id: caseData.patientId,
                status: caseData.status,
                priority: caseData.priority,
                chief_complaint: caseData.chiefComplaint,
                symptom_duration: caseData.symptomDuration,
                raw_notes: caseData.rawNotes,
                vital_signs: caseData.vitalSigns,
                source: source,
                recommendation_id: caseData.recommendationId,
                doctor_notes: caseData.doctorNotes,
                doctor_decision: caseData.doctorDecision
            }, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        console.log(`📤 Supabase: Case ${caseData.id} saved`);
        return data;
    } catch (error) {
        console.error('❌ Supabase case save failed:', error.message);
        return null;
    }
}

// ============================================
// AI SUMMARY OPERATIONS
// ============================================

/**
 * Save AI summary to Supabase
 * @param {object} summary - AI summary data
 * @returns {Promise<object|null>}
 */
export async function saveAISummaryToSupabase(summary) {
    if (!isSupabaseAvailable()) return null;

    try {
        const { data, error } = await supabase
            .from('ai_summaries')
            .upsert({
                id: summary.id,
                case_id: summary.caseId,
                model_version: summary.modelVersion,
                summary: summary.summary,
                risk_flags: summary.riskFlags || [],
                urgency_level: summary.urgencyLevel,
                key_symptoms: summary.keySymptoms || [],
                suggested_follow_up: summary.suggestedFollowUp,
                confidence_score: summary.confidenceScore,
                disclaimer: summary.disclaimer,
                is_ai_generated: true,
                processing_time_ms: summary.processingTimeMs
            }, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        console.log(`📤 Supabase: AI Summary ${summary.id} saved`);
        return data;
    } catch (error) {
        console.error('❌ Supabase AI summary save failed:', error.message);
        return null;
    }
}

/**
 * Get AI summary by case ID from Supabase
 * @param {string} caseId - Case ID
 * @returns {Promise<object|null>}
 */
export async function getAISummaryFromSupabase(caseId) {
    if (!isSupabaseAvailable()) return null;

    try {
        const { data, error } = await supabase
            .from('ai_summaries')
            .select('*')
            .eq('case_id', caseId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('❌ Supabase AI summary fetch failed:', error.message);
        return null;
    }
}

export default {
    initSupabase,
    getSupabase,
    isSupabaseAvailable,
    savePatientToSupabase,
    saveCaseToSupabase,
    saveAISummaryToSupabase,
    getAISummaryFromSupabase
};
