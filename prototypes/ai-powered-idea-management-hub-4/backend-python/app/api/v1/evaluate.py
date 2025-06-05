import logging

from fastapi import APIRouter, Depends, HTTPException
from starlette.status import HTTP_200_OK, HTTP_400_BAD_REQUEST, HTTP_503_SERVICE_UNAVAILABLE

from app.core.security import AuthenticatedUser, get_current_user # Or a more specific role
from app.models.domain import EvaluationResult, EvaluateAnswerRequest
from app.services.ai_service import evaluate_answer as ai_evaluate_answer_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "", # Empty path, will be prefixed by /api/v1/evaluate
    response_model=EvaluationResult,
    status_code=HTTP_200_OK,
    summary="Evaluate User's Answer to a Question",
    description="Receives a question, user's answer, and chat history, then returns AI evaluation.",
)
async def evaluate_user_answer_endpoint(
    request_data: EvaluateAnswerRequest,
    # current_user: AuthenticatedUser = Depends(get_current_user), # Uncomment for protected route
) -> EvaluationResult:
    """
    Endpoint to evaluate a user's answer using an AI model.
    - **request_data**: Contains the main question, user's answer, and optional chat history.
    - **current_user**: (Optional) The authenticated user.
    """
    if not request_data.main_question or request_data.user_answer_text is None: # userAnswerText can be empty string
        logger.warning("Evaluation request missing mainQuestion or userAnswerText.")
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Missing mainQuestion or userAnswerText in request.",
        )

    # logger.info(f"User {current_user.email} requesting answer evaluation for question theme: '{request_data.main_question.theme}'")
    logger.info(f"Requesting answer evaluation for question theme: '{request_data.main_question.theme}'")

    try:
        result = await ai_evaluate_answer_service(
            main_question=request_data.main_question,
            user_answer_text=request_data.user_answer_text,
            full_chat_history=request_data.full_chat_history,
        )

        if result.error:
            logger.error(
                f"AI evaluation failed for question theme '{request_data.main_question.theme}': {result.error}"
            )
            # Consistent with Node.js: return 200 with error in payload
            # Consider 503 if AI service is critical and unavailable
            if "AI service not configured" in (result.error or ""):
                 raise HTTPException(
                    status_code=HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"AI service for evaluation is currently unavailable: {result.error}",
                )
            return result # Return result with error field populated

        logger.info(
            f"Answer evaluation for theme '{request_data.main_question.theme}' resulted in type '{result.type}'."
        )
        return result

    except HTTPException:
        raise # Re-raise HTTPException
    except Exception as e:
        logger.error(
            f"Unexpected error during answer evaluation for theme '{request_data.main_question.theme}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=HTTP_503_SERVICE_UNAVAILABLE, # Or 500
            detail=f"An unexpected error occurred while evaluating the answer: {str(e)}",
        )
