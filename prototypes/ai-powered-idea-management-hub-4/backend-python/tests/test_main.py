import pytest
from httpx import AsyncClient
from starlette import status

from app.core.config import settings # To check settings if needed

# Test the root health check endpoint
@pytest.mark.asyncio
async def test_root_health_check(test_client: AsyncClient):
    response = await test_client.get("/")
    assert response.status_code == status.HTTP_200_OK
    json_response = response.json()
    assert json_response["status"] == "ok"
    assert json_response["message"] == f"{settings.PROJECT_NAME} is running!"
    assert json_response["version"] == settings.PROJECT_VERSION
    # APP_ENV in tests is set to "testing" via conftest.py os.environ
    assert json_response["environment"] == "testing" 

# Test the v1 health check endpoint
@pytest.mark.asyncio
async def test_v1_health_check(test_client: AsyncClient):
    response = await test_client.get(f"{settings.API_V1_STR}/health")
    assert response.status_code == status.HTTP_200_OK
    json_response = response.json()
    assert json_response["status"] == "ok"
    assert json_response["version"] == "v1"

# Test OpenAPI docs availability
@pytest.mark.asyncio
async def test_openapi_docs_available(test_client: AsyncClient):
    # Check Swagger UI
    response_swagger = await test_client.get("/docs")
    assert response_swagger.status_code == status.HTTP_200_OK
    assert "swagger-ui" in response_swagger.text.lower()

    # Check ReDoc
    response_redoc = await test_client.get("/redoc")
    assert response_redoc.status_code == status.HTTP_200_OK
    assert "redoc" in response_redoc.text.lower()

    # Check OpenAPI JSON
    response_openapi_json = await test_client.get(f"{settings.API_V1_STR}/openapi.json")
    assert response_openapi_json.status_code == status.HTTP_200_OK
    json_payload = response_openapi_json.json()
    assert json_payload["openapi"].startswith("3.") # Check for OpenAPI 3.x.x
    assert json_payload["info"]["title"] == settings.PROJECT_NAME
    assert json_payload["info"]["version"] == settings.PROJECT_VERSION

# Example test for a non-existent route (should return 404)
@pytest.mark.asyncio
async def test_non_existent_route(test_client: AsyncClient):
    response = await test_client.get("/this-route-does-not-exist")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    json_response = response.json()
    assert json_response["detail"] == "Not Found"

# Add more tests for main.py specific functionalities if any,
# like global exception handlers or middleware behaviors (though middleware is often tested via endpoint tests).
