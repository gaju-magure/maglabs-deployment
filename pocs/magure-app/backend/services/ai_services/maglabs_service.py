import logging
import httpx
import json
from django.utils import timezone
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

# Conversation type configurations for MagLabs API
CONVERSATION_TYPE_CONFIGS = {
    'brainstorm': {
        'focus_stages': ['solution_brainstorming'],
        'skip_stages': ['problem_clarification'],
        'temperature': 0.9,  # More creative
        'interview_type': 'business_idea',
        'instructions': 'Focus on generating creative, diverse solutions. Encourage wild ideas.',
        'expected_completion': ['user_profiling', 'solution_brainstorming', 'value_proposition']
    },
    'problem_solving': {
        'focus_stages': ['problem_capture', 'problem_clarification'],
        'temperature': 0.5,  # More analytical  
        'interview_type': 'business_idea',
        'instructions': 'Use systematic problem analysis approach. Break down complex issues.',
        'expected_completion': ['user_profiling', 'problem_capture', 'problem_clarification', 'solution_brainstorming']
    },
    'refine': {
        'focus_stages': 'all',
        'temperature': 0.7,
        'interview_type': 'business_idea', 
        'instructions': 'Guide through comprehensive idea refinement with critical analysis.',
        'expected_completion': 'all'
    },
    'feature_design': {
        'focus_stages': ['solution_brainstorming', 'value_proposition'],
        'temperature': 0.6,
        'interview_type': 'business_idea',
        'instructions': 'Focus on technical specifications and implementation details.',
        'expected_completion': ['user_profiling', 'solution_brainstorming', 'value_proposition']
    },
    'strategy_planning': {
        'focus_stages': ['value_proposition', 'report_generation'],
        'temperature': 0.6,
        'interview_type': 'business_idea',
        'instructions': 'Emphasize business strategy, market fit, and implementation planning.',
        'expected_completion': ['user_profiling', 'problem_capture', 'value_proposition', 'report_generation']
    },
    'interview': {
        'focus_stages': 'all',
        'temperature': 0.7,
        'interview_type': 'business_idea',
        'instructions': 'Conduct comprehensive structured interview through all stages.',
        'expected_completion': 'all'
    }
}

class MagLabsService:
    """
    MagLabs VLLM API service for multi-agent conversation and interview flows.
    Provides business-focused AI interactions with conversation stage tracking.
    """
    
    def __init__(self):
        self.api_base_url = 'http://localhost:8001/v1/chat/completions'
        self.health_url = 'http://localhost:8001/health'
        self.default_model = "gpt-4o-mini"
        self.timeout = 30.0
        
    def create_session(self, user_context: Dict[str, Any], 
                      template: Optional[Any] = None, initial_message: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new conversation session with MagLabs API.
        
        Args:
            user_context: User information (role, department, name, etc.)
            template: Optional ChatTemplate instance for configuration
            initial_message: Optional custom initial message
            
        Returns:
            Dict containing session_id and initial response
        """
        # Use template or default to determine initial message
        if initial_message:
            starter_message = initial_message
        elif template:
            starter_message = template.initial_prompt
        else:
            starter_message = "I want to brainstorm creative solutions and innovative ideas"
        
        messages = [{"role": "user", "content": starter_message}]
        
        # Get configuration for this template
        config = self._get_conversation_config(template)
        
        return self.send_message(
            messages=messages,
            user_context=user_context,
            conversation_config=config
        )
    
    def send_message(self, 
                    messages: List[Dict[str, str]], 
                    user_context: Optional[Dict] = None,
                    session_id: Optional[str] = None,
                    conversation_config: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Send message to MagLabs API and get structured response.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            user_context: User context information
            session_id: Optional existing session ID
            conversation_config: Configuration from template
            
        Returns:
            Dict with 'content', 'session_id', 'stage', 'progress', and 'metadata'
        """
        
        # Get default configuration if none provided
        if not conversation_config:
            conversation_config = self._get_conversation_config(None)
        
        # Prepare payload for MagLabs API
        # Convert complex metadata values to strings as required by MagLabs API
        focus_stages = conversation_config.get('focus_stages')
        if isinstance(focus_stages, list):
            focus_stages_str = ','.join(focus_stages)
        elif focus_stages == 'all':
            focus_stages_str = 'all'
        else:
            focus_stages_str = str(focus_stages) if focus_stages else ''
        
        user_context_str = json.dumps(user_context) if user_context else '{}'
        
        payload = {
            "model": self.default_model,
            "messages": messages,
            "temperature": conversation_config.get('temperature', 0.7),
            "stream": False,
            "metadata": {
                                "interview_type": conversation_config.get('interview_type', 'business_idea'),
                "focus_stages": focus_stages_str,
                "instructions": conversation_config.get('instructions', ''),
                "user_context": user_context_str
            }
        }
        
        headers = {'Content-Type': 'application/json'}
        
        if session_id:
            headers['X-Session-ID'] = session_id
        
        try:
            # Check API health first
            # self._check_api_health()
            
            # Make request to MagLabs API
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    self.api_base_url,
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                
            data = response.json()
            
            # Extract core response
            if not data.get("choices") or not data["choices"]:
                raise ValueError("Invalid response from MagLabs API")
                
            choice = data["choices"][0]
            message_content = choice["message"]["content"]
            
            # Extract MagLabs metadata
            raw_metadata = data.get("metadata", {})
            parsed_metadata = self._parse_maglabs_metadata(raw_metadata)
            
            # Extract session info from headers
            session_id = response.headers.get('x-interview-session-id') or parsed_metadata.get('session_id')
            
            return {
                'content': message_content,
                'session_id': session_id,
                'stage': parsed_metadata.get('stage', 'user_profiling'),
                'stage_progress': parsed_metadata.get('stage_progress', 0.0),
                'conversation_health': parsed_metadata.get('conversation_health', 'good'),
                'business_context': parsed_metadata.get('business_context', {}),
                'suggested_actions': parsed_metadata.get('suggested_actions', []),
                'metadata': {
                    'model': data.get('model'),
                    'usage': data.get('usage', {}),
                    'timestamp': timezone.now().isoformat(),
                    'raw_metadata': raw_metadata
                }
            }
            
        except httpx.TimeoutException:
            logger.error("MagLabs API timeout")
            raise ConnectionError("AI service is taking too long to respond. Please try again.")
            
        except httpx.ConnectError:
            logger.error("Cannot connect to MagLabs API")
            raise ConnectionError("Unable to connect to AI service. Please ensure MagLabs API is running.")
            
        except httpx.HTTPStatusError as e:
            logger.error(f"MagLabs API HTTP error: {e.response.status_code}")
            response_text = e.response.text if hasattr(e.response, 'text') else str(e)
            logger.error(f"Response text: {response_text}")
            
            if e.response.status_code >= 500:
                # Try retry with new session for 500 errors (likely token limit)
                logger.info("500 error detected, attempting retry with new session")
                return self._retry_with_new_session(messages, user_context, conversation_config)
            elif e.response.status_code == 422:
                # Unprocessable entity - likely invalid metadata format, try retry
                logger.info("422 error detected, attempting retry with new session")
                return self._retry_with_new_session(messages, user_context, conversation_config)
            else:
                try:
                    error_detail = e.response.json()
                    raise ValueError(f"Invalid request: {error_detail.get('detail', 'Unknown error')}")
                except json.JSONDecodeError:
                    raise ValueError(f"Request failed with status {e.response.status_code}")
                    
        except Exception as e:
            logger.error(f"Unexpected error in MagLabs service: {e}")
            raise ConnectionError(f"AI service error: {str(e)}")
    
    def _retry_with_new_session(self, messages: List[Dict[str, str]], 
                               user_context: Optional[Dict],
                               conversation_config: Dict) -> Dict[str, Any]:
        """Retry the request with a forced new session by changing user context."""
        import uuid
        import time
        from django.utils import timezone
        
        # Modify user context to force new session with multiple unique identifiers
        modified_context = (user_context or {}).copy()
        modified_context['session_reset'] = str(uuid.uuid4())
        modified_context['retry_timestamp'] = timezone.now().isoformat()
        modified_context['retry_attempt'] = str(int(time.time()))
        modified_context['force_new_session'] = 'true'
        
        # Remove any existing session-specific data that might cause conflicts
        session_keys_to_update = ['django_session_id', 'unique_identifier', 'session_timestamp']
        for key in session_keys_to_update:
            if key in modified_context:
                modified_context[f'{key}_original'] = modified_context[key]
                modified_context[key] = f"{modified_context[key]}_reset_{int(time.time())}"
        
        logger.info("Retrying with modified user context to force new session")
        logger.info(f"Original context keys: {list((user_context or {}).keys())}")
        logger.info(f"Modified context keys: {list(modified_context.keys())}")
        
        # Convert complex metadata values to strings
        focus_stages = conversation_config.get('focus_stages')
        if isinstance(focus_stages, list):
            focus_stages_str = ','.join(focus_stages)
        elif focus_stages == 'all':
            focus_stages_str = 'all'
        else:
            focus_stages_str = str(focus_stages) if focus_stages else ''
        
        user_context_str = json.dumps(modified_context)
        
        payload = {
            "model": self.default_model,
            "messages": messages,
            "temperature": conversation_config.get('temperature', 0.7),
            "stream": False,
            "metadata": {
                                "interview_type": conversation_config.get('interview_type', 'business_idea'),
                "focus_stages": focus_stages_str,
                "instructions": conversation_config.get('instructions', ''),
                "user_context": user_context_str
            }
        }
        
        headers = {'Content-Type': 'application/json'}
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    self.api_base_url,
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                
            data = response.json()
            
            if not data.get("choices") or not data["choices"]:
                raise ValueError("Invalid response from MagLabs API")
                
            choice = data["choices"][0]
            message_content = choice["message"]["content"]
            
            raw_metadata = data.get("metadata", {})
            parsed_metadata = self._parse_maglabs_metadata(raw_metadata)
            
            session_id = response.headers.get('x-interview-session-id') or parsed_metadata.get('session_id')
            
            return {
                'content': message_content,
                'session_id': session_id,
                'stage': parsed_metadata.get('stage', 'user_profiling'),
                'stage_progress': parsed_metadata.get('stage_progress', 0.0),
                'conversation_health': parsed_metadata.get('conversation_health', 'good'),
                'business_context': parsed_metadata.get('business_context', {}),
                'suggested_actions': parsed_metadata.get('suggested_actions', []),
                'metadata': {
                    'model': data.get('model'),
                    'usage': data.get('usage', {}),
                    'timestamp': timezone.now().isoformat(),
                    'raw_metadata': raw_metadata,
                    'session_reset': True
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to create new session: {e}")
            raise ConnectionError("Unable to create new conversation session")

    def get_session_state(self, session_id: str) -> Dict[str, Any]:
        """
        Get current state of a conversation session.
        
        Args:
            session_id: The session ID to query
            
        Returns:
            Dict with session state information
        """
        # For now, use a simple status message to get current state
        messages = [{"role": "user", "content": "What is my current progress?"}]
        
        return self.send_message(
            messages=messages,
            session_id=session_id
        )
    
    def _check_api_health(self):
        """Check if MagLabs API is available."""
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(self.health_url)
                response.raise_for_status()
                health_data = response.json()
                
                if health_data.get("status") != "ok":
                    raise ConnectionError("MagLabs API is not healthy")
                    
        except httpx.RequestError:
            raise ConnectionError("MagLabs API is not reachable at http://localhost:8001")
    
    def _parse_maglabs_metadata(self, raw_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Parse MagLabs API metadata into structured format."""
        parsed = {}
        
        # Parse conversation state
        if 'conversation' in raw_metadata:
            try:
                conv_data = json.loads(raw_metadata['conversation']) if isinstance(raw_metadata['conversation'], str) else raw_metadata['conversation']
                parsed['stage'] = conv_data.get('stage', 'user_profiling')
                parsed['stage_progress'] = conv_data.get('stage_progress', 0.0)
                parsed['session_id'] = conv_data.get('conversation_id')
            except (json.JSONDecodeError, TypeError):
                logger.warning("Failed to parse conversation metadata")
        
        # Parse business context
        if 'business_context' in raw_metadata:
            try:
                business_data = json.loads(raw_metadata['business_context']) if isinstance(raw_metadata['business_context'], str) else raw_metadata['business_context']
                parsed['business_context'] = business_data
            except (json.JSONDecodeError, TypeError):
                logger.warning("Failed to parse business context metadata")
                parsed['business_context'] = {}
        
        # Parse quality metrics for health status
        if 'quality_metrics' in raw_metadata:
            try:
                quality_data = json.loads(raw_metadata['quality_metrics']) if isinstance(raw_metadata['quality_metrics'], str) else raw_metadata['quality_metrics']
                parsed['conversation_health'] = quality_data.get('conversation_health', 'good')
            except (json.JSONDecodeError, TypeError):
                logger.warning("Failed to parse quality metrics metadata")
                parsed['conversation_health'] = 'good'
        
        # Parse suggested actions
        if 'next_actions' in raw_metadata:
            try:
                actions_data = json.loads(raw_metadata['next_actions']) if isinstance(raw_metadata['next_actions'], str) else raw_metadata['next_actions']
                parsed['suggested_actions'] = actions_data.get('suggested_questions', [])
            except (json.JSONDecodeError, TypeError):
                logger.warning("Failed to parse next actions metadata")
                parsed['suggested_actions'] = []
        
        return parsed
    
    def _get_conversation_config(self, template: Optional[Any] = None) -> Dict[str, Any]:
        """Get configuration for template or use default."""
        # Start with default configuration
        config = CONVERSATION_TYPE_CONFIGS['brainstorm'].copy()
        
        # Override with template configuration if provided
        if template and hasattr(template, 'get_maglabs_config'):
            template_config = template.get_maglabs_config()
            config.update({k: v for k, v in template_config.items() if v})  # Only non-empty values
            
        return config
    
    def _get_conversation_starter(self, conversation_type: str) -> str:
        """Get appropriate conversation starter for each type."""
        starters = {
            'brainstorm': "I want to brainstorm creative solutions and innovative ideas",
            'refine': "I have an idea that I want to develop and refine thoroughly",
            'problem_solving': "I need help analyzing and solving a complex problem systematically", 
            'feature_design': "I want to design and specify a new product feature with technical details",
            'strategy_planning': "I need assistance with strategic planning and business roadmapping",
            'interview': "I want to go through a comprehensive structured interview about my business idea"
        }
        return starters.get(conversation_type, starters['brainstorm'])
    
    def start_interview_mode(self, session_id: str, template: Optional[Any] = None, 
                           interview_goals: Optional[str] = None) -> Dict[str, Any]:
        """
        Activate structured interview mode for an existing session.
        
        Args:
            session_id: Existing MagLabs session ID
            template: Template to configure interview for
            interview_goals: Specific goals for this interview
            
        Returns:
            Dict with interview activation confirmation and next steps
        """
        config = self._get_conversation_config(template)
        
        # Create interview activation message
        interview_prompt = f"""
        I want to activate structured interview mode for this conversation.
        
        Expected Stages: {config.get('expected_completion', 'all')}
        Focus Areas: {config.get('focus_stages', 'all')}
        
        Goals: {interview_goals or 'Comprehensive development of my idea through structured stages'}
        
        Please guide me through a structured interview process.
        """
        
        return self.send_message(
            messages=[{"role": "user", "content": interview_prompt}],
            session_id=session_id,
            conversation_config=config
        )
    
    def advance_to_stage(self, session_id: str, target_stage: str, 
                        template: Optional[Any] = None) -> Dict[str, Any]:
        """
        Request advancement to a specific interview stage.
        
        Args:
            session_id: MagLabs session ID
            target_stage: Stage to advance to
            template: Current template
            
        Returns:
            Dict with stage advancement response
        """
        stage_message = f"""
        I'm ready to advance to the {target_stage.replace('_', ' ')} stage. 
        Please help me move forward with the next phase of our discussion.
        """
        
        config = self._get_conversation_config(template)
        
        return self.send_message(
            messages=[{"role": "user", "content": stage_message}],
            session_id=session_id,
            conversation_config=config
        )