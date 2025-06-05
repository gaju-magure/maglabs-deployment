import logging
import asyncio
import os
from datetime import datetime
from typing import List, Optional, Dict, Any

import litellm
from litellm.utils import ModelResponse

from app.core.config import settings
from app.models.domain import (
    CategorizationResult,
    ChatMessage,
    EvaluationResult,
    IdeaCategoryEnum,
    Question,
)

logger = logging.getLogger(__name__)

# Configure LiteLLM client
try:
    # Use the LLM configuration from settings
    model_name = settings.LLM_MODEL
    
    # LiteLLM automatically reads API keys from standard environment variable names:
    # - OpenAI: OPENAI_API_KEY
    # - Gemini/Google: GOOGLE_API_KEY or GEMINI_API_KEY  
    # - Anthropic: ANTHROPIC_API_KEY
    # No explicit configuration needed, just verify keys are available
    
    if settings.LLM_PROVIDER == "gemini":
        logger.info(f"Using LiteLLM with Gemini for model: {model_name}")
        # LiteLLM will automatically use GOOGLE_API_KEY or GEMINI_API_KEY from environment
        if not (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY") or settings.GEMINI_API_KEY):
            logger.error("No Gemini API key found (GOOGLE_API_KEY, GEMINI_API_KEY, or settings)")
            model_name = None
        
    elif settings.LLM_PROVIDER == "openai":
        logger.info(f"Using LiteLLM with OpenAI for model: {model_name}")
        # LiteLLM will automatically use OPENAI_API_KEY from environment
        if not os.environ.get("OPENAI_API_KEY"):
            logger.error("OPENAI_API_KEY not found in environment variables")
            model_name = None
        
    elif settings.LLM_PROVIDER == "anthropic":
        logger.info(f"Using LiteLLM with Anthropic for model: {model_name}")
        # LiteLLM will automatically use ANTHROPIC_API_KEY from environment
        if not os.environ.get("ANTHROPIC_API_KEY"):
            logger.error("ANTHROPIC_API_KEY not found in environment variables")
            model_name = None
    else:
        logger.warning(f"Unknown LLM provider '{settings.LLM_PROVIDER}'. Supported: gemini, openai, anthropic")
        model_name = None
        
    if model_name:
        logger.info(f"LiteLLM configured to use model: {model_name}")
        
except Exception as e:
    logger.error(f"Error configuring LiteLLM: {e}", exc_info=True)
    model_name = None


# Constants from the original Node.js backend
PROCEED_MARKER = "AI_ACTION: PROCEED"
CLARIFY_ACTION_MARKER = "AI_ACTION: CLARIFY" # Renamed for clarity vs CLARITY_DELTA_MARKER
CLARITY_DELTA_MARKER = "CLARITY_DELTA:"
FINAL_ANSWER_MARKER = "FINAL_ANSWER:"


async def categorize_idea(title: str, description: str) -> CategorizationResult:
    """
    Categorizes an idea based on its title and description using LiteLLM.
    """
    if not model_name:
        logger.error(
            "LiteLLM not properly configured for categorization. Model name is invalid."
        )
        # Fallback to Uncategorized with an error message
        return CategorizationResult(
            category=IdeaCategoryEnum.UNCATEGORIZED,
            error="AI service not configured or model unavailable.",
        )
    
    # LiteLLM will handle API key validation automatically during the API call

    categories = ", ".join(
        [
            cat.value
            for cat in IdeaCategoryEnum
            if cat != IdeaCategoryEnum.UNCATEGORIZED
        ]
    )
    prompt = f"""
    Given the following idea title and description, please categorize it into ONE of the following predefined categories.
    Respond with ONLY the category name from the list. Do not add any extra text, explanation, or markdown.

    Categories:
    {categories}

    Idea Title: "{title}"
    Idea Description: "{description}"

    Chosen Category:
    """

    try:
        logger.debug(f"Sending categorization prompt to LiteLLM: {prompt}")
        
        # Call LiteLLM completion API
        start_time = datetime.now()
        response = await litellm.acompletion(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,  # Low temperature for more deterministic responses
            max_tokens=50,    # We only need a short response
        )
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info(f"LiteLLM API call completed in {duration:.2f} seconds")
        
        # Extract the response text
        if response and hasattr(response, 'choices') and len(response.choices) > 0:
            text_response = response.choices[0].message.content.strip()
            logger.debug(f"LiteLLM categorization raw response: '{text_response}'")

            if text_response in IdeaCategoryEnum._value2member_map_:  # type: ignore
                return CategorizationResult(
                    category=IdeaCategoryEnum(text_response), 
                    confidence=0.85  # Mock confidence
                )
            else:
                logger.warning(
                    f"LiteLLM response '{text_response}' is not a valid IdeaCategoryEnum for categorization. Defaulting to Uncategorized."
                )
                return CategorizationResult(
                    category=IdeaCategoryEnum.UNCATEGORIZED,
                    error="AI could not determine a valid category from the response.",
                )
        else:
            logger.error(f"Unexpected response format from LiteLLM: {response}")
            return CategorizationResult(
                category=IdeaCategoryEnum.UNCATEGORIZED,
                error="AI returned an unexpected response format.",
            )
    except Exception as e:
        logger.error(f"Error calling LiteLLM API for categorization: {e}", exc_info=True)
        return CategorizationResult(
            category=IdeaCategoryEnum.UNCATEGORIZED, 
            error=f"AI categorization failed: {str(e)}"
        )


async def evaluate_answer(
    main_question: Question, user_answer_text: str, full_chat_history: Optional[List[ChatMessage]] = None
) -> EvaluationResult:
    """
    Evaluates a user's answer to a question using LiteLLM, providing feedback or clarification.
    """
    logger.info(f"Evaluating answer for: '{main_question.text}' (Theme: {main_question.theme})")
    logger.info(f"User answer: '{user_answer_text}'")

    try:
        # LiteLLM will handle API key validation automatically during the API call
        
        if not model_name:
            logger.error("Model name is not set. Cannot evaluate answer.")
            return EvaluationResult(
                type="proceed",
                ai_response_to_user=f"Thank you for your input on '{main_question.theme}'. (AI model not configured)",
                final_answer_for_question=user_answer_text,
                clarity_meter_delta=0.05,
                error="Model name is not set",
            )

        chat_history_str = "\n".join(
            [f"{m.sender.value}: {m.text}" for m in (full_chat_history or [])[-3:]] # Last 3 messages
        )

        prompt_template = f"""
        You are an AI assistant helping a user flesh out an idea by asking questions.
        The current main question is about "{main_question.theme}": "{main_question.text}".
        The user's latest answer is: "{user_answer_text}".

        Previously discussed relevant context (last few messages):
        {chat_history_str}

        Your task:
        1. Evaluate if the user's answer is clear, sufficient, and directly addresses the main question.
        2. If the answer is sufficient:
           - Start your response strictly with "{PROCEED_MARKER}".
           - On a new line, provide a brief, encouraging message to the user (1-2 sentences).
           - OPTIONAL: If useful, on a new line, write "{FINAL_ANSWER_MARKER}" followed by a concise summary or refined version of the user's key point for this question. If not refining, omit this line.
           - Finally, on a new line, write "{CLARITY_DELTA_MARKER}" followed by a numerical value between 0.10 and 0.30 (e.g., {CLARITY_DELTA_MARKER}0.20).
        3. If the answer is unclear, insufficient, or evasive:
           - Start your response strictly with "{CLARIFY_ACTION_MARKER}".
           - On a new line, formulate a polite and specific clarifying question for the user to elicit more details or focus their response (1-2 sentences).
           - Finally, on a new line, write "{CLARITY_DELTA_MARKER}" followed by a numerical value between 0.00 and 0.10 (e.g., {CLARITY_DELTA_MARKER}0.05).

        Focus on making the interaction feel natural, helpful, and constructive. Be concise.
        """

        try:
            logger.info("Calling LiteLLM for answer evaluation...")
            start_time = datetime.now()
            
            # Call LiteLLM completion API
            response = await litellm.acompletion(
                model=model_name,
                messages=[{"role": "user", "content": prompt_template}],
                temperature=0.7,  # Moderate temperature for balanced creativity and consistency
                max_tokens=300,   # Enough for a detailed response
            )
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.info(f"LiteLLM API call completed in {duration:.2f} seconds")
            
            # Extract the response text
            if response and hasattr(response, 'choices') and len(response.choices) > 0:
                ai_generated_text = response.choices[0].message.content.strip()
                logger.debug(f"LiteLLM evaluation raw response: '{ai_generated_text}'")
                
                # Process the response
                lines = [line.strip() for line in ai_generated_text.split("\n") if line.strip()]
                if not lines:
                    logger.error("LiteLLM response was empty or only whitespace.")
                    raise ValueError("Empty response from AI.")
                
                action_line = lines[0]
                ai_response_to_user = "Okay, let's move on." # Default
                final_answer_for_question = user_answer_text # Default
                clarity_meter_delta = 0.0

                clarity_delta_line = next((line for line in lines if line.upper().startswith(CLARITY_DELTA_MARKER)), None)
                if clarity_delta_line:
                    delta_str = clarity_delta_line[len(CLARITY_DELTA_MARKER):].strip()
                    try:
                        delta = float(delta_str)
                        clarity_meter_delta = max(0.0, min(delta, 0.30)) # Clamp value
                    except ValueError:
                        logger.warning(f"Could not parse clarity delta: '{delta_str}'")
                
                # Extract AI response to user (second line, if not a marker line)
                if len(lines) > 1 and not lines[1].upper().startswith((FINAL_ANSWER_MARKER, CLARITY_DELTA_MARKER)):
                    ai_response_to_user = lines[1]

                if PROCEED_MARKER in action_line:
                    final_answer_line = next((line for line in lines if line.upper().startswith(FINAL_ANSWER_MARKER)), None)
                    if final_answer_line:
                        parsed_final_answer = final_answer_line[len(FINAL_ANSWER_MARKER):].strip()
                        if parsed_final_answer:
                            final_answer_for_question = parsed_final_answer
                    
                    # Default proceed message if none better was parsed
                    if ai_response_to_user == "Okay, let's move on." and len(lines) > 1 and lines[1].upper().startswith(CLARITY_DELTA_MARKER):
                         ai_response_to_user = f"Thanks for clarifying that regarding '{main_question.theme}'!"

                    return EvaluationResult(
                        type="proceed",
                        ai_response_to_user=ai_response_to_user,
                        final_answer_for_question=final_answer_for_question,
                        clarity_meter_delta=clarity_meter_delta,
                    )
                elif CLARIFY_ACTION_MARKER in action_line:
                    # Default clarify message if none better was parsed
                    if ai_response_to_user == "Okay, let's move on." or (len(lines) > 1 and lines[1].upper().startswith(CLARITY_DELTA_MARKER)):
                        ai_response_to_user = f"Could you tell me a bit more about '{main_question.theme}'?"
                    
                    return EvaluationResult(
                        type="clarify",
                        ai_response_to_user=ai_response_to_user,
                        clarity_meter_delta=clarity_meter_delta,
                    )
                else:
                    logger.warning(f"LiteLLM response format unexpected: '{ai_generated_text}'")
                    return EvaluationResult(
                        type="proceed", # Fallback to proceed
                        ai_response_to_user="Response structure issue, but let's continue.",
                        final_answer_for_question=user_answer_text,
                        clarity_meter_delta=0.01,
                        error="AI response format error.",
                    )
            else:
                logger.error(f"Unexpected response format from LiteLLM: {response}")
                return EvaluationResult(
                    type="proceed",
                    ai_response_to_user=f"Thank you for your input on '{main_question.theme}'. (AI response format error)",
                    final_answer_for_question=user_answer_text,
                    clarity_meter_delta=0.05,
                    error="Unexpected response format from LiteLLM",
                )
                
        except Exception as api_error:
            logger.error(f"Error during LiteLLM API call: {api_error}", exc_info=True)
            return EvaluationResult(
                type="proceed",
                ai_response_to_user=f"Thank you for your input on '{main_question.theme}'. (API error occurred)",
                final_answer_for_question=user_answer_text,
                clarity_meter_delta=0.05,
                error=f"LiteLLM API error: {str(api_error)}",
            )
    except Exception as e:
        logger.error(f"Unexpected error in evaluate_answer: {e}", exc_info=True)
        return EvaluationResult(
            type="proceed",
            ai_response_to_user=f"Thank you for your input on '{main_question.theme}'. (Error: {str(e)})",
            final_answer_for_question=user_answer_text,
            clarity_meter_delta=0.0,
            error=f"Unexpected error: {str(e)}",
        )

