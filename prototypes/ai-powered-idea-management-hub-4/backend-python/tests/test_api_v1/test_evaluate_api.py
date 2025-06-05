import pytest
from httpx import AsyncClient
from starlette import status

from app.core.config import settings
from app.models.domain import (
    ChatMessage,
    EvaluationResult,
    EvaluateAnswerRequest,
    Question,
    SenderTypeEnum,
)

# Mock the AI service for evaluation
@pytest.fixture(autouse=True)
def mock_ai_evaluate_service(mocker):
    async def mock_evaluate(
        main_question: Question, user_answer_text: str, full_chat_history: list[ChatMessage] | None = None
    ) -> EvaluationResult:
        if main_question.theme == "Error Theme":
            return EvaluationResult(
                type="proceed", # Fallback type
                ai_response_to_user="Simulated AI error during evaluation.",
                error="Simulated AI service error."
            )
        if main_question.theme == "Service Unavailable Theme":
            return EvaluationResult(
                type="proceed",
                ai_response_to_user="AI service unavailable.",
                error="AI service not configured or model unavailable." # Triggers 503
            )
        if "clarify this" in user_answer_text.lower():
            return EvaluationResult(
                type="clarify",
                ai_response_to_user="Could you please clarify your previous point?",
                clarity_meter_delta=0.05,
            )
        return EvaluationResult(
            type="proceed",
            ai_response_to_user="That's a great point, thank you!",
            final_answer_for_question=user_answer_text,
            clarity_meter_delta=0.25,
        )
    return mocker.patch("app.api.v1.evaluate.ai_evaluate_answer_service", side_effect=mock_evaluate)


# Sample data for tests
sample_question = Question(id="q1", text="What is your main goal?", theme="Goal Setting")
sample_chat_history = [
    ChatMessage(sender=SenderTypeEnum.AI, text="Hello! What's your idea about?"),
    ChatMessage(sender=SenderTypeEnum.USER, text="It's about a new type of widget."),
]

@pytest.mark.asyncio
async def test_evaluate_answer_success_proceed(test_client: AsyncClient, mock_ai_evaluate_service):
    payload = EvaluateAnswerRequest(
        main_question=sample_question,
        user_answer_text="My main goal is to innovate.",
        full_chat_history=sample_chat_history,
    ).model_dump(mode="json") # Ensure enums are serialized correctly

    response = await test_client.post(f"{settings.API_V1_STR}/evaluate", json=payload)

    assert response.status_code == status.HTTP_200_OK
    json_response = response.json()
    assert json_response["type"] == "proceed"
    assert json_response["ai_response_to_user"] == "That's a great point, thank you!"
    assert json_response["final_answer_for_question"] == "My main goal is to innovate."
    assert json_response["clarity_meter_delta"] == 0.25
    assert json_response["error"] is None
    
    # Check if the mock was called with correct arguments
    mock_ai_evaluate_service.assert_called_once()
    call_kwargs = mock_ai_evaluate_service.call_args.kwargs # Get keyword arguments
    assert call_kwargs["main_question"] == sample_question
    assert call_kwargs["user_answer_text"] == "My main goal is to innovate."
    assert call_kwargs["full_chat_history"] == sample_chat_history


@pytest.mark.asyncio
async def test_evaluate_answer_success_clarify(test_client: AsyncClient, mock_ai_evaluate_service):
    payload = EvaluateAnswerRequest(
        main_question=sample_question,
        user_answer_text="Please clarify this for me.",
        full_chat_history=None, # Test with no chat history
    ).model_dump(mode="json")

    response = await test_client.post(f"{settings.API_V1_STR}/evaluate", json=payload)

    assert response.status_code == status.HTTP_200_OK
    json_response = response.json()
    assert json_response["type"] == "clarify"
    assert json_response["ai_response_to_user"] == "Could you please clarify your previous point?"
    assert json_response["final_answer_for_question"] is None
    assert json_response["clarity_meter_delta"] == 0.05
    assert json_response["error"] is None
    # Check if the mock was called with correct arguments
    mock_ai_evaluate_service.assert_called_once()
    call_kwargs = mock_ai_evaluate_service.call_args.kwargs
    assert call_kwargs["main_question"] == sample_question
    assert call_kwargs["user_answer_text"] == "Please clarify this for me."
    assert call_kwargs["full_chat_history"] is None

@pytest.mark.asyncio
async def test_evaluate_answer_missing_main_question(test_client: AsyncClient):
    payload = {"user_answer_text": "Some answer."} # Missing main_question
    response = await test_client.post(f"{settings.API_V1_STR}/evaluate", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY # Pydantic validation error
    # Or 400 if custom check in endpoint:
    # assert response.status_code == status.HTTP_400_BAD_REQUEST
    # assert "Missing mainQuestion" in response.json()["detail"]


@pytest.mark.asyncio
async def test_evaluate_answer_missing_user_answer(test_client: AsyncClient):
    payload = {"main_question": sample_question.model_dump(mode="json")} # Missing user_answer_text
    response = await test_client.post(f"{settings.API_V1_STR}/evaluate", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY # Pydantic validation
    # Or 400 if custom check:
    # assert response.status_code == status.HTTP_400_BAD_REQUEST
    # assert "Missing userAnswerText" in response.json()["detail"]

@pytest.mark.asyncio
async def test_evaluate_answer_ai_service_error_simulated(test_client: AsyncClient, mock_ai_evaluate_service):
    error_question = Question(id="q_err", text="Error question", theme="Error Theme")
    payload = EvaluateAnswerRequest(
        main_question=error_question,
        user_answer_text="This should error.",
    ).model_dump(mode="json")

    response = await test_client.post(f"{settings.API_V1_STR}/evaluate", json=payload)
    
    assert response.status_code == status.HTTP_200_OK # Endpoint returns 200 with error in body
    json_response = response.json()
    assert "Simulated AI service error" in json_response["error"]
    mock_ai_evaluate_service.assert_called_once()

@pytest.mark.asyncio
async def test_evaluate_answer_ai_service_unavailable(test_client: AsyncClient, mock_ai_evaluate_service):
    unavailable_question = Question(id="q_unavail", text="Unavailable question", theme="Service Unavailable Theme")
    payload = EvaluateAnswerRequest(
        main_question=unavailable_question,
        user_answer_text="This should be 503.",
    ).model_dump(mode="json")

    response = await test_client.post(f"{settings.API_V1_STR}/evaluate", json=payload)

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    json_response = response.json()
    assert "AI service for evaluation is currently unavailable" in json_response["detail"]
    mock_ai_evaluate_service.assert_called_once()

# Add tests for authentication if the endpoint is protected.
