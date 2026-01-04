/**
 * Patient Routes
 * API endpoints for patient management
 */

import { Router } from 'express';
import * as patientService from '../services/patientService.js';

const router = Router();

/**
 * POST /patients
 * Register a new patient
 */
router.post('/', (req, res) => {
    const result = patientService.createPatient(req.body);

    if (!result.success) {
        const status = result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(status).json(result);
    }

    res.status(201).json(result);
});

/**
 * GET /patients
 * List all patients with pagination
 * Query params: page, limit, search
 */
router.get('/', (req, res) => {
    const { page, limit, search } = req.query;

    // If search query provided, use search
    if (search) {
        const result = patientService.searchPatients(search);
        return res.json(result);
    }

    // Otherwise, return paginated list
    const result = patientService.listPatients({ page, limit });
    res.json(result);
});

/**
 * GET /patients/:id
 * Get patient by ID
 */
router.get('/:id', (req, res) => {
    const result = patientService.getPatient(req.params.id);

    if (!result.success) {
        const status = result.error === 'NOT_FOUND' ? 404 : 500;
        return res.status(status).json(result);
    }

    res.json(result);
});

/**
 * PATCH /patients/:id
 * Update patient
 */
router.patch('/:id', (req, res) => {
    const result = patientService.updatePatient(req.params.id, req.body);

    if (!result.success) {
        const statusMap = {
            'NOT_FOUND': 404,
            'VALIDATION_ERROR': 400
        };
        const status = statusMap[result.error] || 500;
        return res.status(status).json(result);
    }

    res.json(result);
});

export default router;
