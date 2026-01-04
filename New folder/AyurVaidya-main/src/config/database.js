/**
 * Ayurvaidya Database Configuration
 * In-memory database with JSON file persistence
 * Hackathon-friendly: No native dependencies required
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../../database/ayurvaidya.json');

// In-memory database
let db = {
    patients: [],
    caseFiles: [],
    recommendations: []
};

/**
 * Load database from file
 */
function loadDatabase() {
    try {
        if (existsSync(DB_PATH)) {
            const data = readFileSync(DB_PATH, 'utf-8');
            db = JSON.parse(data);
            console.log(`📦 Database loaded from: ${DB_PATH}`);
        } else {
            console.log('📦 Starting with empty database');
        }
    } catch (error) {
        console.error('⚠️ Could not load database, starting fresh:', error.message);
        db = { patients: [], caseFiles: [], recommendations: [] };
    }
}

/**
 * Save database to file
 */
function saveDatabase() {
    try {
        writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (error) {
        console.error('⚠️ Could not save database:', error.message);
    }
}

/**
 * Get database reference
 * @returns {object} Database object
 */
export function getDatabase() {
    return db;
}

/**
 * Initialize database
 */
export function initializeDatabase() {
    loadDatabase();
    console.log('✅ Database initialized');
    return true;
}

/**
 * Seed database with sample data
 */
export function seedDatabase() {
    if (db.patients.length > 0) {
        console.log('ℹ️  Database already has data, skipping seed');
        return false;
    }

    // Sample patients
    db.patients = [
        {
            id: 'pat_001',
            full_name: 'Ramesh Kumar',
            age: 45,
            gender: 'M',
            phone: '9876543210',
            district: 'Varanasi',
            state: 'Uttar Pradesh',
            prakriti: 'PITTA',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'pat_002',
            full_name: 'Sunita Devi',
            age: 32,
            gender: 'F',
            phone: '9876543211',
            district: 'Patna',
            state: 'Bihar',
            prakriti: 'VATA',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'pat_003',
            full_name: 'Amit Singh',
            age: 28,
            gender: 'M',
            phone: '9876543212',
            district: 'Jaipur',
            state: 'Rajasthan',
            prakriti: 'KAPHA',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'pat_004',
            full_name: 'Lakshmi Pillai',
            age: 55,
            gender: 'F',
            phone: '9876543213',
            district: 'Kochi',
            state: 'Kerala',
            prakriti: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'pat_005',
            full_name: 'Mohammed Khan',
            age: 40,
            gender: 'M',
            phone: '9876543214',
            district: 'Lucknow',
            state: 'Uttar Pradesh',
            prakriti: 'PITTA',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    // Sample case files
    db.caseFiles = [
        {
            id: 'case_001',
            patient_id: 'pat_001',
            status: 'PENDING_REVIEW',
            priority: 'ROUTINE',
            chief_complaint: 'Burning sensation in stomach after meals',
            symptom_duration: '5 days',
            raw_notes: 'Patient reports acidity, worse at night. No fever. Takes occasional antacids. Diet includes spicy food.',
            vital_signs: JSON.stringify({ temperature: 98.4, bloodPressure: '130/85', pulseRate: 78, weight: 72 }),
            attachments: null,
            structured_summary: null,
            clinical_flags: null,
            recommendation_id: null,
            doctor_notes: null,
            doctor_decision: null,
            reviewed_at: null,
            reviewed_by: null,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'case_002',
            patient_id: 'pat_002',
            status: 'PENDING_REVIEW',
            priority: 'ELEVATED',
            chief_complaint: 'Persistent headache and fatigue',
            symptom_duration: '1 week',
            raw_notes: 'Patient feels tired all day. Headache mostly in the morning. Sleep quality poor. Works long hours at computer.',
            vital_signs: JSON.stringify({ temperature: 98.6, bloodPressure: '110/70', pulseRate: 82, weight: 58 }),
            attachments: null,
            structured_summary: null,
            clinical_flags: null,
            recommendation_id: null,
            doctor_notes: null,
            doctor_decision: null,
            reviewed_at: null,
            reviewed_by: null,
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'case_003',
            patient_id: 'pat_003',
            status: 'DRAFT',
            priority: 'ROUTINE',
            chief_complaint: 'Joint pain in knees',
            symptom_duration: '2 months',
            raw_notes: 'Gradual onset. Worse in cold weather. No swelling visible. Family history of arthritis.',
            vital_signs: JSON.stringify({ temperature: 98.2, bloodPressure: '120/80', pulseRate: 70, weight: 85 }),
            attachments: null,
            structured_summary: null,
            clinical_flags: null,
            recommendation_id: null,
            doctor_notes: null,
            doctor_decision: null,
            reviewed_at: null,
            reviewed_by: null,
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
            id: 'case_004',
            patient_id: 'pat_004',
            status: 'PENDING_REVIEW',
            priority: 'URGENT',
            chief_complaint: 'Severe chest discomfort and shortness of breath',
            symptom_duration: '2 days',
            raw_notes: 'Patient is diabetic. Feels heaviness in chest. Breathlessness on climbing stairs. No radiating pain.',
            vital_signs: JSON.stringify({ temperature: 98.8, bloodPressure: '150/95', pulseRate: 92, weight: 68 }),
            attachments: null,
            structured_summary: null,
            clinical_flags: null,
            recommendation_id: null,
            doctor_notes: null,
            doctor_decision: null,
            reviewed_at: null,
            reviewed_by: null,
            created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
            id: 'case_005',
            patient_id: 'pat_005',
            status: 'REVIEWED',
            priority: 'ROUTINE',
            chief_complaint: 'Recurring cold and cough',
            symptom_duration: '2 weeks',
            raw_notes: 'Seasonal pattern. Mild fever initially, now resolved. Productive cough. No blood in sputum.',
            vital_signs: JSON.stringify({ temperature: 98.6, bloodPressure: '125/82', pulseRate: 76, weight: 75 }),
            attachments: null,
            structured_summary: '40-year-old male presenting with recurring cold and cough for 2 weeks. Seasonal pattern noted. Vital signs within acceptable limits.',
            clinical_flags: JSON.stringify(['seasonal_allergy_possible', 'routine_evaluation']),
            recommendation_id: 'rec_001',
            doctor_notes: 'Patient advised rest and hydration. Follow-up in 1 week if not improved.',
            doctor_decision: 'Symptomatic treatment approved. No antibiotics needed at this stage.',
            reviewed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            reviewed_by: 'Dr. Sample',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'case_006',
            patient_id: 'pat_001',
            status: 'CLOSED',
            priority: 'ROUTINE',
            chief_complaint: 'Mild indigestion',
            symptom_duration: '3 days',
            raw_notes: 'Patient ate street food. No vomiting. Mild discomfort.',
            vital_signs: JSON.stringify({ temperature: 98.4, bloodPressure: '128/84', pulseRate: 76, weight: 72 }),
            attachments: null,
            structured_summary: null,
            clinical_flags: JSON.stringify(['dietary_indiscretion']),
            recommendation_id: null,
            doctor_notes: 'Advised bland diet and hydration.',
            doctor_decision: 'Dietary management only. Case closed.',
            reviewed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            reviewed_by: 'Dr. Sharma',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'case_007',
            patient_id: 'pat_003',
            status: 'CLOSED',
            priority: 'ELEVATED',
            chief_complaint: 'Ankle Sprain',
            symptom_duration: '1 day',
            raw_notes: 'Twisted ankle while walking. Swelling present. Able to bear weight partially.',
            vital_signs: JSON.stringify({ temperature: 98.2, bloodPressure: '120/80', pulseRate: 72, weight: 85 }),
            attachments: null,
            structured_summary: null,
            clinical_flags: null,
            recommendation_id: null,
            doctor_notes: 'RICE protocol explained. X-ray not immediately indicated.',
            doctor_decision: 'Conservative management. Review in 5 days.',
            reviewed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            reviewed_by: 'Dr. Kavita',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'case_008',
            patient_id: 'pat_002',
            status: 'PENDING_REVIEW',
            priority: 'ROUTINE',
            chief_complaint: 'Skin rash on forearm',
            symptom_duration: '2 weeks',
            raw_notes: 'Itchy circular patch. No history of allergies. Using antiseptic cream with no relief.',
            vital_signs: JSON.stringify({ temperature: 98.6, bloodPressure: '110/70', pulseRate: 80, weight: 58 }),
            attachments: null,
            structured_summary: null,
            clinical_flags: null,
            recommendation_id: null,
            doctor_notes: null,
            doctor_decision: null,
            reviewed_at: null,
            reviewed_by: null,
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
    ];

    // Sample recommendation
    db.recommendations = [
        {
            id: 'rec_001',
            case_file_id: 'case_005',
            generated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            ai_model_version: 'stub-v0.1',
            confidence_score: 75,
            allopathy: JSON.stringify({
                approach: 'Symptomatic management with focus on immune support',
                suggestedActions: [
                    'Consider generic antihistamine if allergic component suspected',
                    'Steam inhalation 2-3 times daily',
                    'Adequate hydration (2-3L water daily)',
                    'Rest for 2-3 days if symptoms persist'
                ],
                genericFirst: true,
                referralNeeded: false,
                referralReason: null
            }),
            ayurveda: JSON.stringify({
                constitutionalNote: 'Pitta-Kapha imbalance suspected due to seasonal change',
                dietaryGuidance: [
                    'Warm water with honey and ginger in morning',
                    'Avoid cold drinks and dairy temporarily',
                    'Light, easily digestible meals',
                    'Include turmeric in cooking'
                ],
                lifestyleGuidance: [
                    'Early to bed (before 10 PM)',
                    'Light morning sun exposure for 15 minutes',
                    'Avoid air conditioning'
                ],
                herbSuggestions: [
                    'Tulsi (Holy Basil) tea',
                    'Mulethi (Licorice) if no hypertension',
                    'Giloy for immune support'
                ],
                yogaRecommendations: [
                    'Pranayama: Anulom Vilom (5 minutes)',
                    'Bhastrika (if no breathing difficulty)'
                ]
            }),
            contraindications: JSON.stringify([
                'Avoid Mulethi if patient has high blood pressure',
                'Giloy may affect blood sugar - monitor if diabetic'
            ]),
            red_flags: JSON.stringify([
                'Seek immediate care if fever returns above 101°F',
                'Consult urgently if blood in sputum',
                'Emergency visit if breathing becomes labored'
            ]),
            estimated_cost_range: JSON.stringify({ min: 50, max: 200, currency: 'INR' }),
            disclaimer: `⚠️ GUIDANCE, NOT DIAGNOSIS

This information is generated to assist healthcare providers and does not constitute medical diagnosis, prescription, or treatment. All suggestions require validation by a qualified medical professional. The AI system provides decision support only — final clinical judgment rests with the treating physician.

Generated by Ayurvaidya CDSS v0.1 (Stage 1 - Stub Mode)`,
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
    ];

    saveDatabase();
    console.log('🌱 Database seeded with sample data');
    return true;
}

/**
 * Save current state (call after mutations)
 */
export function persistDatabase() {
    saveDatabase();
}

/**
 * Close database (no-op for JSON storage)
 */
export function closeDatabase() {
    saveDatabase();
    console.log('📦 Database saved and closed');
}

export default {
    getDatabase,
    initializeDatabase,
    seedDatabase,
    persistDatabase,
    closeDatabase
};
