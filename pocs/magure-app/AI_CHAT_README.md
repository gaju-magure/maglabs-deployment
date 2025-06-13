# AI Chat System - Complete Flow Documentation

## Overview

This document provides a comprehensive understanding of the AI Chat system in the Magure application, detailing the complete flow from frontend user interaction to backend processing and AI service integration.

## Architecture Overview

```
Frontend (React/TypeScript) 
    ↓ HTTP requests
Backend (Django REST Framework)
    ↓ HTTP requests  
MagLabs VLLM API (FastAPI)
```

## System Components

### 1. Frontend Components (`/frontend/src/components/chat/`)

#### ChatInterface.tsx
- **Purpose**: Main chat interface component
- **Key Features**:
  - Message sending/receiving
  - Interview mode activation
  - Help modal integration
  - Enhanced error handling with specific error messages
  - Session management

#### ChatHelpModal.tsx
- **Purpose**: Comprehensive user guide and help system
- **Features**:
  - Quick start guide
  - Conversation types explanation
  - Interview mode details
  - Effective prompting tips
  - Common use case templates

#### ChatMessage.tsx
- **Purpose**: Individual message display component
- **Handles**: User messages, AI responses, system messages, error messages

#### EmptyChat.tsx
- **Purpose**: Welcome screen for new chat sessions
- **Features**: Template suggestions, interview mode starter

#### ChatSessionSidebar.tsx
- **Purpose**: Session management and navigation
- **Features**: Session creation, listing, search, filtering

### 2. Backend Models (`/backend/apps/ideas/models.py`)

#### ChatSession
```python
class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="New Chat")
    conversation_type = models.CharField(max_length=50, choices=CONVERSATION_TYPES)
    status = models.CharField(max_length=20, choices=SESSION_STATUS_CHOICES)
    message_count = models.IntegerField(default=0)
    total_tokens_used = models.IntegerField(default=0)
    context_metadata = models.JSONField(default=dict)  # User context
    ai_metadata = models.JSONField(default=dict)  # AI service metadata
    # ... additional fields
```

#### ChatMessage
```python
class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, related_name='messages')
    role = models.CharField(max_length=20)  # 'user', 'assistant', 'system'
    content = models.TextField()
    message_type = models.CharField(max_length=50, choices=MESSAGE_TYPE_CHOICES)
    sequence_number = models.IntegerField()
    ai_metadata = models.JSONField(default=dict)
    processing_status = models.CharField(max_length=20, default='pending')
    # ... additional fields
```

### 3. Backend API Endpoints (`/backend/apps/ideas/views.py`)

#### ChatSessionViewSet
- **Base URL**: `/api/v1/ideas/chat/sessions/`
- **Key Endpoints**:
  - `POST /` - Create new session
  - `GET /{id}/` - Get session details
  - `POST /{id}/send_message/` - Send message and get AI response
  - `POST /{id}/start_interview/` - Activate interview mode
  - `POST /{id}/submit_as_idea/` - Convert chat to idea submission

### 4. AI Service Integration (`/backend/services/ai_services/openai_service.py`)

#### OpenAIService Class
- **Purpose**: Interface with MagLabs VLLM API
- **Key Methods**:
  - `chat_completion()` - Main AI interaction method
  - `trigger_interview_mode()` - Start interview sessions
  - `refine_idea()` - Legacy idea refinement
  - `score_idea()` - Idea scoring functionality

## Complete Flow Documentation

### 1. Session Creation Flow

#### Frontend → Backend
1. **User Action**: Click "New Chat" in sidebar
2. **Frontend Request**: 
   ```typescript
   POST /api/v1/ideas/chat/sessions/
   {
     "title": "New Chat",
     "conversation_type": "general"
   }
   ```

#### Backend Processing
1. **ChatSessionViewSet.create()**:
   ```python
   # Create session with user context
   session = ChatSession.objects.create(
       user=request.user,
       title=data['title'],
       conversation_type=data['conversation_type'],
       context_metadata={
           'user_role': user.role,
           'department': user.department.name if user.department else None,
           'custom_role': user.custom_role,
           'user_name': user.get_full_name()
       }
   )
   ```

2. **Response**: Full session object with ID for navigation

### 2. Message Send Flow

#### Frontend → Backend
1. **User Action**: Type message and press Enter
2. **Frontend Request**:
   ```typescript
   POST /api/v1/ideas/chat/sessions/{session_id}/send_message/
   {
     "content": "I have an idea for improving our workflow",
     "message_type": "text"
   }
   ```

#### Backend Processing (`ChatSessionViewSet.send_message()`)

1. **Create User Message**:
   ```python
   user_message = ChatMessage.objects.create(
       session=session,
       role='user',
       content=validated_data['content'],
       message_type=validated_data['message_type'],
       sequence_number=last_sequence + 1
   )
   ```

2. **Build Conversation History**:
   ```python
   conversation_history = [
       {'role': 'system', 'content': contextual_system_prompt},
       {'role': 'user', 'content': 'Previous message'},
       {'role': 'assistant', 'content': 'Previous AI response'},
       {'role': 'user', 'content': 'Current message'}
   ]
   ```

3. **Call AI Service**:
   ```python
   ai_response = ai_service.chat_completion(
       messages=conversation_history,
       session_context=session.context_metadata,
       session_id=session.ai_metadata.get('interview_session_id')
   )
   ```

#### Backend → MagLabs VLLM API

1. **AI Service Request** (`OpenAIService.chat_completion()`):
   ```python
   payload = {
       "model": "gpt-4o-mini",
       "messages": enhanced_messages,
       "temperature": 0.7,
       "metadata": {
           "user_context": session_context,
           "chat_type": "idea_refinement"
       }
   }
   
   headers = {
       'Content-Type': 'application/json',
       'X-Interview-Session-ID': session_id  # If continuing interview
   }
   
   response = httpx.post('http://localhost:8001/v1/chat/completions', ...)
   ```

#### MagLabs VLLM API Processing

1. **API Features** (from `run_server.sh`):
   ```bash
   ENABLE_MULTI_AGENT_ORCHESTRATION=true
   ENABLE_ENHANCED_SESSION_MANAGER=true  
   ENABLE_INTERVIEW_ROUTER=true
   ENABLE_PERSISTENT_SESSIONS=true
   ENABLE_INTERVIEW_MIDDLEWARE=true
   DISABLE_AUTH=true
   ```

2. **Response Format**:
   ```json
   {
     "id": "chatcmpl-...",
     "object": "chat.completion",
     "created": 1234567890,
     "model": "gpt-4o-mini",
     "choices": [{
       "index": 0,
       "message": {
         "role": "assistant", 
         "content": "That's an interesting workflow improvement idea! Can you tell me more about the specific bottlenecks you've identified?"
       },
       "finish_reason": "stop"
     }],
     "usage": {
       "prompt_tokens": 150,
       "completion_tokens": 50,
       "total_tokens": 200
     }
   }
   ```

3. **Interview Headers** (if in interview mode):
   ```
   X-Interview-Session-ID: uuid-string
   X-Interview-Stage: initial|exploration|refinement|conclusion
   ```

#### Backend Response Processing

1. **Create AI Message**:
   ```python
   ai_message = ChatMessage.objects.create(
       session=session,
       role='assistant',
       content=ai_response['content'],
       message_type='text',
       sequence_number=last_sequence + 2,
       ai_metadata=ai_response.get('metadata', {})
   )
   ```

2. **Update Session**:
   ```python
   session.message_count += 2
   session.total_tokens_used += metadata['usage']['total_tokens']
   if ai_response.get('interview_session_id'):
       session.ai_metadata.update({
           'interview_session_id': ai_response['interview_session_id'],
           'interview_stage': metadata.get('interview_stage')
       })
   session.save()
   ```

#### Backend → Frontend Response
```json
{
  "user_message": { "id": "...", "content": "...", "role": "user" },
  "ai_message": { "id": "...", "content": "...", "role": "assistant" },
  "session_updated": { "id": "...", "message_count": 2, "..." }
}
```

### 3. Interview Mode Flow

#### Activation
1. **User Action**: Click "Start Interview" button
2. **Frontend Request**:
   ```typescript
   POST /api/v1/ideas/chat/sessions/{session_id}/start_interview/
   {
     "message": "I have a business idea I want to develop comprehensively"
   }
   ```

#### Backend Processing (`ChatSessionViewSet.start_interview()`)
1. **Call AI Service**:
   ```python
   result = ai_service.trigger_interview_mode(
       initial_message=initial_message,
       user_context=session.context_metadata
   )
   ```

2. **Update Session Metadata**:
   ```python
   session.ai_metadata = {
       'interview_mode': True,
       'started_at': timezone.now().isoformat(),
       'interview_session_id': result.get('interview_session_id')
   }
   session.conversation_type = 'refine'
   ```

#### AI Service Behavior
- Switches to multi-agent interview system
- Asks structured questions about:
  - Problem definition
  - Target audience
  - Business model
  - Implementation challenges
  - Success metrics

### 4. Error Handling Flow

#### Connection Errors
1. **AI Service Unavailable**:
   ```python
   except ConnectionError as e:
       error_message = ChatMessage.objects.create(
           session=session,
           role='system',
           content="I'm having trouble connecting to the AI service...",
           message_type='error',
           processing_status='failed'
       )
       return Response({...}, status=503)
   ```

#### Frontend Error Display
```typescript
onError: (error: any) => {
  let errorMessage = "Failed to send message. Please try again.";
  
  if (error?.response?.status === 503) {
    errorMessage = "AI service is temporarily unavailable...";
  } else if (error?.response?.status === 502) {
    errorMessage = "Received invalid response from AI service...";
  }
  
  toast({ title: "Error", description: errorMessage, variant: "destructive" });
}
```

### 5. Idea Submission Flow

#### Convert Chat to Idea
1. **User Action**: Click "Submit as Idea" after sufficient conversation
2. **Frontend Request**:
   ```typescript
   POST /api/v1/ideas/chat/sessions/{session_id}/submit_as_idea/
   {
     "title": "Automated Workflow System",
     "description": "Based on our conversation...",
     "priority": "medium"
   }
   ```

#### Backend Processing
1. **Create Idea**:
   ```python
   idea = Idea.objects.create(
       title=validated_data['title'],
       description=validated_data['description'], 
       priority=validated_data['priority'],
       user=session.user,
       department=session.user.department,
       status='submitted'
   )
   ```

2. **Link Session to Idea**:
   ```python
   session.submitted_idea = idea
   session.is_idea_submitted = True
   session.save()
   ```

## Configuration & Setup

### Environment Variables (MagLabs VLLM API)
```bash
ENABLE_MULTI_AGENT_ORCHESTRATION=true
ENABLE_ENHANCED_SESSION_MANAGER=true
ENABLE_INTERVIEW_ROUTER=true  
ENABLE_PERSISTENT_SESSIONS=true
ENABLE_INTERVIEW_MIDDLEWARE=true
STORAGE_BACKEND=file
DISABLE_AUTH=true
ENVIRONMENT=development
```

### API Endpoints Summary
```
# Sessions
GET    /api/v1/ideas/chat/sessions/           # List sessions
POST   /api/v1/ideas/chat/sessions/           # Create session  
GET    /api/v1/ideas/chat/sessions/{id}/      # Get session details
PATCH  /api/v1/ideas/chat/sessions/{id}/      # Update session

# Messages & Interactions  
POST   /api/v1/ideas/chat/sessions/{id}/send_message/     # Send message
POST   /api/v1/ideas/chat/sessions/{id}/start_interview/  # Start interview
POST   /api/v1/ideas/chat/sessions/{id}/regenerate_response/ # Regenerate
POST   /api/v1/ideas/chat/sessions/{id}/submit_as_idea/   # Submit idea

# Utilities
PATCH  /api/v1/ideas/chat/sessions/{id}/update_title/    # Update title
POST   /api/v1/ideas/chat/sessions/{id}/archive/         # Archive session
```

### Dependencies
- **Frontend**: React, TypeScript, TanStack Query, Lucide Icons
- **Backend**: Django, DRF, PostgreSQL, httpx
- **AI Service**: MagLabs VLLM API (OpenAI-compatible)

## Troubleshooting

### Common Issues

1. **"AI service unavailable"**
   - Check MagLabs VLLM API is running on localhost:8001
   - Verify environment variables are set correctly
   - Check network connectivity

2. **"Session creation with undefined ID"**  
   - Fixed: Backend now returns complete session object
   - Ensure ChatSessionDetailSerializer is used for responses

3. **"message_count conflicts with model field"**
   - Fixed: Removed conflicting annotation in queryset

4. **Interview mode not starting**
   - Verify session has no existing interview_mode flag
   - Check initial message is not empty
   - Ensure AI service supports interview features

### Debugging Tips

1. **Check Backend Logs**:
   ```bash
   # Django logs
   tail -f logs/django.log
   
   # AI service connectivity
   curl http://localhost:8001/health
   ```

2. **Frontend Network Tab**:
   - Monitor API requests/responses
   - Check for 503/502 errors
   - Verify request payloads

3. **Database Inspection**:
   ```sql
   -- Check session data
   SELECT id, title, conversation_type, ai_metadata FROM ideas_chatsession;
   
   -- Check message flow
   SELECT role, content, sequence_number FROM ideas_chatmessage WHERE session_id = '...';
   ```

## Performance Considerations

- **Token Usage**: Tracked per session for cost monitoring
- **Message History**: Full conversation sent to AI for context
- **Retry Logic**: 3 attempts with exponential backoff
- **Timeout**: 30 seconds for AI service requests
- **Session Cleanup**: Archive old sessions to maintain performance

## Security Notes

- Authentication required for all endpoints
- User isolation through session ownership
- Role-based access control for idea submissions
- No sensitive data logged in AI metadata
- MagLabs API runs with DISABLE_AUTH=true (development only)