import logging
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum # Added for isinstance check

from supabase._async.client import AsyncClient as SupabaseAsyncClient # Corrected import
from postgrest.base_request_builder import APIResponse # Corrected import for type hinting

from app.models.domain import Idea, IdeaCreate, IdeaUpdate, IdeaTagCreate, IdeaStatusEnum, Answer, ChatMessage, ValueSelection
from app.core.config import settings # If needed for service-specific configs

logger = logging.getLogger(__name__)

# --- Helper functions for Supabase interactions (can be expanded) ---

async def _handle_supabase_response(response: APIResponse, operation: str, entity_name: str, entity_id: Optional[Any] = None):
    """
    Helper to consistently handle Supabase Postgrest responses.
    Logs errors and raises HTTPException for bad responses if needed by caller.
    Returns True on success (e.g., data present or no error for mutations), False otherwise.
    """
    if response.data and not hasattr(response, 'error'): # Check for data and no error attribute for older supabase-py versions
        return True
    if hasattr(response, 'error') and response.error:
        log_msg = f"Supabase error during {operation} for {entity_name}"
        if entity_id:
            log_msg += f" ID {entity_id}"
        log_msg += f": {response.error.message} (Code: {response.error.code})"
        logger.error(log_msg)
        return False
    if not response.data and operation.startswith("get"): # No data found for a get operation
        return False # Not necessarily an error, just not found
    return True # Default to success if no error and not a 'get' expecting data

# --- Idea CRUD Service Functions ---

async def create_idea_in_db(
    db: SupabaseAsyncClient, idea_data: IdeaCreate, submitter_user_id: uuid.UUID
) -> Optional[Idea]:
    """
    Creates a new idea in the database.
    Manages related entities like tags.
    """
    logger.info(f"Creating idea '{idea_data.title}' for user {submitter_user_id}")

    idea_to_insert = {
        "title": idea_data.title,
        "description": idea_data.description,
        "submitter_user_id": str(submitter_user_id),
        "organisation_id": idea_data.organisation_id, # Ensure this is str(uuid) if it's UUID
        "status": idea_data.status.value,
        "clarity_score": idea_data.clarity_score,
        "value_score": idea_data.value_score,
        "readiness_score": idea_data.readiness_score,
        "effort_selection": idea_data.effort_selection.value if idea_data.effort_selection else None,
        "roi_index": idea_data.roi_index,
        # created_at and updated_at are handled by DB defaults
    }

    try:
        # Insert the main idea
        response_idea = await db.table("ideas").insert(idea_to_insert).execute()
        if not response_idea.data or (hasattr(response_idea, 'error') and response_idea.error):
            await _handle_supabase_response(response_idea, "insert", "idea")
            return None
        
        created_idea_dict = response_idea.data[0]
        new_idea_id = uuid.UUID(created_idea_dict["id"])

        # Insert tags
        if idea_data.tags:
            tags_to_insert = [
                {
                    "idea_id": str(new_idea_id),
                    "category": tag.category.value,
                    "source": tag.source,
                    "confidence": tag.confidence,
                    "is_primary": tag.is_primary,
                }
                for tag in idea_data.tags
            ]
            response_tags = await db.table("idea_tags").insert(tags_to_insert).execute()
            if not await _handle_supabase_response(response_tags, "insert", "idea_tags for idea", new_idea_id):
                # Handle tag insertion failure (e.g., rollback idea or log warning)
                logger.warning(f"Failed to insert tags for idea {new_idea_id}, but idea was created.")

        # Insert value selections
        if idea_data.value_selections:
            value_selections_to_insert = [
                {
                    "idea_id": str(new_idea_id),
                    "dimension_key": sel.dimension_key.value if isinstance(sel.dimension_key, Enum) else sel.dimension_key,
                    "selected_band_key": sel.selected_band_key.value,
                }
                for sel in idea_data.value_selections
            ]
            response_vs = await db.table("idea_value_selections").insert(value_selections_to_insert).execute()
            if not await _handle_supabase_response(response_vs, "insert", "value_selections for idea", new_idea_id):
                logger.warning(f"Failed to insert value selections for idea {new_idea_id}.")


        # Fetch the complete idea to return (or construct from parts)
        # For simplicity, returning the created dict and assuming it's sufficient for Idea model
        # A full fetch would be: return await get_idea_by_id_from_db(db, new_idea_id)
        
        # Construct the Idea Pydantic model
        # This requires fetching related data or assuming it's part of idea_data
        # For now, we'll use the input idea_data and add the new ID and timestamps
        
        # Map back to Pydantic model, including generated fields
        # This is a simplified mapping. A full fetch or more complex construction is better.
        idea_data_dict = idea_data.model_dump()
        return Idea(
            id=new_idea_id,
            created_at=datetime.fromisoformat(created_idea_dict["created_at"]),
            updated_at=datetime.fromisoformat(created_idea_dict["updated_at"]),
            **idea_data_dict # Spread the rest of the validated input data including submitter_email
        )

    except Exception as e:
        logger.error(f"Exception creating idea '{idea_data.title}': {e}", exc_info=True)
        return None


async def get_all_ideas_from_db(db: SupabaseAsyncClient, skip: int = 0, limit: int = 10) -> List[Idea]:
    """
    Retrieves a list of ideas from the database with pagination.
    This version needs to fetch related data (tags, etc.) and assemble the Idea model.
    """
    logger.info(f"Fetching ideas from DB: skip={skip}, limit={limit}")
    try:
        # Fetch main idea data along with submitter's email using a join-like select
        # The foreign key 'submitter_user_id' in 'ideas' table must point to 'id' in 'users' table.
        # And 'users' table must have an 'email' column.
        # The syntax "submitter_user_id!inner(email)" ensures an inner join and fetches email.
        # If FK is directly on 'users' table, it might be: "users!inner(email)" if column name is 'submitter_user_id'
        # Assuming 'submitter_user_id' is the FK column name in 'ideas' table.
        # And the referenced table 'users' has 'email'.
        # If your FK is named differently or points to a different column, adjust the select.
        # For a simple FK `submitter_user_id` on `ideas` referencing `users(id)`:
        # `select=*,submitter_user_id(email)`
        response = await db.table("ideas").select(
            "*, submitter_user_id:users(email)" # Fetches all columns from ideas and the email from the related user
        ).range(skip, skip + limit - 1).order("created_at", desc=True).execute()

        if not response.data:
            return []
        
        ideas_data = response.data
        ideas_list: List[Idea] = []

        for idea_dict in ideas_data:
            idea_id = uuid.UUID(idea_dict["id"])
            
            submitter_info = idea_dict.get("submitter_user_id") # This will be a dict like {"email": "user@example.com"}
            submitter_email = submitter_info.get("email", "unknown@example.com") if isinstance(submitter_info, dict) else "unknown@example.com"

            # Fetch related tags
            tags_response = await db.table("idea_tags").select("*").eq("idea_id", str(idea_id)).execute()
            idea_tags = [IdeaTagCreate(**tag) for tag in tags_response.data] if tags_response.data else []

            # Fetch related value selections
            vs_response = await db.table("idea_value_selections").select("*").eq("idea_id", str(idea_id)).execute()
            value_selections = [ValueSelection(**vs) for vs in vs_response.data] if vs_response.data else []
            
            # Fetch answers and chat_history for the list view.
            # Note: This can be heavy. Consider if full data is needed for list views.
            # For now, fetching as per model requirements.
            answers_response = await db.table("idea_answers").select("*").eq("idea_id", str(idea_id)).execute()
            answers = [Answer(**ans) for ans in answers_response.data] if answers_response.data else []
            
            chat_response = await db.table("idea_chat_messages").select("*").eq("idea_id", str(idea_id)).order("timestamp").execute()
            chat_history = [ChatMessage(**msg) for msg in chat_response.data] if chat_response.data else []

            ideas_list.append(
                Idea(
                    id=idea_id,
                    title=idea_dict["title"],
                    description=idea_dict["description"],
                    submitter_email=submitter_email,
                    organisation_id=idea_dict.get("organisation_id"),
                    status=IdeaStatusEnum(idea_dict["status"]),
                    tags=idea_tags,
                    questionnaire_answers=answers,
                    chat_history=chat_history,
                    clarity_score=idea_dict.get("clarity_score"),
                    value_score=idea_dict.get("value_score"),
                    readiness_score=idea_dict.get("readiness_score"),
                    value_selections=value_selections,
                    effort_selection=idea_dict.get("effort_selection"),
                    roi_index=idea_dict.get("roi_index"),
                    created_at=datetime.fromisoformat(idea_dict["created_at"]),
                    updated_at=datetime.fromisoformat(idea_dict["updated_at"]),
                )
            )
        return ideas_list
    except Exception as e:
        logger.error(f"Exception fetching all ideas: {e}", exc_info=True)
        return []


async def get_idea_by_id_from_db(db: SupabaseAsyncClient, idea_id: uuid.UUID) -> Optional[Idea]:
    """
    Retrieves a single idea by its ID from the database, including related data.
    """
    logger.info(f"Fetching idea by ID: {idea_id}")
    try:
        # Fetch idea and submitter's email in one go
        response = await db.table("ideas").select(
            "*, submitter_user_id:users(email)" # Fetches all from ideas and user's email
        ).eq("id", str(idea_id)).maybe_single().execute()
        
        if not response.data:
            return None
        
        idea_dict = response.data
        
        submitter_info = idea_dict.get("submitter_user_id")
        submitter_email = submitter_info.get("email", "unknown@example.com") if isinstance(submitter_info, dict) else "unknown@example.com"

        # Fetch related data (tags, answers, chat, value_selections)
        tags_response = await db.table("idea_tags").select("*").eq("idea_id", str(idea_id)).execute()
        idea_tags = [IdeaTagCreate(**tag) for tag in tags_response.data] if tags_response.data else []

        answers_response = await db.table("idea_answers").select("*").eq("idea_id", str(idea_id)).execute()
        answers = [Answer(**ans) for ans in answers_response.data] if answers_response.data else []
        
        chat_response = await db.table("idea_chat_messages").select("*").eq("idea_id", str(idea_id)).order("timestamp").execute()
        chat_history = [ChatMessage(**msg) for msg in chat_response.data] if chat_response.data else []

        vs_response = await db.table("idea_value_selections").select("*").eq("idea_id", str(idea_id)).execute()
        value_selections = [ValueSelection(**vs) for vs in vs_response.data] if vs_response.data else []

        # Construct and return the Idea Pydantic model
        return Idea(
            id=uuid.UUID(idea_dict["id"]),
            title=idea_dict["title"],
            description=idea_dict["description"],
            submitter_email=submitter_email,
            organisation_id=idea_dict.get("organisation_id"),
            status=IdeaStatusEnum(idea_dict["status"]),
            tags=idea_tags,
            questionnaire_answers=answers,
            chat_history=chat_history,
            clarity_score=idea_dict.get("clarity_score"),
            value_score=idea_dict.get("value_score"),
            readiness_score=idea_dict.get("readiness_score"),
            value_selections=value_selections,
            effort_selection=idea_dict.get("effort_selection"),
            roi_index=idea_dict.get("roi_index"),
            created_at=datetime.fromisoformat(idea_dict["created_at"]),
            updated_at=datetime.fromisoformat(idea_dict["updated_at"]),
        )
    except Exception as e:
        logger.error(f"Exception fetching idea by ID {idea_id}: {e}", exc_info=True)
        return None


async def update_idea_in_db(
    db: SupabaseAsyncClient, idea_id: uuid.UUID, idea_update_data: IdeaUpdate, current_user_id: uuid.UUID
) -> Optional[Idea]:
    """
    Updates an existing idea in the database.
    Handles partial updates and updates to related entities like tags.
    """
    logger.info(f"Updating idea ID {idea_id} by user {current_user_id}")

    # Fetch existing idea to ensure it exists and for permission checks (done in API layer)
    existing_idea = await get_idea_by_id_from_db(db, idea_id)
    if not existing_idea:
        return None # Idea not found

    update_payload = idea_update_data.model_dump(exclude_unset=True)
    
    # Ensure `updated_at` is set
    update_payload["updated_at"] = datetime.utcnow().isoformat()

    # Convert enums to their values for DB update if they are part of update_payload
    if "status" in update_payload and isinstance(update_payload["status"], Enum):
        update_payload["status"] = update_payload["status"].value
    if "effort_selection" in update_payload and isinstance(update_payload["effort_selection"], Enum):
        update_payload["effort_selection"] = update_payload["effort_selection"].value


    try:
        # Update main idea table
        if update_payload: # Only update if there's something to update in the main table
            response_idea = await db.table("ideas").update(update_payload).eq("id", str(idea_id)).execute()
            if not await _handle_supabase_response(response_idea, "update", "idea", idea_id):
                return None # Update failed

        # Handle related entities (e.g., tags, value_selections)
        # This often involves deleting existing related items and inserting new ones, or more complex diffing.
        # For simplicity, if tags are provided in update, replace all existing tags.
        if idea_update_data.tags is not None: # Check for explicit presence, even if empty list
            await db.table("idea_tags").delete().eq("idea_id", str(idea_id)).execute() # Delete old tags
            if idea_update_data.tags: # If new tags are provided
                new_tags_to_insert = [
                    {
                        "idea_id": str(idea_id),
                        "category": tag.category.value,
                        "source": tag.source,
                        "confidence": tag.confidence,
                        "is_primary": tag.is_primary,
                    }
                    for tag in idea_update_data.tags
                ]
                await db.table("idea_tags").insert(new_tags_to_insert).execute()
        
        # Similar logic for value_selections, answers, chat_history if they are updatable this way

        return await get_idea_by_id_from_db(db, idea_id) # Return the updated idea

    except Exception as e:
        logger.error(f"Exception updating idea ID {idea_id}: {e}", exc_info=True)
        return None


async def delete_idea_from_db(db: SupabaseAsyncClient, idea_id: uuid.UUID, current_user_id: uuid.UUID) -> bool:
    """
    Deletes an idea from the database.
    Ensures related data is handled (e.g., cascaded deletes if set up in DB, or manual deletion).
    """
    logger.info(f"Deleting idea ID {idea_id} by user {current_user_id}")
    try:
        # DB schema has ON DELETE CASCADE for related tables like idea_tags, idea_answers, etc.
        # So, deleting from 'ideas' table should cascade.
        response = await db.table("ideas").delete().eq("id", str(idea_id)).execute()
        
        # Check if deletion was successful (e.g., if data was returned, it means something was deleted)
        # Supabase delete often returns the deleted records in `response.data`.
        if response.data and len(response.data) > 0:
            logger.info(f"Successfully deleted idea ID {idea_id} and its related data via cascade.")
            return True
        elif not response.data and not (hasattr(response, 'error') and response.error):
            logger.warning(f"Attempted to delete idea ID {idea_id}, but it was not found or already deleted.")
            return False # Or True if "not found" is considered a successful deletion state
        else: # An error occurred
            await _handle_supabase_response(response, "delete", "idea", idea_id)
            return False
            
    except Exception as e:
        logger.error(f"Exception deleting idea ID {idea_id}: {e}", exc_info=True)
        return False
