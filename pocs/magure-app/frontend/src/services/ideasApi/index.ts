const API_BASE_URL = `http://${window.location.hostname}:8000`;

export interface Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_email: string;
  clarity_score?: number;
  creativity_score?: number;
  feasibility_score?: number;
  relevance_score?: number;
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
  const response = await fetch(`${API_BASE_URL}/api/v1/ideas/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch ideas');
  }
  return response.json();
}

export async function createIdea(data: CreateIdeaRequest): Promise<Idea> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ideas/`, {
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
  const response = await fetch(`${API_BASE_URL}/api/v1/ideas/${id}/`, {
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
  const response = await fetch(`${API_BASE_URL}/api/v1/ideas/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete idea');
  }
}

export async function refineIdea(idea_text: string, conversation_history?: any[]): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ideas/refine/`, {
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

export async function scoreIdea(idea_text: string): Promise<{
  clarity: number;
  creativity: number;
  feasibility: number;
  relevance: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ideas/score/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ idea_text }),
  });
  if (!response.ok) {
    throw new Error('Failed to score idea');
  }
  const data = await response.json();
  return data.scores;
}
