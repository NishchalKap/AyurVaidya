/**
 * CaseFile Model
 * Central object - one healthcare interaction
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase, persistDatabase } from '../config/database.js';
import { CaseStatus, CasePriority } from '../utils/constants.js';

/**
 * Create a new case file
 * @param {object} data - Case data
 * @returns {object} Created case file
 */
export function createCaseFile(data) {
    const db = getDatabase();
    const id = `case_${uuidv4().split('-')[0]}`;
    const now = new Date().toISOString();

    const caseFile = {
        id,
        patient_id: data.patientId,
        status: data.status || CaseStatus.DRAFT,
        priority: data.priority || CasePriority.ROUTINE,
        chief_complaint: data.chiefComplaint,
        symptom_duration: data.symptomDuration || null,
        raw_notes: data.rawNotes || null,
        vital_signs: data.vitalSigns ? JSON.stringify(data.vitalSigns) : null,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        structured_summary: null,
        clinical_flags: null,
        recommendation_id: null,
        doctor_notes: null,
        doctor_decision: null,
        reviewed_at: null,
        reviewed_by: null,
        created_at: now,
        updated_at: now
    };

    db.caseFiles.push(caseFile);
    persistDatabase();

    return getCaseFileById(id);
}

/**
 * Get case file by ID with patient info
 * @param {string} id - Case ID
 * @returns {object|null} Case file or null
 */
export function getCaseFileById(id) {
    const db = getDatabase();
    const caseFile = db.caseFiles.find(c => c.id === id);

    if (!caseFile) return null;

    const patient = db.patients.find(p => p.id === caseFile.patient_id);

    return formatCaseFile({
        ...caseFile,
        patient_name: patient?.full_name || null,
        patient_age: patient?.age || null,
        patient_gender: patient?.gender || null,
        patient_prakriti: patient?.prakriti || null
    });
}

/**
 * Get all case files for doctor queue
 * Ordered by priority (URGENT > ELEVATED > ROUTINE) and creation time
 * @param {object} options - Filter and pagination options
 * @returns {object} Paginated case files
 */
export function getAllCaseFiles({
    page = 1,
    limit = 20,
    status = null,
    priority = null
} = {}) {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    // Filter
    let filtered = [...db.caseFiles];
    if (status) {
        filtered = filtered.filter(c => c.status === status);
    }
    if (priority) {
        filtered = filtered.filter(c => c.priority === priority);
    }

    // Sort by priority and time
    const priorityOrder = { 'URGENT': 1, 'ELEVATED': 2, 'ROUTINE': 3 };
    filtered.sort((a, b) => {
        // First by priority
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // For URGENT and ELEVATED: newest first
        // For ROUTINE: oldest first (FIFO)
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();

        if (a.priority === 'ROUTINE') {
            return aTime - bTime; // oldest first
        }
        return bTime - aTime; // newest first
    });

    const total = filtered.length;
    const cases = filtered.slice(offset, offset + limit);

    // Add patient info to each case
    const casesWithPatients = cases.map(c => {
        const patient = db.patients.find(p => p.id === c.patient_id);
        return {
            ...c,
            patient_name: patient?.full_name || null,
            patient_age: patient?.age || null,
            patient_gender: patient?.gender || null,
            patient_prakriti: patient?.prakriti || null
        };
    });

    return {
        cases: casesWithPatients.map(formatCaseFileSummary),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * Get all cases for a specific patient
 * @param {string} patientId - Patient ID
 * @returns {array} Case files
 */
export function getCasesByPatient(patientId) {
    const db = getDatabase();

    const cases = db.caseFiles
        .filter(c => c.patient_id === patientId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return cases.map(c => formatCaseFile({ ...c, patient_name: null }));
}

/**
 * Update case file
 * @param {string} id - Case ID
 * @param {object} data - Update data
 * @returns {object|null} Updated case or null
 */
export function updateCaseFile(id, data) {
    const db = getDatabase();
    const index = db.caseFiles.findIndex(c => c.id === id);

    if (index === -1) return null;

    const caseFile = db.caseFiles[index];

    // Updatable fields
    if (data.status !== undefined) caseFile.status = data.status;
    if (data.priority !== undefined) caseFile.priority = data.priority;
    if (data.chiefComplaint !== undefined) caseFile.chief_complaint = data.chiefComplaint;
    if (data.symptomDuration !== undefined) caseFile.symptom_duration = data.symptomDuration;
    if (data.rawNotes !== undefined) caseFile.raw_notes = data.rawNotes;
    if (data.doctorNotes !== undefined) caseFile.doctor_notes = data.doctorNotes;
    if (data.doctorDecision !== undefined) caseFile.doctor_decision = data.doctorDecision;
    if (data.reviewedBy !== undefined) caseFile.reviewed_by = data.reviewedBy;
    if (data.structuredSummary !== undefined) caseFile.structured_summary = data.structuredSummary;
    if (data.recommendationId !== undefined) caseFile.recommendation_id = data.recommendationId;

    // Handle JSON fields
    if (data.vitalSigns !== undefined) {
        caseFile.vital_signs = JSON.stringify(data.vitalSigns);
    }
    if (data.clinicalFlags !== undefined) {
        caseFile.clinical_flags = JSON.stringify(data.clinicalFlags);
    }
    if (data.attachments !== undefined) {
        caseFile.attachments = JSON.stringify(data.attachments);
    }

    // Auto-set reviewed_at when status changes to REVIEWED
    if (data.status === CaseStatus.REVIEWED) {
        caseFile.reviewed_at = new Date().toISOString();
    }

    caseFile.updated_at = new Date().toISOString();

    persistDatabase();
    return getCaseFileById(id);
}

/**
 * Submit case for review (change status from DRAFT to PENDING_REVIEW)
 * @param {string} id - Case ID
 * @returns {object|null} Updated case or null
 */
export function submitCaseForReview(id) {
    return updateCaseFile(id, { status: CaseStatus.PENDING_REVIEW });
}

/**
 * Close a case
 * @param {string} id - Case ID
 * @param {string} doctorDecision - Final decision
 * @returns {object|null} Updated case or null
 */
export function closeCaseFile(id, doctorDecision) {
    return updateCaseFile(id, {
        status: CaseStatus.CLOSED,
        doctorDecision
    });
}

/**
 * Format database row to full API response
 * @param {object} row - Database row
 * @returns {object} Formatted case file
 */
function formatCaseFile(row) {
    return {
        id: row.id,
        patientId: row.patient_id,
        patient: row.patient_name ? {
            name: row.patient_name,
            age: row.patient_age,
            gender: row.patient_gender,
            prakriti: row.patient_prakriti
        } : null,
        status: row.status,
        priority: row.priority,
        chiefComplaint: row.chief_complaint,
        symptomDuration: row.symptom_duration,
        rawNotes: row.raw_notes,
        vitalSigns: row.vital_signs ? JSON.parse(row.vital_signs) : null,
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
        structuredSummary: row.structured_summary,
        clinicalFlags: row.clinical_flags ? JSON.parse(row.clinical_flags) : [],
        recommendationId: row.recommendation_id,
        doctorNotes: row.doctor_notes,
        doctorDecision: row.doctor_decision,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

/**
 * Format database row to summary (for queue view)
 * @param {object} row - Database row
 * @returns {object} Formatted case summary
 */
function formatCaseFileSummary(row) {
    return {
        id: row.id,
        patientName: row.patient_name,
        patientAge: row.patient_age,
        patientGender: row.patient_gender,
        chiefComplaint: row.chief_complaint,
        symptomDuration: row.symptom_duration,
        status: row.status,
        priority: row.priority,
        hasRecommendation: !!row.recommendation_id,
        createdAt: row.created_at
    };
}

export default {
    createCaseFile,
    getCaseFileById,
    getAllCaseFiles,
    getCasesByPatient,
    updateCaseFile,
    submitCaseForReview,
    closeCaseFile
};
