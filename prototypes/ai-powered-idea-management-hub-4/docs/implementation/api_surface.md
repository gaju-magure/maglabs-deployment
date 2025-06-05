# API Surface Reference

This document provides a comprehensive reference for all API endpoints in the Magure Idea Hub backend service.

## Base Configuration

**Base URL:** `http://localhost:8000` (development) / `https://api.magure.ai` (production)  
**API Version:** v1  
**Content Type:** `application/json`  
**Authentication:** Bearer JWT tokens via Supabase Auth

### Authentication Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Standard Error Response
```json
{
  "error": "Error message description",
  "detail": "Additional error details",
  "code": "ERROR_CODE"
}
```

## 1. Authentication & Users

### GET /api/v1/auth/me
Get current authenticated user information.

**Authentication:** Required  
**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "roles": ["CONTRIBUTOR"],
  "organization_id": "uuid",
  "last_login_at": "2025-01-21T10:30:00Z"
}
```

## 2. Categories & Taxonomy

### GET /api/v1/categories
List all idea categories with metadata.

**Authentication:** Required  
**Query Parameters:**
- `include_inactive` (boolean): Include inactive categories (default: false)

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "code": "PRODUCT_INNOVATION",
      "name": "Product Innovation",
      "description": "New product development and enhancement",
      "capture_fields": {
        "problem_statement": {
          "type": "text",
          "required": true,
          "max_length": 500
        },
        "target_persona": {
          "type": "text",
          "required": true,
          "max_length": 200
        }
      },
      "screen_rules": {
        "similarity_threshold": 0.85,
        "roi_minimum": 1.2
      },
      "eval_weights": {
        "market": 0.30,
        "strategic_fit": 0.25,
        "feasibility": 0.20,
        "roi": 0.15,
        "risk": 0.10
      },
      "approve_gate": {
        "composite_min": 75,
        "roadmap_slot_quarters": 2
      },
      "incubate_track": {
        "handoff": "Jira Epic",
        "kpis": ["velocity", "feature_adoption", "nps_delta"]
      },
      "is_active": true
    }
  ]
}
```

### GET /api/v1/categories/{code}
Get specific category details by code.

**Authentication:** Required  
**Path Parameters:**
- `code` (string): Category code (e.g., "PRODUCT_INNOVATION")

**Response:** Single category object (same structure as above)

## 3. Ideas Management

### POST /api/v1/ideas
Create a new idea.

**Authentication:** Required  
**Request Body:**
```json
{
  "title": "AI-Powered Smart Toaster",
  "description": "A toaster that uses AI to perfectly toast bread based on visual analysis",
  "categories": ["PRODUCT_INNOVATION", "TECHNOLOGICAL_INNOVATION"],
  "initial_answers": {
    "problem_statement": "Inconsistent toasting results",
    "target_market": "Tech-savvy consumers"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "AI-Powered Smart Toaster",
  "description": "A toaster that uses AI to perfectly toast bread...",
  "submitter_user_id": "uuid",
  "submitter_email": "user@example.com",
  "status": "DRAFT",
  "tags": [
    {
      "category": "PRODUCT_INNOVATION",
      "source": "user_manual",
      "is_primary": true,
      "confidence": null
    }
  ],
  "created_at": "2025-01-21T10:30:00Z",
  "updated_at": "2025-01-21T10:30:00Z"
}
```

### GET /api/v1/ideas
List ideas with filtering and pagination.

**Authentication:** Required  
**Query Parameters:**
- `skip` (integer): Number of items to skip (default: 0)
- `limit` (integer): Maximum items to return (default: 10, max: 100)
- `status` (string): Filter by status
- `category` (string): Filter by category code
- `submitter_id` (uuid): Filter by submitter
- `search` (string): Text search in title/description

**Response:**
```json
{
  "ideas": [
    {
      "id": "uuid",
      "title": "AI-Powered Smart Toaster",
      "description": "A toaster that uses AI...",
      "status": "UNDER_EVALUATION",
      "tags": [...],
      "submitter_email": "user@example.com",
      "value_score": 75.5,
      "clarity_score": 0.85,
      "created_at": "2025-01-21T10:30:00Z"
    }
  ],
  "total": 150,
  "skip": 0,
  "limit": 10
}
```

### GET /api/v1/ideas/{id}
Get specific idea details.

**Authentication:** Required  
**Path Parameters:**
- `id` (uuid): Idea ID

**Response:**
```json
{
  "id": "uuid",
  "title": "AI-Powered Smart Toaster",
  "description": "Detailed description...",
  "submitter_user_id": "uuid",
  "submitter_email": "user@example.com",
  "status": "UNDER_EVALUATION",
  "tags": [
    {
      "category": "PRODUCT_INNOVATION",
      "source": "user_manual",
      "is_primary": true,
      "confidence": null
    },
    {
      "category": "TECHNOLOGICAL_INNOVATION",
      "source": "ai_suggested",
      "is_primary": false,
      "confidence": 0.85
    }
  ],
  "value_assessment": {
    "value_band_selections": {
      "revenue_impact": "BAND_B",
      "cost_saving": "NOT_APPLICABLE"
    },
    "effort_points_selection": "M",
    "calculated_roi_index": 1.75,
    "normalized_value_score": 75.5
  },
  "quality_metrics": {
    "ai_completeness_score": 0.90,
    "ai_clarity_score": 0.85,
    "overall_quality_score": 0.875
  },
  "chat_history": [
    {
      "id": "uuid",
      "sender": "ai",
      "text": "Can you tell me more about the target market?",
      "timestamp": "2025-01-21T10:31:00Z"
    },
    {
      "id": "uuid",
      "sender": "user",
      "text": "Tech enthusiasts who appreciate precision",
      "timestamp": "2025-01-21T10:32:00Z"
    }
  ],
  "answers": [
    {
      "question_id": "Q1_PROBLEM",
      "text": "Inconsistent toasting results frustrate users",
      "answered_at": "2025-01-21T10:30:00Z"
    }
  ],
  "created_at": "2025-01-21T10:30:00Z",
  "updated_at": "2025-01-21T10:35:00Z"
}
```

### PATCH /api/v1/ideas/{id}
Update idea details.

**Authentication:** Required  
**Path Parameters:**
- `id` (uuid): Idea ID

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "SUBMITTED"
}
```

### PATCH /api/v1/ideas/{id}/status
Update idea status (typically used by AI agents).

**Authentication:** Required  
**Path Parameters:**
- `id` (uuid): Idea ID

**Request Body:**
```json
{
  "status": "SCREENING_PASSED",
  "reason": "All automated checks passed",
  "updated_by_agent": "screening_agent"
}
```

### PATCH /api/v1/ideas/{id}/value
Update value band selections and ROI data.

**Authentication:** Required  
**Path Parameters:**
- `id` (uuid): Idea ID

**Request Body:**
```json
{
  "value_band_selections": {
    "revenue_impact": "BAND_C",
    "cost_saving": "BAND_B",
    "risk_reduction": "NOT_APPLICABLE"
  },
  "effort_points_selection": "L",
  "evidence_urls": [
    "https://example.com/market-research.pdf"
  ]
}
```

**Response:**
```json
{
  "calculated_roi_index": 2.1,
  "normalized_value_score": 82.3,
  "updated_at": "2025-01-21T10:40:00Z"
}
```

### DELETE /api/v1/ideas/{id}
Delete an idea (restricted to drafts and admins).

**Authentication:** Required  
**Path Parameters:**
- `id` (uuid): Idea ID

**Response:**
```json
{
  "message": "Idea deleted successfully"
}
```

## 4. AI Processing

### POST /api/v1/categorize
AI-powered idea categorization.

**Authentication:** Required  
**Request Body:**
```json
{
  "title": "Smart home energy optimizer",
  "description": "An AI system that learns household patterns to optimize energy usage"
}
```

**Response:**
```json
{
  "category": "TECHNOLOGICAL_INNOVATION",
  "confidence": 0.89,
  "alternative_categories": [
    {
      "category": "SUSTAINABILITY_INNOVATION",
      "confidence": 0.75
    }
  ]
}
```

### POST /api/v1/evaluate
AI-powered answer evaluation for questionnaire.

**Authentication:** Required  
**Request Body:**
```json
{
  "mainQuestion": {
    "id": "Q1_PROBLEM",
    "stage": 1,
    "theme": "Core Idea & Problem",
    "text": "What specific problem does this idea solve?",
    "isMandatory": true
  },
  "userAnswerText": "People waste energy because they don't know when to turn things off",
  "fullChatHistory": [
    {
      "id": "msg1",
      "sender": "ai",
      "text": "What specific problem does this idea solve?",
      "timestamp": "2025-01-21T10:30:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "type": "proceed",
  "aiResponseToUser": "That's a clear problem statement. Energy awareness is definitely important for households.",
  "finalAnswerForQuestion": "Households waste energy due to lack of awareness about optimal usage timing",
  "clarityMeterDelta": 0.25,
  "nextSuggestedQuestion": {
    "id": "Q2_MARKET",
    "text": "Who is your target market for this solution?"
  }
}
```

## 5. CrewAI Orchestration

### POST /api/v1/crewai/trigger
Trigger a CrewAI flow manually.

**Authentication:** Required (Admin role)  
**Request Body:**
```json
{
  "flow_type": "screening",
  "idea_id": "uuid",
  "parameters": {
    "force_rerun": false,
    "skip_duplicate_check": false
  }
}
```

**Response:**
```json
{
  "flow_id": "uuid",
  "status": "STARTED",
  "estimated_completion": "2025-01-21T10:35:00Z"
}
```

### GET /api/v1/crewai/flows/{flow_id}
Get status of a CrewAI flow execution.

**Authentication:** Required  
**Path Parameters:**
- `flow_id` (uuid): Flow execution ID

**Response:**
```json
{
  "flow_id": "uuid",
  "flow_type": "screening",
  "status": "COMPLETED",
  "idea_id": "uuid",
  "started_at": "2025-01-21T10:30:00Z",
  "completed_at": "2025-01-21T10:33:00Z",
  "agents_executed": [
    {
      "agent_name": "screening_agent",
      "status": "COMPLETED",
      "execution_time_ms": 1500,
      "tokens_used": 850
    }
  ],
  "results": {
    "screening_passed": true,
    "quality_score": 0.87,
    "duplicate_probability": 0.02
  }
}
```

### POST /api/v1/crewai/webhook
Webhook endpoint for CrewAI flow callbacks.

**Authentication:** API Key  
**Request Body:**
```json
{
  "flow_id": "uuid",
  "event_type": "flow_completed",
  "payload": {
    "status": "COMPLETED",
    "results": {...}
  },
  "timestamp": "2025-01-21T10:33:00Z"
}
```

## 6. Analytics & Reporting

### GET /api/v1/analytics/dashboard
Get dashboard metrics and KPIs.

**Authentication:** Required  
**Query Parameters:**
- `period` (string): Time period (7d, 30d, 90d, 1y)
- `category` (string): Filter by category (optional)

**Response:**
```json
{
  "period": "30d",
  "metrics": {
    "ideas_submitted": 45,
    "ideas_approved": 12,
    "approval_rate": 0.267,
    "avg_processing_time_days": 4.2,
    "top_categories": [
      {
        "category": "PRODUCT_INNOVATION",
        "count": 18,
        "approval_rate": 0.33
      }
    ],
    "value_score_distribution": {
      "0-25": 5,
      "26-50": 12,
      "51-75": 18,
      "76-100": 10
    }
  }
}
```

### GET /api/v1/analytics/roi-trends
Get ROI calculation trends and value score history.

**Authentication:** Required  
**Response:**
```json
{
  "last_recalculation": "2025-01-21T02:00:00Z",
  "total_ideas_in_baseline": 450,
  "value_score_trends": [
    {
      "date": "2025-01-14",
      "median_roi_index": 1.8,
      "median_value_score": 65.2
    }
  ],
  "category_performance": [
    {
      "category": "PRODUCT_INNOVATION",
      "avg_roi_index": 2.1,
      "avg_value_score": 72.5
    }
  ]
}
```

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., duplicate) |
| 422 | UNPROCESSABLE_ENTITY | Semantic validation error |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | External service unavailable |

## Rate Limiting

**Standard Limits:**
- 100 requests per minute per user
- 1000 requests per minute per organization
- AI endpoints: 10 requests per minute per user

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642781234
```

This API surface provides comprehensive access to all functionality while maintaining security, performance, and usability standards.
