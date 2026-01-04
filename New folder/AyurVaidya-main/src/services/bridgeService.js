/**
 * Bridge Service
 * Connects marketing frontend actions to clinical CDSS core
 * 
 * This service silently creates CaseFiles from:
 * - Bookings (with doctor context)
 * - Chat messages (with inferred symptoms)
 * 
 * It then runs the AI pipeline asynchronously.
 */

import { v4 as uuidv4 } from 'uuid';
import * as CaseFile from '../models/CaseFile.js';
import * as Patient from '../models/Patient.js';
import * as aiService from './aiService.js';
import {
    checkEmergencyEscalation,
    validateContentSafety,
    sanitizeInput,
    EMERGENCY_KEYWORDS
} from '../utils/safety.js';
import { CaseStatus, CasePriority, STANDARD_DISCLAIMER } from '../utils/constants.js';
import { getDoctorById } from '../models/Doctor.js';

// ============================================
// SYMPTOM INFERENCE
// ============================================

/**
 * Symptom keywords mapped to clinical categories
 */
const SYMPTOM_KEYWORDS = {
    gastric: ['stomach', 'digestion', 'gas', 'acidity', 'heartburn', 'nausea', 'vomiting'],
    respiratory: ['cough', 'cold', 'breathing', 'congestion', 'throat', 'fever'],
    cardiac: ['heart', 'chest', 'bp', 'pressure', 'palpitations'],
    stress: ['stress', 'anxiety', 'sleep', 'insomnia', 'tension', 'fatigue'],
    pain: ['pain', 'ache', 'headache', 'backache', 'joint'],
    skin: ['skin', 'rash', 'allergy', 'itching', 'acne']
};

/**
 * Infer clinical intent from chat message
 * @param {string} message - User's chat message
 * @returns {{category: string, symptoms: string[], confidence: number}}
 */
export function inferIntent(message) {
    if (!message) return { category: 'general', symptoms: [], confidence: 0 };

    const lowerMessage = message.toLowerCase();
    const detectedSymptoms = [];
    let primaryCategory = 'general';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(SYMPTOM_KEYWORDS)) {
        const matches = keywords.filter(kw => lowerMessage.includes(kw));
        if (matches.length > maxMatches) {
            maxMatches = matches.length;
            primaryCategory = category;
        }
        detectedSymptoms.push(...matches);
    }

    return {
        category: primaryCategory,
        symptoms: [...new Set(detectedSymptoms)],
        confidence: Math.min(100, detectedSymptoms.length * 25)
    };
}

/**
 * Generate chief complaint from intent
 */
function generateChiefComplaint(intent, originalMessage) {
    if (intent.symptoms.length === 0) {
        return `General health inquiry: ${originalMessage.substring(0, 100)}`;
    }
    return `Patient reports: ${intent.symptoms.join(', ')}`;
}

// ============================================
// SHADOW PATIENT CREATION
// ============================================

/**
 * Create or retrieve a guest patient for bridge cases
 * @returns {object} Patient record
 */
function getOrCreateGuestPatient() {
    const guestId = 'guest_bridge';
    let patient = Patient.getPatientById(guestId);

    if (!patient) {
        patient = Patient.createPatient({
            id: guestId,
            fullName: 'Bridge Guest User',
            age: 30,
            gender: 'O',
            phone: '0000000000',
            district: 'Online',
            state: 'Digital',
            prakriti: null
        });
    }

    return patient;
}

// ============================================
// SHADOW CASE CREATION
// ============================================

/**
 * Create a CaseFile from a booking
 * @param {object} bookingData - Booking details
 * @returns {object} Created case (or null if failed)
 */
export async function createCaseFromBooking(bookingData) {
    try {
        const patient = getOrCreateGuestPatient();
        const doctor = getDoctorById(bookingData.doctorId);

        const chiefComplaint = doctor
            ? `Consultation booking with ${doctor.name} (${doctor.specialty})`
            : 'General consultation booking';

        const caseData = {
            patientId: patient.id,
            chiefComplaint: chiefComplaint,
            symptomDuration: 'Pending consultation',
            rawNotes: JSON.stringify({
                source: 'BOOKING_BRIDGE',
                bookingId: bookingData.id,
                doctorId: bookingData.doctorId,
                scheduledDate: bookingData.date,
                scheduledTime: bookingData.time,
                consultationType: bookingData.type
            }),
            priority: CasePriority.ROUTINE
        };

        const caseFile = CaseFile.createCaseFile(caseData);

        // Auto-submit for review
        CaseFile.submitCaseForReview(caseFile.id);

        // Trigger AI pipeline asynchronously
        setImmediate(() => triggerClinicalPipeline(caseFile.id));

        return caseFile;
    } catch (error) {
        console.error('Bridge: Failed to create case from booking:', error.message);
        return null;
    }
}

/**
 * Create a CaseFile from a chat interaction
 * @param {string} message - User's chat message
 * @param {object} intent - Inferred intent
 * @returns {object} Created case (or null if low confidence)
 */
export async function createCaseFromChat(message, intent) {
    // Only create cases for meaningful interactions
    if (intent.confidence < 25) {
        return null;
    }

    try {
        const patient = getOrCreateGuestPatient();
        const sanitizedMessage = sanitizeInput(message);

        // Check for emergency
        const emergency = checkEmergencyEscalation(sanitizedMessage);
        const priority = emergency.isEmergency ? CasePriority.URGENT : CasePriority.ROUTINE;

        const caseData = {
            patientId: patient.id,
            chiefComplaint: generateChiefComplaint(intent, sanitizedMessage),
            symptomDuration: 'Unknown (via chat)',
            rawNotes: JSON.stringify({
                source: 'CHAT_BRIDGE',
                originalMessage: sanitizedMessage,
                inferredCategory: intent.category,
                detectedSymptoms: intent.symptoms,
                confidence: intent.confidence,
                emergencyFlags: emergency.triggers
            }),
            priority: priority
        };

        const caseFile = CaseFile.createCaseFile(caseData);

        // Auto-submit for review
        CaseFile.submitCaseForReview(caseFile.id);

        // Trigger AI pipeline asynchronously
        setImmediate(() => triggerClinicalPipeline(caseFile.id));

        return caseFile;
    } catch (error) {
        console.error('Bridge: Failed to create case from chat:', error.message);
        return null;
    }
}

// ============================================
// AI PIPELINE TRIGGER
// ============================================

/**
 * Trigger the clinical AI pipeline for a case
 * @param {string} caseId - Case ID
 */
async function triggerClinicalPipeline(caseId) {
    try {
        console.log(`\n🌉 Bridge: Triggering clinical pipeline for case ${caseId}`);
        const result = await aiService.processCase(caseId);
        console.log(`✅ Bridge: Pipeline complete - ${result.status}`);
    } catch (error) {
        console.error(`❌ Bridge: Pipeline failed for ${caseId}:`, error.message);
    }
}

// ============================================
// SAFETY LAYER
// ============================================

/**
 * Apply safety checks to chat response
 * Ensures "Guidance, Not Diagnosis" even in chat
 * 
 * @param {string} response - AI/chat response
 * @returns {{safe: boolean, response: string, warnings: string[]}}
 */
export function applyChatSafety(response) {
    const warnings = [];

    // Check for prohibited content
    const safety = validateContentSafety(response);
    if (!safety.safe) {
        warnings.push(...safety.violations);
    }

    // Always append mini-disclaimer to chat responses
    const safeResponse = response + '\n\n<small>⚠️ This is general guidance only. Consult a doctor for medical advice.</small>';

    return {
        safe: safety.safe,
        response: safeResponse,
        warnings
    };
}

/**
 * Check if message contains emergency keywords
 * @param {string} message - User message
 * @returns {{isEmergency: boolean, message: string}}
 */
export function checkChatEmergency(message) {
    const emergency = checkEmergencyEscalation(message);

    if (emergency.isEmergency) {
        return {
            isEmergency: true,
            message: '🚨 **URGENT**: Your symptoms may require immediate medical attention. Please contact emergency services or visit the nearest hospital immediately.',
            triggers: emergency.triggers
        };
    }

    return { isEmergency: false };
}

// ============================================
// REPORTING
// ============================================

/**
 * Get bridge activity statistics
 * @returns {object} Stats about bridge-created cases
 */
export function getBridgeStats() {
    const allCases = CaseFile.getAllCaseFiles({ limit: 1000 });

    let bookingCases = 0;
    let chatCases = 0;
    let emergencyCases = 0;

    for (const c of allCases.cases) {
        try {
            const notes = JSON.parse(c.rawNotes || '{}');
            if (notes.source === 'BOOKING_BRIDGE') bookingCases++;
            if (notes.source === 'CHAT_BRIDGE') chatCases++;
            if (notes.emergencyFlags && notes.emergencyFlags.length > 0) emergencyCases++;
        } catch (e) {
            // Skip non-JSON notes
        }
    }

    return {
        totalBridgeCases: bookingCases + chatCases,
        fromBookings: bookingCases,
        fromChat: chatCases,
        emergencyEscalations: emergencyCases
    };
}

export default {
    inferIntent,
    createCaseFromBooking,
    createCaseFromChat,
    applyChatSafety,
    checkChatEmergency,
    getBridgeStats
};
