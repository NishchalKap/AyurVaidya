/**
 * Case Routes
 * API endpoints for case file management
 * 
 * HARDENED VERSION:
 * - Stricter error handling
 * - Request ID tracking
 * - Consistent response format
 */

import { Router } from 'express';
import * as caseService from '../services/caseService.js';

const router = Router();

/**
 * POST /cases
 * Submit a new case
 * 
 * @body {CaseCreateSchema} - Case data
 * @returns {CaseFullResponseSchema} - Created case with warnings if any
 */
router.post('/', (req, res) => {
    const result = caseService.submitCase(req.body);

    if (!result.success) {
        const statusMap = {
            'VALIDATION_ERROR': 400,
            'NOT_FOUND': 404,
            'SAFETY_VIOLATION': 422
        };
        const status = statusMap[result.error] || 500;
        return res.status(status).json(result);
    }

    res.status(201).json(result);
});

/**
 * GET /cases
 * List all cases for doctor queue
 * 
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} status - Filter by status (DRAFT|PENDING_REVIEW|REVIEWED|CLOSED)
 * @query {string} priority - Filter by priority (ROUTINE|ELEVATED|URGENT)
 * @returns {CaseQueueItemSchema[]} with pagination
 */
router.get('/', (req, res) => {
    const { page, limit, status, priority } = req.query;
    const result = caseService.listCases({ page, limit, status, priority });
    res.json(result);
});

/**
 * GET /cases/stats
 * Get queue statistics
 * 
 * @returns {CaseQueueStatsSchema}
 */
router.get('/stats', (req, res) => {
    const result = caseService.getQueueStats();
    res.json(result);
});

/**
 * GET /cases/patient/:patientId
 * Get all cases for a specific patient
 * 
 * NOTE: This must be before /:id to avoid route conflict
 */
router.get('/patient/:patientId', (req, res) => {
    const result = caseService.getPatientCases(req.params.patientId);

    if (!result.success) {
        const status = result.error === 'NOT_FOUND' ? 404 : 500;
        return res.status(status).json(result);
    }

    res.json(result);
});

/**
 * GET /cases/:id
 * Get single case with full details
 * 
 * @returns {CaseFullResponseSchema} with _meta.editableFields and _meta.allowedTransitions
 */
router.get('/:id', (req, res) => {
    const result = caseService.getCase(req.params.id);

    if (!result.success) {
        const status = result.error === 'NOT_FOUND' ? 404 : 500;
        return res.status(status).json(result);
    }

    res.json(result);
});

/**
 * PATCH /cases/:id
 * Update case (doctor notes, priority, etc.)
 * 
 * Field editability depends on case status:
 * - DRAFT: chiefComplaint, symptomDuration, rawNotes, vitalSigns, attachments, priority
 * - PENDING_REVIEW/REVIEWED: doctorNotes, doctorDecision, priority
 * - CLOSED: none
 * 
 * @body {CaseUpdateSchema} - Fields to update
 * @returns {CaseFullResponseSchema}
 */
router.patch('/:id', (req, res) => {
    const result = caseService.updateCase(req.params.id, req.body);

    if (!result.success) {
        const statusMap = {
            'NOT_FOUND': 404,
            'VALIDATION_ERROR': 400,
            'INVALID_STATE': 409,
            'SAFETY_VIOLATION': 422
        };
        const status = statusMap[result.error] || 500;
        return res.status(status).json(result);
    }

    res.json(result);
});

/**
 * POST /cases/:id/submit
 * Submit case for review (DRAFT -> PENDING_REVIEW)
 * 
 * Status Transition: DRAFT -> PENDING_REVIEW
 * Requirements: chiefComplaint must be present
 */
router.post('/:id/submit', (req, res) => {
    const result = caseService.submitForReview(req.params.id);

    if (!result.success) {
        const statusMap = {
            'NOT_FOUND': 404,
            'INVALID_STATE': 409,
            'VALIDATION_ERROR': 400
        };
        const status = statusMap[result.error] || 500;
        return res.status(status).json(result);
    }

    res.json(result);
});

/**
 * POST /cases/:id/review
 * Mark case as reviewed by doctor (PENDING_REVIEW -> REVIEWED)
 * 
 * Status Transition: PENDING_REVIEW -> REVIEWED
 * 
 * @body {reviewedBy: string} - Doctor identifier
 */
router.post('/:id/review', (req, res) => {
    const { reviewedBy } = req.body;
    const result = caseService.markAsReviewed(req.params.id, reviewedBy);

    if (!result.success) {
        const statusMap = {
            'NOT_FOUND': 404,
            'INVALID_STATE': 409,
            'VALIDATION_ERROR': 400
        };
        const status = statusMap[result.error] || 500;
        return res.status(status).json(result);
    }

    res.json(result);
});

/**
 * POST /cases/:id/close
 * Close a case with final decision (REVIEWED -> CLOSED)
 * 
 * Status Transition: REVIEWED -> CLOSED
 * 
 * @body {decision: string} - Doctor's final decision (min 5 chars)
 */
router.post('/:id/close', (req, res) => {
    const { decision } = req.body;
    const result = caseService.closeCase(req.params.id, decision);

    if (!result.success) {
        const statusMap = {
            'NOT_FOUND': 404,
            'INVALID_STATE': 409,
            'VALIDATION_ERROR': 400,
            'SAFETY_VIOLATION': 422
        };
        const status = statusMap[result.error] || 500;
        return res.status(status).json(result);
    }

    res.json(result);
});

export default router;
