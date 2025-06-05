import uuid
from typing import List, Optional

import pytest
from httpx import AsyncClient
from starlette import status

from app.core.config import settings
from app.models.domain import Idea, IdeaCreate, IdeaStatusEnum, IdeaTagCreate, IdeaCategoryEnum, UserRoleEnum, AuthenticatedUser
from app.main import app # For dependency overrides
from app.core.security import get_current_user # To override

# Mock user for authentication
mock_user_contributor = AuthenticatedUser(
    id=str(uuid.uuid4()), email="test.contributor@example.com", role=UserRoleEnum.CONTRIBUTOR
)
mock_user_admin = AuthenticatedUser(
    id=str(uuid.uuid4()), email="test.admin@example.com", role=UserRoleEnum.ADMIN
)

# Mock the idea_service functions used in ideas.py
# These are currently in ideas.py itself, so we patch them there.
# If they were in app.services.idea_service, the path would change.

@pytest.fixture(autouse=True)
def mock_idea_db_operations(mocker):
    # This fixture will mock all db_* functions in app.api.v1.ideas
    # It's important that these mocks are reset for each test if they maintain state.
    # For a stateless mock like this (just returning values), autouse is fine.
    
    # In-memory store for this mock
    mock_ideas_store: List[Idea] = []

    async def _mock_db_create_idea(idea_create: IdeaCreate, submitter_email: str) -> Idea:
        new_idea = Idea(
            **idea_create.model_dump(),
            id=uuid.uuid4(),
            submitter_email=submitter_email,
            # created_at, updated_at will be set by Pydantic default_factory
        )
        mock_ideas_store.append(new_idea)
        return new_idea

    async def _mock_db_get_ideas(skip: int = 0, limit: int = 10) -> List[Idea]:
        return mock_ideas_store[skip : skip + limit]

    async def _mock_db_get_idea_by_id(idea_id: uuid.UUID) -> Optional[Idea]:
        return next((idea for idea in mock_ideas_store if idea.id == idea_id), None)

    async def _mock_db_update_idea(idea_id: uuid.UUID, idea_update_data) -> Optional[Idea]: # idea_update_data is IdeaUpdate
        for i, idea in enumerate(mock_ideas_store):
            if idea.id == idea_id:
                update_data = idea_update_data.model_dump(exclude_unset=True)
                updated_idea = idea.model_copy(update=update_data)
                mock_ideas_store[i] = updated_idea
                return updated_idea
        return None

    async def _mock_db_delete_idea(idea_id: uuid.UUID) -> bool:
        nonlocal mock_ideas_store # To modify the list in the outer scope
        original_len = len(mock_ideas_store)
        mock_ideas_store = [idea for idea in mock_ideas_store if idea.id != idea_id]
        return len(mock_ideas_store) < original_len

    mocker.patch("app.api.v1.ideas.db_create_idea", side_effect=_mock_db_create_idea)
    mocker.patch("app.api.v1.ideas.db_get_ideas", side_effect=_mock_db_get_ideas)
    mocker.patch("app.api.v1.ideas.db_get_idea_by_id", side_effect=_mock_db_get_idea_by_id)
    mocker.patch("app.api.v1.ideas.db_update_idea", side_effect=_mock_db_update_idea)
    mocker.patch("app.api.v1.ideas.db_delete_idea", side_effect=_mock_db_delete_idea)
    
    # Yield to allow tests to run, then clear the store
    yield
    mock_ideas_store.clear()


@pytest.fixture
def override_get_current_user_contributor():
    app.dependency_overrides[get_current_user] = lambda: mock_user_contributor
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def override_get_current_user_admin():
    app.dependency_overrides[get_current_user] = lambda: mock_user_admin
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_idea(test_client: AsyncClient, override_get_current_user_contributor):
    idea_payload = {
        "title": "My Awesome Idea",
        "description": "This idea will change the world.",
        "tags": [{"category": "Product Innovation", "source": "user_manual", "is_primary": True}],
        "status": "Draft"
    }
    response = await test_client.post(f"{settings.API_V1_STR}/ideas", json=idea_payload)
    assert response.status_code == status.HTTP_201_CREATED
    json_response = response.json()
    assert json_response["title"] == "My Awesome Idea"
    assert json_response["submitter_email"] == mock_user_contributor.email
    assert "id" in json_response
    assert len(json_response["tags"]) == 1
    assert json_response["tags"][0]["category"] == IdeaCategoryEnum.PRODUCT_INNOVATION.value


@pytest.mark.asyncio
async def test_list_ideas_empty(test_client: AsyncClient, override_get_current_user_contributor):
    response = await test_client.get(f"{settings.API_V1_STR}/ideas")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_ideas_with_data(test_client: AsyncClient, override_get_current_user_contributor):
    # Create an idea first
    idea_payload = {"title": "Idea 1", "description": "Description 1"}
    await test_client.post(f"{settings.API_V1_STR}/ideas", json=idea_payload)

    response = await test_client.get(f"{settings.API_V1_STR}/ideas")
    assert response.status_code == status.HTTP_200_OK
    ideas = response.json()
    assert len(ideas) == 1
    assert ideas[0]["title"] == "Idea 1"


@pytest.mark.asyncio
async def test_get_specific_idea(test_client: AsyncClient, override_get_current_user_contributor):
    idea_payload = {"title": "Specific Idea", "description": "Details here."}
    create_response = await test_client.post(f"{settings.API_V1_STR}/ideas", json=idea_payload)
    idea_id = create_response.json()["id"]

    response = await test_client.get(f"{settings.API_V1_STR}/ideas/{idea_id}")
    assert response.status_code == status.HTTP_200_OK
    json_response = response.json()
    assert json_response["id"] == idea_id
    assert json_response["title"] == "Specific Idea"


@pytest.mark.asyncio
async def test_get_specific_idea_not_found(test_client: AsyncClient, override_get_current_user_contributor):
    non_existent_id = uuid.uuid4()
    response = await test_client.get(f"{settings.API_V1_STR}/ideas/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_update_idea(test_client: AsyncClient, override_get_current_user_contributor):
    idea_payload = {"title": "Old Title", "description": "Old description.", "status": "Draft"}
    create_response = await test_client.post(f"{settings.API_V1_STR}/ideas", json=idea_payload)
    idea_id = create_response.json()["id"]

    update_payload = {"title": "New Title", "status": "Submitted"}
    response = await test_client.patch(f"{settings.API_V1_STR}/ideas/{idea_id}", json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    json_response = response.json()
    assert json_response["id"] == idea_id
    assert json_response["title"] == "New Title"
    assert json_response["description"] == "Old description." # Description not updated
    assert json_response["status"] == IdeaStatusEnum.SUBMITTED.value


@pytest.mark.asyncio
async def test_update_idea_not_found(test_client: AsyncClient, override_get_current_user_contributor):
    non_existent_id = uuid.uuid4()
    update_payload = {"title": "Non Existent Update"}
    response = await test_client.patch(f"{settings.API_V1_STR}/ideas/{non_existent_id}", json=update_payload)
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_idea(test_client: AsyncClient, override_get_current_user_contributor):
    # For this test, let's use admin to ensure deletion is generally possible by mock
    # The actual permission logic is commented out in the endpoint for now.
    app.dependency_overrides[get_current_user] = lambda: mock_user_admin

    idea_payload = {"title": "To Be Deleted", "description": "Delete me."}
    create_response = await test_client.post(f"{settings.API_V1_STR}/ideas", json=idea_payload)
    idea_id = create_response.json()["id"]

    delete_response = await test_client.delete(f"{settings.API_V1_STR}/ideas/{idea_id}")
    assert delete_response.status_code == status.HTTP_200_OK
    assert delete_response.json()["message"] == f"Idea with ID {idea_id} deleted successfully."

    # Verify it's gone
    get_response = await test_client.get(f"{settings.API_V1_STR}/ideas/{idea_id}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_idea_not_found(test_client: AsyncClient, override_get_current_user_admin):
    non_existent_id = uuid.uuid4()
    response = await test_client.delete(f"{settings.API_V1_STR}/ideas/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

# Add more tests for permission logic once it's implemented in the endpoint.
# e.g., test_update_idea_unauthorized, test_delete_idea_unauthorized
