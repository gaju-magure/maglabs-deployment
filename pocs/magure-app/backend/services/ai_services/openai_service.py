import logging
import httpx
import json
import re
from django.utils import timezone
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

class OpenAIService:
    """
    Enhanced AI service that fully leverages the MagLabs VLLM API.
    The API is OpenAI-compatible with additional features like:
    - Multi-agent interview system
    - Session persistence
    - Metadata support
    - Streaming capabilities
    """
    
    def __init__(self):
        self.api_base_url = 'http://localhost:8001/v1/chat/completions'
        self.default_model = "gpt-4o-mini"
        self.timeout = 30.0
        
    def chat_completion(self, 
                       messages: List[Dict[str, str]], 
                       session_id: Optional[str] = None,
                       session_context: Optional[Dict] = None,
                       stream: bool = False,
                       temperature: float = 0.7,
                       max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """
        Get chat completion from MagLabs VLLM API.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            session_id: Optional session ID for interview continuity
            session_context: User context (department, role, etc.)
            stream: Whether to stream the response
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dict with 'content', 'metadata', and optional 'interview_session_id'
        """
        
        # Build contextual system prompt
        enhanced_messages = self._enhance_messages_with_context(messages, session_context)
        
        # Prepare payload following OpenAI format
        payload = {
            "model": self.default_model,
            "messages": enhanced_messages,
            "temperature": temperature,
            "stream": stream,
            "top_p": 1.0,
            "presence_penalty": 0.0,
            "frequency_penalty": 0.0,
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
            
        # Add metadata for potential interview context
        if session_context:
            payload["metadata"] = {
                "user_context": session_context,
                "chat_type": "idea_refinement"
            }
        
        headers = {'Content-Type': 'application/json'}
        
        # Add interview session header if continuing a session
        if session_id:
            headers['X-Interview-Session-ID'] = session_id
        
        # Note: MagLabs VLLM API runs with DISABLE_AUTH=true, so no auth headers needed
        
        try:
            start_time = timezone.now()
            
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    self.api_base_url,
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                
            end_time = timezone.now()
            processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            # Parse response
            data = response.json()
            
            if not data.get("choices") or len(data["choices"]) == 0:
                raise ValueError("No valid response from AI service")
                
            # Extract content and metadata
            choice = data["choices"][0]
            content = choice["message"]["content"]
            
            # Build comprehensive metadata
            metadata = {
                'id': data.get('id'),
                'model': data.get('model', self.default_model),
                'created': data.get('created'),
                'finish_reason': choice.get('finish_reason'),
                'usage': data.get('usage', {}),
                'processing_time_ms': processing_time_ms,
                'timestamp': timezone.now().isoformat()
            }
            
            # Check for interview headers in response
            interview_session_id = response.headers.get('X-Interview-Session-ID')
            interview_stage = response.headers.get('X-Interview-Stage')
            
            if interview_session_id:
                metadata['interview_session_id'] = interview_session_id
                metadata['interview_stage'] = interview_stage
            
            return {
                'content': content,
                'metadata': metadata,
                'interview_session_id': interview_session_id
            }
            
        except httpx.TimeoutException:
            logger.error("AI service request timed out")
            raise Exception("The AI service is taking too long to respond. Please try again.")
        except httpx.HTTPStatusError as e:
            logger.error(f"AI service HTTP error: {e.response.status_code}")
            error_detail = e.response.json() if e.response.content else {}
            raise Exception(f"AI service error: {error_detail.get('detail', e.response.status_code)}")
        except Exception as e:
            logger.error(f"Unexpected error in chat completion: {str(e)}")
            raise
    
    def refine_idea(self, idea_text: str, conversation_history: Optional[List[Dict]] = None) -> str:
        """
        Legacy method maintained for backward compatibility.
        Now uses the enhanced chat_completion internally.
        """
        messages = self._build_refinement_prompt(idea_text, conversation_history)
        
        try:
            result = self.chat_completion(messages, temperature=0.7, max_tokens=512)
            return result['content']
        except Exception as e:
            logger.error(f"Error in refine_idea: {e}")
            return "Sorry, there was an error refining your idea. Please try again later."
    
    def score_idea(self, idea_text: str) -> Optional[Dict[str, int]]:
        """
        Score an idea using structured output from the AI.
        """
        messages = [
            {
                "role": "system",
                "content": "You are an expert at evaluating business ideas. Respond only with valid JSON."
            },
            {
                "role": "user",
                "content": (
                    f"Score the following idea on a scale of 1-10 for each category:\n"
                    f"- Clarity: How clear and well-defined is the idea?\n"
                    f"- Creativity: How innovative and unique is the idea?\n"
                    f"- Feasibility: How practical and achievable is the idea?\n"
                    f"- Relevance: How relevant is the idea to current market needs?\n\n"
                    f"Respond in this exact JSON format:\n"
                    f'{{"clarity": 8, "creativity": 7, "feasibility": 9, "relevance": 8}}\n\n'
                    f"Idea: {idea_text}"
                )
            }
        ]
        
        try:
            result = self.chat_completion(messages, temperature=0.2, max_tokens=256)
            content = result['content']
            
            # Extract JSON from response
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            else:
                logger.warning(f"Score idea response not in JSON format: {content}")
                return None
        except Exception as e:
            logger.error(f"Error scoring idea: {e}")
            return None
    
    def _enhance_messages_with_context(self, 
                                     messages: List[Dict[str, str]], 
                                     session_context: Optional[Dict]) -> List[Dict[str, str]]:
        """
        Enhance messages with contextual system prompt based on user information.
        """
        enhanced_messages = []
        
        # Build context-aware system prompt
        system_prompt = self._build_contextual_system_prompt(session_context)
        
        # Add our enhanced system prompt first
        enhanced_messages.append({
            "role": "system",
            "content": system_prompt
        })
        
        # Add all messages, skipping any existing system messages
        for msg in messages:
            if msg['role'] != 'system':
                enhanced_messages.append(msg)
        
        return enhanced_messages
    
    def _build_contextual_system_prompt(self, session_context: Optional[Dict]) -> str:
        """
        Build a context-aware system prompt that helps the AI understand the user better.
        """
        base_prompt = """You are an expert product manager and innovation coach within a corporate environment. 
Your role is to help users refine and develop their ideas through constructive dialogue.

Key responsibilities:
1. Ask clarifying questions to understand the full scope of ideas
2. Identify potential challenges and suggest solutions  
3. Help structure ideas into actionable proposals
4. Consider technical feasibility and business value
5. Guide users toward clear, implementable solutions

Communication style:
- Be professional yet friendly
- Use clear, concise language
- Provide specific, actionable feedback
- Acknowledge good ideas and build upon them
- Be encouraging while maintaining realistic expectations"""

        if session_context:
            context_parts = []
            
            # Add user role context
            if session_context.get('user_role'):
                role_guidance = {
                    'superadmin': "The user is a system administrator with full platform oversight.",
                    'tenant_admin': "The user is an organizational administrator who oversees company initiatives.",
                    'tenant_user': "The user is a team member contributing ideas for organizational improvement."
                }.get(session_context['user_role'], "")
                if role_guidance:
                    context_parts.append(role_guidance)
            
            # Add department context
            if session_context.get('department'):
                context_parts.append(f"They work in the {session_context['department']} department.")
            
            # Add custom role context
            if session_context.get('custom_role'):
                context_parts.append(f"Their specific role is: {session_context['custom_role']}.")
            
            # Add user name for personalization
            if session_context.get('user_name'):
                name = session_context['user_name'].split()[0] if ' ' in session_context['user_name'] else session_context['user_name']
                context_parts.append(f"The user's name is {name}.")
            
            if context_parts:
                base_prompt += "\n\nUser Context:\n" + " ".join(context_parts)
                base_prompt += "\n\nUse this context to provide more relevant and personalized assistance."
        
        return base_prompt
    
    def _build_refinement_prompt(self, idea_text: str, conversation_history: Optional[List[Dict]] = None) -> List[Dict]:
        """
        Build messages for idea refinement (legacy support).
        """
        messages = []
        
        # Add system message
        messages.append({
            "role": "system",
            "content": (
                "You are an expert product manager and innovation coach. "
                "Help the user refine and improve their idea through a friendly, constructive chat. "
                "Ask clarifying questions, suggest improvements, and help them make the idea more actionable."
            )
        })
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add the current idea
        messages.append({
            "role": "user",
            "content": f"My idea: {idea_text}"
        })
        
        return messages
    
    def trigger_interview_mode(self, initial_message: str, user_context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Trigger the multi-agent interview mode for comprehensive idea development.
        This leverages the MagLabs API's interview capabilities.
        """
        messages = [
            {
                "role": "user",
                "content": initial_message
            }
        ]
        
        # The API will automatically detect interview intent and start the process
        return self.chat_completion(
            messages=messages,
            session_context=user_context,
            temperature=0.8  # Slightly higher for more creative responses
        )