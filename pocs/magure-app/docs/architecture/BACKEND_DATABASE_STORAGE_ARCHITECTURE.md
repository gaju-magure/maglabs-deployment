# Backend Database Storage Architecture

This document provides a comprehensive overview of how the Django backend stores chat sessions, messages, and AI metadata from the VLLM API.

## Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Model Definitions](#model-definitions)
3. [AI Metadata Storage](#ai-metadata-storage)
4. [Data Flow and Processing](#data-flow-and-processing)
5. [Storage Examples](#storage-examples)
6. [Database Configuration](#database-configuration)
7. [Indexing Strategy](#indexing-strategy)

## Database Schema Overview

The chat system uses three main models with PostgreSQL as the backend database:

```
ChatTemplate (1) ──────┐
                       │
                       ▼
User (1) ────────── ChatSession (1) ──────── ChatMessage (Many)
                       │                           │
                       └─── Idea (0..1)           └─── ChatMessage (parent)
```

## Model Definitions

### 1. ChatSession Model

**Table**: `ideas_chatsession`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key | Unique session identifier |
| `title` | VARCHAR(200) | Default: "New Chat" | Session display name |
| `status` | VARCHAR(20) | Default: "active" | active/archived/deleted |
| `user_id` | UUID | Foreign Key | Reference to User model |
| `template_id` | UUID | Foreign Key, Nullable | Reference to ChatTemplate |
| `submitted_idea_id` | UUID | Foreign Key, Nullable | Reference to created Idea |

#### MagLabs Integration Fields
| Field | Type | Description |
|-------|------|-------------|
| `maglabs_session_id` | VARCHAR(255) | MagLabs API session ID |
| `current_stage` | VARCHAR(50) | Current conversation stage |
| `stage_progress` | DECIMAL(3,2) | Progress 0.00-1.00 |
| `conversation_health` | VARCHAR(20) | Health status from MagLabs |
| `business_context` | JSONB | Business intelligence data |

#### Interview Configuration
| Field | Type | Description |
|-------|------|-------------|
| `interview_mode` | BOOLEAN | Structured interview enabled |
| `interview_type` | VARCHAR(50) | Interview flow type |
| `target_stages` | JSONB | Array of intended stages |
| `completed_stages` | JSONB | Array of completed stages |
| `interview_goals` | TEXT | Session objectives |

#### Metadata & Analytics
| Field | Type | Description |
|-------|------|-------------|
| `context_metadata` | JSONB | User context (role, dept, etc.) |
| `message_count` | INTEGER | Total message count |
| `total_tokens_used` | INTEGER | Cumulative token usage |
| `is_idea_submitted` | BOOLEAN | Whether idea was created |

#### Timestamps
| Field | Type | Description |
|-------|------|-------------|
| `created_at` | TIMESTAMP | Session creation time |
| `updated_at` | TIMESTAMP | Last modification time |
| `last_activity_at` | TIMESTAMP | Last user/AI interaction |

### 2. ChatMessage Model

**Table**: `ideas_chatmessage`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key | Unique message identifier |
| `session_id` | UUID | Foreign Key | Reference to ChatSession |
| `parent_message_id` | UUID | Foreign Key, Nullable | For threaded conversations |
| `sequence_number` | INTEGER | Unique per session | Message order in session |
| `role` | VARCHAR(20) | user/assistant/system | Message sender type |
| `content` | TEXT | | Message text content |
| `message_type` | VARCHAR(20) | | text/idea_draft/question/etc. |
| `ai_metadata` | JSONB | | Complete AI response metadata |
| `is_processed` | BOOLEAN | Default: True | Processing completion status |
| `processing_status` | VARCHAR(20) | Default: "completed" | Processing state |
| `error_message` | TEXT | Nullable | Error details if failed |
| `created_at` | TIMESTAMP | | Message creation time |
| `updated_at` | TIMESTAMP | | Last modification time |

**Constraints**:
- Unique constraint on `(session_id, sequence_number)`
- Check constraint: `sequence_number >= 1`

### 3. ChatTemplate Model

**Table**: `ideas_chattemplate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary Key |
| `name` | VARCHAR(100) | Template display name |
| `key` | VARCHAR(50) | Unique template identifier |
| `description` | TEXT | Template purpose |
| `content` | TEXT | Template instructions |
| `is_active` | BOOLEAN | Template availability |
| `department_id` | UUID | Department-specific template |
| `maglabs_interview_type` | VARCHAR(50) | MagLabs interview type |
| `expected_stages` | JSONB | Array of stage names |
| `stage_prompts` | JSONB | Custom prompts per stage |
| `temperature` | DECIMAL(2,1) | AI creativity (0.0-2.0) |
| `focus_stages` | JSONB | Emphasized stages |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last modification |

## AI Metadata Storage

The `ai_metadata` JSONB field in ChatMessage stores the complete response from the VLLM API. Here's the comprehensive structure:

### Core Response Fields
```json
{
  "content": "AI response text",
  "session_id": "maglabs-session-uuid",
  "stage": "current_stage_name",
  "stage_progress": 0.75,
  "conversation_health": "good"
}
```

### Stage Progression Data
```json
{
  "stage_completion": {
    "user_profiling": 0.89,
    "problem_capture": 0.67,
    "problem_clarification": 0.45,
    "solution_brainstorming": 0.23,
    "value_proposition": 0.12,
    "report_generation": 0.0
  }
}
```

### Business Intelligence
```json
{
  "business_context": {
    "problem_clarity_score": 0.72,
    "solution_readiness_score": 0.34,
    "market_understanding_score": 0.56,
    "value_proposition_score": 0.41,
    "feasibility_score": 0.63,
    "user_profile_completeness": 0.89,
    "technical_sophistication": 0.45,
    "implementation_readiness": 0.23,
    "stakeholder_engagement": 0.67,
    "urgency_level": "high",
    "budget_signals": "enterprise",
    "decision_authority": "high",
    "pain_points": [
      "Manual process inefficiency",
      "Data inconsistency issues"
    ],
    "success_criteria": [
      "50% time reduction",
      "Zero data errors"
    ],
    "business_drivers": [
      "Cost reduction",
      "Competitive advantage"
    ]
  }
}
```

### Conversation Health Metrics
```json
{
  "conversation_momentum": 0.82,
  "progress_velocity": 0.15,
  "estimated_remaining_seconds": 900,
  "flow_issues": [
    "User providing vague responses",
    "Circular discussion detected"
  ],
  "transition_triggers": [
    "sufficient_information",
    "user_readiness_confirmed"
  ]
}
```

### Quality Analytics
```json
{
  "quality_metrics": {
    "information_density": 0.78,
    "user_engagement": 0.85,
    "question_to_answer_ratio": 0.42,
    "stage_progression_rate": 0.68,
    "repetition_score": 0.15,
    "coherence_score": 0.92,
    "stuck_indicators": [
      "Repetitive questions",
      "Low information density"
    ],
    "progress_indicators": [
      "Active user participation",
      "Detailed responses",
      "Clear problem articulation"
    ],
    "intervention_suggestions": [
      "Ask for specific examples",
      "Provide context prompts",
      "Suggest breaking down complex topics"
    ]
  }
}
```

### AI Transparency Data
```json
{
  "ai_state": {
    "response_confidence": 0.87,
    "assumptions_made": [
      "User is B2B focused",
      "Technical implementation is feasible",
      "Budget is not a primary constraint"
    ],
    "assumption_confidence": 0.73,
    "clarification_needed": true,
    "clarification_topics": [
      "Target market size",
      "Competitive landscape",
      "Technical constraints"
    ],
    "reasoning": "Based on user's role as CTO and technical language used, assuming high technical sophistication. Budget signals indicate enterprise-level solution.",
    "alternative_approaches": [
      "Focus on technical feasibility first",
      "Explore MVP approach",
      "Consider phased implementation"
    ]
  }
}
```

### Next Actions and Recommendations
```json
{
  "next_actions": {
    "recommended_stage": "problem_clarification",
    "transition_ready": true,
    "client_actions": [
      "Gather customer feedback data",
      "Prepare technical requirements",
      "Identify key stakeholders"
    ],
    "estimated_completion": "15-20 minutes",
    "suggested_questions": [
      "What specific metrics would define success?",
      "Who are the primary users of this solution?",
      "What's the expected ROI timeframe?"
    ],
    "preparation_items": [
      "Market research data",
      "Technical architecture diagrams",
      "Budget constraints"
    ],
    "potential_blockers": [
      "Unclear technical requirements",
      "Multiple stakeholder approval needed",
      "Budget approval process"
    ]
  }
}
```

### Technical Metadata
```json
{
  "model": "gpt-4o-mini",
  "usage": {
    "prompt_tokens": 2341,
    "completion_tokens": 678,
    "total_tokens": 3019
  },
  "timestamp": "2025-06-16T10:30:00Z",
  "raw_metadata": {
    "original_response_fields": "preserved_here"
  },
  "parsing_summary": {
    "conversation_parsed": true,
    "quality_metrics_parsed": true,
    "business_context_parsed": true,
    "ai_state_parsed": true,
    "stage_completion_parsed": true,
    "next_actions_parsed": true,
    "total_fields_parsed": 6,
    "parsing_errors": [],
    "parsing_timestamp": "2025-06-16T10:30:00Z"
  }
}
```

## Data Flow and Processing

### 1. Session Creation Flow

```python
# views.py - ChatSessionViewSet.create()
def create(self, request):
    # 1. Create session with user context
    session_data = {
        'user': request.user,
        'context_metadata': {
            'user_role': user.role,
            'user_name': user.name,
            'department': user.department.name,
            'session_reset': str(uuid.uuid4()),  # Force new MagLabs session
            'reset_timestamp': timezone.now().isoformat(),
            'reset_reason': 'new_session'
        }
    }
    
    # 2. Apply template if selected
    if template_id:
        template = ChatTemplate.objects.get(id=template_id)
        session_data.update({
            'template': template,
            'interview_mode': True,
            'interview_type': template.maglabs_interview_type,
            'target_stages': template.expected_stages
        })
    
    # 3. Create session and initial message
    session = ChatSession.objects.create(**session_data)
    
    return session
```

### 2. Message Processing Flow

```python
# views.py - send_message action
def send_message(self, request, pk=None):
    session = self.get_object()
    
    # 1. Create user message
    user_message = ChatMessage.objects.create(
        session=session,
        role='user',
        content=request.data['content'],
        message_type=request.data.get('message_type', 'text'),
        sequence_number=session.message_count + 1
    )
    
    # 2. Build conversation history
    conversation_history = self._build_conversation_history(session)
    
    # 3. Send to MagLabs API
    response = maglabs_service.send_message(
        conversation_history=conversation_history,
        session=session,
        auth_token=request.auth_token
    )
    
    # 4. Parse and store AI response
    ai_message = ChatMessage.objects.create(
        session=session,
        role='assistant',
        content=response['content'],
        message_type='text',
        sequence_number=session.message_count + 2,
        ai_metadata=response  # Full VLLM response stored here
    )
    
    # 5. Update session with latest metadata
    session.maglabs_session_id = response.get('session_id')
    session.current_stage = response.get('stage')
    session.stage_progress = response.get('stage_progress', 0)
    session.conversation_health = response.get('conversation_health', 'good')
    session.business_context = response.get('business_context', {})
    session.message_count += 2
    session.total_tokens_used += response.get('metadata', {}).get('usage', {}).get('total_tokens', 0)
    session.last_activity_at = timezone.now()
    session.save()
    
    return ai_message
```

### 3. Metadata Parsing Strategy

```python
# maglabs_service.py - _parse_maglabs_metadata()
def _parse_maglabs_metadata(self, response_data):
    """Parse and structure MagLabs API response metadata"""
    
    # Handle string-encoded JSON fields
    def safe_json_parse(field_value):
        if isinstance(field_value, str):
            try:
                return json.loads(field_value)
            except json.JSONDecodeError:
                return field_value
        return field_value
    
    # Extract and parse all metadata fields
    parsed_metadata = {
        'stage_completion': safe_json_parse(response_data.get('stage_completion', {})),
        'business_context': safe_json_parse(response_data.get('business_context', {})),
        'quality_metrics': safe_json_parse(response_data.get('quality_metrics', {})),
        'ai_state': safe_json_parse(response_data.get('ai_state', {})),
        'next_actions': safe_json_parse(response_data.get('next_actions', {})),
        # ... continue for all fields
    }
    
    # Add parsing summary for debugging
    parsed_metadata['parsing_summary'] = {
        'total_fields_parsed': len([k for k, v in parsed_metadata.items() if v]),
        'parsing_timestamp': timezone.now().isoformat(),
        'parsing_errors': []
    }
    
    return parsed_metadata
```

## Storage Examples

### Example 1: Complete ChatSession Record

```sql
SELECT * FROM ideas_chatsession WHERE id = 'uuid-here';
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "E-commerce Analytics Platform",
  "status": "active",
  "user_id": "user-uuid",
  "template_id": "business-idea-template-uuid",
  "maglabs_session_id": "maglabs-session-uuid",
  "current_stage": "problem_clarification",
  "stage_progress": 0.67,
  "conversation_health": "good",
  "business_context": {
    "problem_clarity_score": 0.78,
    "solution_readiness_score": 0.45,
    "market_understanding_score": 0.62
  },
  "interview_mode": true,
  "interview_type": "business_idea",
  "target_stages": ["user_profiling", "problem_capture", "problem_clarification", "solution_brainstorming"],
  "completed_stages": ["user_profiling", "problem_capture"],
  "context_metadata": {
    "user_role": "Product Manager",
    "user_name": "John Doe",
    "department": "Product Development",
    "session_reset": "reset-uuid",
    "reset_timestamp": "2025-06-16T10:00:00Z"
  },
  "message_count": 12,
  "total_tokens_used": 15420,
  "is_idea_submitted": false,
  "created_at": "2025-06-16T10:00:00Z",
  "updated_at": "2025-06-16T10:30:00Z",
  "last_activity_at": "2025-06-16T10:30:00Z"
}
```

### Example 2: ChatMessage with Full AI Metadata

```sql
SELECT id, role, content, ai_metadata FROM ideas_chatmessage 
WHERE session_id = 'session-uuid' AND role = 'assistant' 
ORDER BY sequence_number DESC LIMIT 1;
```

```json
{
  "id": "message-uuid",
  "role": "assistant",
  "content": "Based on your description, it sounds like you're addressing a significant pain point in e-commerce analytics. Let me help you clarify the problem further. What specific metrics are most challenging for your target users to track currently?",
  "ai_metadata": {
    "stage": "problem_clarification",
    "stage_progress": 0.67,
    "conversation_health": "good",
    "conversation_momentum": 0.82,
    "progress_velocity": 0.15,
    "estimated_remaining_seconds": 900,
    "stage_completion": {
      "user_profiling": 0.95,
      "problem_capture": 0.78,
      "problem_clarification": 0.67,
      "solution_brainstorming": 0.0,
      "value_proposition": 0.0,
      "report_generation": 0.0
    },
    "business_context": {
      "problem_clarity_score": 0.78,
      "solution_readiness_score": 0.45,
      "market_understanding_score": 0.62,
      "pain_points": [
        "Fragmented analytics across platforms",
        "Manual data compilation",
        "Delayed insight generation"
      ],
      "success_criteria": [
        "Real-time dashboard updates",
        "Automated reporting",
        "Cross-platform data integration"
      ]
    },
    "quality_metrics": {
      "information_density": 0.78,
      "user_engagement": 0.85,
      "stuck_indicators": [],
      "intervention_suggestions": []
    },
    "ai_state": {
      "response_confidence": 0.87,
      "assumptions_made": [
        "User has e-commerce experience",
        "Analytics tools are current pain point"
      ],
      "clarification_needed": true,
      "clarification_topics": ["Specific metrics", "Current tools used"]
    },
    "next_actions": {
      "suggested_questions": [
        "What analytics tools do you currently use?",
        "Which metrics are most critical for your business?",
        "How often do you need these reports?"
      ],
      "recommended_stage": "problem_clarification",
      "estimated_completion": "10-15 minutes"
    },
    "model": "gpt-4o-mini",
    "usage": {
      "prompt_tokens": 1234,
      "completion_tokens": 567,
      "total_tokens": 1801
    },
    "timestamp": "2025-06-16T10:30:00Z"
  }
}
```

## Database Configuration

### PostgreSQL Configuration

```python
# config/settings/base.py
DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require',
        }
    }
}

# Multi-tenancy configuration
DATABASE_ROUTERS = ['django_tenants.routers.TenantSyncRouter']
TENANT_MODEL = "tenants.Tenant"
TENANT_DOMAIN_MODEL = "tenants.TenantDomain"
```

### JSONB Field Configuration

```python
# PostgreSQL JSONB advantages for ai_metadata:
# 1. Efficient storage and querying
# 2. Indexing support for nested fields
# 3. Partial updates without full rewrite
# 4. Schema flexibility for evolving AI responses

# Example queries enabled by JSONB:
# - Find sessions with high business context scores
# - Filter by conversation health status
# - Search for specific AI assumptions
# - Aggregate quality metrics across sessions
```

## Indexing Strategy

### Primary Indexes

```sql
-- ChatSession indexes
CREATE INDEX idx_chatsession_user_status ON ideas_chatsession(user_id, status);
CREATE INDEX idx_chatsession_last_activity ON ideas_chatsession(last_activity_at);
CREATE INDEX idx_chatsession_created_at ON ideas_chatsession(created_at);
CREATE INDEX idx_chatsession_maglabs_session ON ideas_chatsession(maglabs_session_id);

-- ChatMessage indexes
CREATE UNIQUE INDEX idx_chatmessage_session_sequence ON ideas_chatmessage(session_id, sequence_number);
CREATE INDEX idx_chatmessage_created_at ON ideas_chatmessage(created_at);
CREATE INDEX idx_chatmessage_role ON ideas_chatmessage(role);

-- ChatTemplate indexes
CREATE INDEX idx_chattemplate_active_dept ON ideas_chattemplate(is_active, department_id);
CREATE INDEX idx_chattemplate_key ON ideas_chattemplate(key);
```

### JSONB Indexes for AI Metadata

```sql
-- Index for conversation health queries
CREATE INDEX idx_chatmessage_conversation_health 
ON ideas_chatmessage USING GIN ((ai_metadata->'conversation_health'));

-- Index for stage progression queries
CREATE INDEX idx_chatmessage_stage 
ON ideas_chatmessage USING GIN ((ai_metadata->'stage'));

-- Index for quality metrics
CREATE INDEX idx_chatmessage_quality_metrics 
ON ideas_chatmessage USING GIN ((ai_metadata->'quality_metrics'));

-- Index for business context scores
CREATE INDEX idx_chatmessage_business_context 
ON ideas_chatmessage USING GIN ((ai_metadata->'business_context'));
```

### Query Performance Examples

```sql
-- Find sessions with poor conversation health
SELECT s.id, s.title, s.conversation_health 
FROM ideas_chatsession s 
WHERE s.conversation_health = 'poor';

-- Find messages with high confidence AI responses
SELECT m.id, m.content, m.ai_metadata->'ai_state'->>'response_confidence' as confidence
FROM ideas_chatmessage m 
WHERE CAST(m.ai_metadata->'ai_state'->>'response_confidence' AS FLOAT) > 0.9;

-- Aggregate quality metrics across all sessions
SELECT 
    AVG(CAST(ai_metadata->'quality_metrics'->>'information_density' AS FLOAT)) as avg_info_density,
    AVG(CAST(ai_metadata->'quality_metrics'->>'user_engagement' AS FLOAT)) as avg_engagement
FROM ideas_chatmessage 
WHERE role = 'assistant' AND ai_metadata ? 'quality_metrics';
```

## Data Retention and Cleanup

### Automatic Cleanup Policies

```python
# Implemented via Django management commands
# 1. Archive old sessions (> 90 days inactive)
# 2. Delete archived sessions (> 1 year)
# 3. Compress AI metadata for old messages
# 4. Clean up orphaned MagLabs sessions
```

### Backup Strategy

```python
# Full database backup: Daily
# Incremental backups: Hourly
# AI metadata export: Weekly (for analytics)
# Point-in-time recovery: 30 days
```

This architecture provides a robust, scalable storage system for AI-enhanced chat sessions with comprehensive metadata tracking and efficient querying capabilities.