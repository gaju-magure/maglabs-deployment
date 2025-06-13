# Conversation Types Implementation Analysis

## Table of Contents
1. [Current Implementation Overview](#current-implementation-overview)
2. [The Gap: Expected vs Actual Behavior](#the-gap-expected-vs-actual-behavior)
3. [Technical Analysis](#technical-analysis)
4. [Proposed Improvements](#proposed-improvements)
5. [Implementation Roadmap](#implementation-roadmap)

## Current Implementation Overview

### Conversation Types Defined

The system defines 5 conversation types in `ChatSession.CONVERSATION_TYPES`:
- **brainstorm**: Brainstorming new ideas
- **refine**: Idea Refinement  
- **general**: General Chat
- **problem_solving**: Problem Solving
- **feature_design**: Feature Design

### Templates System

Chat templates are stored in the database with:
- `name`: Template name
- `description`: What the template is for
- `conversation_type`: Associated conversation type
- `initial_prompt`: Starting message for the conversation
- `system_prompt_override`: Custom system prompt (stored but underutilized)

### Current User Flow

1. User selects a conversation type or template in the UI
2. Frontend creates a chat session with the selected `conversation_type`
3. The type is stored in the database but **not actively used** in AI interactions
4. All conversations receive the same generic AI behavior

## The Gap: Expected vs Actual Behavior

### What Users Expect

Based on the UI presentation, users expect:

| Conversation Type | Expected AI Behavior |
|------------------|---------------------|
| **Brainstorming** | Creative, exploratory, encouraging wild ideas, asking "what if" questions |
| **Refine Ideas** | Structured, analytical, focusing on feasibility and implementation details |
| **Problem Solving** | Diagnostic approach, root cause analysis, systematic solution evaluation |
| **General Chat** | Flexible, conversational, adaptive to user needs |
| **Feature Design** | Technical focus, user story creation, architecture considerations |

### What Actually Happens

All conversation types receive the **same generic system prompt**:

```python
# From OpenAIService._build_contextual_system_prompt()
base_prompt = """You are an expert product manager and innovation coach within a corporate environment. 
Your role is to help users refine and develop their ideas through constructive dialogue.

Key responsibilities:
1. Ask clarifying questions to understand the full scope of ideas
2. Identify potential challenges and suggest solutions  
3. Help structure ideas into actionable proposals
4. Consider technical feasibility and business value
5. Guide users toward clear, implementable solutions
...
```

**Result**: Regardless of the selected conversation type, the AI behaves the same way.

## Technical Analysis

### Where Conversation Types Get Lost

1. **ChatSessionCreateSerializer** (`serializers.py:323-387`)
   - Stores `conversation_type` in the session
   - Applies `system_prompt_override` from templates to session
   - But this is where it stops

2. **ChatSessionViewSet.send_message()** (`views.py:399-548`)
   - Builds conversation history
   - Calls `ai_service.chat_completion()`
   - **Does not pass conversation type or session's system prompt**

3. **OpenAIService.chat_completion()** (`openai_service.py:28-82`)
   - Uses generic system prompt via `_build_contextual_system_prompt()`
   - **Ignores session's conversation_type and system_prompt**

### Key Code Showing the Gap

```python
# views.py - send_message method
def send_message(self, request, pk=None):
    session = self.get_object()
    # ...
    
    # Build conversation history
    conversation_history = self._build_conversation_history(session)
    
    # Get AI response - conversation_type is NOT passed!
    ai_response_data = ai_service.chat_completion(
        messages=conversation_history,
        session_context=session.context_metadata,  # Only user context
        session_id=session.ai_metadata.get('interview_session_id')
    )
```

```python
# views.py - _build_conversation_history method
def _build_conversation_history(self, session):
    messages = []
    
    # Add system prompt if exists
    if session.system_prompt:
        messages.append({
            'role': 'system',
            'content': session.system_prompt
        })
    
    # This system prompt is added but then REPLACED by OpenAIService!
```

### Interview Mode Implementation

Interview mode exists but is underutilized:
- `start_interview` endpoint triggers it
- Sets `ai_metadata['interview_mode'] = True`
- But still uses the same `chat_completion` method
- No actual multi-agent or stage-based processing

## Proposed Improvements

### 1. Make Conversation Types Functional

#### Modify OpenAIService to Accept and Use Conversation Type

```python
# openai_service.py - Enhanced chat_completion method
def chat_completion(self, 
                   messages: List[Dict[str, str]], 
                   session_id: Optional[str] = None,
                   session_context: Optional[Dict] = None,
                   conversation_type: Optional[str] = None,  # NEW
                   custom_system_prompt: Optional[str] = None,  # NEW
                   stream: bool = False,
                   temperature: float = 0.7,
                   max_tokens: Optional[int] = None) -> Dict[str, Any]:
    
    # Use custom system prompt or build based on conversation type
    if custom_system_prompt:
        system_prompt = custom_system_prompt
    else:
        system_prompt = self._build_conversation_type_prompt(
            conversation_type, session_context
        )
    
    # Don't override existing system messages, use the appropriate one
    enhanced_messages = self._enhance_messages_with_system_prompt(
        messages, system_prompt
    )
```

#### Add Conversation-Type-Specific Prompts

```python
# openai_service.py - New method
def _build_conversation_type_prompt(self, conversation_type: str, context: Optional[Dict]) -> str:
    """Build system prompt based on conversation type"""
    
    prompts = {
        'brainstorm': """You are a creative innovation facilitator specializing in divergent thinking.
Your approach:
- Encourage wild, unconventional ideas without judgment
- Use techniques like SCAMPER, mind mapping, and lateral thinking
- Ask "What if...?" and "How might we...?" questions
- Build on ideas with "Yes, and..." responses
- Defer feasibility concerns until later stages
- Help users explore multiple perspectives and possibilities""",

        'refine': """You are a strategic product development expert focused on idea refinement.
Your approach:
- Structure rough concepts into clear proposals
- Identify core value propositions and user benefits  
- Analyze feasibility, risks, and resource requirements
- Create actionable implementation roadmaps
- Define success metrics and validation methods
- Challenge assumptions constructively""",

        'problem_solving': """You are a systematic problem-solving consultant using structured methodologies.
Your approach:
- Apply root cause analysis (5 Whys, Fishbone diagrams)
- Break down complex problems into manageable components
- Evaluate solutions using criteria matrices
- Consider unintended consequences and edge cases
- Prioritize solutions by impact and effort
- Create testing and validation plans""",

        'feature_design': """You are a technical product designer and systems architect.
Your approach:
- Define user stories and acceptance criteria
- Consider technical architecture and constraints
- Design for scalability and maintainability
- Create mockups or wireframes conceptually
- Define APIs and integration points
- Consider security and performance implications""",

        'general': self._build_contextual_system_prompt(context)
    }
    
    base_prompt = prompts.get(conversation_type, prompts['general'])
    
    # Add context enhancement
    if context:
        base_prompt += f"\n\nUser Context: {self._format_user_context(context)}"
    
    return base_prompt
```

### 2. Update Views to Pass Conversation Type

```python
# views.py - Modified send_message method
def send_message(self, request, pk=None):
    session = self.get_object()
    # ...
    
    # Get AI response with conversation type
    ai_response_data = ai_service.chat_completion(
        messages=conversation_history,
        session_context=session.context_metadata,
        conversation_type=session.conversation_type,  # NEW
        custom_system_prompt=session.system_prompt,  # NEW
        session_id=session.ai_metadata.get('interview_session_id')
    )
```

### 3. Enhance Interview Mode

```python
# openai_service.py - True interview mode implementation
def trigger_interview_mode(self, initial_message: str, user_context: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Trigger multi-stage interview mode with different expert perspectives
    """
    
    # Stage 1: Business Analyst perspective
    stage1_prompt = """You are a senior business analyst conducting the first stage of an idea development interview.
Focus on understanding the business need, target users, and value proposition.
Ask 2-3 clarifying questions about the business context."""
    
    messages = [
        {"role": "system", "content": stage1_prompt},
        {"role": "user", "content": initial_message}
    ]
    
    result = self.chat_completion(
        messages=messages,
        session_context=user_context,
        temperature=0.8
    )
    
    # Add interview metadata
    result['metadata']['interview_stage'] = 'business_analysis'
    result['metadata']['next_stage'] = 'technical_feasibility'
    
    return result

def continue_interview(self, session_id: str, messages: List[Dict], current_stage: str) -> Dict[str, Any]:
    """Continue interview with stage-appropriate prompting"""
    
    stage_prompts = {
        'technical_feasibility': """You are a technical architect reviewing the idea.
Assess technical challenges, required resources, and implementation approach.""",
        
        'market_validation': """You are a market researcher evaluating the idea.
Consider market fit, competition, and user adoption strategies.""",
        
        'final_synthesis': """You are a product strategist synthesizing all perspectives.
Create a comprehensive summary with clear next steps."""
    }
    
    # Inject stage-specific system prompt
    stage_messages = [
        {"role": "system", "content": stage_prompts.get(current_stage, "")},
        *messages
    ]
    
    return self.chat_completion(
        messages=stage_messages,
        session_context=session_context,
        temperature=0.7
    )
```

### 4. Template System Improvements

```python
# serializers.py - Enhanced template handling
def create(self, validated_data):
    template_id = validated_data.pop('template_id', None)
    # ...
    
    if template_id:
        template = ChatTemplate.objects.get(id=template_id, is_active=True)
        
        # Apply template configuration
        session.conversation_type = template.conversation_type
        session.system_prompt = template.system_prompt_override
        
        # Store template metadata for tracking
        session.context_metadata['template_used'] = template.name
        session.context_metadata['template_id'] = str(template.id)
```

## Implementation Roadmap

### Phase 1: Make Conversation Types Work (Priority: High)
1. **Update OpenAIService** (2-3 hours)
   - Add conversation type parameter to chat_completion
   - Implement _build_conversation_type_prompt method
   - Ensure backward compatibility

2. **Update Views** (1 hour)
   - Pass conversation_type to AI service
   - Pass custom_system_prompt when available

3. **Test Each Type** (2 hours)
   - Create test conversations for each type
   - Verify distinct AI behaviors
   - Document example interactions

### Phase 2: Enhance Interview Mode (Priority: Medium)
1. **Implement Stage-Based Processing** (3-4 hours)
   - Create interview stage management
   - Build stage-specific prompts
   - Handle stage transitions

2. **Update Frontend** (2 hours)
   - Show interview progress
   - Handle stage-specific UI elements

### Phase 3: Advanced Features (Priority: Low)
1. **Dynamic Temperature Adjustment**
   - Higher temperature for brainstorming (0.8-0.9)
   - Lower for problem-solving (0.5-0.6)

2. **Response Format Customization**
   - Structured outputs for feature design
   - Creative formats for brainstorming

3. **Conversation Analytics**
   - Track which types are most effective
   - Measure idea quality by type

### Testing Strategy

1. **Unit Tests**
   ```python
   def test_conversation_type_prompts():
       service = OpenAIService()
       
       # Test each conversation type
       for conv_type in ['brainstorm', 'refine', 'problem_solving']:
           prompt = service._build_conversation_type_prompt(conv_type, {})
           assert conv_type in prompt.lower()
           assert len(prompt) > 100  # Ensure substantial prompt
   ```

2. **Integration Tests**
   - Create test sessions with each type
   - Verify AI responses match expected behavior
   - Test template application

3. **User Acceptance Testing**
   - A/B test different prompt variations
   - Gather feedback on AI behavior
   - Iterate on prompt engineering

## Conclusion

The conversation types feature has a solid foundation but lacks the critical connection between user selection and AI behavior. By implementing the proposed changes, we can deliver on the promise of specialized AI assistance for different types of creative and problem-solving tasks.

The implementation is straightforward and can be done incrementally, starting with basic conversation type support and expanding to advanced features like true multi-stage interview mode.