# Ayurvaidya AI Pipeline Documentation

> **Stage:** 1 (Foundation - Conceptual Only)  
> **Status:** Stubs with marked integration points

---

## Pipeline Overview

The Ayurvaidya AI pipeline processes patient cases through 5 stages to generate integrated care recommendations. In Stage 1, all stages return mock data while the integration points are clearly defined for Stage 2 implementation.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          AI PIPELINE FLOW                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Raw Patient Data                                                       │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  STAGE 1: DATA STRUCTURING                                  │       │
│   │  • Extract symptoms from raw notes                          │       │
│   │  • Normalize vital signs                                    │       │
│   │  • Identify key clinical indicators                         │       │
│   └─────────────────────────────────────────────────────────────┘       │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  STAGE 2: CLINICAL SUMMARIZATION                            │       │
│   │  • Generate 2-3 sentence clinical summary                   │       │
│   │  • Identify clinical flags                                  │       │
│   │  • Prioritize concerns                                      │       │
│   └─────────────────────────────────────────────────────────────┘       │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  STAGE 3: INTEGRATED CARE DRAFTING                          │       │
│   │  • Generate Allopathy recommendations                       │       │
│   │  • Generate Ayurveda recommendations                        │       │
│   │  • Consider patient Prakriti (constitution)                 │       │
│   └─────────────────────────────────────────────────────────────┘       │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  STAGE 4: COST OPTIMIZATION                                 │       │
│   │  • Find generic drug alternatives                           │       │
│   │  • Estimate cost range                                      │       │
│   │  • Prioritize affordable options                            │       │
│   └─────────────────────────────────────────────────────────────┘       │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  STAGE 5: SAFETY VALIDATION                                 │       │
│   │  • Check for contraindications                              │       │
│   │  • Identify red flags                                       │       │
│   │  • Validate against patient history                         │       │
│   └─────────────────────────────────────────────────────────────┘       │
│         │                                                                │
│         ▼                                                                │
│   Final Recommendation Object                                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Stage Details

### Stage 1: Data Structuring

**Purpose:** Convert messy, unstructured patient input into clean, normalized data.

**Input:**
- Raw notes (free text)
- Chief complaint
- Vital signs

**Output:**
- Structured symptom list
- Normalized vital signs
- Key clinical indicators

**AI Integration Point:**
```javascript
// >> AI_INTEGRATION_POINT: OpenAI to extract structured symptoms
// 
// const structuredData = await openai.chat.completions.create({
//   model: "gpt-4",
//   messages: [
//     { 
//       role: "system", 
//       content: `You are a medical data extraction assistant.
//         Extract symptoms, duration, severity, and key findings
//         from the provided patient notes.
//         Return structured JSON.` 
//     },
//     { role: "user", content: rawNotes }
//   ],
//   response_format: { type: "json_object" }
// });
```

---

### Stage 2: Clinical Summarization

**Purpose:** Generate a concise clinical summary for quick doctor review.

**Input:**
- Structured data from Stage 1
- Patient demographics

**Output:**
- 2-3 sentence clinical summary
- Clinical flags (e.g., "dehydration_risk", "infection_possible")

**AI Integration Point:**
```javascript
// >> AI_INTEGRATION_POINT: OpenAI to generate clinical summary
//
// const summary = await openai.chat.completions.create({
//   model: "gpt-4",
//   messages: [
//     { 
//       role: "system", 
//       content: `You are a clinical summarization assistant.
//         Create a concise 2-3 sentence summary of the patient case.
//         Identify any clinical flags that warrant attention.
//         Do NOT diagnose. Focus on presenting facts.` 
//     },
//     { role: "user", content: JSON.stringify(structuredData) }
//   ]
// });
```

---

### Stage 3: Integrated Care Drafting

**Purpose:** Generate dual-track recommendations for Allopathy and Ayurveda.

**Input:**
- Clinical summary
- Patient Prakriti (constitution)
- Structured symptoms

**Output:**
- Allopathy track (evidence-based, generic-first)
- Ayurveda track (lifestyle, diet, constitutional)

**AI Integration Point:**
```javascript
// >> AI_INTEGRATION_POINT: OpenAI with dual-track prompts
//
// const [allopathyResponse, ayurvedaResponse] = await Promise.all([
//   openai.chat.completions.create({
//     model: "gpt-4",
//     messages: [
//       { 
//         role: "system", 
//         content: ALLOPATHY_PROMPT // Focus on evidence-based, generic-first
//       },
//       { role: "user", content: JSON.stringify(clinicalData) }
//     ]
//   }),
//   openai.chat.completions.create({
//     model: "gpt-4",
//     messages: [
//       { 
//         role: "system", 
//         content: AYURVEDA_PROMPT // Focus on lifestyle, diet, constitution
//       },
//       { role: "user", content: JSON.stringify(clinicalData) }
//     ]
//   })
// ]);
```

**Allopathy Guidelines:**
- Suggest generic alternatives when available
- Focus on symptomatic relief
- Clear referral criteria
- No prescription - only suggestions for doctor

**Ayurveda Guidelines:**
- Consider patient Prakriti (Vata/Pitta/Kapha)
- Focus on lifestyle modifications
- Dietary recommendations
- Yoga and breathing exercises
- Herb suggestions (NOT prescriptions)

---

### Stage 4: Cost Optimization

**Purpose:** Find affordable alternatives and estimate costs.

**Input:**
- Drug/herb suggestions from Stage 3
- Patient location (for regional pricing)

**Output:**
- Generic alternatives
- Estimated cost range
- Affordability flags

**AI Integration Point:**
```javascript
// >> AI_INTEGRATION_POINT: Drug database + generic mapping
//
// const costOptimized = await drugDatabase.findGenerics(suggestions);
// 
// For Stage 2:
// - Integrate with Indian Generic Drug Database (IDPL)
// - Connect to JanAushadhi pricing API
// - Regional pharmacy availability check
```

---

### Stage 5: Safety Validation

**Purpose:** Ensure recommendations are safe for the patient.

**Input:**
- Full recommendation object
- Patient history (future: medication list)
- Known allergies (future)

**Output:**
- Contraindications list
- Red flags for immediate attention
- Safety score

**AI Integration Point:**
```javascript
// >> AI_INTEGRATION_POINT: Rule engine + OpenAI safety check
//
// const safetyCheck = await Promise.all([
//   ruleEngine.checkContraindications(recommendation, patientHistory),
//   openai.chat.completions.create({
//     model: "gpt-4",
//     messages: [
//       { 
//         role: "system", 
//         content: `You are a medical safety validator.
//           Check for potential drug interactions, contraindications,
//           and red flags. Err on the side of caution.` 
//       },
//       { role: "user", content: JSON.stringify(recommendation) }
//     ]
//   })
// ]);
```

---

## Recommendation Object Structure

```json
{
  "id": "rec_abc123",
  "caseFileId": "case_xyz789",
  "generatedAt": "2026-01-03T10:30:00Z",
  "aiModelVersion": "gpt-4-turbo",
  "confidenceScore": 75,
  
  "allopathy": {
    "approach": "Symptomatic management recommended",
    "suggestedActions": [
      "Consider generic antacid if needed",
      "Adequate hydration",
      "Monitor symptoms for 48-72 hours"
    ],
    "genericFirst": true,
    "referralNeeded": false,
    "referralReason": null
  },
  
  "ayurveda": {
    "constitutionalNote": "Pitta aggravation suspected based on symptoms",
    "dietaryGuidance": [
      "Avoid spicy and acidic foods",
      "Prefer cooling foods like cucumber, coconut water"
    ],
    "lifestyleGuidance": [
      "Sleep by 10 PM",
      "Avoid afternoon sun exposure"
    ],
    "herbSuggestions": [
      "Shatavari for digestive cooling",
      "Amla for Pitta balance"
    ],
    "yogaRecommendations": [
      "Sheetali Pranayama (cooling breath)",
      "Gentle forward bends"
    ]
  },
  
  "contraindications": [
    "Avoid Mulethi if patient has hypertension",
    "Shatavari may affect blood sugar - monitor if diabetic"
  ],
  
  "redFlags": [
    "Seek immediate care if blood in stool",
    "Emergency visit if severe chest pain"
  ],
  
  "estimatedCostRange": {
    "min": 100,
    "max": 500,
    "currency": "INR"
  },
  
  "disclaimer": "⚠️ GUIDANCE, NOT DIAGNOSIS..."
}
```

---

## Stage 2 Roadmap

When implementing real AI in Stage 2:

1. **Set up OpenAI client**
   ```javascript
   import OpenAI from 'openai';
   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   ```

2. **Create system prompts** for each stage
   - Store in separate files for version control
   - Include examples and constraints

3. **Implement response parsing**
   - Validate AI responses
   - Handle edge cases and errors

4. **Add caching layer**
   - Cache similar queries
   - Reduce API costs

5. **Implement monitoring**
   - Track token usage
   - Log response quality
   - A/B test prompts

---

## Safety First Principles

1. **Never diagnose** - Only provide information
2. **Always defer to doctor** - Human-in-the-loop
3. **Flag uncertainty** - Confidence scores matter
4. **Clear escalation** - Red flags prominently displayed
5. **Audit everything** - Full logging for review
