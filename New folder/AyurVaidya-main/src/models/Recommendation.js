/**
 * Recommendation Model
 * AI-generated guidance (placeholder structure for Stage 1)
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase, persistDatabase } from '../config/database.js';
import { STANDARD_DISCLAIMER } from '../utils/constants.js';

/**
 * Create a new recommendation
 * @param {object} data - Recommendation data
 * @returns {object} Created recommendation
 */
export function createRecommendation(data) {
    const db = getDatabase();
    const id = `rec_${uuidv4().split('-')[0]}`;
    const now = new Date().toISOString();

    const recommendation = {
        id,
        case_file_id: data.caseFileId,
        generated_at: now,
        ai_model_version: data.aiModelVersion || 'stub-v0.1',
        confidence_score: data.confidenceScore || 0,
        allopathy: JSON.stringify(data.allopathy),
        ayurveda: JSON.stringify(data.ayurveda),
        contraindications: JSON.stringify(data.contraindications || []),
        red_flags: JSON.stringify(data.redFlags || []),
        estimated_cost_range: JSON.stringify(data.estimatedCostRange || { min: 0, max: 0, currency: 'INR' }),
        disclaimer: data.disclaimer || STANDARD_DISCLAIMER,
        created_at: now
    };

    db.recommendations.push(recommendation);

    // Link recommendation to case file
    const caseIndex = db.caseFiles.findIndex(c => c.id === data.caseFileId);
    if (caseIndex !== -1) {
        db.caseFiles[caseIndex].recommendation_id = id;
    }

    persistDatabase();
    return getRecommendationById(id);
}

/**
 * Get recommendation by ID
 * @param {string} id - Recommendation ID
 * @returns {object|null} Recommendation or null
 */
export function getRecommendationById(id) {
    const db = getDatabase();
    const rec = db.recommendations.find(r => r.id === id);
    return rec ? formatRecommendation(rec) : null;
}

/**
 * Get recommendation by case file ID
 * @param {string} caseFileId - Case file ID
 * @returns {object|null} Recommendation or null
 */
export function getRecommendationByCaseId(caseFileId) {
    const db = getDatabase();
    const rec = db.recommendations.find(r => r.case_file_id === caseFileId);
    return rec ? formatRecommendation(rec) : null;
}

/**
 * Check if case has a recommendation
 * @param {string} caseFileId - Case file ID
 * @returns {boolean} True if recommendation exists
 */
export function hasRecommendation(caseFileId) {
    const db = getDatabase();
    return db.recommendations.some(r => r.case_file_id === caseFileId);
}

/**
 * Delete recommendation (if regenerating)
 * @param {string} id - Recommendation ID
 * @returns {boolean} True if deleted
 */
export function deleteRecommendation(id) {
    const db = getDatabase();
    const index = db.recommendations.findIndex(r => r.id === id);

    if (index === -1) return false;

    db.recommendations.splice(index, 1);
    persistDatabase();
    return true;
}

/**
 * Format database row to API response
 * @param {object} row - Database row
 * @returns {object} Formatted recommendation
 */
function formatRecommendation(row) {
    return {
        id: row.id,
        caseFileId: row.case_file_id,
        generatedAt: row.generated_at,
        aiModelVersion: row.ai_model_version,
        confidenceScore: row.confidence_score,

        // Dual-track recommendations
        allopathy: JSON.parse(row.allopathy),
        ayurveda: JSON.parse(row.ayurveda),

        // Safety layer
        contraindications: JSON.parse(row.contraindications || '[]'),
        redFlags: JSON.parse(row.red_flags || '[]'),

        // Cost optimization
        estimatedCostRange: JSON.parse(row.estimated_cost_range || '{}'),

        // Disclaimer
        disclaimer: row.disclaimer,

        createdAt: row.created_at
    };
}

export default {
    createRecommendation,
    getRecommendationById,
    getRecommendationByCaseId,
    hasRecommendation,
    deleteRecommendation
};
