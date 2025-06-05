import uuid
import pytest
from httpx import AsyncClient
from starlette import status
from typing import List, Dict, Any

from app.core.config import settings
from app.models.domain import Idea, IdeaCreate, IdeaStatusEnum, IdeaTagCreate, IdeaCategoryEnum, UserRoleEnum, AuthenticatedUser
from app.main import app # For dependency overrides
from app.core.security import get_current_user # To override

# --- Test User Setup ---
# For integration tests, we need a way to represent authenticated users.
# Ideally, you'd have test users in your Supabase auth.
# For now, we'll mock get_current_user to simulate different authenticated users.

test_user_contributor_id = str(uuid.uuid4())
test_user_admin_id = str(uuid.uuid4())

mock_user_contributor = AuthenticatedUser(
    id=test_user_contributor_id, email="integration.contributor@example.com", role=UserRoleEnum.CONTRIBUTOR
)
mock_user_admin = AuthenticatedUser(
    id=test_user_admin_id, email="integration.admin@example.com", role=UserRoleEnum.ADMIN
)

# This list will store IDs of ideas created during tests for cleanup
created_idea_ids_for_cleanup: List[str] = []

@pytest.fixture(scope="module", autouse=True)
async def setup_and_teardown_module_data(test_client: AsyncClient):
    """
    Module-level fixture to handle setup before any test in this module runs,
    and teardown after all tests in this module have run.
    Requires a test_client fixture that can make authenticated requests if needed for setup/teardown.
    For now, assumes direct DB manipulation for cleanup or relies on RLS + service calls.
    """
    # Setup: Ensure test users exist in public.users table if not automatically synced.
    # This might involve direct Supabase calls if RLS prevents easy creation via API.
    # For simplicity, we assume users are either pre-existing in cloud Supabase
    # or that the handle_new_user_sync trigger works upon their first (mocked) "login".
    # If your RLS is strict, you might need a privileged client for setup/teardown.
    
    # print(f"Setting up test users for module: {mock_user_contributor.email}, {mock_user_admin.email}")
    # This part is tricky without direct DB access or a privileged client.
    # We'll rely on the application's RLS and hope the mocked users can operate.

    yield # Run tests

    # Teardown: Clean up created ideas
    # print(f"Tearing down: Cleaning up {len(created_idea_ids_for_cleanup)} created ideas.")
    if created_idea_ids_for_cleanup:
        # Need an admin client or a way to bypass RLS for cleanup if users can't delete all their data.
        # For now, we'll try deleting with the mock_admin_user.
        app.dependency_overrides[get_current_user] = lambda: mock_user_admin
        # Re-initialize client with admin override for cleanup
        async with AsyncClient(transport=app, base_url="http://testserver") as admin_client: # type: ignore
            for idea_id in created_idea_ids_for_cleanup:
                try:
                    # print(f"Attempting to delete idea: {idea_id} with admin user.")
                    delete_resp = await admin_client.delete(f"{settings.API_V1_STR}/ideas/{idea_id}")
                    if delete_resp.status_code not in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]:
                        print(f"Warning: Failed to cleanup idea {idea_id}. Status: {delete_resp.status_code}, Detail: {delete_resp.text}")
                except Exception as e:
                    print(f"Warning: Exception during cleanup of idea {idea_id}: {e}")
        app.dependency_overrides.clear()
    created_idea_ids_for_cleanup.clear()


@pytest.fixture
def override_get_current_user(request):
    """Fixture to override get_current_user based on a marker or param."""
    # Default to contributor if no marker
    user_to_mock = mock_user_contributor 
    if hasattr(request, "param") and request.param == "admin":
        user_to_mock = mock_user_admin
    
    original_override = app.dependency_overrides.get(get_current_user)
    app.dependency_overrides[get_current_user] = lambda: user_to_mock
    yield
    if original_override:
        app.dependency_overrides[get_current_user] = original_override
    else:
        app.dependency_overrides.clear()


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.parametrize("override_get_current_user", ["contributor"], indirect=True)
async def test_integration_create_and_get_idea(test_client: AsyncClient, override_get_current_user):
    idea_payload: Dict[str, Any] = {
        "title": "Integration Test Idea",
        "description": "This idea is created during an integration test.",
        "submitter_email": mock_user_contributor.email, # Should match current_user
        "tags": [{"category": IdeaCategoryEnum.TECHNOLOGICAL_INNOVATION.value, "source": "user_test", "is_primary": True}],
        "status": IdeaStatusEnum.DRAFT.value
    }
    
    # Create Idea
    create_response = await test_client.post(f"{settings.API_V1_STR}/ideas", json=idea_payload)
    assert create_response.status_code == status.HTTP_201_CREATED
    created_idea_json = create_response.json()
    idea_id = created_idea_json["id"]
    created_idea_ids_for_cleanup.append(idea_id) # Add to cleanup list

    assert created_idea_json["title"] == idea_payload["title"]
    assert created_idea_json["submitter_email"] == mock_user_contributor.email
    assert len(created_idea_json["tags"]) == 1
    assert created_idea_json["tags"][0]["category"] == IdeaCategoryEnum.TECHNOLOGICAL_INNOVATION.value

    # Get Idea
    get_response = await test_client.get(f"{settings.API_V1_STR}/ideas/{idea_id}")
    assert get_response.status_code == status.HTTP_200_OK
    fetched_idea_json = get_response.json()
    assert fetched_idea_json["id"] == idea_id
    assert fetched_idea_json["title"] == idea_payload["title"]
    # Supabase returns timestamps with timezone, Pydantic models might need to handle this.
    # For now, just check presence.
    assert "created_at" in fetched_idea_json
    assert "updated_at" in fetched_idea_json


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.parametrize("override_get_current_user", ["contributor"], indirect=True)
async def test_integration_list_ideas(test_client: AsyncClient, override_get_current_user):
    # Create a couple of ideas to ensure listing works
    idea1_payload = {"title": "List Test Idea 1", "description": "First idea for listing.", "submitter_email": mock_user_contributor.email}
    idea2_payload = {"title": "List Test Idea 2", "description": "Second idea for listing.", "submitter_email": mock_user_contributor.email}

    resp1 = await test_client.post(f"{settings.API_V1_STR}/ideas", json=idea1_payload)
    assert resp1.status_code == status.HTTP_201_CREATED
    created_idea_ids_for_cleanup.append(resp1.json()["id"])
    
    resp2 = await test_client.post(f"{settings.API_V1_STR}/ideas", json=idea2_payload)
    assert resp2.status_code == status.HTTP_201_CREATED
    created_idea_ids_for_cleanup.append(resp2.json()["id"])

    list_response = await test_client.get(f"{settings.API_V1_STR}/ideas?limit=5")
    assert list_response.status_code == status.HTTP_200_OK
    ideas_list = list_response.json()
    assert len(ideas_list) >= 2 # Could be more if other tests ran or DB not clean
    
    titles = [idea["title"] for idea in ideas_list]
    assert "List Test Idea 1" in titles
    assert "List Test Idea 2" in titles


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.parametrize("override_get_current_user", ["contributor"], indirect=True)
async def test_integration_update_idea(test_client: AsyncClient, override_get_current_user):
    create_payload = {
        "title": "Original Title for Update", 
        "description": "Original description.", 
        "submitter_email": mock_user_contributor.email,
        "status": IdeaStatusEnum.DRAFT.value
    }
    create_response = await test_client.post(f"{settings.API_V1_STR}/ideas", json=create_payload)
    assert create_response.status_code == status.HTTP_201_CREATED
    idea_id = create_response.json()["id"]
    created_idea_ids_for_cleanup.append(idea_id)

    update_payload = {"title": "Updated Title by Integration Test", "status": IdeaStatusEnum.SUBMITTED.value}
    update_response = await test_client.patch(f"{settings.API_V1_STR}/ideas/{idea_id}", json=update_payload)
    
    assert update_response.status_code == status.HTTP_200_OK
    updated_idea_json = update_response.json()
    assert updated_idea_json["id"] == idea_id
    assert updated_idea_json["title"] == "Updated Title by Integration Test"
    assert updated_idea_json["status"] == IdeaStatusEnum.SUBMITTED.value
    assert updated_idea_json["description"] == "Original description." # Description should remain unchanged


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.parametrize("override_get_current_user", ["admin"], indirect=True) # Admin to delete
async def test_integration_delete_idea(test_client: AsyncClient, override_get_current_user):
    # Create an idea as a contributor first
    app.dependency_overrides[get_current_user] = lambda: mock_user_contributor
    create_payload = {"title": "Idea to be Deleted (Integration)", "description": "Delete me please.", "submitter_email": mock_user_contributor.email}
    create_response = await test_client.post(f"{settings.API_V1_STR}/ideas", json=create_payload)
    assert create_response.status_code == status.HTTP_201_CREATED
    idea_id = create_response.json()["id"]
    # Don't add to global cleanup list, this test handles its own deletion.

    # Now, delete as admin
    app.dependency_overrides[get_current_user] = lambda: mock_user_admin # Switch to admin for deletion
    delete_response = await test_client.delete(f"{settings.API_V1_STR}/ideas/{idea_id}")
    assert delete_response.status_code == status.HTTP_200_OK
    assert delete_response.json()["message"] == f"Idea with ID {idea_id} deleted successfully."

    # Verify it's gone
    get_response_after_delete = await test_client.get(f"{settings.API_V1_STR}/ideas/{idea_id}")
    assert get_response_after_delete.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.parametrize("override_get_current_user", ["contributor"], indirect=True)
async def test_integration_get_non_existent_idea(test_client: AsyncClient, override_get_current_user):
    non_existent_uuid = str(uuid.uuid4())
    response = await test_client.get(f"{settings.API_V1_STR}/ideas/{non_existent_uuid}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

# Note: These tests assume RLS policies in Supabase are set up correctly.
# If RLS prevents certain actions even for the "mocked" user (based on auth.uid()),
# these tests might fail due to 403 Forbidden or data not being returned as expected.
# True end-to-end tests would involve programmatically creating Supabase users and logging them in
# to get real JWTs, which is more complex to set up.
