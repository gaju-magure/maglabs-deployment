
import { IdeaCategoryEnum, CategorizationResult, Question, ChatMessage, EvaluationResult } from '../types';

const API_BASE_URL = 'http://localhost:8080'; // Docker nginx proxy to Python backend
const API_VERSION = '/api/v1'; // API version prefix for FastAPI backend

export const categorizeIdeaWithGemini = async (title: string, description: string): Promise<CategorizationResult | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/categorize`, { // Updated to use API_VERSION prefix
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });

    if (!response.ok) {
      console.error(`Error from backend categorization API: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Error body:", errorBody);
      return { category: IdeaCategoryEnum.UNCATEGORIZED, error: `Backend error: ${response.statusText}` };
    }
    return await response.json();
  } catch (error) {
    console.error("Network error calling categorization API:", error);
    return { category: IdeaCategoryEnum.UNCATEGORIZED, error: "Network error during categorization." };
  }
};

export const evaluateAnswerAndSuggestNextStep = async (
  mainQuestion: Question,
  userAnswerText: string,
  fullChatHistory?: ChatMessage[]
): Promise<EvaluationResult> => {
  try {
    // Convert ChatMessage objects from camelCase to snake_case for Python backend
    const convertedChatHistory = fullChatHistory?.map(msg => ({
      id: msg.id,
      sender: msg.sender,
      text: msg.text,
      timestamp: msg.timestamp,
      for_question_id: msg.forQuestionId,
      is_clarification: msg.isClarification,
      ai_thinks: msg.aiThinks
    }));

    const response = await fetch(`${API_BASE_URL}${API_VERSION}/evaluate`, { // Updated to use API_VERSION prefix
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        main_question: mainQuestion, 
        user_answer_text: userAnswerText, 
        full_chat_history: convertedChatHistory 
      }),
    });

    if (!response.ok) {
      console.error(`Error from backend evaluation API: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Error body:", errorBody);
      // Provide a default fallback response structure for EvaluationResult
      return {
        type: 'proceed',
        aiResponseToUser: `Error communicating with AI assistant (${response.statusText}). Let's proceed with your answer.`,
        finalAnswerForQuestion: userAnswerText,
        clarityMeterDelta: 0,
        error: `Backend error: ${response.statusText}`
      };
    }
    return await response.json();
  } catch (error) {
    console.error("Network error calling evaluation API:", error);
    // Provide a default fallback response structure for EvaluationResult
    return {
      type: 'proceed',
      aiResponseToUser: "Network error communicating with AI assistant. Let's proceed with your answer.",
      finalAnswerForQuestion: userAnswerText,
      clarityMeterDelta: 0,
      error: "Network error during evaluation."
    };
  }
};
