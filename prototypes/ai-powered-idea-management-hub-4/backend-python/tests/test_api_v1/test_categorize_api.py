import pytest
from httpx import AsyncClient
from starlette import status

from app.core.config import settings
from app.models.domain import CategorizationResult, IdeaCategoryEnum

# Mock the AI service for categorization to avoid actual API calls during tests
@pytest.fixture(autouse=True)
def mock_ai_categorize_service(mocker):
    # This mock will apply to all tests in this file
    async def mock_categorize(title: str, description: str) -> CategorizationResult:
        if title == "Error Case Title":
            return CategorizationResult(
                category=IdeaCategoryEnum.UNCATEGORIZED, # Default category for errors
                error="Simulated AI service error during categorization."
            )
        if title == "Uncategorizable Case":
             return CategorizationResult(
                category=IdeaCategoryEnum.UNCATEGORIZED,
                error="AI could not determine a valid category from the response." # Simulating AI's inability
            )
        if title == "Service Unavailable Case":
            # This specific error message is checked in the endpoint to raise 503
            return CategorizationResult(
                category=IdeaCategoryEnum.UNCATEGORIZED,
                error="AI service not configured or model unavailable."
            )
        # Default successful mock response
        return CategorizationResult(
            category=IdeaCategoryEnum.PRODUCT_INNOVATION, confidence=0.95
        )

    # Patch the actual service function used by the endpoint
    # The path to patch is where the function is *looked up*, not where it's defined.
    # So, if categorize.py imports it as `from app.services.ai_service import categorize_idea`,
    # then that's the path to patch.
    return mocker.patch("app.api.v1.categorize.ai_categorize_idea_service", side_effect=mock_categorize)


@pytest.mark.asyncio
async def test_categorize_idea_success(test_client: AsyncClient, mock_ai_categorize_service):
    payload = {"title": "Test Idea", "description": "A great new product idea."}
    response = await test_client.post(f"{settings.API_V1_STR}/categorize", json=payload)

    assert response.status_code == status.HTTP_200_OK
    json_response = response.json()
    assert json_response["category"] == IdeaCategoryEnum.PRODUCT_INNOVATION.value
    assert json_response["confidence"] == 0.95
    assert json_response["error"] is None
    mock_ai_categorize_service.assert_called_once_with(title=payload["title"], description=payload["description"])


@pytest.mark.asyncio
async def test_categorize_idea_missing_title(test_client: AsyncClient):
    payload = {"description": "A great new product idea."} # Missing title
    response = await test_client.post(f"{settings.API_V1_STR}/categorize", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Missing title or description" in response.json()["detail"]


@pytest.mark.asyncio
async def test_categorize_idea_missing_description(test_client: AsyncClient):
    payload = {"title": "Test Idea"} # Missing description
    response = await test_client.post(f"{settings.API_V1_STR}/categorize", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Missing title or description" in response.json()["detail"]

@pytest.mark.asyncio
async def test_categorize_idea_empty_title(test_client: AsyncClient):
    payload = {"title": "", "description": "A great new product idea."}
    response = await test_client.post(f"{settings.API_V1_STR}/categorize", json=payload)
    # The endpoint currently checks for presence, not emptiness. Pydantic models might enforce min_length.
    # If CategorizeRequest model has min_length for title, this would be 422.
    # Current endpoint logic:
    assert response.status_code == status.HTTP_400_BAD_REQUEST 
    assert "Missing title or description" in response.json()["detail"] # Because empty string is falsy

@pytest.mark.asyncio
async def test_categorize_idea_ai_service_error_simulated(test_client: AsyncClient, mock_ai_categorize_service):
    # Test the case where the AI service itself returns an error within the CategorizationResult
    payload = {"title": "Error Case Title", "description": "This should cause a simulated AI error."}
    response = await test_client.post(f"{settings.API_V1_STR}/categorize", json=payload)
    
    assert response.status_code == status.HTTP_200_OK # As per current endpoint logic, returns 200 with error in body
    json_response = response.json()
    assert json_response["category"] == IdeaCategoryEnum.UNCATEGORIZED.value
    assert "Simulated AI service error" in json_response["error"]
    mock_ai_categorize_service.assert_called_once_with(title=payload["title"], description=payload["description"])

@pytest.mark.asyncio
async def test_categorize_idea_ai_uncategorizable(test_client: AsyncClient, mock_ai_categorize_service):
    # Test the case where AI cannot categorize but doesn't error out (e.g. invalid response from AI)
    payload = {"title": "Uncategorizable Case", "description": "This idea is too vague for AI."}
    response = await test_client.post(f"{settings.API_V1_STR}/categorize", json=payload)

    assert response.status_code == status.HTTP_200_OK
    json_response = response.json()
    assert json_response["category"] == IdeaCategoryEnum.UNCATEGORIZED.value
    assert "AI could not determine a valid category" in json_response["error"]
    mock_ai_categorize_service.assert_called_once_with(title=payload["title"], description=payload["description"])

@pytest.mark.asyncio
async def test_categorize_idea_ai_service_unavailable(test_client: AsyncClient, mock_ai_categorize_service):
    # Test the specific error message that triggers a 503
    payload = {"title": "Service Unavailable Case", "description": "This triggers a 503."}
    response = await test_client.post(f"{settings.API_V1_STR}/categorize", json=payload)

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    json_response = response.json()
    assert "AI service for categorization is currently unavailable" in json_response["detail"]
    mock_ai_categorize_service.assert_called_once_with(title=payload["title"], description=payload["description"])

# To test with authentication, you would need to:
# 1. Define mock users in conftest.py (e.g., mock_current_user_contributor).
# 2. Override the get_current_user dependency in the test or via app.dependency_overrides.
# 3. Uncomment the `current_user` dependency in the endpoint.
# Example:
# @pytest.mark.asyncio
# async def test_categorize_idea_authenticated(test_client: AsyncClient, mock_ai_categorize_service, mock_current_user_contributor):
#     from app.main import app # Import app to set overrides
#     from app.core.security import get_current_user

#     app.dependency_overrides[get_current_user] = lambda: mock_current_user_contributor
    
#     payload = {"title": "Authenticated Test", "description": "Idea by authenticated user."}
#     # Assuming the endpoint now has `current_user: AuthenticatedUser = Depends(get_current_user)`
#     # The mock token is not needed if overriding get_current_user directly.
#     # headers = {"Authorization": "Bearer mocktoken"} # Not needed if overriding dependency
    
#     response = await test_client.post(f"{settings.API_V1_STR}/categorize", json=payload) #, headers=headers)
    
#     assert response.status_code == status.HTTP_200_OK
#     # ... further assertions ...
    
#     app.dependency_overrides.clear() # Clean up
