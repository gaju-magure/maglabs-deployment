import { getBaseUrl } from "@/lib/utils";

export interface Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_email: string;
  is_pinned: boolean;
}

export interface CreateIdeaRequest {
  title: string;
  description: string;
  status?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function listIdeas(): Promise<Idea[]> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch ideas');
  }
  return response.json();
}

export async function createIdea(data: CreateIdeaRequest): Promise<Idea> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create idea');
  }
  return response.json();
}

export async function updateIdea(id: string, data: Partial<CreateIdeaRequest>): Promise<Idea> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update idea');
  }
  return response.json();
}

export async function deleteIdea(id: string): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete idea');
  }
}

export async function refineIdea(idea_text: string, conversation_history?: any[]): Promise<string> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/refine/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ idea_text, conversation_history }),
  });
  if (!response.ok) {
    throw new Error('Failed to refine idea');
  }
  const data = await response.json();
  return data.refined_idea;
}

export async function submitIdea(title: string, description: string): Promise<Idea> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/submit/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, description }),
  });
  if (!response.ok) {
    throw new Error('Failed to submit idea');
  }
  return response.json();
}

export async function getContentWallIdeas(): Promise<Idea[]> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/content_wall/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch content wall ideas');
  }
  return response.json();
}

export async function toggleIdeaPin(id: string): Promise<Idea> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/${id}/toggle_pin/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to toggle idea pin');
  }
  return response.json();
}
