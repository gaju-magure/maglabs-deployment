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
    
    def __init__(self, auth_token=None):
        self.api_base_url = 'http://localhost:8001/v1/chat/completions'
        self.health_url = 'http://localhost:8001/health'
        self.default_model = "gpt-4o-mini"
        self.timeout = 30.0
        self.auth_token = auth_token
        
    def create_session(self, user_context: Dict[str, Any], 
                      template: Optional[Any] = None, initial_message: Optional[str] = None,
                      auth_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new conversation session with MagLabs API.
        
        Args:
            user_context: User information (role, department, name, etc.)
            template: Optional ChatTemplate instance for configuration
            initial_message: Optional custom initial message
            auth_token: Optional JWT token for authentication
            
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
            conversation_config=config,
            auth_token=auth_token
        )
    
    def send_message(self, 
                    messages: List[Dict[str, str]], 
                    user_context: Optional[Dict] = None,
                    session_id: Optional[str] = None,
                    conversation_config: Optional[Dict] = None,
                    auth_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Send message to MagLabs API and get structured response.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            user_context: User context information
            session_id: Optional existing session ID
            conversation_config: Configuration from template
            auth_token: Optional JWT token for authentication
            
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
        
        # Add JWT token for authentication if provided (prioritize parameter over instance)
        # token_to_use = auth_token or self.auth_token
        # if token_to_use:
        #     headers['Authorization'] = f'Bearer {token_to_use}'
        
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
                
                # Legacy compatibility fields
                'stage': parsed_metadata.get('stage', 'user_profiling'),
                'stage_progress': parsed_metadata.get('stage_progress', 0.0),
                'conversation_health': parsed_metadata.get('conversation_health', 'good'),
                'business_context': parsed_metadata.get('business_context', {}),
                'suggested_actions': parsed_metadata.get('suggested_actions', []),
                
                # Enhanced MagLabs metadata - conversation state
                'conversation_momentum': parsed_metadata.get('conversation_momentum', 0.0),
                'progress_velocity': parsed_metadata.get('progress_velocity', 0.0),
                'estimated_remaining_seconds': parsed_metadata.get('estimated_remaining_seconds', 0),
                'flow_issues': parsed_metadata.get('flow_issues', []),
                'transition_triggers': parsed_metadata.get('transition_triggers', []),
                
                # Quality metrics and AI transparency
                'quality_metrics': parsed_metadata.get('quality_metrics', {}),
                'ai_state': parsed_metadata.get('ai_state', {}),
                'next_actions': parsed_metadata.get('next_actions', {}),
                'stage_completion': parsed_metadata.get('stage_completion', {}),
                
                # Enhanced stage progression data (maintained for backward compatibility)
                'stage_data': {
                    'stage_name': parsed_metadata.get('stage_name', 'user_profiling'),
                    'stage_completion': parsed_metadata.get('stage_completion', {}),
                    'business_context': parsed_metadata.get('business_context', {}),
                    'transition_ready': parsed_metadata.get('transition_ready', False),
                    'conversation_health': parsed_metadata.get('conversation_health', 'good'),
                    'next_stage': parsed_metadata.get('next_stage'),
                    'ai_confidence': parsed_metadata.get('ai_confidence', 0.8),
                    'assumptions_made': parsed_metadata.get('assumptions_made', []),
                    'clarification_needed': parsed_metadata.get('clarification_needed', False),
                    
                    # Enhanced fields
                    'conversation_momentum': parsed_metadata.get('conversation_momentum', 0.0),
                    'progress_velocity': parsed_metadata.get('progress_velocity', 0.0),
                    'quality_indicators': parsed_metadata.get('quality_metrics', {}).get('progress_indicators', []),
                    'intervention_suggestions': parsed_metadata.get('quality_metrics', {}).get('intervention_suggestions', []),
                    'flow_issues': parsed_metadata.get('flow_issues', [])
                },
                
                'metadata': {
                    'model': data.get('model'),
                    'usage': data.get('usage', {}),
                    'timestamp': timezone.now().isoformat(),
                    'raw_metadata': raw_metadata,
                    'parsing_summary': parsed_metadata.get('metadata_summary', {})
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
            
            if e.response.status_code == 401:
                # Authentication failed - JWT token invalid or expired
                logger.error("Authentication failed with MagLabs API - invalid or expired JWT token")
                raise ConnectionError("Authentication failed: Invalid or expired JWT token. Please log in again.")
            elif e.response.status_code == 403:
                # Authorization failed - JWT token valid but insufficient permissions
                logger.error("Authorization failed with MagLabs API - insufficient permissions")
                raise ConnectionError("Access denied: You don't have permission to access this AI service.")
            elif e.response.status_code >= 500:
                # Try retry with new session for 500 errors (likely token limit)
                logger.info("500 error detected, attempting retry with new session")
                return self._retry_with_new_session(messages, user_context, conversation_config, auth_token)
            elif e.response.status_code == 422:
                # Unprocessable entity - likely invalid metadata format, try retry
                logger.info("422 error detected, attempting retry with new session")
                return self._retry_with_new_session(messages, user_context, conversation_config, auth_token)
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
                               conversation_config: Dict,
                               auth_token: Optional[str] = None) -> Dict[str, Any]:
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
        
        # Add JWT token for authentication if provided
        token_to_use = auth_token or self.auth_token
        if token_to_use:
            headers['Authorization'] = f'Bearer {token_to_use}'
        
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
                
                # Legacy compatibility fields
                'stage': parsed_metadata.get('stage', 'user_profiling'),
                'stage_progress': parsed_metadata.get('stage_progress', 0.0),
                'conversation_health': parsed_metadata.get('conversation_health', 'good'),
                'business_context': parsed_metadata.get('business_context', {}),
                'suggested_actions': parsed_metadata.get('suggested_actions', []),
                
                # Enhanced MagLabs metadata - conversation state
                'conversation_momentum': parsed_metadata.get('conversation_momentum', 0.0),
                'progress_velocity': parsed_metadata.get('progress_velocity', 0.0),
                'estimated_remaining_seconds': parsed_metadata.get('estimated_remaining_seconds', 0),
                'flow_issues': parsed_metadata.get('flow_issues', []),
                'transition_triggers': parsed_metadata.get('transition_triggers', []),
                
                # Quality metrics and AI transparency
                'quality_metrics': parsed_metadata.get('quality_metrics', {}),
                'ai_state': parsed_metadata.get('ai_state', {}),
                'next_actions': parsed_metadata.get('next_actions', {}),
                'stage_completion': parsed_metadata.get('stage_completion', {}),
                
                # Enhanced stage progression data (maintained for backward compatibility)
                'stage_data': {
                    'stage_name': parsed_metadata.get('stage_name', 'user_profiling'),
                    'stage_completion': parsed_metadata.get('stage_completion', {}),
                    'business_context': parsed_metadata.get('business_context', {}),
                    'transition_ready': parsed_metadata.get('transition_ready', False),
                    'conversation_health': parsed_metadata.get('conversation_health', 'good'),
                    'next_stage': parsed_metadata.get('next_stage'),
                    'ai_confidence': parsed_metadata.get('ai_confidence', 0.8),
                    'assumptions_made': parsed_metadata.get('assumptions_made', []),
                    'clarification_needed': parsed_metadata.get('clarification_needed', False),
                    
                    # Enhanced fields
                    'conversation_momentum': parsed_metadata.get('conversation_momentum', 0.0),
                    'progress_velocity': parsed_metadata.get('progress_velocity', 0.0),
                    'quality_indicators': parsed_metadata.get('quality_metrics', {}).get('progress_indicators', []),
                    'intervention_suggestions': parsed_metadata.get('quality_metrics', {}).get('intervention_suggestions', []),
                    'flow_issues': parsed_metadata.get('flow_issues', [])
                },
                
                'metadata': {
                    'model': data.get('model'),
                    'usage': data.get('usage', {}),
                    'timestamp': timezone.now().isoformat(),
                    'raw_metadata': raw_metadata,
                    'parsing_summary': parsed_metadata.get('metadata_summary', {}),
                    'session_reset': True
                }
            }
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                logger.error("Authentication failed during session retry - invalid or expired JWT token")
                raise ConnectionError("Authentication failed: Invalid or expired JWT token. Please log in again.")
            elif e.response.status_code == 403:
                logger.error("Authorization failed during session retry - insufficient permissions")
                raise ConnectionError("Access denied: You don't have permission to access this AI service.")
            else:
                logger.error(f"HTTP error during session retry: {e.response.status_code}")
                raise ConnectionError("Unable to create new conversation session")
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
        """Parse MagLabs API metadata into comprehensive structured format for enhanced stage progression."""
        parsed = {}
        
        # Parse conversation state (core conversation metrics)
        conversation_data = {}
        if 'conversation' in raw_metadata:
            try:
                conv_data = json.loads(raw_metadata['conversation']) if isinstance(raw_metadata['conversation'], str) else raw_metadata['conversation']
                conversation_data = conv_data
                
                # Core fields for backward compatibility
                parsed['stage_name'] = conv_data.get('stage', 'user_profiling')
                parsed['stage_progress'] = conv_data.get('stage_progress', 0.0)
                parsed['session_id'] = conv_data.get('conversation_id')
                parsed['stage'] = conv_data.get('stage', 'user_profiling')  # Legacy compatibility
                
                # Enhanced conversation metrics
                parsed['conversation_momentum'] = conv_data.get('conversation_momentum', 0.0)
                parsed['estimated_remaining_seconds'] = conv_data.get('estimated_remaining_seconds', 0)
                parsed['total_exchanges'] = conv_data.get('total_exchanges', 0)
                parsed['stage_duration_seconds'] = conv_data.get('stage_duration_seconds', 0)
                parsed['transition_triggers'] = conv_data.get('transition_triggers', [])
                parsed['flow_issues'] = conv_data.get('flow_issues', [])
                parsed['automation_level'] = conv_data.get('automation_level', 0.0)
                
            except (json.JSONDecodeError, TypeError):
                logger.warning("Failed to parse conversation metadata")
                parsed.update({
                    'stage_name': 'user_profiling',
                    'stage': 'user_profiling',
                    'conversation_momentum': 0.0,
                    'flow_issues': [],
                    'transition_triggers': []
                })
        
        # Parse stage completion scores (detailed stage progression)
        stage_completion_data = {}
        if 'stage_completion' in raw_metadata:
            try:
                stage_data = json.loads(raw_metadata['stage_completion']) if isinstance(raw_metadata['stage_completion'], str) else raw_metadata['stage_completion']
                stage_completion_data = stage_data
                parsed['stage_completion'] = stage_data
            except (json.JSONDecodeError, TypeError):
                logger.warning("Failed to parse stage completion metadata")
                parsed['stage_completion'] = {}
        
        # Parse business context with comprehensive business intelligence
        business_context = {}
        if 'business_context' in raw_metadata:
            try:
                business_data = json.loads(raw_metadata['business_context']) if isinstance(raw_metadata['business_context'], str) else raw_metadata['business_context']
                business_context.update(business_data)
                
                # Structure business context for frontend
                parsed['business_context'] = {
                    'problem_clarity': business_context.get('problem_clarity', 0.0),
                    'solution_readiness': business_context.get('solution_readiness', 0.0),
                    'technical_sophistication': business_context.get('technical_sophistication', 0.5),
                    'implementation_readiness': business_context.get('implementation_readiness', 0.0),
                    'stakeholder_engagement': business_context.get('stakeholder_engagement', 0.5),
                    'urgency_level': business_context.get('urgency_level', 'medium'),
                    'budget_signals': business_context.get('budget_signals', 'business'),
                    'decision_authority': business_context.get('decision_authority', 'medium'),
                    'pain_points': business_context.get('pain_points', []),
                    'success_criteria': business_context.get('success_criteria', []),
                    'business_drivers': business_context.get('business_drivers', [])
                }
            except (json.JSONDecodeError, TypeError):
                logger.warning("Failed to parse business context metadata")
                parsed['business_context'] = {
                    'problem_clarity': 0.0,
                    'solution_readiness': 0.0,
                    'urgency_level': 'medium',
                    'budget_signals': 'business',
                    'decision_authority': 'medium'
                }
        
        # Parse quality metrics (conversation health and performance)
        quality_metrics = {}
        if 'quality_metrics' in raw_metadata:
            try:
                quality_data = json.loads(raw_metadata['quality_metrics']) if isinstance(raw_metadata['quality_metrics'], str) else raw_metadata['quality_metrics']
                quality_metrics = quality_data
                
                parsed['conversation_health'] = quality_data.get('conversation_health', 'good')
                parsed['progress_velocity'] = quality_data.get('progress_velocity', 0.0)
                parsed['quality_metrics'] = {
                    'information_density': quality_data.get('information_density', 0.0),
                    'user_engagement': quality_data.get('user_engagement', 0.0),
                    'question_to_answer_ratio': quality_data.get('question_to_answer_ratio', 0.0),
                    'stage_progression_rate': quality_data.get('stage_progression_rate', 0.0),
                    'repetition_score': quality_data.get('repetition_score', 0.0),
                    'coherence_score': quality_data.get('coherence_score', 0.0),
                    'stuck_indicators': quality_data.get('stuck_indicators', []),
                    'progress_indicators': quality_data.get('progress_indicators', []),
                    'intervention_suggestions': quality_data.get('intervention_suggestions', [])
                }
            except (json.JSONDecodeError, TypeError):
                logger.warning("Failed to parse quality metrics metadata")
                parsed.update({
                    'conversation_health': 'good',
                    'progress_velocity': 0.0,
                    'quality_metrics': {
                        'intervention_suggestions': [],
                        'stuck_indicators': [],
                        'progress_indicators': []
                    }
                })
        
        # Parse AI state metadata (transparency and assumptions)
        ai_state = {}
        if 'ai_state' in raw_metadata:
            try:
                ai_data = json.loads(raw_metadata['ai_state']) if isinstance(raw_metadata['ai_state'], str) else raw_metadata['ai_state']
                ai_state = ai_data
                
                parsed['ai_state'] = {
                    'response_confidence': ai_data.get('response_confidence', 0.8),
                    'assumptions_made': ai_data.get('assumptions_made', []),
                    'assumption_confidence': ai_data.get('assumption_confidence', 0.0),
                    'clarification_needed': ai_data.get('clarification_needed', False),
                    'clarification_topics': ai_data.get('clarification_topics', []),
                    'reasoning': ai_data.get('reasoning', ''),
                    'alternative_approaches': ai_data.get('alternative_approaches', [])
                }
                
                # Legacy fields for backward compatibility
                parsed['ai_confidence'] = ai_data.get('response_confidence', 0.8)
                parsed['assumptions_made'] = ai_data.get('assumptions_made', [])
                parsed['clarification_needed'] = ai_data.get('clarification_needed', False)
                
            except (json.JSONDecodeError, TypeError):
                logger.warning("Failed to parse AI state metadata")
                parsed['ai_state'] = {
                    'response_confidence': 0.8,
                    'assumptions_made': [],
                    'clarification_needed': False
                }
        
        # Parse next actions and recommendations
        if 'next_actions' in raw_metadata:
            try:
                actions_data = json.loads(raw_metadata['next_actions']) if isinstance(raw_metadata['next_actions'], str) else raw_metadata['next_actions']
                
                parsed['next_actions'] = {
                    'recommended_stage': actions_data.get('recommended_stage'),
                    'transition_ready': actions_data.get('transition_ready', False),
                    'client_actions': actions_data.get('client_actions', []),
                    'estimated_completion': actions_data.get('estimated_completion'),
                    'suggested_questions': actions_data.get('suggested_questions', []),
                    'preparation_items': actions_data.get('preparation_items', []),
                    'potential_blockers': actions_data.get('potential_blockers', [])
                }
                
                # Legacy fields
                parsed['suggested_actions'] = actions_data.get('suggested_questions', [])
                parsed['transition_ready'] = actions_data.get('transition_ready', False)
                parsed['next_stage'] = actions_data.get('recommended_stage')
                
            except (json.JSONDecodeError, TypeError):
                logger.warning("Failed to parse next actions metadata")
                parsed.update({
                    'next_actions': {
                        'transition_ready': False,
                        'suggested_questions': [],
                        'client_actions': []
                    },
                    'suggested_actions': [],
                    'transition_ready': False
                })
        
        # Add comprehensive metadata summary for debugging and monitoring
        parsed['metadata_summary'] = {
            'conversation_parsed': bool(conversation_data),
            'quality_metrics_parsed': bool(quality_metrics),
            'business_context_parsed': bool(business_context),
            'ai_state_parsed': bool(ai_state),
            'stage_completion_parsed': bool(stage_completion_data),
            'total_fields_parsed': len([k for k in raw_metadata.keys() if k in ['conversation', 'quality_metrics', 'business_context', 'ai_state', 'stage_completion', 'next_actions']]),
            'parsing_timestamp': timezone.now().isoformat()
        }
        
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
                           interview_goals: Optional[str] = None, auth_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Activate structured interview mode for an existing session.
        
        Args:
            session_id: Existing MagLabs session ID
            template: Template to configure interview for
            interview_goals: Specific goals for this interview
            auth_token: Optional JWT token for authentication
            
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
            conversation_config=config,
            auth_token=auth_token
        )
    
    def advance_to_stage(self, session_id: str, target_stage: str, 
                        template: Optional[Any] = None, auth_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Request advancement to a specific interview stage.
        
        Args:
            session_id: MagLabs session ID
            target_stage: Stage to advance to
            template: Current template
            auth_token: Optional JWT token for authentication
            
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
            conversation_config=config,
            auth_token=auth_token
        )