/**
 * OpenAI Service
 * 
 * Handles real AI calls for Clinical Summarization (Stage 2 only).
 * Other stages remain stubs.
 */

import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { STANDARD_DISCLAIMER } from '../utils/constants.js';
import { saveAISummaryToSupabase } from '../config/supabase.js';

// ============================================
// CONFIGURATION
// ============================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = 'gpt-3.5-turbo'; // Widely available

let openai = null;
let isConfigured = false;

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize OpenAI client
 * @returns {boolean} True if configured
 */
export function initOpenAI() {
    if (!OPENAI_API_KEY) {
        console.log('⚠️  OpenAI API key not configured - using stubs only');
        return false;
    }

    try {
        openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        isConfigured = true;
        console.log('✅ OpenAI client initialized');
        return true;
    } catch (error) {
        console.error('❌ OpenAI initialization failed:', error.message);
        return false;
    }
}

/**
 * Check if OpenAI is available
 * @returns {boolean}
 */
export function isOpenAIAvailable() {
    return isConfigured && openai !== null;
}

// ============================================
// CLINICAL SUMMARIZATION (REAL AI)
// ============================================

/**
 * The ONLY real AI call - Clinical Summarization
 * 
 * @param {object} caseData - Case data to summarize
 * @returns {Promise<object>} AI summary
 */
export async function generateClinicalSummary(caseData) {
    const startTime = Date.now();
    const summaryId = `sum_${uuidv4().substring(0, 8)}`;

    // Fallback to stub if OpenAI not available
    if (!isOpenAIAvailable()) {
        console.log('🔄 OpenAI unavailable - using stub summary');
        return generateStubSummary(caseData, summaryId);
    }

    try {
        console.log('\n🤖 OpenAI: Generating clinical summary...');

        const prompt = buildSummarizationPrompt(caseData);

        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `You are a clinical decision support assistant. Your role is to summarize patient symptoms and identify potential risk flags. 

CRITICAL RULES:
1. NEVER diagnose any condition
2. NEVER prescribe treatments or medications
3. NEVER claim certainty about any medical condition
4. Focus ONLY on summarizing symptoms and identifying general risk indicators
5. Use neutral, clinical language
6. Always err on the side of caution`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3, // Lower temperature for more consistent outputs
            max_tokens: 500
        });

        const aiOutput = JSON.parse(response.choices[0].message.content);
        const processingTime = Date.now() - startTime;

        console.log(`✅ OpenAI: Summary generated in ${processingTime}ms`);

        // Validate and sanitize output
        const summary = sanitizeAIOutput(aiOutput, summaryId, caseData.id, processingTime);

        // Save to Supabase
        await saveAISummaryToSupabase(summary);

        return summary;

    } catch (error) {
        console.error('❌ OpenAI call failed:', error.message);
        console.log('🔄 Falling back to stub summary');
        return generateStubSummary(caseData, summaryId, error.message);
    }
}

// ... existing code ...

/**
 * Generate stub summary when OpenAI is unavailable
 */
function generateStubSummary(caseData, summaryId, debugError = null) {
    return {
        id: summaryId,
        caseId: caseData.id,
        modelVersion: 'stub-v0.1',
        summary: `Patient reports: ${caseData.chiefComplaint || 'symptoms not specified'}. Duration: ${caseData.symptomDuration || 'unspecified'}.`,
        riskFlags: caseData.priority === 'URGENT' ? ['Elevated symptoms - requires attention'] : [],
        urgencyLevel: caseData.priority || 'ROUTINE',
        keySymptoms: [caseData.chiefComplaint?.split(' ')[0] || 'unspecified'],
        suggestedFollowUp: 'Consult with a healthcare provider for personalized advice.',
        confidenceScore: 50,
        disclaimer: STANDARD_DISCLAIMER,
        isAIGenerated: false,
        processingTimeMs: 0,
        createdAt: new Date().toISOString(),
        _debugError: debugError
    };
}

// ============================================
// PROMPT BUILDING
// ============================================

/**
 * Build the summarization prompt
 * @param {object} caseData - Case data
 * @returns {string} Prompt
 */
function buildSummarizationPrompt(caseData) {
    // Extract source info if available
    let sourceInfo = '';
    try {
        const notes = JSON.parse(caseData.rawNotes || '{}');
        if (notes.source === 'CHAT_BRIDGE') {
            sourceInfo = `\nOriginal Message: ${notes.originalMessage}`;
        }
    } catch (e) { }

    return `
Analyze the following patient case and provide a structured summary.

PATIENT CASE:
- Chief Complaint: ${caseData.chiefComplaint || 'Not provided'}
- Symptom Duration: ${caseData.symptomDuration || 'Not specified'}
- Current Priority: ${caseData.priority || 'ROUTINE'}
${sourceInfo}

Provide your response as JSON with this exact structure:
{
  "summary": "Brief clinical summary of the reported symptoms (2-3 sentences)",
  "riskFlags": ["List of potential risk indicators to watch for"],
  "urgencyLevel": "ROUTINE or ELEVATED or URGENT",
  "keySymptoms": ["Main symptoms identified"],
  "suggestedFollowUp": "General, non-prescriptive suggestion for next steps"
}

REMEMBER: 
- Do NOT diagnose
- Do NOT prescribe
- Summarize symptoms only
- Identify general risk indicators
`;
}

// ============================================
// OUTPUT SANITIZATION
// ============================================

/**
 * Sanitize and validate AI output
 * @param {object} aiOutput - Raw AI output
 * @param {string} summaryId - Summary ID
 * @param {string} caseId - Case ID
 * @param {number} processingTime - Processing time in ms
 * @returns {object} Sanitized summary
 */
function sanitizeAIOutput(aiOutput, summaryId, caseId, processingTime) {
    // Ensure required fields exist
    const summary = {
        id: summaryId,
        caseId: caseId,
        modelVersion: MODEL,
        summary: aiOutput.summary || 'Summary generation completed.',
        riskFlags: Array.isArray(aiOutput.riskFlags) ? aiOutput.riskFlags : [],
        urgencyLevel: validateUrgency(aiOutput.urgencyLevel),
        keySymptoms: Array.isArray(aiOutput.keySymptoms) ? aiOutput.keySymptoms : [],
        suggestedFollowUp: aiOutput.suggestedFollowUp || 'Consult with a healthcare provider for personalized advice.',
        confidenceScore: 75, // Fixed for hackathon
        disclaimer: STANDARD_DISCLAIMER,
        isAIGenerated: true,
        processingTimeMs: processingTime,
        createdAt: new Date().toISOString()
    };

    // Additional safety check - remove any diagnosis-like language
    summary.summary = removeDiagnosisLanguage(summary.summary);
    summary.suggestedFollowUp = removeDiagnosisLanguage(summary.suggestedFollowUp);

    return summary;
}

/**
 * Validate urgency level
 */
function validateUrgency(urgency) {
    const valid = ['ROUTINE', 'ELEVATED', 'URGENT'];
    return valid.includes(urgency) ? urgency : 'ROUTINE';
}

/**
 * Remove diagnosis-like language
 */
function removeDiagnosisLanguage(text) {
    if (!text) return text;

    const patterns = [
        /you have/gi,
        /diagnosed with/gi,
        /diagnosis is/gi,
        /confirmed to have/gi,
        /you are suffering from/gi
    ];

    let cleaned = text;
    for (const pattern of patterns) {
        cleaned = cleaned.replace(pattern, 'may be experiencing symptoms of');
    }

    return cleaned;
}

// ============================================
// STUB FALLBACK
// ============================================




export default {
    initOpenAI,
    isOpenAIAvailable,
    generateClinicalSummary
};
