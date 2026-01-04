/**
 * Ayurvaidya API Contracts
 * Strict schema definitions for all API endpoints
 * 
 * This file serves as the single source of truth for:
 * - Request payload schemas
 * - Response payload schemas
 * - AI output contracts
 * 
 * Frontend developers should use these contracts for integration.
 */

import { z } from 'zod';
import {
    Gender,
    Prakriti,
    CaseStatus,
    CasePriority,
    AttachmentType,
    AIPipelineStage
} from './constants.js';

// ============================================
// BASE SCHEMAS
// ============================================

/**
 * Standard API Response Wrapper
 * All endpoints return this structure
 */
export const APIResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    details: z.array(z.any()).optional()
});

/**
 * Pagination Schema
 */
export const PaginationSchema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative()
});

// ============================================
// PATIENT SCHEMAS
// ============================================

export const PatientCreateSchema = z.object({
    fullName: z.string().min(2).max(100),
    age: z.number().int().min(0).max(150),
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
    phone: z.string().min(10).max(15),
    district: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    prakriti: z.enum([Prakriti.VATA, Prakriti.PITTA, Prakriti.KAPHA]).optional().nullable()
});

export const PatientResponseSchema = z.object({
    id: z.string(),
    fullName: z.string(),
    age: z.number(),
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
    phone: z.string(),
    district: z.string(),
    state: z.string(),
    prakriti: z.enum([Prakriti.VATA, Prakriti.PITTA, Prakriti.KAPHA]).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

export const PatientUpdateSchema = PatientCreateSchema.partial();

// ============================================
// VITAL SIGNS SCHEMA
// ============================================

export const VitalSignsSchema = z.object({
    temperature: z.number().min(90).max(110).optional().nullable(),
    bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/).optional().nullable(),
    pulseRate: z.number().int().min(30).max(250).optional().nullable(),
    weight: z.number().min(1).max(500).optional().nullable()
}).optional().nullable();

// ============================================
// CASE FILE SCHEMAS
// ============================================

export const AttachmentSchema = z.object({
    type: z.enum([
        AttachmentType.LAB_REPORT,
        AttachmentType.PRESCRIPTION,
        AttachmentType.IMAGE,
        AttachmentType.OTHER
    ]),
    description: z.string().min(1).max(500),
    url: z.string().url().optional().nullable()
});

export const CaseCreateSchema = z.object({
    patientId: z.string().min(1),
    chiefComplaint: z.string().min(5).max(1000),
    symptomDuration: z.string().max(100).optional().nullable(),
    rawNotes: z.string().max(5000).optional().nullable(),
    vitalSigns: VitalSignsSchema,
    attachments: z.array(AttachmentSchema).max(10).optional(),
    priority: z.enum([CasePriority.ROUTINE, CasePriority.ELEVATED, CasePriority.URGENT]).optional()
});

export const CaseUpdateSchema = z.object({
    // Priority - always updatable except when closed
    priority: z.enum([CasePriority.ROUTINE, CasePriority.ELEVATED, CasePriority.URGENT]).optional(),

    // Pre-review fields - only updatable in DRAFT
    rawNotes: z.string().max(5000).optional().nullable(),
    vitalSigns: VitalSignsSchema,

    // Doctor fields - only updatable after submission
    doctorNotes: z.string().max(5000).optional().nullable(),
    doctorDecision: z.string().max(2000).optional().nullable()
});

export const CasePatientSummarySchema = z.object({
    name: z.string(),
    age: z.number(),
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
    prakriti: z.enum([Prakriti.VATA, Prakriti.PITTA, Prakriti.KAPHA]).nullable()
});

export const CaseFullResponseSchema = z.object({
    id: z.string(),
    patientId: z.string(),
    patient: CasePatientSummarySchema.nullable(),
    status: z.enum([CaseStatus.DRAFT, CaseStatus.PENDING_REVIEW, CaseStatus.REVIEWED, CaseStatus.CLOSED]),
    priority: z.enum([CasePriority.ROUTINE, CasePriority.ELEVATED, CasePriority.URGENT]),
    chiefComplaint: z.string(),
    symptomDuration: z.string().nullable(),
    rawNotes: z.string().nullable(),
    vitalSigns: VitalSignsSchema,
    attachments: z.array(AttachmentSchema),
    structuredSummary: z.string().nullable(),
    clinicalFlags: z.array(z.string()),
    recommendationId: z.string().nullable(),
    doctorNotes: z.string().nullable(),
    doctorDecision: z.string().nullable(),
    reviewedAt: z.string().datetime().nullable(),
    reviewedBy: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

export const CaseQueueItemSchema = z.object({
    id: z.string(),
    patientName: z.string(),
    patientAge: z.number(),
    patientGender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
    chiefComplaint: z.string(),
    symptomDuration: z.string().nullable(),
    status: z.enum([CaseStatus.DRAFT, CaseStatus.PENDING_REVIEW, CaseStatus.REVIEWED, CaseStatus.CLOSED]),
    priority: z.enum([CasePriority.ROUTINE, CasePriority.ELEVATED, CasePriority.URGENT]),
    hasRecommendation: z.boolean(),
    createdAt: z.string().datetime()
});

export const CaseQueueStatsSchema = z.object({
    total: z.number().int().nonnegative(),
    byStatus: z.record(z.string(), z.number().int().nonnegative()),
    byPriority: z.record(z.string(), z.number().int().nonnegative())
});

// ============================================
// AI / RECOMMENDATION SCHEMAS (STRICT)
// ============================================

/**
 * Allopathy Track Schema
 * Evidence-based, generic-first recommendations
 */
export const AllopathyTrackSchema = z.object({
    approach: z.string().min(10).max(500),
    suggestedActions: z.array(z.string().max(200)).min(1).max(10),
    genericFirst: z.boolean(),
    referralNeeded: z.boolean(),
    referralReason: z.string().max(500).nullable()
});

/**
 * Ayurveda Track Schema
 * Lifestyle, diet, constitutional guidance
 */
export const AyurvedaTrackSchema = z.object({
    constitutionalNote: z.string().min(10).max(500),
    dietaryGuidance: z.array(z.string().max(200)).min(1).max(10),
    lifestyleGuidance: z.array(z.string().max(200)).min(1).max(10),
    herbSuggestions: z.array(z.string().max(200)).max(10),
    yogaRecommendations: z.array(z.string().max(200)).max(10)
});

/**
 * Cost Range Schema
 */
export const CostRangeSchema = z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    currency: z.literal('INR')
});

/**
 * Full Recommendation Schema
 * This is the LOCKED CONTRACT for AI outputs
 */
export const RecommendationSchema = z.object({
    id: z.string(),
    caseFileId: z.string(),
    generatedAt: z.string().datetime(),
    aiModelVersion: z.string(),
    confidenceScore: z.number().int().min(0).max(100),

    // Dual-track recommendations
    allopathy: AllopathyTrackSchema,
    ayurveda: AyurvedaTrackSchema,

    // Safety layer
    contraindications: z.array(z.string().max(300)).max(10),
    redFlags: z.array(z.string().max(300)).max(10),

    // Cost optimization
    estimatedCostRange: CostRangeSchema,

    // Mandatory disclaimer
    disclaimer: z.string().min(50),

    createdAt: z.string().datetime()
});

/**
 * AI Processing Result Schema
 */
export const AIProcessingResultSchema = z.object({
    status: z.enum(['COMPLETED', 'ALREADY_PROCESSED', 'FAILED']),
    message: z.string(),
    processingTime: z.string().optional(),
    recommendationId: z.string().optional(),
    pipelineStages: z.array(z.string()).optional()
});

/**
 * AI Status Schema
 */
export const AIStatusSchema = z.object({
    status: z.enum(['COMPLETED', 'PENDING', 'NOT_STARTED', 'PROCESSING', 'FAILED']),
    message: z.string(),
    recommendationId: z.string().optional()
});

/**
 * AI Pipeline Stage Schema
 */
export const AIPipelineStageSchema = z.object({
    id: z.number().int().positive(),
    name: z.enum([
        AIPipelineStage.DATA_STRUCTURING,
        AIPipelineStage.CLINICAL_SUMMARIZATION,
        AIPipelineStage.INTEGRATED_CARE_DRAFTING,
        AIPipelineStage.COST_OPTIMIZATION,
        AIPipelineStage.SAFETY_VALIDATION
    ]),
    description: z.string(),
    aiModel: z.string(),
    status: z.enum(['STUB', 'ACTIVE', 'COMPLETED', 'FAILED'])
});

export const AIPipelineInfoSchema = z.object({
    version: z.string(),
    status: z.enum(['STUB_MODE', 'ACTIVE', 'DEGRADED']),
    message: z.string(),
    stages: z.array(AIPipelineStageSchema)
});

// ============================================
// ERROR SCHEMAS
// ============================================

export const ErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.enum([
        'VALIDATION_ERROR',
        'NOT_FOUND',
        'INVALID_STATE',
        'DUPLICATE_ERROR',
        'CONSTRAINT_ERROR',
        'PROCESSING_ERROR',
        'SAFETY_VIOLATION',
        'INTERNAL_ERROR'
    ]),
    message: z.string(),
    details: z.array(z.object({
        path: z.array(z.string().or(z.number())).optional(),
        message: z.string()
    })).optional()
});

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate request body against schema
 * @param {z.ZodSchema} schema - Zod schema
 * @param {object} data - Data to validate
 * @returns {{valid: boolean, data?: object, errors?: object[]}}
 */
export function validateRequest(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { valid: true, data: result.data };
    }
    return {
        valid: false,
        errors: result.error.errors.map(e => ({
            path: e.path,
            message: e.message
        }))
    };
}

/**
 * Validate AI output matches contract
 * @param {object} output - AI output
 * @returns {{valid: boolean, errors?: object[]}}
 */
export function validateAIOutput(output) {
    return validateRequest(RecommendationSchema, output);
}

// ============================================
// EXPORTS
// ============================================

export default {
    // Base
    APIResponseSchema,
    PaginationSchema,

    // Patient
    PatientCreateSchema,
    PatientResponseSchema,
    PatientUpdateSchema,

    // Case
    CaseCreateSchema,
    CaseUpdateSchema,
    CaseFullResponseSchema,
    CaseQueueItemSchema,
    CaseQueueStatsSchema,
    VitalSignsSchema,
    AttachmentSchema,

    // AI/Recommendation
    RecommendationSchema,
    AllopathyTrackSchema,
    AyurvedaTrackSchema,
    CostRangeSchema,
    AIProcessingResultSchema,
    AIStatusSchema,
    AIPipelineInfoSchema,
    AIPipelineStageSchema,

    // Error
    ErrorResponseSchema,

    // Helpers
    validateRequest,
    validateAIOutput
};
