/**
 * Patient Service
 * Business logic for patient operations
 */

import { z } from 'zod';
import * as Patient from '../models/Patient.js';
import { Gender, Prakriti } from '../utils/constants.js';

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const CreatePatientSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().int().min(0).max(150, 'Invalid age'),
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    district: z.string().min(2, 'District is required'),
    state: z.string().min(2, 'State is required'),
    prakriti: z.enum([Prakriti.VATA, Prakriti.PITTA, Prakriti.KAPHA]).optional().nullable()
});

export const UpdatePatientSchema = CreatePatientSchema.partial();

// ============================================
// SERVICE METHODS
// ============================================

/**
 * Create a new patient
 * @param {object} data - Patient data
 * @returns {object} Result with patient or error
 */
export function createPatient(data) {
    // Validate input
    const validation = CreatePatientSchema.safeParse(data);
    if (!validation.success) {
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            details: validation.error.errors
        };
    }

    try {
        const patient = Patient.createPatient(validation.data);
        return { success: true, data: patient };
    } catch (error) {
        return {
            success: false,
            error: 'DATABASE_ERROR',
            message: error.message
        };
    }
}

/**
 * Get patient by ID
 * @param {string} id - Patient ID
 * @returns {object} Result with patient or error
 */
export function getPatient(id) {
    const patient = Patient.getPatientById(id);

    if (!patient) {
        return {
            success: false,
            error: 'NOT_FOUND',
            message: `Patient not found: ${id}`
        };
    }

    return { success: true, data: patient };
}

/**
 * List all patients with pagination
 * @param {object} options - Pagination options
 * @returns {object} Paginated patients
 */
export function listPatients(options = {}) {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));

    const result = Patient.getAllPatients({ page, limit });
    return { success: true, data: result };
}

/**
 * Update patient
 * @param {string} id - Patient ID
 * @param {object} data - Update data
 * @returns {object} Result with patient or error
 */
export function updatePatient(id, data) {
    // Check if patient exists
    const existing = Patient.getPatientById(id);
    if (!existing) {
        return {
            success: false,
            error: 'NOT_FOUND',
            message: `Patient not found: ${id}`
        };
    }

    // Validate input
    const validation = UpdatePatientSchema.safeParse(data);
    if (!validation.success) {
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            details: validation.error.errors
        };
    }

    try {
        const patient = Patient.updatePatient(id, validation.data);
        return { success: true, data: patient };
    } catch (error) {
        return {
            success: false,
            error: 'DATABASE_ERROR',
            message: error.message
        };
    }
}

/**
 * Search patients
 * @param {string} query - Search query
 * @returns {object} Search results
 */
export function searchPatients(query) {
    if (!query || query.length < 2) {
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Search query must be at least 2 characters'
        };
    }

    const patients = Patient.searchPatients(query);
    return { success: true, data: patients };
}

export default {
    createPatient,
    getPatient,
    listPatients,
    updatePatient,
    searchPatients,
    CreatePatientSchema,
    UpdatePatientSchema
};
