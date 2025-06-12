import { getBaseUrl } from "@/lib/utils";
import { Idea } from "../ideasApi";

// Type definitions
export interface ChatSession {
  id: string;
  title: string;
  conversation_type: 'brainstorm' | 'refine' | 'general' | 'problem_solving' | 'feature_design';
  status: 'active' | 'archived' | 'deleted';
  message_count: number;
  last_message_preview: string;
  time_ago: string;
  is_idea_submitted: boolean;
  last_activity_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: 'text' | 'idea_draft' | 'refinement' | 'question' | 'submission' | 'error';
  ai_metadata?: {
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    timestamp?: string;
    finish_reason?: string;
    processing_time_ms?: number;
    interview_session_id?: string;
    interview_stage?: string;
  };
  sequence_number: number;
  created_at: string;
  formatted_time: string;
  is_processed: boolean;
  processing_status: string;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
  system_prompt: string;
  ai_model: string;
  context_metadata: {
    user_role: string;
    user_name: string;
    department?: string;
    department_id?: string;
    custom_role?: string;
    custom_role_id?: string;
  };
  submitted_idea_details?: Idea;
  can_submit_idea: boolean;
  total_tokens_used: number;
  updated_at: string;
  ai_metadata: {
    interview_session_id?: string;
    interview_stage?: string;
    interview_mode?: boolean;
    started_at?: string;
    last_updated?: string;
  };
}

export interface ChatTemplate {
  id: string;
  name: string;
  description: string;
  conversation_type: string;
  initial_prompt: string;
  department?: string;
  created_at: string;
}

export interface CreateSessionRequest {
  title?: string;
  conversation_type?: string;
  template_id?: string;
}

export interface SendMessageRequest {
  content: string;
  message_type?: 'text' | 'idea_draft' | 'question';
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  ai_message?: ChatMessage;
  error_message?: ChatMessage;
  session_updated: ChatSessionDetail;
  error?: string;
}

export interface SubmitIdeaRequest {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SubmitIdeaResponse {
  idea: Idea;
  session: ChatSessionDetail;
  message: string;
}

// Helper function for auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// API Functions

export async function listChatSessions(params?: {
  status?: string;
  search?: string;
}): Promise<ChatSession[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  
  const url = `${getBaseUrl()}/api/v1/ideas/chat/sessions/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat sessions');
  }
  
  return response.json();
}

export async function createChatSession(data: CreateSessionRequest): Promise<ChatSessionDetail> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/chat/sessions/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create chat session');
  }
  
  return response.json();
}

export async function getChatSession(id: string): Promise<ChatSessionDetail> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/chat/sessions/${id}/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat session');
  }
  
  return response.json();
}

export async function sendMessage(
  sessionId: string, 
  data: SendMessageRequest
): Promise<SendMessageResponse> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/send_message/`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send message');
  }
  
  return response.json();
}

export async function regenerateResponse(sessionId: string): Promise<SendMessageResponse> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/regenerate_response/`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to regenerate response');
  }
  
  return response.json();
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<{title: string}> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/update_title/`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to update session title');
  }
  
  return response.json();
}

export async function archiveSession(sessionId: string): Promise<{status: string}> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/archive/`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to archive session');
  }
  
  return response.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
}

export async function submitChatAsIdea(
  sessionId: string, 
  data: SubmitIdeaRequest
): Promise<SubmitIdeaResponse> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/submit_as_idea/`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit idea');
  }
  
  return response.json();
}

export async function startInterview(
  sessionId: string,
  message?: string
): Promise<SendMessageResponse> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/start_interview/`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message: message || 'I have a business idea I want to develop' }),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to start interview');
  }
  
  return response.json();
}

export async function getChatTemplates(): Promise<ChatTemplate[]> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/chat/templates/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat templates');
  }
  
  return response.json();
}