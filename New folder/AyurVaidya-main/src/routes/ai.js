/**
 * AI Routes
 * API endpoints for AI processing
 * 
 * Stage 2: Real OpenAI for Clinical Summarization
 */

import { Router } from 'express';
import * as aiService from '../services/aiService.js';
import { getCaseFileById } from '../models/CaseFile.js';
import { isOpenAIAvailable } from '../services/openaiService.js';
import { isSupabaseAvailable, getAISummaryFromSupabase } from '../config/supabase.js';

const router = Router();

/**
 * POST /ai/process/:caseId
 * Trigger AI processing for a case
 * 
 * Stage 2: Uses real OpenAI for Clinical Summarization
 */
router.post('/process/:caseId', async (req, res) => {
    const { caseId } = req.params;

    const caseFile = getCaseFileById(caseId);
    if (!caseFile) {
        return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: `Case not found: ${caseId}`
        });
    }

    try {
        const result = await aiService.processCase(caseId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error(`❌ AI Processing failed: ${error.message}\n`);

        res.status(500).json({
            success: false,
            error: 'PROCESSING_ERROR',
            message: error.message
        });
    }
});

/**
 * GET /ai/status/:caseId
 * Check AI processing status for a case
 */
router.get('/status/:caseId', (req, res) => {
    const { caseId } = req.params;

    const status = aiService.getProcessingStatus(caseId);

    if (status.status === 'NOT_FOUND') {
        return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: `Case not found: ${caseId}`
        });
    }

    res.json({
        success: true,
        data: status
    });
});

/**
 * GET /ai/recommendation/:caseId
 * Get AI-generated recommendation for a case
 */
router.get('/recommendation/:caseId', (req, res) => {
    const { caseId } = req.params;

    const caseFile = getCaseFileById(caseId);
    if (!caseFile) {
        return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: `Case not found: ${caseId}`
        });
    }

    const recommendation = aiService.getCaseRecommendation(caseId);

    if (!recommendation) {
        return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: 'No recommendation found. Trigger processing first.'
        });
    }

    res.json({
        success: true,
        data: recommendation
    });
});

/**
 * GET /ai/summary/:caseId
 * Get AI-generated clinical summary for a case
 * 
 * NEW ENDPOINT: Returns real OpenAI summary
 */
router.get('/summary/:caseId', async (req, res) => {
    const { caseId } = req.params;

    const caseFile = getCaseFileById(caseId);
    if (!caseFile) {
        return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: `Case not found: ${caseId}`
        });
    }

    // Try in-memory first
    let summary = aiService.getCaseSummary(caseId);

    // Try Supabase if not in memory
    if (!summary && isSupabaseAvailable()) {
        summary = await getAISummaryFromSupabase(caseId);
    }

    if (!summary) {
        return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: 'No summary found. Trigger processing first.'
        });
    }

    res.json({
        success: true,
        data: summary
    });
});

/**
 * GET /ai/pipeline
 * Get information about the AI pipeline stages
 */
router.get('/pipeline', (req, res) => {
    const openAIStatus = isOpenAIAvailable() ? 'ACTIVE' : 'STUB';

    res.json({
        success: true,
        data: {
            version: isOpenAIAvailable() ? 'gpt-4o-mini' : 'stub-v0.1',
            status: isOpenAIAvailable() ? 'PARTIAL_ACTIVE' : 'STUB_MODE',
            message: isOpenAIAvailable()
                ? 'Clinical Summarization uses real OpenAI. Other stages are stubs.'
                : 'AI pipeline is in stub mode. Configure OPENAI_API_KEY to enable.',
            supabase: isSupabaseAvailable() ? 'CONNECTED' : 'NOT_CONFIGURED',
            stages: [
                {
                    id: 1,
                    name: 'DATA_STRUCTURING',
                    description: 'Extract structured symptoms from raw notes',
                    aiModel: 'GPT-4 (pending)',
                    status: 'STUB'
                },
                {
                    id: 2,
                    name: 'CLINICAL_SUMMARIZATION',
                    description: 'Generate concise clinical summary',
                    aiModel: 'gpt-4o-mini',
                    status: openAIStatus
                },
                {
                    id: 3,
                    name: 'INTEGRATED_CARE_DRAFTING',
                    description: 'Create dual-track recommendations',
                    aiModel: 'GPT-4 (pending)',
                    status: 'STUB'
                },
                {
                    id: 4,
                    name: 'COST_OPTIMIZATION',
                    description: 'Find generic alternatives',
                    aiModel: 'Drug Database (pending)',
                    status: 'STUB'
                },
                {
                    id: 5,
                    name: 'SAFETY_VALIDATION',
                    description: 'Check for contraindications',
                    aiModel: 'Rule Engine (pending)',
                    status: 'STUB'
                }
            ]
        }
    });
});

/**
 * GET /ai/health
 * Check AI service health
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'HEALTHY',
            mode: isOpenAIAvailable() ? 'PARTIAL_LIVE' : 'STUB',
            openai: isOpenAIAvailable() ? 'CONNECTED' : 'NOT_CONFIGURED',
            supabase: isSupabaseAvailable() ? 'CONNECTED' : 'NOT_CONFIGURED',
            version: isOpenAIAvailable() ? 'gpt-4o-mini' : 'stub-v0.1',
            timestamp: new Date().toISOString()
        }
    });
});

export default router;
