# UI → Backend → VLLM API Parameter Mapping

This document maps the parameters that are visible and used in the UI components to their corresponding backend and VLLM API parameters.

## Overview

The data flow follows this path:
1. **Frontend UI** (React components) displays data from `ChatSessionDetail`
2. **Backend Django** processes and stores data in models, sends to MagLabs service
3. **MagLabs Service** formats and sends to VLLM API
4. **VLLM API** returns enhanced metadata that flows back through the system

## Core Session Parameters

| UI Element | UI Property Path | Backend Model Field | VLLM API Parameter |
|------------|------------------|---------------------|-------------------|
| Session Title | `session.title` | `ChatSession.title` | Not sent to API |
| Message Count | `session.message_count` | `ChatSession.message_count` | Not sent to API |
| Token Usage | `session.total_tokens_used` | `ChatSession.total_tokens_used` | Returned in `usage.total_tokens` |
| Interview Mode Badge | `session.ai_metadata.interview_mode` | `ChatSession.interview_mode` | `metadata.interview_type` |

## Stage Progression Parameters

| UI Element | UI Property Path | Backend Model Field | VLLM API Parameter |
|------------|------------------|---------------------|-------------------|
| Current Stage Name | `session.current_stage` or `stageData.stage_name` | `ChatSession.current_stage` | Returned in response metadata |
| Stage Progress % | `session.stage_progress` | `ChatSession.stage_progress` | Returned as `stage_progress` |
| Stage Completion Scores | `stageData.stage_completion` | Stored in `ai_metadata` | Returned as `stage_completion` |
| Progress Dots/Badges | Calculated from `currentStageIndex` | Derived from `current_stage` | Not directly sent |

## Business Context Parameters

| UI Element | UI Property Path | Backend Model Field | VLLM API Parameter |
|------------|------------------|---------------------|-------------------|
| Problem Clarity Score | `stageData.business_context.problem_clarity` | `ChatSession.business_context` | Returned in `business_context.problem_clarity` |
| Solution Readiness | `stageData.business_context.solution_readiness` | `ChatSession.business_context` | Returned in `business_context.solution_readiness` |
| Profile Completion | `stageData.business_context.profile_completion_score` | `ChatSession.business_context` | Returned in `business_context.profile_completion_score` |
| Technical Sophistication | `session.business_context.technical_sophistication` | `ChatSession.business_context` | Returned in `business_context.technical_sophistication` |
| Implementation Readiness | `session.business_context.implementation_readiness` | `ChatSession.business_context` | Returned in `business_context.implementation_readiness` |
| Stakeholder Engagement | `session.business_context.stakeholder_engagement` | `ChatSession.business_context` | Returned in `business_context.stakeholder_engagement` |
| Urgency Level | `session.business_context.urgency_level` | `ChatSession.business_context` | Returned in `business_context.urgency_level` |
| Budget Signals | `session.business_context.budget_signals` | `ChatSession.business_context` | Returned in `business_context.budget_signals` |
| Decision Authority | `session.business_context.decision_authority` | `ChatSession.business_context` | Returned in `business_context.decision_authority` |

## Conversation Health & Quality Metrics

| UI Element | UI Property Path | Backend Model Field | VLLM API Parameter |
|------------|------------------|---------------------|-------------------|
| Health Indicator | `session.conversation_health` | `ChatSession.conversation_health` | Returned as `conversation_health` |
| Conversation Momentum | `session.conversation_momentum` | Via response | Returned as `conversation_momentum` |
| Progress Velocity | `session.progress_velocity` | Via response | Returned as `progress_velocity` |
| Estimated Time Remaining | `session.estimated_remaining_seconds` | Via response | Returned as `estimated_remaining_seconds` |
| Information Density | `session.quality_metrics.information_density` | Via response | Returned in `quality_metrics.information_density` |
| User Engagement | `session.quality_metrics.user_engagement` | Via response | Returned in `quality_metrics.user_engagement` |
| Q&A Ratio | `session.quality_metrics.question_to_answer_ratio` | Via response | Returned in `quality_metrics.question_to_answer_ratio` |
| Stage Progression Rate | `session.quality_metrics.stage_progression_rate` | Via response | Returned in `quality_metrics.stage_progression_rate` |
| Repetition Score | `session.quality_metrics.repetition_score` | Via response | Returned in `quality_metrics.repetition_score` |
| Coherence Score | `session.quality_metrics.coherence_score` | Via response | Returned in `quality_metrics.coherence_score` |

## AI Transparency Parameters

| UI Element | UI Property Path | Backend Model Field | VLLM API Parameter |
|------------|------------------|---------------------|-------------------|
| Response Confidence | `session.ai_state.response_confidence` | Via response | Returned in `ai_state.response_confidence` |
| Assumptions Made | `session.ai_state.assumptions_made` | Via response | Returned in `ai_state.assumptions_made` |
| Assumption Confidence | `session.ai_state.assumption_confidence` | Via response | Returned in `ai_state.assumption_confidence` |
| Clarification Needed | `session.ai_state.clarification_needed` | Via response | Returned in `ai_state.clarification_needed` |
| Clarification Topics | `session.ai_state.clarification_topics` | Via response | Returned in `ai_state.clarification_topics` |
| AI Reasoning | `session.ai_state.reasoning` | Via response | Returned in `ai_state.reasoning` |
| Alternative Approaches | `session.ai_state.alternative_approaches` | Via response | Returned in `ai_state.alternative_approaches` |

## Flow Control Parameters

| UI Element | UI Property Path | Backend Model Field | VLLM API Parameter |
|------------|------------------|---------------------|-------------------|
| Stuck Indicators | `session.flow_issues` | Via response | Returned as `flow_issues` |
| Progress Indicators | `session.quality_metrics.progress_indicators` | Via response | Returned in `quality_metrics.progress_indicators` |
| Intervention Suggestions | `session.quality_metrics.intervention_suggestions` | Via response | Returned in `quality_metrics.intervention_suggestions` |
| Transition Triggers | `session.transition_triggers` | Via response | Returned as `transition_triggers` |
| Transition Ready | `stageData.transition_ready` | Via response | Returned as `transition_ready` |

## Next Actions & Suggestions

| UI Element | UI Property Path | Backend Model Field | VLLM API Parameter |
|------------|------------------|---------------------|-------------------|
| Recommended Stage | `session.next_actions.recommended_stage` | Via response | Returned in `next_actions.recommended_stage` |
| Suggested Questions | `session.next_actions.suggested_questions` | Via response | Returned in `next_actions.suggested_questions` |
| Client Actions | `session.next_actions.client_actions` | Via response | Returned in `next_actions.client_actions` |
| Preparation Items | `session.next_actions.preparation_items` | Via response | Returned in `next_actions.preparation_items` |
| Potential Blockers | `session.next_actions.potential_blockers` | Via response | Returned in `next_actions.potential_blockers` |

## User Context Parameters (Sent to VLLM)

| UI Element | Backend Source | VLLM API Parameter |
|------------|----------------|-------------------|
| User Role | `session.context_metadata.user_role` | `metadata.user_context` (JSON string) |
| User Name | `session.context_metadata.user_name` | `metadata.user_context` (JSON string) |
| Department | `session.context_metadata.department` | `metadata.user_context` (JSON string) |
| Custom Role | `session.context_metadata.custom_role` | `metadata.user_context` (JSON string) |

## Template Configuration (Sent to VLLM)

| Configuration | Backend Source | VLLM API Parameter |
|--------------|----------------|-------------------|
| Interview Type | `template.conversation_type` → config | `metadata.interview_type` |
| Focus Stages | `CONVERSATION_TYPE_CONFIGS[type].focus_stages` | `metadata.focus_stages` (comma-separated string) |
| Temperature | `CONVERSATION_TYPE_CONFIGS[type].temperature` | `temperature` |
| Instructions | `CONVERSATION_TYPE_CONFIGS[type].instructions` | `metadata.instructions` |

## Message History (Sent to VLLM)

| Data | Backend Processing | VLLM API Parameter |
|------|-------------------|-------------------|
| Conversation History | Built from `ChatMessage` objects | `messages` array with role/content |
| Session ID | `session.maglabs_session_id` | `X-Session-ID` header |

## Key UI Components Using These Parameters

1. **ChatInterface.tsx**
   - Displays: token usage, interview mode, stage progress dots
   - Uses: `session.total_tokens_used`, `session.ai_metadata.interview_mode`, stage progression

2. **UnifiedChatInterface.tsx**
   - Displays: health indicator, progress meter, AI transparency, interventions
   - Uses: All enhanced metadata fields

3. **StageProgressMeter.tsx**
   - Displays: detailed stage progression with scores
   - Uses: `stageData`, `business_context` scores, `currentStageProgress`

4. **ConversationHealthIndicator.tsx**
   - Displays: health status, momentum, velocity
   - Uses: `conversation_health`, `conversation_momentum`, `progress_velocity`

5. **AITransparencyPanel.tsx**
   - Displays: AI confidence, assumptions, clarifications
   - Uses: All `ai_state` fields

6. **InterventionSuggestions.tsx**
   - Displays: suggested questions and actions
   - Uses: `intervention_suggestions`, `suggested_questions`

7. **EnhancedProgressMeter.tsx**
   - Displays: comprehensive progress visualization
   - Uses: All progress-related metadata

## Data Flow Example

1. **User sends message** → Frontend calls `sendMessage()`
2. **Backend processes**:
   - Creates user `ChatMessage`
   - Calls `MagLabsService.send_message()` with:
     - `messages` (conversation history)
     - `user_context` (user metadata as JSON string)
     - `session_id` (if exists)
     - `conversation_config` (from template)
3. **MagLabs Service** sends to VLLM API:
   ```json
   {
     "model": "gpt-4o-mini",
     "messages": [...],
     "temperature": 0.7,
     "metadata": {
       "interview_type": "business_idea",
       "focus_stages": "user_profiling,problem_capture",
       "instructions": "...",
       "user_context": "{\"user_role\":\"...\", ...}"
     }
   }
   ```
4. **VLLM API returns** enhanced response with all metadata
5. **Backend stores** metadata in:
   - `ChatMessage.ai_metadata`
   - Updates `ChatSession` fields
6. **Frontend receives** `ChatSessionDetail` with all fields populated
7. **UI components render** based on available data

## Notes

- Not all parameters are always present - UI components handle missing data gracefully
- Some parameters (like progress dots) are calculated client-side from other data
- The VLLM API is the source of truth for all AI-generated metadata
- User context is serialized as JSON string when sent to VLLM API