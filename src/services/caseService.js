/**
 * Case Service
 * Business logic for case file operations
 * 
 * HARDENED VERSION:
 * - Enforces status transition rules
 * - Validates field editability
 * - Checks emergency escalation
 * - Sanitizes inputs
 */

import { z } from 'zod';
import * as CaseFile from '../models/CaseFile.js';
import { getPatientById } from '../models/Patient.js';
import { CaseStatus, CasePriority, AttachmentType } from '../utils/constants.js';
import {
    isValidStatusTransition,
    getAllowedTransitions,
    isFieldEditable,
    checkEmergencyEscalation,
    suggestPriority,
    sanitizeInput,
    validateContentSafety
} from '../utils/safety.js';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const VitalSignsSchema = z.object({
    temperature: z.number().min(90).max(110).optional().nullable(),
    bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/).optional().nullable(),
    pulseRate: z.number().int().min(30).max(250).optional().nullable(),
    weight: z.number().min(1).max(500).optional().nullable()
}).optional().nullable();

const AttachmentSchema = z.object({
    type: z.enum([AttachmentType.LAB_REPORT, AttachmentType.PRESCRIPTION, AttachmentType.IMAGE, AttachmentType.OTHER]),
    description: z.string().min(1).max(500),
    url: z.string().url().optional().nullable()
});

export const CreateCaseSchema = z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    chiefComplaint: z.string().min(5, 'Chief complaint must be at least 5 characters').max(1000),
    symptomDuration: z.string().max(100).optional().nullable(),
    rawNotes: z.string().max(5000).optional().nullable(),
    vitalSigns: VitalSignsSchema,
    attachments: z.array(AttachmentSchema).max(10).optional(),
    priority: z.enum([CasePriority.ROUTINE, CasePriority.ELEVATED, CasePriority.URGENT]).optional()
});

export const UpdateCaseSchema = z.object({
    priority: z.enum([CasePriority.ROUTINE, CasePriority.ELEVATED, CasePriority.URGENT]).optional(),
    rawNotes: z.string().max(5000).optional().nullable(),
    vitalSigns: VitalSignsSchema,
    doctorNotes: z.string().max(5000).optional().nullable(),
    doctorDecision: z.string().max(2000).optional().nullable()
});

// ============================================
// SERVICE METHODS
// ============================================

/**
 * Submit a new case
 * @param {object} data - Case data
 * @returns {object} Result with case or error
 */
export function submitCase(data) {
    // Validate input
    const validation = CreateCaseSchema.safeParse(data);
    if (!validation.success) {
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            details: validation.error.errors.map(e => ({
                path: e.path,
                message: e.message
            }))
        };
    }

    // Check if patient exists
    const patient = getPatientById(validation.data.patientId);
    if (!patient) {
        return {
            success: false,
            error: 'NOT_FOUND',
            message: `Patient not found: ${validation.data.patientId}`
        };
    }

    // Sanitize text inputs
    const sanitizedData = {
        ...validation.data,
        chiefComplaint: sanitizeInput(validation.data.chiefComplaint),
        rawNotes: validation.data.rawNotes ? sanitizeInput(validation.data.rawNotes) : null
    };

    // Check for emergency escalation
    const emergency = checkEmergencyEscalation(sanitizedData.chiefComplaint);
    if (emergency.isEmergency) {
        sanitizedData.priority = CasePriority.URGENT;
    }

    // Suggest priority based on content
    const prioritySuggestion = suggestPriority(
        sanitizedData.chiefComplaint,
        sanitizedData.priority || CasePriority.ROUTINE
    );

    try {
        const caseFile = CaseFile.createCaseFile(sanitizedData);

        const response = {
            success: true,
            data: caseFile
        };

        // Add escalation notice if emergency detected
        if (emergency.isEmergency) {
            response.warnings = [{
                type: 'EMERGENCY_ESCALATION',
                message: emergency.message,
                triggers: emergency.triggers
            }];
        }

        // Add priority suggestion if different from original
        if (prioritySuggestion.isEscalation) {
            response.warnings = response.warnings || [];
            response.warnings.push({
                type: 'PRIORITY_SUGGESTION',
                message: prioritySuggestion.reason,
                suggestedPriority: prioritySuggestion.suggestedPriority
            });
        }

        return response;
    } catch (error) {
        return {
            success: false,
            error: 'DATABASE_ERROR',
            message: error.message
        };
    }
}

/**
 * Get case by ID with full details
 * @param {string} id - Case ID
 * @returns {object} Result with case or error
 */
export function getCase(id) {
    const caseFile = CaseFile.getCaseFileById(id);

    if (!caseFile) {
        return {
            success: false,
            error: 'NOT_FOUND',
            message: `Case not found: ${id}`
        };
    }

    // Add editability info for frontend
    const editabilityInfo = getEditabilityInfo(caseFile.status);

    return {
        success: true,
        data: {
            ...caseFile,
            _meta: {
                allowedTransitions: getAllowedTransitions(caseFile.status),
                editableFields: editabilityInfo.editable,
                readOnlyFields: editabilityInfo.readOnly
            }
        }
    };
}

/**
 * List all cases for doctor queue
 * @param {object} options - Filter and pagination options
 * @returns {object} Paginated cases
 */
export function listCases(options = {}) {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));

    // Validate status filter
    const status = options.status && Object.values(CaseStatus).includes(options.status)
        ? options.status
        : null;

    // Validate priority filter  
    const priority = options.priority && Object.values(CasePriority).includes(options.priority)
        ? options.priority
        : null;

    const result = CaseFile.getAllCaseFiles({ page, limit, status, priority });
    return { success: true, data: result };
}

/**
 * Get all cases for a patient
 * @param {string} patientId - Patient ID
 * @returns {object} Result with cases
 */
export function getPatientCases(patientId) {
    const patient = getPatientById(patientId);
    if (!patient) {
        return {
            success: false,
            error: 'NOT_FOUND',
            message: `Patient not found: ${patientId}`
        };
    }

    const cases = CaseFile.getCasesByPatient(patientId);
    return { success: true, data: cases };
}

/**
 * Update case (doctor notes, priority, etc.)
 * HARDENED: Enforces field editability based on status
 * 
 * @param {string} id - Case ID
 * @param {object} data - Update data
 * @returns {object} Result with case or error
 */
export function updateCase(id, data) {
    // Check if case exists
    const existing = CaseFile.getCaseFileById(id);
    if (!existing) {
        return {
            success: false,
            error: 'NOT_FOUND',
            message: `Case not found: ${id}`
        };
    }

    // Validate input
    const validation = UpdateCaseSchema.safeParse(data);
    if (!validation.success) {
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            details: validation.error.errors.map(e => ({
                path: e.path,
                message: e.message
            }))
        };
    }

    // Check field editability
    const blockedFields = [];
    for (const field of Object.keys(validation.data)) {
        const editability = isFieldEditable(field, existing.status);
        if (!editability.editable) {
            blockedFields.push({ field, reason: editability.reason });
        }
    }

    if (blockedFields.length > 0) {
        return {
            success: false,
            error: 'INVALID_STATE',
            message: 'Some fields cannot be edited in current status',
            details: blockedFields
        };
    }

    // Validate doctor notes content safety
    if (validation.data.doctorNotes) {
        const safety = validateContentSafety(validation.data.doctorNotes);
        if (!safety.safe) {
            return {
                success: false,
                error: 'SAFETY_VIOLATION',
                message: 'Content contains prohibited diagnosis/prescription language',
                details: safety.violations
            };
        }
    }

    // Sanitize text inputs
    const sanitizedData = {
        ...validation.data,
        rawNotes: validation.data.rawNotes ? sanitizeInput(validation.data.rawNotes) : undefined,
        doctorNotes: validation.data.doctorNotes ? sanitizeInput(validation.data.doctorNotes) : undefined,
        doctorDecision: validation.data.doctorDecision ? sanitizeInput(validation.data.doctorDecision) : undefined
    };

    try {
        const caseFile = CaseFile.updateCaseFile(id, sanitizedData);
        return { success: true, data: caseFile };
    } catch (error) {
        return {
            success: false,
            error: 'DATABASE_ERROR',
            message: error.message
        };
    }
}

/**
 * Submit case for review
 * HARDENED: Validates status transition
 * 
 * @param {string} id - Case ID
 * @returns {object} Result with case or error
 */
export function submitForReview(id) {
    const existing = CaseFile.getCaseFileById(id);
    if (!existing) {
        return {
            success: false,
            error: 'NOT_FOUND',
            message: `Case not found: ${id}`
        };
    }

    // Validate status transition
    if (!isValidStatusTransition(existing.status, CaseStatus.PENDING_REVIEW)) {
        return {
            success: false,
            error: 'INVALID_STATE',
            message: `Cannot transition from ${existing.status} to PENDING_REVIEW`,
            allowedTransitions: getAllowedTransitions(existing.status)
        };
    }

    // Check if minimum required fields are present
    if (!existing.chiefComplaint || existing.chiefComplaint.length < 5) {
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Chief complaint is required before submitting for review'
        };
    }

    const caseFile = CaseFile.submitCaseForReview(id);
    return { success: true, data: caseFile };
}

/**
 * Mark case as reviewed by doctor
 * @param {string} id - Case ID
 * @param {string} reviewedBy - Doctor identifier
 * @returns {object} Result with case or error
 */
export function markAsReviewed(id, reviewedBy) {
    const existing = CaseFile.getCaseFileById(id);
    if (!existing) {
        return {
            success: false,
            error: 'NOT_FOUND',
            message: `Case not found: ${id}`
        };
    }

    // Validate status transition
    if (!isValidStatusTransition(existing.status, CaseStatus.REVIEWED)) {
        return {
            success: false,
            error: 'INVALID_STATE',
            message: `Cannot transition from ${existing.status} to REVIEWED`,
            allowedTransitions: getAllowedTransitions(existing.status)
        };
    }

    if (!reviewedBy || reviewedBy.trim().length < 2) {
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Reviewer identifier is required'
        };
    }

    const caseFile = CaseFile.updateCaseFile(id, {
        status: CaseStatus.REVIEWED,
        reviewedBy: sanitizeInput(reviewedBy)
    });

    return { success: true, data: caseFile };
}

/**
 * Close a case with final decision
 * HARDENED: Validates status transition and decision content
 * 
 * @param {string} id - Case ID
 * @param {string} decision - Doctor's final decision
 * @returns {object} Result with case or error
 */
export function closeCase(id, decision) {
    const existing = CaseFile.getCaseFileById(id);
    if (!existing) {
        return {
            success: false,
            error: 'NOT_FOUND',
            message: `Case not found: ${id}`
        };
    }

    // Validate status transition
    if (!isValidStatusTransition(existing.status, CaseStatus.CLOSED)) {
        return {
            success: false,
            error: 'INVALID_STATE',
            message: `Cannot close case from ${existing.status} status`,
            allowedTransitions: getAllowedTransitions(existing.status)
        };
    }

    if (!decision || decision.trim().length < 5) {
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Decision must be at least 5 characters'
        };
    }

    // Validate decision content safety
    const safety = validateContentSafety(decision);
    if (!safety.safe) {
        return {
            success: false,
            error: 'SAFETY_VIOLATION',
            message: 'Decision contains prohibited diagnosis/prescription language',
            details: safety.violations
        };
    }

    const caseFile = CaseFile.closeCaseFile(id, sanitizeInput(decision));
    return { success: true, data: caseFile };
}

/**
 * Get queue statistics
 * @returns {object} Queue stats
 */
export function getQueueStats() {
    const allCases = CaseFile.getAllCaseFiles({ limit: 1000 });

    const stats = {
        total: allCases.pagination.total,
        byStatus: {},
        byPriority: {},
        urgentCount: 0,
        pendingReviewCount: 0
    };

    // Initialize counters
    for (const status of Object.values(CaseStatus)) {
        stats.byStatus[status] = 0;
    }
    for (const priority of Object.values(CasePriority)) {
        stats.byPriority[priority] = 0;
    }

    // Count by status and priority
    for (const c of allCases.cases) {
        stats.byStatus[c.status]++;
        stats.byPriority[c.priority]++;

        if (c.priority === CasePriority.URGENT) {
            stats.urgentCount++;
        }
        if (c.status === CaseStatus.PENDING_REVIEW) {
            stats.pendingReviewCount++;
        }
    }

    return { success: true, data: stats };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get editability info for a case based on status
 * @param {string} status - Case status
 * @returns {{editable: string[], readOnly: string[]}}
 */
function getEditabilityInfo(status) {
    const allFields = [
        'chiefComplaint', 'symptomDuration', 'rawNotes', 'vitalSigns',
        'attachments', 'priority', 'doctorNotes', 'doctorDecision'
    ];

    const editable = [];
    const readOnly = [];

    for (const field of allFields) {
        const result = isFieldEditable(field, status);
        if (result.editable) {
            editable.push(field);
        } else {
            readOnly.push(field);
        }
    }

    return { editable, readOnly };
}

export default {
    submitCase,
    getCase,
    listCases,
    getPatientCases,
    updateCase,
    submitForReview,
    markAsReviewed,
    closeCase,
    getQueueStats,
    CreateCaseSchema,
    UpdateCaseSchema
};
