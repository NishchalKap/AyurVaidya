/**
 * Ayurvaidya Safety & Compliance Utilities
 * Enforces "Guidance, Not Diagnosis" at the system level
 */

import { STANDARD_DISCLAIMER, CasePriority } from './constants.js';

// ============================================
// PROHIBITED TERMS
// Terms that indicate diagnosis/prescription
// ============================================

export const PROHIBITED_DIAGNOSIS_TERMS = [
    // Definitive diagnosis language
    'you have',
    'diagnosed with',
    'diagnosis is',
    'diagnosis:',
    'confirmed',
    'definitely',
    'certainly',
    'you are suffering from',
    'patient has',

    // Prescription language
    'prescribe',
    'prescription',
    'take this medicine',
    'take this medication',
    'dosage:',
    'mg twice daily',
    'mg once daily',
    'tablets daily',
    'must take',
    'should take'
];

export const PROHIBITED_MEDICAL_CLAIMS = [
    'will cure',
    'guaranteed to',
    'proven to cure',
    'will heal',
    'miracle',
    '100% effective',
    'no side effects'
];

// ============================================
// CASE STATUS TRANSITION RULES
// ============================================

/**
 * Valid status transitions for CaseFile
 * Key: current status, Value: array of allowed next statuses
 */
export const STATUS_TRANSITIONS = {
    'DRAFT': ['PENDING_REVIEW'],
    'PENDING_REVIEW': ['REVIEWED', 'DRAFT'],  // Can go back to draft if needs revision
    'REVIEWED': ['CLOSED', 'PENDING_REVIEW'], // Can reopen for additional review
    'CLOSED': []  // Terminal state - no transitions allowed
};

/**
 * Check if a status transition is valid
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} True if transition is allowed
 */
export function isValidStatusTransition(fromStatus, toStatus) {
    const allowedTransitions = STATUS_TRANSITIONS[fromStatus];
    if (!allowedTransitions) return false;
    return allowedTransitions.includes(toStatus);
}

/**
 * Get allowed next statuses for a given status
 * @param {string} currentStatus - Current status
 * @returns {string[]} Array of allowed next statuses
 */
export function getAllowedTransitions(currentStatus) {
    return STATUS_TRANSITIONS[currentStatus] || [];
}

// ============================================
// FIELD EDITABILITY RULES
// ============================================

/**
 * Fields that can never be modified after creation
 */
export const IMMUTABLE_FIELDS = [
    'id',
    'patientId',
    'createdAt'
];

/**
 * Fields that are system-managed (not editable by API)
 */
export const SYSTEM_MANAGED_FIELDS = [
    'updatedAt',
    'structuredSummary',      // AI-generated
    'clinicalFlags',          // AI-generated
    'recommendationId'        // Set by AI processing
];

/**
 * Fields editable only before review
 */
export const PRE_REVIEW_ONLY_FIELDS = [
    'chiefComplaint',
    'symptomDuration',
    'rawNotes',
    'vitalSigns',
    'attachments'
];

/**
 * Fields editable only by doctor (during/after review)
 */
export const DOCTOR_ONLY_FIELDS = [
    'doctorNotes',
    'doctorDecision',
    'reviewedBy'
];

/**
 * Check if a field is editable given the case status
 * @param {string} fieldName - Field to check
 * @param {string} caseStatus - Current case status
 * @returns {{editable: boolean, reason: string}}
 */
export function isFieldEditable(fieldName, caseStatus) {
    // Immutable fields are never editable
    if (IMMUTABLE_FIELDS.includes(fieldName)) {
        return { editable: false, reason: 'Field is immutable after creation' };
    }

    // System managed fields cannot be edited via API
    if (SYSTEM_MANAGED_FIELDS.includes(fieldName)) {
        return { editable: false, reason: 'Field is managed by the system' };
    }

    // Pre-review fields can only be edited in DRAFT status
    if (PRE_REVIEW_ONLY_FIELDS.includes(fieldName)) {
        if (caseStatus === 'DRAFT') {
            return { editable: true, reason: 'Editable in draft status' };
        }
        return { editable: false, reason: 'Field is locked after submission for review' };
    }

    // Doctor fields are editable after submission
    if (DOCTOR_ONLY_FIELDS.includes(fieldName)) {
        if (caseStatus === 'DRAFT') {
            return { editable: false, reason: 'Doctor fields not available in draft' };
        }
        if (caseStatus === 'CLOSED') {
            return { editable: false, reason: 'Case is closed' };
        }
        return { editable: true, reason: 'Doctor can edit this field' };
    }

    // Priority is always editable (for escalation) except when closed
    if (fieldName === 'priority') {
        if (caseStatus === 'CLOSED') {
            return { editable: false, reason: 'Case is closed' };
        }
        return { editable: true, reason: 'Priority can always be adjusted' };
    }

    return { editable: false, reason: 'Unknown field' };
}

// ============================================
// CONTENT SAFETY VALIDATION
// ============================================

/**
 * Check text for prohibited diagnosis/prescription language
 * @param {string} text - Text to check
 * @returns {{safe: boolean, violations: string[]}}
 */
export function validateContentSafety(text) {
    if (!text || typeof text !== 'string') {
        return { safe: true, violations: [] };
    }

    const lowerText = text.toLowerCase();
    const violations = [];

    for (const term of PROHIBITED_DIAGNOSIS_TERMS) {
        if (lowerText.includes(term.toLowerCase())) {
            violations.push(`Contains prohibited term: "${term}"`);
        }
    }

    for (const claim of PROHIBITED_MEDICAL_CLAIMS) {
        if (lowerText.includes(claim.toLowerCase())) {
            violations.push(`Contains prohibited claim: "${claim}"`);
        }
    }

    return {
        safe: violations.length === 0,
        violations
    };
}

/**
 * Sanitize text by removing potentially harmful content
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeInput(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }

    // Remove HTML tags
    let sanitized = text.replace(/<[^>]*>/g, '');

    // Remove script content
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Trim excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
}

// ============================================
// EMERGENCY ESCALATION
// ============================================

/**
 * Emergency keywords that trigger automatic escalation
 */
export const EMERGENCY_KEYWORDS = [
    'chest pain',
    'difficulty breathing',
    'unconscious',
    'severe bleeding',
    'stroke',
    'heart attack',
    'seizure',
    'suicide',
    'self-harm',
    'poisoning',
    'allergic reaction',
    'anaphylaxis'
];

/**
 * Check if case content indicates emergency
 * @param {string} text - Text to check (chief complaint, notes)
 * @returns {{isEmergency: boolean, triggers: string[], recommendedAction: string}}
 */
export function checkEmergencyEscalation(text) {
    if (!text || typeof text !== 'string') {
        return { isEmergency: false, triggers: [], recommendedAction: null };
    }

    const lowerText = text.toLowerCase();
    const triggers = [];

    for (const keyword of EMERGENCY_KEYWORDS) {
        if (lowerText.includes(keyword.toLowerCase())) {
            triggers.push(keyword);
        }
    }

    if (triggers.length > 0) {
        return {
            isEmergency: true,
            triggers,
            recommendedAction: 'IMMEDIATE_ESCALATION',
            message: '⚠️ EMERGENCY INDICATORS DETECTED. This case should be flagged as URGENT and reviewed immediately.'
        };
    }

    return { isEmergency: false, triggers: [], recommendedAction: null };
}

/**
 * Determine recommended priority based on content
 * @param {string} chiefComplaint - Chief complaint text
 * @param {string} currentPriority - Current priority
 * @returns {{suggestedPriority: string, reason: string, isEscalation: boolean}}
 */
export function suggestPriority(chiefComplaint, currentPriority = 'ROUTINE') {
    const emergency = checkEmergencyEscalation(chiefComplaint);

    if (emergency.isEmergency) {
        return {
            suggestedPriority: CasePriority.URGENT,
            reason: `Emergency keywords detected: ${emergency.triggers.join(', ')}`,
            isEscalation: currentPriority !== CasePriority.URGENT
        };
    }

    return {
        suggestedPriority: currentPriority,
        reason: 'No emergency indicators detected',
        isEscalation: false
    };
}

// ============================================
// DISCLAIMER ENFORCEMENT
// ============================================

/**
 * Ensure recommendation always has disclaimer
 * @param {object} recommendation - Recommendation object
 * @returns {object} Recommendation with guaranteed disclaimer
 */
export function enforceDisclaimer(recommendation) {
    if (!recommendation) return recommendation;

    return {
        ...recommendation,
        disclaimer: STANDARD_DISCLAIMER,
        _disclaimerEnforced: true,
        _generatedAt: new Date().toISOString()
    };
}

/**
 * Wrap any AI output with safety metadata
 * @param {object} output - AI output object
 * @returns {object} Output with safety wrapper
 */
export function wrapAIOutput(output) {
    return {
        ...output,
        _meta: {
            isAIGenerated: true,
            mode: 'STUB', // Will be 'LIVE' after AI integration
            version: 'stub-v0.1',
            timestamp: new Date().toISOString(),
            disclaimer: 'GUIDANCE_NOT_DIAGNOSIS'
        }
    };
}

// ============================================
// EXPORTS
// ============================================

export default {
    // Status transitions
    STATUS_TRANSITIONS,
    isValidStatusTransition,
    getAllowedTransitions,

    // Field editability
    IMMUTABLE_FIELDS,
    SYSTEM_MANAGED_FIELDS,
    PRE_REVIEW_ONLY_FIELDS,
    DOCTOR_ONLY_FIELDS,
    isFieldEditable,

    // Content safety
    PROHIBITED_DIAGNOSIS_TERMS,
    PROHIBITED_MEDICAL_CLAIMS,
    validateContentSafety,
    sanitizeInput,

    // Emergency
    EMERGENCY_KEYWORDS,
    checkEmergencyEscalation,
    suggestPriority,

    // Disclaimer
    enforceDisclaimer,
    wrapAIOutput
};
