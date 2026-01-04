# Ayurvaidya API Contracts

> **Version:** v1.1 (Hardened)  
> **Base URL:** `http://localhost:3000/api/v1`  
> **Status:** Contract-Locked for Frontend Integration

---

## ⚠️ Important for Frontend Developers

This document is the **single source of truth** for API integration. All response structures are locked and will not change without version increment.

### Key Principles
1. All responses follow `{ success: boolean, data?: T, error?: string }`
2. AI outputs always include `disclaimer` field
3. Field editability depends on case status
4. Status transitions follow strict rules

---

## 📋 Table of Contents

1. [Response Format](#response-format)
2. [Error Codes](#error-codes)
3. [Patient Endpoints](#patient-endpoints)
4. [Case Endpoints](#case-endpoints)
5. [AI Endpoints](#ai-endpoints)
6. [Status Machine](#status-machine)
7. [Field Editability](#field-editability)
8. [Safety Rules](#safety-rules)

---

## Response Format

### Success Response
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  warnings?: Warning[];  // Optional warnings (e.g., emergency escalation)
}

interface Warning {
  type: 'EMERGENCY_ESCALATION' | 'PRIORITY_SUGGESTION';
  message: string;
  triggers?: string[];
}
```

### Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: ErrorCode;
  message: string;
  details?: ValidationError[];
  allowedTransitions?: string[];  // For INVALID_STATE errors
}

interface ValidationError {
  path: (string | number)[];
  message: string;
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_STATE` | 409 | Invalid status transition |
| `SAFETY_VIOLATION` | 422 | Content contains prohibited terms |
| `DUPLICATE_ERROR` | 409 | Record already exists |
| `PROCESSING_ERROR` | 500 | AI processing failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Patient Endpoints

### Create Patient

```
POST /api/v1/patients
```

**Request:**
```typescript
interface CreatePatientRequest {
  fullName: string;       // 2-100 chars
  age: number;            // 0-150
  gender: 'M' | 'F' | 'O';
  phone: string;          // 10-15 chars
  district: string;       // 2-100 chars
  state: string;          // 2-100 chars
  prakriti?: 'VATA' | 'PITTA' | 'KAPHA' | null;  // Optional
}
```

**Response (201):**
```typescript
interface PatientResponse {
  id: string;             // "pat_xxx"
  fullName: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  phone: string;
  district: string;
  state: string;
  prakriti: 'VATA' | 'PITTA' | 'KAPHA' | null;
  createdAt: string;      // ISO datetime
  updatedAt: string;      // ISO datetime
}
```

### List Patients

```
GET /api/v1/patients?page=1&limit=20&search=query
```

**Response:**
```typescript
interface PatientListResponse {
  patients: PatientResponse[];
  pagination: Pagination;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

---

## Case Endpoints

### Create Case

```
POST /api/v1/cases
```

**Request:**
```typescript
interface CreateCaseRequest {
  patientId: string;           // Required
  chiefComplaint: string;      // 5-1000 chars, Required
  symptomDuration?: string;    // Max 100 chars
  rawNotes?: string;           // Max 5000 chars
  vitalSigns?: VitalSigns;
  attachments?: Attachment[];  // Max 10
  priority?: 'ROUTINE' | 'ELEVATED' | 'URGENT';  // Default: ROUTINE
}

interface VitalSigns {
  temperature?: number;        // 90-110 (Fahrenheit)
  bloodPressure?: string;      // Format: "120/80"
  pulseRate?: number;          // 30-250
  weight?: number;             // 1-500 (kg)
}

interface Attachment {
  type: 'LAB_REPORT' | 'PRESCRIPTION' | 'IMAGE' | 'OTHER';
  description: string;         // 1-500 chars
  url?: string;
}
```

**Response (201):**
```typescript
interface CreateCaseResponse {
  success: true;
  data: CaseResponse;
  warnings?: Warning[];  // If emergency keywords detected
}
```

> **Note:** If chief complaint contains emergency keywords (e.g., "chest pain", "difficulty breathing"), the case is automatically escalated to URGENT priority.

### Get Case

```
GET /api/v1/cases/:id
```

**Response:**
```typescript
interface CaseResponse {
  id: string;                  // "case_xxx"
  patientId: string;
  patient: PatientSummary | null;
  status: CaseStatus;
  priority: CasePriority;
  chiefComplaint: string;
  symptomDuration: string | null;
  rawNotes: string | null;
  vitalSigns: VitalSigns | null;
  attachments: Attachment[];
  structuredSummary: string | null;    // AI-generated
  clinicalFlags: string[];             // AI-generated
  recommendationId: string | null;
  doctorNotes: string | null;
  doctorDecision: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  
  _meta: {
    allowedTransitions: CaseStatus[];
    editableFields: string[];
    readOnlyFields: string[];
  }
}

type CaseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'REVIEWED' | 'CLOSED';
type CasePriority = 'ROUTINE' | 'ELEVATED' | 'URGENT';

interface PatientSummary {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  prakriti: 'VATA' | 'PITTA' | 'KAPHA' | null;
}
```

### List Cases (Doctor Queue)

```
GET /api/v1/cases?page=1&limit=20&status=PENDING_REVIEW&priority=URGENT
```

**Queue Ordering:**
1. 🔴 URGENT cases (newest first)
2. 🟡 ELEVATED cases (newest first)
3. 🟢 ROUTINE cases (oldest first - FIFO)

**Response:**
```typescript
interface CaseQueueItem {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'O';
  chiefComplaint: string;
  symptomDuration: string | null;
  status: CaseStatus;
  priority: CasePriority;
  hasRecommendation: boolean;
  createdAt: string;
}
```

### Update Case

```
PATCH /api/v1/cases/:id
```

**Request:** Only editable fields (see [Field Editability](#field-editability))

### Case Status Actions

| Action | Endpoint | Transition |
|--------|----------|------------|
| Submit for Review | `POST /cases/:id/submit` | DRAFT → PENDING_REVIEW |
| Mark Reviewed | `POST /cases/:id/review` | PENDING_REVIEW → REVIEWED |
| Close Case | `POST /cases/:id/close` | REVIEWED → CLOSED |

**POST /cases/:id/review:**
```typescript
interface ReviewRequest {
  reviewedBy: string;  // Min 2 chars
}
```

**POST /cases/:id/close:**
```typescript
interface CloseRequest {
  decision: string;  // Min 5 chars, no diagnosis language
}
```

---

## AI Endpoints

### Trigger AI Processing

```
POST /api/v1/ai/process/:caseId
```

**Response:**
```typescript
interface AIProcessingResult {
  status: 'COMPLETED' | 'ALREADY_PROCESSED' | 'FAILED';
  message: string;
  processingTime?: string;     // e.g., "0.80s"
  recommendationId?: string;
  pipelineStages?: string[];
}
```

### Get Recommendation

```
GET /api/v1/ai/recommendation/:caseId
```

**Response (LOCKED CONTRACT):**
```typescript
interface Recommendation {
  id: string;                  // "rec_xxx"
  caseFileId: string;
  generatedAt: string;         // ISO datetime
  aiModelVersion: string;      // "stub-v0.1" or future version
  confidenceScore: number;     // 0-100
  
  allopathy: AllopathyTrack;
  ayurveda: AyurvedaTrack;
  
  contraindications: string[];  // Max 10 items
  redFlags: string[];           // Max 10 items
  
  estimatedCostRange: {
    min: number;
    max: number;
    currency: 'INR';            // Always INR
  };
  
  disclaimer: string;           // ALWAYS present, min 50 chars
  createdAt: string;
}

interface AllopathyTrack {
  approach: string;             // 10-500 chars
  suggestedActions: string[];   // 1-10 items
  genericFirst: boolean;        // Always true in current version
  referralNeeded: boolean;
  referralReason: string | null;
}

interface AyurvedaTrack {
  constitutionalNote: string;   // Based on patient prakriti
  dietaryGuidance: string[];    // 1-10 items
  lifestyleGuidance: string[];  // 1-10 items
  herbSuggestions: string[];    // 0-10 items
  yogaRecommendations: string[]; // 0-10 items
}
```

### Get AI Pipeline Info

```
GET /api/v1/ai/pipeline
```

**Response:**
```typescript
interface PipelineInfo {
  version: string;
  status: 'STUB_MODE' | 'ACTIVE' | 'DEGRADED';
  message: string;
  stages: PipelineStage[];
}

interface PipelineStage {
  id: number;               // 1-5
  name: string;             // Stage name
  description: string;
  aiModel: string;
  status: 'STUB' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
}
```

---

## Status Machine

```
┌─────────────────────────────────────────────────────────┐
│                     CASE STATUS FLOW                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌──────────┐                                          │
│   │  DRAFT   │ ◄─────────────┐                          │
│   └─────┬────┘               │                          │
│         │                    │ (revision needed)        │
│         │ POST /submit       │                          │
│         ▼                    │                          │
│   ┌──────────────────┐       │                          │
│   │  PENDING_REVIEW  │ ──────┘                          │
│   └─────────┬────────┘                                  │
│             │                                           │
│             │ POST /review                              │
│             ▼                                           │
│   ┌──────────────────┐                                  │
│   │    REVIEWED      │ ◄───┐ (needs re-review)         │
│   └─────────┬────────┘     │                           │
│             │              │                           │
│             │ POST /close  │                           │
│             ▼              │                           │
│   ┌──────────────────┐     │                           │
│   │     CLOSED       │ ────┘ (cannot reopen)          │
│   └──────────────────┘                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Valid Transitions

| From | To | Endpoint |
|------|----|----------|
| DRAFT | PENDING_REVIEW | POST /submit |
| PENDING_REVIEW | REVIEWED | POST /review |
| PENDING_REVIEW | DRAFT | PATCH (status change) |
| REVIEWED | CLOSED | POST /close |
| REVIEWED | PENDING_REVIEW | PATCH (status change) |
| CLOSED | - | No transitions allowed |

---

## Field Editability

### By Case Status

| Field | DRAFT | PENDING_REVIEW | REVIEWED | CLOSED |
|-------|-------|----------------|----------|--------|
| chiefComplaint | ✅ | ❌ | ❌ | ❌ |
| symptomDuration | ✅ | ❌ | ❌ | ❌ |
| rawNotes | ✅ | ❌ | ❌ | ❌ |
| vitalSigns | ✅ | ❌ | ❌ | ❌ |
| attachments | ✅ | ❌ | ❌ | ❌ |
| priority | ✅ | ✅ | ✅ | ❌ |
| doctorNotes | ❌ | ✅ | ✅ | ❌ |
| doctorDecision | ❌ | ✅ | ✅ | ❌ |

### System-Managed Fields (Never Editable)
- `id`
- `patientId`
- `createdAt`
- `updatedAt`
- `structuredSummary` (AI-generated)
- `clinicalFlags` (AI-generated)
- `recommendationId` (Set by AI processing)

---

## Safety Rules

### Emergency Escalation

The following keywords in chief complaint trigger automatic URGENT priority:

- chest pain
- difficulty breathing
- unconscious
- severe bleeding
- stroke / heart attack
- seizure
- suicide / self-harm
- poisoning
- allergic reaction / anaphylaxis

### Prohibited Content

The following terms are blocked in doctorNotes and doctorDecision:

**Diagnosis Language:**
- "you have", "diagnosed with", "diagnosis is"
- "confirmed", "definitely", "certainly"

**Prescription Language:**
- "prescribe", "prescription"
- "take this medicine/medication"
- "dosage:", "mg twice daily"

**Medical Claims:**
- "will cure", "guaranteed to"
- "100% effective", "no side effects"

### Mandatory Disclaimer

Every recommendation includes:

```
⚠️ GUIDANCE, NOT DIAGNOSIS

This information is generated to assist healthcare providers and does 
not constitute medical diagnosis, prescription, or treatment. All 
suggestions require validation by a qualified medical professional. 
The AI system provides decision support only — final clinical judgment 
rests with the treating physician.
```

---

## Quick Start Examples

### 1. Create Patient and Case

```javascript
// Create patient
const patient = await fetch('/api/v1/patients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'Ramesh Kumar',
    age: 45,
    gender: 'M',
    phone: '9876543210',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    prakriti: 'PITTA'
  })
}).then(r => r.json());

// Create case
const caseFile = await fetch('/api/v1/cases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientId: patient.data.id,
    chiefComplaint: 'Burning sensation in stomach after meals',
    symptomDuration: '5 days',
    vitalSigns: {
      temperature: 98.4,
      bloodPressure: '130/85'
    }
  })
}).then(r => r.json());
```

### 2. Doctor Workflow

```javascript
// Submit case for review
await fetch(`/api/v1/cases/${caseId}/submit`, { method: 'POST' });

// Trigger AI processing
await fetch(`/api/v1/ai/process/${caseId}`, { method: 'POST' });

// Get recommendation
const rec = await fetch(`/api/v1/ai/recommendation/${caseId}`).then(r => r.json());

// Add doctor notes
await fetch(`/api/v1/cases/${caseId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    doctorNotes: 'Patient advised rest and hydration. Follow-up in 1 week.',
  })
});

// Mark as reviewed
await fetch(`/api/v1/cases/${caseId}/review`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reviewedBy: 'Dr. Smith' })
});

// Close case
await fetch(`/api/v1/cases/${caseId}/close`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ decision: 'Symptomatic treatment recommended.' })
});
```

---

> **Contract Version:** 1.1  
> **Last Updated:** 2026-01-03  
> **Breaking Changes:** None from v1.0
