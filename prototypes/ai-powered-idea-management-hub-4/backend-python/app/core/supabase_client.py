import logging
from typing import Optional

from supabase._async.client import AsyncClient  # Updated import path
from supabase import create_async_client  # For creating async client
# from supabase import create_client, Client # Synchronous version

from app.core.config import settings

logger = logging.getLogger(__name__)

supabase_async_client: Optional[AsyncClient] = None
# supabase_sync_client: Optional[Client] = None # For synchronous operations if any

async def get_supabase_async_client() -> AsyncClient:
    """
    Returns an initialized Supabase async client.
    Initializes it if it hasn't been already.
    """
    global supabase_async_client
    if supabase_async_client is None:
        logger.info("Initializing Supabase async client...")
        try:
            supabase_async_client = await create_async_client(
                str(settings.SUPABASE_URL),  # Convert AnyHttpUrl to string
                settings.SUPABASE_SERVICE_ROLE_KEY # Use service role key for backend operations
            )
            # You can test the connection here if needed, e.g., by fetching a small piece of data
            # response = await supabase_async_client.table("your_table_name").select("id").limit(1).execute()
            # if response.data:
            #     logger.info("Supabase async client initialized and connection tested successfully.")
            # else:
            #     logger.warning("Supabase async client initialized, but test query failed or returned no data.")
            logger.info("Supabase async client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase async client: {e}", exc_info=True)
            # Depending on the application's needs, you might want to raise the exception
            # or handle it in a way that allows the app to start but with limited functionality.
            raise
    return supabase_async_client

# Optional: Synchronous client if needed for specific tasks (e.g., scripts, non-async parts)
# def get_supabase_sync_client() -> Client:
#     """
#     Returns an initialized Supabase synchronous client.
#     Initializes it if it hasn't been already.
#     """
#     global supabase_sync_client
#     if supabase_sync_client is None:
#         logger.info("Initializing Supabase sync client...")
#         try:
#             supabase_sync_client = create_client(
#                 settings.SUPABASE_URL,
#                 settings.SUPABASE_SERVICE_ROLE_KEY
#             )
#             logger.info("Supabase sync client initialized successfully.")
#         except Exception as e:
#             logger.error(f"Failed to initialize Supabase sync client: {e}", exc_info=True)
#             raise
#     return supabase_sync_client

async def close_supabase_async_client():
    """
    Closes the Supabase async client session if it's open.
    Useful for application shutdown events.
    """
    global supabase_async_client
    if supabase_async_client:
        logger.info("Closing Supabase async client session...")
        try:
            await supabase_async_client.auth.sign_out() # Example cleanup, actual session close might be different
            # For supabase-py, session management is often handled internally by httpx client.
            # Explicit close might not be needed unless specific resources are held.
            # await supabase_async_client.postgrest.aclose() # If using httpx client directly
            logger.info("Supabase async client session closed (or sign_out attempted).")
        except Exception as e:
            logger.error(f"Error closing Supabase async client session: {e}", exc_info=True)
        supabase_async_client = None

# Example usage (typically in your FastAPI route dependencies or service layers):
# async def some_service_function():
#     db_client = await get_supabase_async_client()
#     response = await db_client.table("users").select("*").eq("id", "some_uuid").execute()
#     return response.data
