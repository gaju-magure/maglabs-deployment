import pytest
from unittest.mock import AsyncMock, patch # For mocking genai client

from app.models.domain import (
    CategorizationResult,
    ChatMessage,
    EvaluationResult,
    IdeaCategoryEnum,
    Question,
    SenderTypeEnum,
)
from app.services.ai_service import categorize_idea, evaluate_answer
from app.core.config import settings # To potentially modify settings for tests if needed

# Store original API key and model name to restore after tests
ORIGINAL_GEMINI_API_KEY = settings.GEMINI_API_KEY
ORIGINAL_MODEL_NAME_IN_SERVICE = "gemini-pro" # Assuming this is the default in ai_service

@pytest.fixture(scope="function", autouse=True)
def manage_gemini_config():
    # This fixture ensures that GEMINI_API_KEY is set for tests
    # and that the ai_service module re-evaluates its client if necessary.
    # It also mocks the genai client to prevent real API calls.

    # Set a dummy API key for testing purposes if not already set by conftest.py
    # This ensures the ai_service initializes the genai client logic path.
    if not settings.GEMINI_API_KEY:
        settings.GEMINI_API_KEY = "test_api_key_for_ai_service"
    
    # The ai_service module configures genai on import.
    # To test different scenarios (e.g. API key missing), we might need to reload the module
    # or mock at a lower level. For these tests, we'll assume API key is present
    # and mock the `genai.generate_text_async` and `genai.get_model` calls.

    with patch("app.services.ai_service.genai.configure") as mock_configure, \
         patch("app.services.ai_service.genai.get_model") as mock_get_model, \
         patch("app.services.ai_service.genai.generate_text_async") as mock_generate_text:
        
        # Ensure get_model returns a mock that indicates model exists
        mock_get_model.return_value = AsyncMock() # A truthy value

        yield mock_configure, mock_get_model, mock_generate_text # Provide mocks to tests if needed

    # Restore original settings if they were changed
    settings.GEMINI_API_KEY = ORIGINAL_GEMINI_API_KEY
    # If model_name in ai_service was dynamically set, restore it too.
    # For now, assuming it's hardcoded or re-evaluated based on settings.


@pytest.mark.asyncio
async def test_categorize_idea_success(manage_gemini_config):
    _, _, mock_generate_text = manage_gemini_config
    
    mock_response = AsyncMock()
    mock_response.result = IdeaCategoryEnum.TECHNOLOGICAL_INNOVATION.value
    mock_generate_text.return_value = mock_response

    result = await categorize_idea("Tech Idea", "A new piece of tech.")
    
    assert result.category == IdeaCategoryEnum.TECHNOLOGICAL_INNOVATION
    assert result.confidence == 0.85 # Mocked confidence
    assert result.error is None
    mock_generate_text.assert_called_once()
    # We could also assert the prompt contents if needed by inspecting call_args


@pytest.mark.asyncio
async def test_categorize_idea_gemini_returns_invalid_category(manage_gemini_config):
    _, _, mock_generate_text = manage_gemini_config

    mock_response = AsyncMock()
    mock_response.result = "Not A Real Category"
    mock_generate_text.return_value = mock_response

    result = await categorize_idea("Vague Idea", "Something unclear.")

    assert result.category == IdeaCategoryEnum.UNCATEGORIZED
    assert "AI could not determine a valid category" in result.error


@pytest.mark.asyncio
async def test_categorize_idea_gemini_api_error(manage_gemini_config):
    _, _, mock_generate_text = manage_gemini_config
    mock_generate_text.side_effect = Exception("Gemini API exploded")

    result = await categorize_idea("Error Idea", "This will cause an error.")

    assert result.category == IdeaCategoryEnum.UNCATEGORIZED
    assert "AI categorization failed: Gemini API exploded" in result.error


@pytest.mark.asyncio
async def test_categorize_idea_no_api_key(manage_gemini_config):
    mock_configure, mock_get_model, mock_generate_text = manage_gemini_config
    
    # Simulate API key not being set by making get_model return None (or falsy)
    # This requires ai_service.model_name to be None or get_model to indicate unavailability
    with patch("app.services.ai_service.model_name", None): # Temporarily set model_name to None
        result = await categorize_idea("No Key Idea", "Description")
        assert result.category == IdeaCategoryEnum.UNCATEGORIZED
        assert "AI service not configured or model unavailable" in result.error
        mock_generate_text.assert_not_called() # Should not attempt to call Gemini

    # Test with get_model returning None
    mock_get_model.return_value = None
    result = await categorize_idea("No Model Idea", "Description")
    assert result.category == IdeaCategoryEnum.UNCATEGORIZED
    assert "AI service not configured or model unavailable" in result.error
    mock_generate_text.assert_not_called()


# --- Tests for evaluate_answer ---
sample_question = Question(id="q1", text="What is your main goal?", theme="Goal Setting")
sample_chat_history = [
    ChatMessage(sender=SenderTypeEnum.AI, text="Hello!"),
    ChatMessage(sender=SenderTypeEnum.USER, text="My idea is..."),
]

@pytest.mark.asyncio
async def test_evaluate_answer_proceeds(manage_gemini_config):
    _, _, mock_generate_text = manage_gemini_config

    mock_response_text = f"""
    AI_ACTION: PROCEED
    That's a clear goal!
    FINAL_ANSWER:The user wants to achieve world peace.
    CLARITY_DELTA:0.28
    """
    mock_response = AsyncMock()
    mock_response.result = mock_response_text
    mock_generate_text.return_value = mock_response

    result = await evaluate_answer(sample_question, "World peace.", sample_chat_history)

    assert result.type == "proceed"
    assert result.ai_response_to_user == "That's a clear goal!"
    assert result.final_answer_for_question == "The user wants to achieve world peace."
    assert result.clarity_meter_delta == 0.28
    assert result.error is None
    mock_generate_text.assert_called_once()


@pytest.mark.asyncio
async def test_evaluate_answer_clarifies(manage_gemini_config):
    _, _, mock_generate_text = manage_gemini_config
    
    mock_response_text = f"""
    AI_ACTION: CLARIFY
    Could you be more specific about 'soon'?
    CLARITY_DELTA:0.03
    """
    mock_response = AsyncMock()
    mock_response.result = mock_response_text
    mock_generate_text.return_value = mock_response

    result = await evaluate_answer(sample_question, "I want it soon.", None)

    assert result.type == "clarify"
    assert result.ai_response_to_user == "Could you be more specific about 'soon'?"
    assert result.final_answer_for_question is None # Not set for clarify
    assert result.clarity_meter_delta == 0.03
    assert result.error is None


@pytest.mark.asyncio
async def test_evaluate_answer_unexpected_format(manage_gemini_config):
    _, _, mock_generate_text = manage_gemini_config

    mock_response = AsyncMock()
    mock_response.result = "This is not the expected format at all."
    mock_generate_text.return_value = mock_response

    result = await evaluate_answer(sample_question, "A normal answer.")

    assert result.type == "proceed" # Falls back to proceed
    assert "Response structure issue" in result.ai_response_to_user
    assert result.final_answer_for_question == "A normal answer." # Defaults to user's answer
    assert result.clarity_meter_delta == 0.01
    assert "AI response format error" in result.error


@pytest.mark.asyncio
async def test_evaluate_answer_gemini_api_error(manage_gemini_config):
    _, _, mock_generate_text = manage_gemini_config
    mock_generate_text.side_effect = Exception("Gemini evaluation exploded")

    result = await evaluate_answer(sample_question, "This will also error.")

    assert result.type == "proceed" # Falls back
    assert "technical hiccup occurred with AI" in result.ai_response_to_user
    assert result.error == "AI evaluation failed: Gemini evaluation exploded"


@pytest.mark.asyncio
async def test_evaluate_answer_no_api_key(manage_gemini_config):
    mock_configure, mock_get_model, mock_generate_text = manage_gemini_config
    
    with patch("app.services.ai_service.model_name", None):
        result = await evaluate_answer(sample_question, "Answer with no key.")
        assert result.type == "proceed" # Mock fallback
        assert "(AI offline - mock response)" in result.ai_response_to_user
        assert "AI service not configured or model unavailable" in result.error
        mock_generate_text.assert_not_called()

    mock_get_model.return_value = None
    result = await evaluate_answer(sample_question, "Answer with no model.")
    assert result.type == "proceed" # Mock fallback
    assert "(AI offline - mock response)" in result.ai_response_to_user
    assert "AI service not configured or model unavailable" in result.error
    mock_generate_text.assert_not_called()
