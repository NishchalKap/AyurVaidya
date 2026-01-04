/**
 * AI Service
 * Stage 2: REAL OpenAI for Clinical Summarization
 * Other stages remain stubs
 */

import { getCaseFileById, updateCaseFile } from '../models/CaseFile.js';
import { createRecommendation, getRecommendationByCaseId, hasRecommendation } from '../models/Recommendation.js';
import { getPatientById } from '../models/Patient.js';
import {
    getMockRecommendation,
    getMockStructuredSummary,
    getMockClinicalFlags,
    simulateAIDelay
} from '../utils/mockData.js';
import { AIPipelineStage, CaseStatus } from '../utils/constants.js';
import { generateClinicalSummary, isOpenAIAvailable } from './openaiService.js';
import { saveCaseToSupabase, isSupabaseAvailable } from '../config/supabase.js';

// In-memory storage for AI summaries (fallback)
const aiSummaries = new Map();

/**
 * Process a case through the AI pipeline
 * 
 * PIPELINE STAGES:
 * 1. Data Structuring (STUB)
 * 2. Clinical Summarization (REAL OPENAI ✓)
 * 3. Integrated Care Drafting (STUB)
 * 4. Cost Optimization (STUB)
 * 5. Safety Validation (STUB)
 * 
 * @param {string} caseId - Case file ID
 * @returns {object} Processing result
 */
export async function processCase(caseId) {
    // Get case data
    const caseFile = getCaseFileById(caseId);
    if (!caseFile) {
        throw new Error(`Case not found: ${caseId}`);
    }

    // Check if already processed
    if (hasRecommendation(caseId)) {
        return {
            status: 'ALREADY_PROCESSED',
            message: 'Case already has a recommendation',
            recommendationId: caseFile.recommendationId
        };
    }

    // Get patient data for context
    const patient = getPatientById(caseFile.patientId);

    console.log('\n🤖 AI Processing triggered for case:', caseId);

    const startTime = Date.now();

    // ============================================
    // STAGE 1: DATA STRUCTURING (STUB)
    // ============================================
    console.log(`  [${AIPipelineStage.DATA_STRUCTURING}] Processing... (stub)`);
    await simulateAIDelay();

    // ============================================
    // STAGE 2: CLINICAL SUMMARIZATION (REAL OPENAI)
    // ============================================
    console.log(`  [${AIPipelineStage.CLINICAL_SUMMARIZATION}] Processing... ${isOpenAIAvailable() ? '(REAL AI)' : '(stub)'}`);

    // Generate real AI summary
    const aiSummary = await generateClinicalSummary(caseFile);

    // Store in memory for retrieval
    aiSummaries.set(caseId, aiSummary);

    // Use AI summary for structured output
    const structuredSummary = aiSummary.summary;
    const clinicalFlags = aiSummary.riskFlags;

    // ============================================
    // STAGE 3: INTEGRATED CARE DRAFTING (STUB)
    // ============================================
    console.log(`  [${AIPipelineStage.INTEGRATED_CARE_DRAFTING}] Processing... (stub)`);

    // ============================================
    // STAGE 4: COST OPTIMIZATION (STUB)
    // ============================================
    console.log(`  [${AIPipelineStage.COST_OPTIMIZATION}] Processing... (stub)`);

    // ============================================
    // STAGE 5: SAFETY VALIDATION (STUB)
    // ============================================
    console.log(`  [${AIPipelineStage.SAFETY_VALIDATION}] Processing... (stub)`);

    // ============================================
    // GENERATE RECOMMENDATION (MOCK)
    // ============================================
    const mockRec = getMockRecommendation(caseId, {
        chiefComplaint: caseFile.chiefComplaint,
        priority: aiSummary.urgencyLevel || caseFile.priority,
        prakriti: patient?.prakriti
    });

    // Save recommendation to database
    const recommendation = createRecommendation({
        caseFileId: caseId,
        aiModelVersion: aiSummary.modelVersion,
        confidenceScore: aiSummary.confidenceScore,
        allopathy: mockRec.allopathy,
        ayurveda: mockRec.ayurveda,
        contraindications: mockRec.contraindications,
        redFlags: aiSummary.riskFlags.length > 0 ? aiSummary.riskFlags : mockRec.redFlags,
        estimatedCostRange: mockRec.estimatedCostRange,
        disclaimer: mockRec.disclaimer
    });

    // Update case file with AI outputs
    const updatedCase = updateCaseFile(caseId, {
        structuredSummary,
        clinicalFlags,
        status: CaseStatus.PENDING_REVIEW
    });

    // Save to Supabase (async, non-blocking)
    if (isSupabaseAvailable()) {
        saveCaseToSupabase(updatedCase).catch(e => console.error('Supabase sync failed:', e.message));
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ AI Processing complete: COMPLETED in ${processingTime}s`);

    return {
        status: 'COMPLETED',
        message: isOpenAIAvailable()
            ? 'AI processing completed with real OpenAI'
            : 'AI processing simulated (OpenAI not configured)',
        processingTime: `${processingTime}s`,
        recommendationId: recommendation.id,
        summaryId: aiSummary.id,
        pipelineStages: Object.values(AIPipelineStage),
        realAIUsed: isOpenAIAvailable()
    };
}

/**
 * Get AI processing status for a case
 */
export function getProcessingStatus(caseId) {
    const caseFile = getCaseFileById(caseId);

    if (!caseFile) {
        return { status: 'NOT_FOUND', message: 'Case not found' };
    }

    if (caseFile.recommendationId) {
        return {
            status: 'COMPLETED',
            message: 'Processing complete',
            recommendationId: caseFile.recommendationId,
            hasSummary: aiSummaries.has(caseId)
        };
    }

    if (caseFile.status === CaseStatus.DRAFT) {
        return {
            status: 'NOT_STARTED',
            message: 'Case not yet submitted for processing'
        };
    }

    return {
        status: 'PENDING',
        message: 'Processing not yet initiated'
    };
}

/**
 * Get recommendation for a case
 */
export function getCaseRecommendation(caseId) {
    return getRecommendationByCaseId(caseId);
}

/**
 * Get AI summary for a case
 * @param {string} caseId - Case ID
 * @returns {object|null} AI summary
 */
export function getCaseSummary(caseId) {
    return aiSummaries.get(caseId) || null;
}

export default {
    processCase,
    getProcessingStatus,
    getCaseRecommendation,
    getCaseSummary
};
