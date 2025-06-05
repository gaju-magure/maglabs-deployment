import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase._async.client import AsyncClient as SupabaseAsyncClient  # Correct import path

from app.core.supabase_client import get_supabase_async_client
from app.core.security import AuthenticatedUser, get_current_user, require_admin, UserRoleEnum # Example role protection
from app.models.domain import Idea, IdeaCreate, IdeaUpdate, MessageResponse, IdeaStatusEnum # Assuming MessageResponse for delete
from app.services import idea_service # Import the actual service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "",
    response_model=Idea,
    status_code=status.HTTP_201_CREATED,
    summary="Create a New Idea",
    description="Allows an authenticated user to submit a new idea.",
)
async def create_new_idea(
    idea_in: IdeaCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase: SupabaseAsyncClient = Depends(get_supabase_async_client), # Inject Supabase client
) -> Idea:
    """
    Create a new idea. The submitter will be the currently authenticated user.
    """
    logger.info(f"User {current_user.email} (ID: {current_user.id}) creating new idea: '{idea_in.title}'")
    
    # Ensure submitter_email in payload matches authenticated user, or set it from current_user
    if idea_in.submitter_email != current_user.email:
        logger.warning(
            f"Idea submission by {current_user.email} has mismatched submitter_email '{idea_in.submitter_email}'. "
            f"Overriding with authenticated user's email."
        )
        idea_in.submitter_email = current_user.email

    new_idea = await idea_service.create_idea_in_db(
        db=supabase, idea_data=idea_in, submitter_user_id=uuid.UUID(current_user.id)
    )
    if not new_idea:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create idea.")
    return new_idea


@router.get(
    "",
    response_model=List[Idea],
    summary="List All Ideas",
    description="Retrieves a list of ideas, with pagination support. Accessible to all authenticated users.",
)
async def list_ideas(
    skip: int = Query(0, ge=0, description="Number of items to skip for pagination."),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of items to return."),
    current_user: AuthenticatedUser = Depends(get_current_user), # Ensures user is authenticated
    supabase: SupabaseAsyncClient = Depends(get_supabase_async_client),
) -> List[Idea]:
    """
    Get a list of all ideas.
    - **skip**: Number of ideas to skip.
    - **limit**: Maximum number of ideas to return.
    """
    logger.info(f"User {current_user.email} listing ideas with skip={skip}, limit={limit}.")
    ideas = await idea_service.get_all_ideas_from_db(db=supabase, skip=skip, limit=limit)
    return ideas


@router.get(
    "/{idea_id}",
    response_model=Idea,
    summary="Get a Specific Idea",
    description="Retrieves details for a specific idea by its ID.",
)
async def get_specific_idea(
    idea_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase: SupabaseAsyncClient = Depends(get_supabase_async_client),
) -> Idea:
    """
    Get a specific idea by its UUID.
    """
    logger.info(f"User {current_user.email} requesting idea with ID: {idea_id}")
    idea = await idea_service.get_idea_by_id_from_db(db=supabase, idea_id=idea_id)
    if not idea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Idea with ID {idea_id} not found.")
    
    # Basic permission: User can see their own ideas or if they are admin/evaluator.
    # More granular RLS should be handled at the DB level.
    # The submitter_email in the Idea model from DB needs to be populated correctly for this check.
    # For now, this check might be too simplistic if submitter_email is not reliably fetched.
    # if idea.submitter_email != current_user.email and current_user.role not in [UserRoleEnum.ADMIN, UserRoleEnum.EVALUATOR]:
    #     # This check depends on how submitter_email is populated in the Idea model by the service.
    #     # If idea_service.get_idea_by_id_from_db doesn't join with users table for email, this won't work.
    #     # RLS policies in Supabase are the primary enforcer.
    #     pass # Assuming RLS handles this.

    return idea


@router.patch(
    "/{idea_id}",
    response_model=Idea,
    summary="Update an Idea",
    description="Allows updating parts of an existing idea. Restrictions may apply based on user role and idea status.",
)
async def update_existing_idea(
    idea_id: uuid.UUID,
    idea_in: IdeaUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase: SupabaseAsyncClient = Depends(get_supabase_async_client),
) -> Idea:
    """
    Update an existing idea.
    - User must be the submitter (for drafts) or have appropriate permissions (Admin/Evaluator).
    """
    logger.info(f"User {current_user.email} (ID: {current_user.id}) attempting to update idea ID: {idea_id}")
    
    # Service function should handle checking if idea exists and user has permission.
    # For now, we rely on RLS and the service function to return None if not found/allowed.
    updated_idea = await idea_service.update_idea_in_db(
        db=supabase, idea_id=idea_id, idea_update_data=idea_in, current_user_id=uuid.UUID(current_user.id)
    )
    
    if not updated_idea:
        # Could be 404 (not found) or 403 (forbidden), or 500 (update failed).
        # The service layer should ideally differentiate or log appropriately.
        # For now, assume 404 if not found, otherwise it might be a general failure.
        # A more robust way is for service to raise specific exceptions.
        existing_check = await idea_service.get_idea_by_id_from_db(db=supabase, idea_id=idea_id)
        if not existing_check:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Idea with ID {idea_id} not found for update.")
        # If it exists but update failed, it could be a permission issue handled by RLS (returning no data)
        # or an internal error.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update idea. It might be due to permissions or an internal error.")
        
    return updated_idea


@router.delete(
    "/{idea_id}",
    response_model=MessageResponse, 
    status_code=status.HTTP_200_OK, 
    summary="Delete an Idea",
    description="Allows deleting an idea. Typically restricted to submitters (for drafts) or Admins.",
)
async def delete_existing_idea(
    idea_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user), 
    supabase: SupabaseAsyncClient = Depends(get_supabase_async_client),
) -> MessageResponse:
    """
    Delete an existing idea.
    - User must be the submitter (for drafts) or an Admin. (Enforced by RLS / service logic)
    """
    logger.info(f"User {current_user.email} (ID: {current_user.id}) attempting to delete idea ID: {idea_id}")

    # Service function should handle RLS internally or check permissions.
    success = await idea_service.delete_idea_from_db(
        db=supabase, idea_id=idea_id, current_user_id=uuid.UUID(current_user.id)
    )
    
    if not success:
        # Check if idea existed to differentiate 404 from other errors (e.g. RLS denial)
        existing_idea = await idea_service.get_idea_by_id_from_db(db=supabase, idea_id=idea_id)
        if not existing_idea: # If it's already gone or never existed
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Idea with ID {idea_id} not found for deletion.")
        # If it exists but deletion failed, it's likely a permission issue (RLS) or other DB error.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Failed to delete idea with ID {idea_id}. Check permissions or server logs.")
    
    return MessageResponse(message=f"Idea with ID {idea_id} deleted successfully.")
