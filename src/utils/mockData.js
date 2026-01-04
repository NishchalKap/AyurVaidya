/**
 * Ayurvaidya Mock Data
 * Mock AI responses for Stage 1 (stubs)
 * 
 * LOCKED CONTRACT VERSION:
 * - All outputs strictly match RecommendationSchema
 * - Deterministic placeholders (not random text)
 * - Frontend can safely integrate
 */

import { STANDARD_DISCLAIMER, CasePriority, Prakriti } from './constants.js';
import { enforceDisclaimer, wrapAIOutput } from './safety.js';

// ============================================
// LOCKED MOCK DATA TEMPLATES
// ============================================

/**
 * Fixed approach templates by complaint category
 * Ensures consistent output for testing
 */
const APPROACH_TEMPLATES = {
    gastric: 'Symptomatic management for gastrointestinal discomfort with dietary modifications recommended',
    respiratory: 'Supportive care for respiratory symptoms with monitoring advised',
    pain: 'Conservative pain management approach with activity modification recommended',
    fatigue: 'Comprehensive evaluation for fatigue with lifestyle assessment recommended',
    cardiac: 'Urgent evaluation recommended - cardiac symptoms require immediate attention',
    default: 'Standard protocol evaluation and symptomatic management recommended'
};

/**
 * Fixed action sets by category
 */
const ACTION_TEMPLATES = {
    gastric: [
        'Adequate hydration (2-3L water daily)',
        'Avoid spicy, fried, and acidic foods for 1 week',
        'Small, frequent meals instead of large meals',
        'Avoid lying down for 2 hours after eating',
        'Monitor symptoms for 48-72 hours'
    ],
    respiratory: [
        'Adequate hydration (2-3L water daily)',
        'Steam inhalation 2-3 times daily',
        'Rest and avoid strenuous activity',
        'Avoid cold drinks and cold environments',
        'Monitor temperature twice daily'
    ],
    pain: [
        'Rest the affected area appropriately',
        'Apply warm/cold compress as advised',
        'Gentle stretching if tolerable',
        'Maintain good posture',
        'Consider OTC pain relief if needed'
    ],
    fatigue: [
        'Ensure 7-8 hours of quality sleep',
        'Regular meal times with balanced nutrition',
        'Light exercise (15-20 min walking)',
        'Reduce caffeine intake',
        'Consider blood work if symptoms persist'
    ],
    default: [
        'Adequate hydration (2-3L water daily)',
        'Rest and stress reduction',
        'Monitor symptoms for 48-72 hours',
        'Maintain healthy diet',
        'Schedule follow-up if symptoms persist beyond 1 week'
    ]
};

/**
 * Fixed constitutional notes by Prakriti
 */
const CONSTITUTIONAL_NOTES = {
    [Prakriti.VATA]: 'Vata imbalance indicated - focus on grounding, warming, and routine-based practices',
    [Prakriti.PITTA]: 'Pitta aggravation suspected - cooling, calming, and moderation recommended',
    [Prakriti.KAPHA]: 'Kapha accumulation indicated - stimulating, lightening, and activating approach suggested',
    default: 'Constitutional assessment pending - general balancing approach with seasonal awareness recommended'
};

/**
 * Fixed dietary guidance templates
 */
const DIETARY_TEMPLATES = {
    [Prakriti.VATA]: [
        'Prefer warm, cooked, and moist foods',
        'Include healthy fats (ghee, sesame oil)',
        'Avoid raw, cold, and dry foods',
        'Regular meal times are essential',
        'Warm milk with spices before bed'
    ],
    [Prakriti.PITTA]: [
        'Prefer cooling foods (cucumber, coconut, milk)',
        'Avoid spicy, sour, and fermented foods',
        'Include sweet, bitter, and astringent tastes',
        'Moderate salt intake',
        'Avoid skipping meals'
    ],
    [Prakriti.KAPHA]: [
        'Prefer light, warm, and dry foods',
        'Include pungent, bitter, and astringent tastes',
        'Avoid heavy, oily, and sweet foods',
        'Skip breakfast if not hungry',
        'Ginger tea before meals'
    ],
    default: [
        'Prefer freshly cooked, warm meals',
        'Include seasonal vegetables in diet',
        'Reduce processed and packaged foods',
        'Adequate water intake between meals',
        'Light dinner at least 2 hours before sleep'
    ]
};

/**
 * Fixed lifestyle guidance templates
 */
const LIFESTYLE_TEMPLATES = {
    [Prakriti.VATA]: [
        'Maintain regular daily routine',
        'Warm oil self-massage (Abhyanga) before bath',
        'Avoid excessive travel and stimulation',
        'Early to bed (by 10 PM)',
        'Gentle, grounding yoga practices'
    ],
    [Prakriti.PITTA]: [
        'Avoid excessive heat and direct sun',
        'Cool shower or swimming recommended',
        'Moderate exercise, avoid overexertion',
        'Moonlight walks in evening',
        'Practice patience and cooling pranayama'
    ],
    [Prakriti.KAPHA]: [
        'Rise early (before 6 AM)',
        'Vigorous exercise recommended',
        'Dry brushing before shower',
        'Avoid daytime napping',
        'Engage in stimulating activities'
    ],
    default: [
        'Maintain regular sleep schedule (10 PM - 6 AM ideal)',
        'Morning sunlight exposure for 15-20 minutes',
        'Gentle walking for 20-30 minutes daily',
        'Reduce screen time 1 hour before bed',
        'Practice 5 minutes of deep breathing daily'
    ]
};

/**
 * Fixed herb suggestions
 */
const HERB_TEMPLATES = {
    gastric: [
        'Shatavari - digestive soothing',
        'Triphala - digestive regulation',
        'Mulethi (Licorice) - if no hypertension',
        'Jeera (Cumin) water - daily consumption'
    ],
    respiratory: [
        'Tulsi (Holy Basil) - respiratory support',
        'Ginger-honey combination - throat soothing',
        'Mulethi (Licorice) - if no hypertension',
        'Pippali - respiratory clearing'
    ],
    default: [
        'Tulsi (Holy Basil) - general immunity',
        'Ashwagandha - stress adaptation (consult if on medications)',
        'Triphala - digestive health',
        'Amla - vitamin C and rejuvenation'
    ]
};

/**
 * Fixed yoga recommendations
 */
const YOGA_TEMPLATES = [
    'Pranayama: Anulom Vilom (alternate nostril breathing) - 5 minutes',
    'Gentle stretching upon waking',
    'Shavasana (corpse pose) for relaxation - 10 minutes before sleep'
];

/**
 * Fixed red flags by priority
 */
const RED_FLAG_TEMPLATES = {
    [CasePriority.URGENT]: [
        '🚨 URGENT: Immediate medical evaluation strongly recommended',
        'Seek emergency care if symptoms worsen suddenly',
        'Do not delay - consult healthcare provider immediately',
        'If chest pain occurs, call emergency services'
    ],
    [CasePriority.ELEVATED]: [
        'Monitor closely - seek care if symptoms worsen',
        'Consult within 24 hours if no improvement',
        'Emergency visit if difficulty breathing develops',
        'Seek immediate care if high fever (>103°F) occurs'
    ],
    default: [
        'Seek care if symptoms worsen significantly',
        'Consult if symptoms persist beyond 1 week',
        'Emergency visit if difficulty breathing develops',
        'Seek immediate care if high fever (>103°F) occurs'
    ]
};

/**
 * Fixed contraindications
 */
const CONTRAINDICATION_TEMPLATES = [
    'Consult physician before use if pregnant or nursing',
    'Discontinue if allergic reaction occurs',
    'Inform doctor of all current medications',
    'Not a substitute for professional medical advice'
];

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Determine complaint category
 * @param {string} complaint - Chief complaint
 * @returns {string} Category key
 */
function getComplaintCategory(complaint = '') {
    const lower = complaint.toLowerCase();

    if (lower.includes('stomach') || lower.includes('digest') || lower.includes('acid') || lower.includes('gastric')) {
        return 'gastric';
    }
    if (lower.includes('cough') || lower.includes('cold') || lower.includes('breath') || lower.includes('respiratory')) {
        return 'respiratory';
    }
    if (lower.includes('pain') || lower.includes('ache')) {
        return 'pain';
    }
    if (lower.includes('fatigue') || lower.includes('tired') || lower.includes('weakness')) {
        return 'fatigue';
    }
    if (lower.includes('chest') || lower.includes('heart')) {
        return 'cardiac';
    }

    return 'default';
}

/**
 * Generate a mock recommendation for a case
 * LOCKED CONTRACT: Output matches RecommendationSchema exactly
 * 
 * @param {string} caseId - The case ID
 * @param {object} caseData - The case data (for context-aware mocks)
 * @returns {object} Mock recommendation object
 */
export function getMockRecommendation(caseId, caseData = {}) {
    const timestamp = new Date().toISOString();
    const category = getComplaintCategory(caseData.chiefComplaint);
    const prakriti = caseData.prakriti || 'default';
    const priority = caseData.priority || CasePriority.ROUTINE;

    // Generate deterministic confidence based on category
    const confidenceMap = {
        gastric: 78,
        respiratory: 75,
        pain: 72,
        fatigue: 70,
        cardiac: 65, // Lower for serious conditions
        default: 74
    };

    const recommendation = {
        id: `rec_${caseId.replace('case_', '')}`,
        caseFileId: caseId,
        generatedAt: timestamp,
        aiModelVersion: 'stub-v0.1',
        confidenceScore: confidenceMap[category],

        allopathy: {
            approach: APPROACH_TEMPLATES[category] || APPROACH_TEMPLATES.default,
            suggestedActions: ACTION_TEMPLATES[category] || ACTION_TEMPLATES.default,
            genericFirst: true,
            referralNeeded: priority === CasePriority.URGENT || category === 'cardiac',
            referralReason: priority === CasePriority.URGENT
                ? 'Elevated symptoms require specialist evaluation'
                : category === 'cardiac'
                    ? 'Cardiac symptoms require specialist evaluation'
                    : null
        },

        ayurveda: {
            constitutionalNote: CONSTITUTIONAL_NOTES[prakriti] || CONSTITUTIONAL_NOTES.default,
            dietaryGuidance: DIETARY_TEMPLATES[prakriti] || DIETARY_TEMPLATES.default,
            lifestyleGuidance: LIFESTYLE_TEMPLATES[prakriti] || LIFESTYLE_TEMPLATES.default,
            herbSuggestions: HERB_TEMPLATES[category] || HERB_TEMPLATES.default,
            yogaRecommendations: YOGA_TEMPLATES
        },

        contraindications: CONTRAINDICATION_TEMPLATES,

        redFlags: RED_FLAG_TEMPLATES[priority] || RED_FLAG_TEMPLATES.default,

        estimatedCostRange: {
            min: 100,
            max: 500,
            currency: 'INR'
        },

        disclaimer: STANDARD_DISCLAIMER
    };

    // Ensure disclaimer is always present
    return enforceDisclaimer(recommendation);
}

/**
 * Generate mock structured summary for a case
 * LOCKED FORMAT: Consistent structure for frontend parsing
 */
export function getMockStructuredSummary(caseData) {
    const age = caseData.patientAge || 'Unknown age';
    const gender = caseData.patientGender === 'M' ? 'male' :
        caseData.patientGender === 'F' ? 'female' : 'patient';
    const duration = caseData.symptomDuration || 'unspecified duration';
    const complaint = caseData.chiefComplaint || 'unspecified complaint';

    return `${age}-year-old ${gender} presenting with ${complaint.toLowerCase()} for ${duration}. ` +
        `Vital signs within acceptable limits. No immediate red flags identified from initial assessment. ` +
        `Recommend standard evaluation per clinical protocol.`;
}

/**
 * Generate mock clinical flags based on complaint
 * LOCKED FORMAT: Consistent flag names for frontend
 */
export function getMockClinicalFlags(chiefComplaint = '') {
    const category = getComplaintCategory(chiefComplaint);

    const flagMap = {
        gastric: ['gi_evaluation_needed', 'dietary_assessment_recommended'],
        respiratory: ['respiratory_monitoring', 'infection_screening_suggested'],
        pain: ['pain_management_needed', 'mobility_assessment'],
        fatigue: ['metabolic_screening_suggested', 'sleep_assessment_needed'],
        cardiac: ['cardiac_evaluation_recommended', 'urgent_attention_required'],
        default: ['routine_evaluation', 'standard_workup']
    };

    return flagMap[category] || flagMap.default;
}

/**
 * Simulate AI processing delay
 * FIXED DELAY: Predictable for testing
 * @returns {Promise} Resolves after simulated delay
 */
export function simulateAIDelay() {
    const delay = 800; // Fixed 800ms for predictable testing
    return new Promise(resolve => setTimeout(resolve, delay));
}

// ============================================
// EXPORTS
// ============================================

export default {
    getMockRecommendation,
    getMockStructuredSummary,
    getMockClinicalFlags,
    simulateAIDelay
};
