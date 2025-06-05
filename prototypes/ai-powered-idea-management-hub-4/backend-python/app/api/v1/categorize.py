import logging

from fastapi import APIRouter, Depends, HTTPException
from starlette.status import HTTP_200_OK, HTTP_400_BAD_REQUEST, HTTP_503_SERVICE_UNAVAILABLE

from app.core.security import AuthenticatedUser, get_current_user # Or a more specific role if needed
from app.models.domain import CategorizationResult, CategorizeRequest
from app.services.ai_service import categorize_idea as ai_categorize_idea_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "", # Empty path, will be prefixed by /api/v1/categorize
    response_model=CategorizationResult,
    status_code=HTTP_200_OK,
    summary="Categorize an Idea",
    description="Receives an idea's title and description, and returns an AI-generated category.",
)
async def categorize_idea_endpoint(
    request_data: CategorizeRequest,
    # current_user: AuthenticatedUser = Depends(get_current_user), # Uncomment to make it a protected route
) -> CategorizationResult:
    """
    Endpoint to categorize an idea using an AI model.
    - **request_data**: Contains the title and description of the idea.
    - **current_user**: (Optional) The authenticated user making the request.
    """
    if not request_data.title or not request_data.description:
        logger.warning("Categorization request missing title or description.")
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Missing title or description in request.",
        )

    # logger.info(f"User {current_user.email} is requesting categorization for idea: '{request_data.title}'")
    logger.info(f"Requesting categorization for idea: '{request_data.title}'")


    try:
        result = await ai_categorize_idea_service(
            title=request_data.title, description=request_data.description
        )

        if result.error and result.category == CategorizationResult.__fields__["category"].default : # type: ignore
            # If there was an error and category is the default (e.g., UNCATEGORIZED)
            # We might want to return a different status code or ensure client handles error field
            logger.error(f"AI categorization failed for '{request_data.title}': {result.error}")
            # For now, returning 200 with error in payload as per original Node.js backend
            # Consider 503 if AI service is critical and unavailable
            if "AI service not configured" in (result.error or ""):
                 raise HTTPException(
                    status_code=HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"AI service for categorization is currently unavailable: {result.error}",
                )
            # Other errors might still be 200 but with error details
            return result

        logger.info(f"Idea '{request_data.title}' categorized as '{result.category.value}' with confidence {result.confidence}")
        return result

    except HTTPException:
        raise # Re-raise HTTPException to let FastAPI handle it
    except Exception as e:
        logger.error(
            f"Unexpected error during idea categorization for '{request_data.title}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=HTTP_503_SERVICE_UNAVAILABLE, # Or 500 for general internal error
            detail=f"An unexpected error occurred while categorizing the idea: {str(e)}",
        )
