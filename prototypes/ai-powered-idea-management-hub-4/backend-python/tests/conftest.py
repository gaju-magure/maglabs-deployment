import asyncio
import os
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Set environment variables for testing before loading the app
# This ensures that the app uses test-specific configurations if any.
os.environ["APP_ENV"] = "testing"

# IMPORTANT FOR CLOUD SUPABASE INTEGRATION TESTING:
# The FastAPI application's `GlobalConfig` (in `app.core.config.py`) loads settings from
# environment variables and a `.env` file. For integration tests against the
# live cloud Supabase instance (zsqigchbodazahqexxbo), ensure that your `.env` file
# in the `backend-python` directory (or your shell environment) contains the
# correct SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_JWT_SECRET
# for this cloud project.
#
# Example placeholder lines (actual values should be in your .env or environment):
# os.environ["SUPABASE_URL"] = "https://zsqigchbodazahqexxbo.supabase.co"
# os.environ["SUPABASE_ANON_KEY"] = "your_cloud_anon_key"
# os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "your_cloud_service_role_key"
# os.environ["SUPABASE_JWT_SECRET"] = "your_cloud_jwt_secret"
# os.environ["GEMINI_API_KEY"] = "your_actual_or_mocked_gemini_key_for_tests"

# It's crucial that these are set *before* `app.main` or `app.core.config` are imported
# if you intend for os.environ calls here to override .env file values for pydantic-settings.
# However, pydantic-settings prioritizes actual environment variables over .env file content.
# Thus, setting them in your shell or CI environment is the most robust way for overrides.
# If relying on a .env file, ensure it's correctly populated for the test target.

# If config is already loaded, these might not take effect as expected.
# One way to ensure this is to have a separate entrypoint/config for testing,
# or ensure config reloads if APP_ENV changes.
# For pydantic-settings, it typically reads .env on instantiation.

# Now import the FastAPI app
from app.main import app
from app.core.config import settings # To access settings if needed in tests
# from app.core.supabase_client import get_supabase_async_client # If you need to override/mock

@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """
    Creates an instance of the default event loop for each test session.
    Necessary for pytest-asyncio.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function") # "function" scope for client per test
async def test_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Fixture to create an AsyncClient for testing the FastAPI application.
    This client allows making requests to the application in tests.
    """
    # The transport must be created with the app instance.
    # base_url is where the client will send requests.
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client: # type: ignore
        yield client

# Example fixture for a mock Supabase client (if needed)
# @pytest_asyncio.fixture(scope="function")
# async def mock_supabase_client(mocker):
#     mock_client = mocker.AsyncMock(spec=SupabaseAsyncClient) # Assuming SupabaseAsyncClient is the type
    
#     # Mock specific methods, e.g., table().select().execute()
#     mock_select_response = mocker.MagicMock()
#     mock_select_response.data = [] # Example response
#     mock_client.table.return_value.select.return_value.execute.return_value = mock_select_response
    
#     # Override the get_supabase_async_client dependency
#     # This requires get_supabase_async_client to be a FastAPI dependency that can be overridden.
#     # app.dependency_overrides[get_supabase_async_client] = lambda: mock_client
    
#     yield mock_client
    
#     # Clean up overrides after test
#     # app.dependency_overrides.clear()


# Example fixture for a mock current user
# from app.models.domain import AuthenticatedUser, UserRoleEnum
# from app.core.security import get_current_user

# @pytest_asyncio.fixture(scope="function")
# def mock_current_user_contributor() -> AuthenticatedUser:
#     return AuthenticatedUser(
#         id="test-user-id-contributor",
#         email="contributor@example.com",
#         role=UserRoleEnum.CONTRIBUTOR,
#     )

# @pytest_asyncio.fixture(scope="function")
# def mock_current_user_admin() -> AuthenticatedUser:
#     return AuthenticatedUser(
#         id="test-user-id-admin",
#         email="admin@example.com",
#         role=UserRoleEnum.ADMIN,
#     )

# def override_get_current_user(mock_user: AuthenticatedUser):
#     async def _override():
#         return mock_user
#     return _override

# To use in a test:
# app.dependency_overrides[get_current_user] = override_get_current_user(mock_current_user_admin_fixture)
# ... test code ...
# app.dependency_overrides.clear()


# You can add more global fixtures here, e.g., for database setup/teardown if using a real test DB.
# For Supabase, this might involve:
# - Starting a local Supabase instance (`supabase start`).
# - Applying migrations.
# - Seeding test data.
# - Cleaning up data after tests.

import logging

logger = logging.getLogger(__name__)
logger.info(f"Test environment configured. APP_ENV: {settings.APP_ENV}")
logger.info(f"Test Supabase URL (from settings): {settings.SUPABASE_URL}")
logger.info(f"Test Gemini API Key (from settings): {'********' if settings.GEMINI_API_KEY else 'Not Set'}")
