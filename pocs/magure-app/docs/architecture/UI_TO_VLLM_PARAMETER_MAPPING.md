# UI to VLLM API Parameter Mapping

This document maps parameters from the UI through the backend to the VLLM API, showing what data is visible in the UI and how it flows through the system.

## Request Flow: UI → Backend → VLLM API

### 1. Request Parameters (UI → VLLM API)

| UI Element | Backend Parameter | VLLM API Parameter | Type | Required | Description |
|------------|-------------------|-------------------|------|----------|-------------|
| Chat Input | `content` | `messages[].content` | string | Yes | User's message text |
| Session Context | `session_id` | Header: `X-Session-ID` | string | No | Maintains conversation continuity |
| Template Selection | `template.key` | `metadata.interview_type` | string | Yes | Template type (e.g., "business_idea") |
| Focus Stages | `template.focus_stages[]` | `metadata.focus_stages` | string | Yes | Comma-separated stages or "all" |
| Instructions | `template.content` | `metadata.instructions` | string | Yes | Template-specific instructions |
| User Profile | `user.role` | `metadata.user_context.user_role` | string | Yes | User's role in organization |
| User Name | `user.name` | `metadata.user_context.user_name` | string | Yes | User's display name |
| Department | `user.department` | `metadata.user_context.department` | string | No | User's department |
| Temperature | `template.temperature` | `temperature` | float | Yes | AI response creativity (0.0-1.0) |
| Model | (hardcoded) | `model` | string | Yes | Currently "gpt-4o-mini" |

## Response Flow: VLLM API → Backend → UI

### 2. Core Response Parameters (VLLM API → UI)

| VLLM API Response | Backend Storage | UI Display Location | Type | Description |
|-------------------|-----------------|---------------------|------|-------------|
| `content` | `ChatMessage.content` | Chat message bubble | string | AI's response text |
| `session_id` | `ChatSession.maglabs_session_id` | (internal use) | string | VLLM session identifier |
| `stage` | `ChatSession.current_stage` | Stage progress meter header | string | Current conversation stage |
| `stage_progress` | `ChatSession.stage_progress` | Progress bar (0-100%) | float | Overall stage completion |
| `conversation_health` | `ChatSession.conversation_health` | Health indicator color/text | string | "excellent", "good", "fair", "poor" |

### 3. Enhanced Metadata (Visible in UI)

| VLLM API Response | UI Component | Display Format | Description |
|-------------------|--------------|----------------|-------------|
| `conversation_momentum` | ConversationHealthIndicator | Momentum bar + "Gaining/Steady/Losing" | Rate of progress change |
| `progress_velocity` | ConversationHealthIndicator | Velocity indicator + percentage | Current progress speed |
| `estimated_remaining_seconds` | ConversationHealthIndicator | "~X minutes remaining" | Time to completion estimate |
| `quality_metrics.user_engagement` | ConversationHealthIndicator | Engagement level indicator | User participation quality |
| `quality_metrics.information_density` | StageProgressMeter | Density indicator | Information richness score |
| `quality_metrics.stuck_indicators[]` | InterventionSuggestions | Warning messages | Issues blocking progress |
| `quality_metrics.intervention_suggestions[]` | InterventionSuggestions | Suggestion cards | Recommended actions |

### 4. Business Context Scores (Visible in Progress Meter)

| VLLM API Response | UI Display | Range | Description |
|-------------------|------------|-------|-------------|
| `business_context.problem_clarity_score` | Progress sub-meter | 0-100 | How well problem is defined |
| `business_context.solution_readiness_score` | Progress sub-meter | 0-100 | Solution maturity level |
| `business_context.market_understanding_score` | Progress sub-meter | 0-100 | Market knowledge depth |
| `business_context.value_proposition_score` | Progress sub-meter | 0-100 | Value prop strength |
| `business_context.feasibility_score` | Progress sub-meter | 0-100 | Implementation feasibility |
| `business_context.user_profile_completeness` | Progress sub-meter | 0-100 | User info completeness |

### 5. AI Transparency Data (Visible in AI Panel)

| VLLM API Response | UI Display | Description |
|-------------------|------------|-------------|
| `ai_state.response_confidence` | Confidence meter (0-100%) | AI's confidence in response |
| `ai_state.assumptions_made[]` | Assumption list | Key assumptions AI made |
| `ai_state.clarification_needed` | Clarification indicator | Whether more info needed |
| `ai_state.clarification_topics[]` | Topic badges | Areas needing clarification |
| `ai_state.reasoning` | Expandable text | AI's reasoning process |

### 6. Stage Completion Tracking

| VLLM API Response | UI Display | Description |
|-------------------|------------|-------------|
| `stage_completion.user_profiling` | Stage 1 progress | User profiling completion |
| `stage_completion.problem_capture` | Stage 2 progress | Problem capture completion |
| `stage_completion.problem_clarification` | Stage 3 progress | Problem clarification completion |
| `stage_completion.solution_brainstorming` | Stage 4 progress | Solution brainstorming completion |
| `stage_completion.value_proposition` | Stage 5 progress | Value proposition completion |
| `stage_completion.report_generation` | Stage 6 progress | Report generation completion |

### 7. Next Actions (Visible in Suggestions)

| VLLM API Response | UI Display | Description |
|-------------------|------------|-------------|
| `next_actions.suggested_questions[]` | Question suggestion cards | Recommended questions to ask |
| `next_actions.recommended_stage` | Stage transition prompt | Suggested next stage |
| `next_actions.client_actions[]` | Action items list | Things user should do |
| `next_actions.estimated_completion` | Time estimate | When session might complete |

## Important Notes for VLLM API Team

1. **Required Parameters**: All parameters marked as "Required" must be present for the UI to function correctly.

2. **Data Types**: Please ensure all numeric scores are returned as floats between 0.0 and 1.0 (we multiply by 100 for percentage display).

3. **String Enums**: 
   - `conversation_health`: Must be one of ["excellent", "good", "fair", "poor"]
   - `stage`: Must match one of the predefined stage names

4. **Arrays**: All array fields should be returned as empty arrays `[]` if no data, not null.

5. **Session Continuity**: The `session_id` returned in responses is crucial for maintaining conversation context across multiple interactions.

6. **Metadata Structure**: The `metadata.user_context` field must be a JSON string containing the user context object.

7. **Token Tracking**: Please include token usage in `metadata.usage` for billing and limit tracking.

## Example VLLM API Request

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "User's message"}
  ],
  "temperature": 0.7,
  "stream": false,
  "metadata": {
    "interview_type": "business_idea",
    "focus_stages": "problem_capture,problem_clarification",
    "instructions": "Template instructions here...",
    "user_context": "{\"user_role\":\"Manager\",\"user_name\":\"John Doe\",\"department\":\"Sales\"}"
  }
}
```

## Example VLLM API Response (Key Fields for UI)

```json
{
  "content": "AI response text...",
  "session_id": "uuid-here",
  "stage": "problem_capture",
  "stage_progress": 0.45,
  "conversation_health": "good",
  "conversation_momentum": 0.15,
  "progress_velocity": 0.08,
  "estimated_remaining_seconds": 1200,
  "business_context": {
    "problem_clarity_score": 0.72,
    "solution_readiness_score": 0.34,
    "market_understanding_score": 0.56,
    "value_proposition_score": 0.41,
    "feasibility_score": 0.63,
    "user_profile_completeness": 0.89
  },
  "quality_metrics": {
    "information_density": 0.68,
    "user_engagement": 0.75,
    "stuck_indicators": ["User providing vague responses"],
    "intervention_suggestions": ["Ask for specific examples"]
  },
  "ai_state": {
    "response_confidence": 0.82,
    "assumptions_made": ["User is in B2B sales"],
    "clarification_needed": true,
    "clarification_topics": ["Target market size"],
    "reasoning": "Based on the user's role..."
  },
  "stage_completion": {
    "user_profiling": 0.89,
    "problem_capture": 0.45,
    "problem_clarification": 0.12,
    "solution_brainstorming": 0.0,
    "value_proposition": 0.0,
    "report_generation": 0.0
  },
  "next_actions": {
    "suggested_questions": [
      "Can you describe a specific customer pain point?",
      "What solutions have you already tried?"
    ],
    "recommended_stage": "problem_clarification",
    "client_actions": ["Gather customer feedback data"],
    "estimated_completion": "20-25 minutes"
  },
  "metadata": {
    "model": "gpt-4o-mini",
    "usage": {
      "prompt_tokens": 1234,
      "completion_tokens": 567,
      "total_tokens": 1801
    }
  }
}
```