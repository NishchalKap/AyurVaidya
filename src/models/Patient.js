/**
 * Patient Model
 * Demographic identity only - no medical history stored here
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase, persistDatabase } from '../config/database.js';

/**
 * Create a new patient
 * @param {object} data - Patient data
 * @returns {object} Created patient
 */
export function createPatient(data) {
    const db = getDatabase();
    const id = `pat_${uuidv4().split('-')[0]}`;
    const now = new Date().toISOString();

    const patient = {
        id,
        full_name: data.fullName,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        district: data.district,
        state: data.state,
        prakriti: data.prakriti || null,
        created_at: now,
        updated_at: now
    };

    db.patients.push(patient);
    persistDatabase();

    return formatPatient(patient);
}

/**
 * Get patient by ID
 * @param {string} id - Patient ID
 * @returns {object|null} Patient object or null
 */
export function getPatientById(id) {
    const db = getDatabase();
    const patient = db.patients.find(p => p.id === id);
    return patient ? formatPatient(patient) : null;
}

/**
 * Get all patients with pagination
 * @param {object} options - Pagination options
 * @returns {object} Paginated patients list
 */
export function getAllPatients({ page = 1, limit = 20 } = {}) {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    // Sort by created_at descending
    const sorted = [...db.patients].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    const total = sorted.length;
    const patients = sorted.slice(offset, offset + limit);

    return {
        patients: patients.map(formatPatient),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * Update patient
 * @param {string} id - Patient ID
 * @param {object} data - Update data
 * @returns {object|null} Updated patient or null
 */
export function updatePatient(id, data) {
    const db = getDatabase();
    const index = db.patients.findIndex(p => p.id === id);

    if (index === -1) {
        return null;
    }

    const patient = db.patients[index];

    if (data.fullName !== undefined) patient.full_name = data.fullName;
    if (data.age !== undefined) patient.age = data.age;
    if (data.gender !== undefined) patient.gender = data.gender;
    if (data.phone !== undefined) patient.phone = data.phone;
    if (data.district !== undefined) patient.district = data.district;
    if (data.state !== undefined) patient.state = data.state;
    if (data.prakriti !== undefined) patient.prakriti = data.prakriti;

    patient.updated_at = new Date().toISOString();

    persistDatabase();
    return formatPatient(patient);
}

/**
 * Search patients by name or phone
 * @param {string} query - Search query
 * @returns {array} Matching patients
 */
export function searchPatients(query) {
    const db = getDatabase();
    const lowerQuery = query.toLowerCase();

    const matches = db.patients.filter(p =>
        p.full_name.toLowerCase().includes(lowerQuery) ||
        p.phone.includes(query)
    );

    return matches.slice(0, 50).map(formatPatient);
}

/**
 * Format database row to API response
 * @param {object} row - Database row
 * @returns {object} Formatted patient
 */
function formatPatient(row) {
    return {
        id: row.id,
        fullName: row.full_name,
        age: row.age,
        gender: row.gender,
        phone: row.phone,
        district: row.district,
        state: row.state,
        prakriti: row.prakriti,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

export default {
    createPatient,
    getPatientById,
    getAllPatients,
    updatePatient,
    searchPatients
};
