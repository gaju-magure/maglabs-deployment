# Conversation Types, Interview Mode & Templates: How They (Don't) Work

## Executive Summary

**The Reality**: Despite having different conversation types (Brainstorming, Idea Refinement, Problem Solving, General Chat), interview mode, and templates, **all conversations currently receive the same AI behavior**. The conversation type is stored as metadata but never influences the AI's responses.

**The Expectation**: Users expect different AI behaviors for different conversation types - creative exploration for brainstorming, structured analysis for problem-solving, critical refinement for idea development, etc.

**The Gap**: Conversation types are currently just UI labels. The AI uses the same generic prompt regardless of the selected type.

## Table of Contents
1. [Current Implementation Analysis](#current-implementation-analysis)
2. [Expected vs Actual Behavior](#expected-vs-actual-behavior)
3. [Technical Deep Dive](#technical-deep-dive)
4. [Why It Doesn't Work As Expected](#why-it-doesnt-work-as-expected)
5. [Proposed Improvements](#proposed-improvements)
6. [Implementation Roadmap](#implementation-roadmap)

## Current Implementation Analysis

### 1. How Conversation Types Are Defined

```python
# backend/apps/ideas/models.py
class ChatSession(models.Model):
    CONVERSATION_TYPES = [
        ('brainstorm', 'Brainstorming'),
        ('refine', 'Idea Refinement'),
        ('general', 'General Chat'),
        ('problem_solving', 'Problem Solving'),
        ('feature_design', 'Feature Design'),
    ]
    
    conversation_type = models.CharField(
        max_length=20, 
        choices=CONVERSATION_TYPES, 
        default='general'
    )
```

**What happens**: The conversation type is stored in the database when a session is created.

### 2. How Templates Work

```python
# backend/apps/ideas/models.py
class ChatTemplate(models.Model):
    name = models.CharField(max_length=100)
    conversation_type = models.CharField(choices=ChatSession.CONVERSATION_TYPES)
    initial_prompt = models.TextField()
    system_prompt_override = models.TextField(blank=True)  # <-- This exists but isn't used!
```

**What happens**: Templates provide initial prompts and can set conversation types, but the `system_prompt_override` field that could customize AI behavior is never utilized.

### 3. The Flow from UI to AI

```
1. User selects conversation type in UI
   ↓
2. Frontend sends: POST /api/v1/ideas/chat/sessions/
   {
     "title": "New Chat",
     "conversation_type": "brainstorm"  // <-- Sent to backend
   }
   ↓
3. Backend creates ChatSession with conversation_type
   ↓
4. User sends message: POST /api/v1/ideas/chat/sessions/{id}/send_message/
   ↓
5. Backend calls OpenAIService.chat_completion()
   ↓
6. OpenAIService builds generic prompt (ignores conversation_type!)
   ↓
7. Same AI behavior for all types
```

## Expected vs Actual Behavior

| Conversation Type | What Users Expect | What Actually Happens |
|-------------------|-------------------|----------------------|
| **Brainstorming** | • Creative, divergent thinking<br>• "What if...?" questions<br>• Multiple idea generation<br>• No immediate criticism | Generic professional dialogue |
| **Problem Solving** | • Root cause analysis<br>• Structured approach<br>• Solution evaluation<br>• Implementation steps | Generic professional dialogue |
| **Idea Refinement** | • Critical evaluation<br>• Detailed development<br>• Feasibility analysis<br>• Clear action items | Generic professional dialogue |
| **General Chat** | • Flexible conversation<br>• Context-aware responses | Generic professional dialogue |
| **Interview Mode** | • Multi-stage process<br>• Guided questions<br>• Comprehensive exploration | Single-stage with same prompt |

### Example: Same Response Regardless of Type

**User Message**: "I want to improve our customer service"

**Current Response (ALL types)**:
> "That's an interesting idea! Can you tell me more about the specific challenges you're facing with customer service? Understanding the current pain points will help us develop targeted solutions."

**Expected Brainstorming Response**:
> "Let's explore creative ways to revolutionize your customer service! What if we completely reimagined the customer journey? Consider these wild ideas: AI avatars, VR support sessions, predictive issue resolution... Don't worry about feasibility yet - let's dream big! What aspect of customer service excites you most to transform?"

**Expected Problem Solving Response**:
> "Let's analyze your customer service challenges systematically. First, can you identify the top 3 specific problems? For each, I'll help you: 1) Define the root cause, 2) Measure the impact, 3) Evaluate solutions. What metrics currently indicate service issues?"

## Technical Deep Dive

### Where Conversation Type Gets Lost

```python
# backend/services/ai_services/openai_service.py
def _build_contextual_system_prompt(self, session_context: Optional[Dict]) -> str:
    base_prompt = """You are an expert product manager and innovation coach...
    [GENERIC PROMPT FOR ALL TYPES]"""
    
    # User context is added (role, department, name)
    # BUT conversation_type is NEVER used!
    
    return base_prompt
```

**The Problem**: The `conversation_type` is available in `session.conversation_type` but is never passed to or used by the AI service.

### The Unused Template System

```python
# backend/apps/ideas/views.py - ChatSessionViewSet
def create(self, request, *args, **kwargs):
    # Creates session with conversation_type
    # BUT doesn't use template's system_prompt_override
    
def send_message(self, request, pk=None):
    # Builds conversation history
    # Calls AI service
    # Never checks session.conversation_type or template prompts
```

### Interview Mode Implementation

```python
# Current implementation
def start_interview(self, request, pk=None):
    session.ai_metadata = {
        'interview_mode': True,  # Just sets a flag
        'started_at': timezone.now().isoformat()
    }
    
    # Calls same AI service with same generic prompt
    result = ai_service.trigger_interview_mode(
        initial_message=initial_message,
        user_context=session.context_metadata
    )
```

**The Problem**: Interview mode sets metadata flags but doesn't actually change the AI's behavior or implement multi-stage conversations.

## Why It Doesn't Work As Expected

### 1. Missing Conversation-Type-Specific Prompts

The `_build_contextual_system_prompt` method never considers the conversation type:

```python
# What we have:
def _build_contextual_system_prompt(self, session_context: Optional[Dict]) -> str:
    base_prompt = """Generic prompt for all types..."""
    
# What we need:
def _build_contextual_system_prompt(self, session_context: Optional[Dict], 
                                   conversation_type: str) -> str:
    prompts = {
        'brainstorm': """You are a creative innovation catalyst...""",
        'problem_solving': """You are a systematic problem-solving expert...""",
        'refine': """You are a critical thinking coach...""",
        # etc.
    }
    base_prompt = prompts.get(conversation_type, prompts['general'])
```

### 2. Template System Not Utilized

Templates have `system_prompt_override` but it's never used:

```python
# Current: system_prompt_override is stored but ignored
# Needed: Check template and use its system prompt if available
```

### 3. No Conversation Type in API Calls

The conversation type never makes it to the AI service:

```python
# Current call
ai_response_data = ai_service.chat_completion(
    messages=conversation_history,
    session_context=session.context_metadata,  # Has user info, not conversation type
)

# Needed
ai_response_data = ai_service.chat_completion(
    messages=conversation_history,
    session_context=session.context_metadata,
    conversation_type=session.conversation_type,  # Add this!
)
```

## Proposed Improvements

### 1. Implement Conversation-Type-Specific Prompts

```python
# openai_service.py
CONVERSATION_PROMPTS = {
    'brainstorm': """You are a creative innovation catalyst who helps users generate bold, unconventional ideas.
    
Your approach:
- Start with "What if..." and "Imagine..." questions
- Generate multiple diverse ideas (aim for 5-10 per response)
- Build on ideas with "Yes, and..." thinking
- Avoid criticism or feasibility concerns initially
- Use analogies from other industries
- Encourage wild, seemingly impossible ideas
- Ask questions that spark lateral thinking

Example responses:
"What if we completely eliminated that step? Imagine a world where... Here are 7 wild ideas:..."
""",
    
    'problem_solving': """You are a systematic problem-solving expert who uses structured analytical methods.
    
Your approach:
- First, clarify the problem with specific questions
- Use root cause analysis (5 Whys, Fishbone diagrams)
- Break complex problems into smaller components
- Evaluate solutions with pros/cons matrices
- Provide implementation steps with timelines
- Consider risks and mitigation strategies
- Use data-driven decision making

Structure your responses:
1. Problem Definition: [Clarify the real issue]
2. Root Cause Analysis: [Identify why it happens]
3. Solution Options: [Present 2-3 alternatives]
4. Recommendation: [Your suggested approach]
5. Next Steps: [Specific actions to take]
""",
    
    'refine': """You are a critical thinking coach who helps polish rough ideas into actionable proposals.
    
Your approach:
- Start by understanding the core value proposition
- Ask probing questions about feasibility and impact
- Identify potential obstacles and address them
- Develop clear success metrics
- Create detailed implementation plans
- Consider stakeholder perspectives
- Build business cases with ROI estimates

Focus areas:
- Clarity: Is the idea clearly defined?
- Viability: Can it realistically be implemented?
- Value: What's the concrete benefit?
- Execution: What are the specific next steps?
""",
    
    'general': """You are an expert product manager and innovation coach.
Balance creativity with practicality, adapting your approach based on the user's needs.
""",
    
    'feature_design': """You are a product design expert who creates detailed feature specifications.
    
Your approach:
- Start with user stories and use cases
- Define acceptance criteria
- Create feature requirements
- Consider edge cases and error states
- Design user flows and interactions
- Evaluate technical feasibility
- Prioritize based on impact vs effort
"""
}
```

### 2. Enhance the Chat Flow

```python
# views.py - ChatSessionViewSet
def send_message(self, request, pk=None):
    session = self.get_object()
    
    # Get the conversation type AND any template overrides
    conversation_type = session.conversation_type
    template = session.template  # If session was created from template
    
    # Pass conversation type to AI service
    ai_response_data = ai_service.chat_completion(
        messages=conversation_history,
        session_context=session.context_metadata,
        conversation_type=conversation_type,
        system_prompt_override=template.system_prompt_override if template else None
    )
```

### 3. Implement True Interview Mode

```python
# Interview mode with stages
INTERVIEW_STAGES = {
    'initial': {
        'prompt': "Let's explore your idea comprehensively. I'll guide you through several stages...",
        'questions': [
            "What problem are you trying to solve?",
            "Who experiences this problem?",
            "What's the impact of not solving it?"
        ]
    },
    'exploration': {
        'prompt': "Now let's dig deeper into your solution...",
        'questions': [
            "What solutions have you considered?",
            "What makes your approach unique?",
            "What resources would you need?"
        ]
    },
    'refinement': {
        'prompt': "Let's refine and challenge your idea...",
        'questions': [
            "What are the biggest risks?",
            "How would you measure success?",
            "What's your implementation timeline?"
        ]
    },
    'conclusion': {
        'prompt': "Let's summarize and create an action plan...",
        'synthesize': True
    }
}
```

### 4. Make Templates More Powerful

```python
# Enhanced template usage
class ChatTemplate(models.Model):
    # Existing fields...
    
    # New fields for enhanced behavior
    conversation_style = models.JSONField(
        default=dict,
        help_text="Style parameters like creativity_level, formality, etc."
    )
    
    follow_up_prompts = models.JSONField(
        default=list,
        help_text="Suggested follow-up questions for this template"
    )
    
    success_criteria = models.TextField(
        blank=True,
        help_text="What constitutes a successful conversation for this template"
    )
```

## Implementation Roadmap

### Phase 1: Basic Functionality (1-2 weeks)
**Priority: HIGH**

1. **Update OpenAIService** to accept and use conversation type
   ```python
   def chat_completion(self, messages, session_context=None, 
                      conversation_type='general', **kwargs):
       # Implementation
   ```

2. **Add conversation-specific prompts** 
   - Create CONVERSATION_PROMPTS dictionary
   - Modify `_build_contextual_system_prompt` to use it

3. **Update ChatSessionViewSet** to pass conversation type
   - Modify `send_message` method
   - Include conversation_type in AI service calls

4. **Basic Testing**
   - Verify different prompts generate different responses
   - Test each conversation type

### Phase 2: Enhanced Features (2-3 weeks)
**Priority: MEDIUM**

1. **Implement template system_prompt_override**
   - Check for template overrides in send_message
   - Apply template prompts when available

2. **Enhance interview mode**
   - Implement multi-stage conversation flow
   - Track interview progress in ai_metadata
   - Create stage-specific prompts

3. **Add conversation style parameters**
   - Temperature adjustments per type
   - Response length preferences
   - Formality levels

### Phase 3: Advanced Features (3-4 weeks)
**Priority: LOW**

1. **Dynamic prompt adjustment**
   - Learn from user feedback
   - Adjust prompts based on conversation flow

2. **Template analytics**
   - Track which templates lead to successful ideas
   - A/B test different prompts

3. **Multi-agent orchestration**
   - Different AI "personas" for different stages
   - Specialized agents for technical vs business analysis

## Testing Strategy

### 1. Unit Tests
```python
def test_conversation_type_affects_prompt():
    """Verify different conversation types generate different prompts"""
    service = OpenAIService()
    
    brainstorm_prompt = service._build_contextual_system_prompt(
        {}, conversation_type='brainstorm'
    )
    problem_prompt = service._build_contextual_system_prompt(
        {}, conversation_type='problem_solving'
    )
    
    assert brainstorm_prompt != problem_prompt
    assert 'creative' in brainstorm_prompt.lower()
    assert 'systematic' in problem_prompt.lower()
```

### 2. Integration Tests
```python
def test_brainstorm_generates_multiple_ideas():
    """Verify brainstorming actually generates multiple ideas"""
    response = client.post(
        f'/api/v1/ideas/chat/sessions/{session_id}/send_message/',
        {'content': 'How can we improve employee engagement?'}
    )
    
    ai_response = response.json()['ai_message']['content']
    # Should contain multiple idea markers
    assert ai_response.count('What if') >= 3
    assert ai_response.count('Imagine') >= 2
```

### 3. User Acceptance Criteria

**Brainstorming Sessions**:
- ✓ Generates 5+ ideas per response
- ✓ Uses creative language
- ✓ Avoids immediate criticism
- ✓ Builds on previous ideas

**Problem Solving Sessions**:
- ✓ Asks clarifying questions first
- ✓ Uses structured analysis
- ✓ Provides concrete next steps
- ✓ Evaluates multiple solutions

**Idea Refinement Sessions**:
- ✓ Challenges assumptions
- ✓ Asks about feasibility
- ✓ Develops implementation plans
- ✓ Creates success metrics

## Conclusion

The current implementation treats all conversation types the same, missing a huge opportunity to provide specialized AI assistance. By implementing conversation-type-specific prompts and enhancing the template system, we can deliver the differentiated experience users expect.

The proposed changes are backward-compatible and can be rolled out incrementally, starting with basic prompt differentiation and building up to advanced multi-agent orchestration.

**Next Steps**:
1. Get stakeholder approval for Phase 1 implementation
2. Create conversation-type-specific prompts with domain experts
3. Implement and test basic functionality
4. Gather user feedback and iterate