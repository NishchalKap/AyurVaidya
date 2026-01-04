# Ayurvaidya API Documentation

> **Version:** v1  
> **Base URL:** `http://localhost:3000/api/v1`  
> **Stage:** 1 (Foundation - AI Stubs)

---

## Overview

Ayurvaidya provides a RESTful API for managing patient cases and generating AI-assisted clinical recommendations. In Stage 1, all AI endpoints return mock data matching the expected contract.

**Core Principle:** *Guidance, Not Diagnosis*

---

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": [ ... ]  // For validation errors
}
```

---

## Endpoints

### Health & Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/api/v1` | API information |

---

### Patients

#### Create Patient
```
POST /api/v1/patients
```

**Request Body:**
```json
{
  "fullName": "Ramesh Kumar",
  "age": 45,
  "gender": "M",          // M, F, or O
  "phone": "9876543210",
  "district": "Varanasi",
  "state": "Uttar Pradesh",
  "prakriti": "PITTA"     // Optional: VATA, PITTA, KAPHA
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "pat_abc123",
    "fullName": "Ramesh Kumar",
    "age": 45,
    "gender": "M",
    "phone": "9876543210",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "prakriti": "PITTA",
    "createdAt": "2026-01-03T10:00:00.000Z",
    "updatedAt": "2026-01-03T10:00:00.000Z"
  }
}
```

#### List Patients
```
GET /api/v1/patients?page=1&limit=20
GET /api/v1/patients?search=Ramesh
```

#### Get Patient
```
GET /api/v1/patients/:id
```

#### Update Patient
```
PATCH /api/v1/patients/:id
```

---

### Cases

#### Submit Case
```
POST /api/v1/cases
```

**Request Body:**
```json
{
  "patientId": "pat_abc123",
  "chiefComplaint": "Burning sensation in stomach after meals",
  "symptomDuration": "5 days",
  "rawNotes": "Patient reports acidity, worse at night. No fever.",
  "vitalSigns": {
    "temperature": 98.4,
    "bloodPressure": "130/85",
    "pulseRate": 78,
    "weight": 72
  },
  "priority": "ROUTINE"  // ROUTINE, ELEVATED, or URGENT
}
```

#### List Cases (Doctor Queue)
```
GET /api/v1/cases?page=1&limit=20
GET /api/v1/cases?status=PENDING_REVIEW
GET /api/v1/cases?priority=URGENT
```

**Queue Order:**
1. 🔴 URGENT cases (newest first)
2. 🟡 ELEVATED cases (newest first)
3. 🟢 ROUTINE cases (oldest first - FIFO)

#### Get Single Case
```
GET /api/v1/cases/:id
```

#### Update Case (Doctor Notes)
```
PATCH /api/v1/cases/:id
```

**Request Body:**
```json
{
  "doctorNotes": "Patient advised rest and hydration.",
  "priority": "ELEVATED"
}
```

#### Submit for Review
```
POST /api/v1/cases/:id/submit
```

#### Close Case
```
POST /api/v1/cases/:id/close
```

**Request Body:**
```json
{
  "decision": "Symptomatic treatment approved. Follow-up in 1 week."
}
```

#### Queue Statistics
```
GET /api/v1/cases/stats
```

---

### AI (Stubs in Stage 1)

#### Trigger AI Processing
```
POST /api/v1/ai/process/:caseId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "COMPLETED",
    "message": "AI processing simulated (Stage 1 stub)",
    "processingTime": "1.2s",
    "recommendationId": "rec_abc123",
    "pipelineStages": [
      "DATA_STRUCTURING",
      "CLINICAL_SUMMARIZATION",
      "INTEGRATED_CARE_DRAFTING",
      "COST_OPTIMIZATION",
      "SAFETY_VALIDATION"
    ]
  }
}
```

#### Check Processing Status
```
GET /api/v1/ai/status/:caseId
```

#### Get Recommendation
```
GET /api/v1/ai/recommendation/:caseId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rec_abc123",
    "caseFileId": "case_xyz789",
    "confidenceScore": 75,
    
    "allopathy": {
      "approach": "Symptomatic management recommended",
      "suggestedActions": ["Consider antacid", "Monitor for 48h"],
      "genericFirst": true,
      "referralNeeded": false
    },
    
    "ayurveda": {
      "constitutionalNote": "Pitta aggravation suspected",
      "dietaryGuidance": ["Avoid spicy foods", "Prefer cooling foods"],
      "lifestyleGuidance": ["10pm sleep", "Morning walk"],
      "herbSuggestions": ["Shatavari", "Amla"],
      "yogaRecommendations": ["Pawanmuktasana"]
    },
    
    "contraindications": ["Avoid Mulethi if hypertensive"],
    "redFlags": ["Seek care if blood in stool"],
    
    "estimatedCostRange": {
      "min": 100,
      "max": 500,
      "currency": "INR"
    },
    
    "disclaimer": "⚠️ GUIDANCE, NOT DIAGNOSIS..."
  }
}
```

#### Pipeline Information
```
GET /api/v1/ai/pipeline
```

#### AI Service Health
```
GET /api/v1/ai/health
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input data |
| `NOT_FOUND` | Resource not found |
| `INVALID_STATE` | Invalid state transition |
| `DUPLICATE_ERROR` | Record already exists |
| `CONSTRAINT_ERROR` | Database constraint failed |
| `INTERNAL_ERROR` | Server error |

---

## Status Enums

**Case Status:**
- `DRAFT` - Initial state
- `PENDING_REVIEW` - Awaiting doctor review
- `REVIEWED` - Doctor has reviewed
- `CLOSED` - Case closed

**Case Priority:**
- `ROUTINE` - Normal priority
- `ELEVATED` - Needs attention
- `URGENT` - Immediate review needed

**Prakriti (Ayurvedic Constitution):**
- `VATA` - Air + Ether
- `PITTA` - Fire + Water
- `KAPHA` - Earth + Water

---

## Quick Test Commands

```bash
# Health check
curl http://localhost:3000/health

# Create patient
curl -X POST http://localhost:3000/api/v1/patients \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Patient","age":30,"gender":"M","phone":"9999999999","district":"Test","state":"Test"}'

# List patients
curl http://localhost:3000/api/v1/patients

# Create case
curl -X POST http://localhost:3000/api/v1/cases \
  -H "Content-Type: application/json" \
  -d '{"patientId":"pat_001","chiefComplaint":"Test complaint for 2 days","symptomDuration":"2 days"}'

# Trigger AI processing
curl -X POST http://localhost:3000/api/v1/ai/process/case_001

# Get recommendation
curl http://localhost:3000/api/v1/ai/recommendation/case_001
```
