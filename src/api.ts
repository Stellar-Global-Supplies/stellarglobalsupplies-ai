import type { User, GroqModel, ImageModel, Conversation, Message, Attachment, ChatRequest } from '@/types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const errorBody = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(errorBody.error || `Request failed (${resp.status})`);
  }
  return resp.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const resp = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(resp);
  },

  async me(): Promise<User> {
    const resp = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
    return handleResponse(resp);
  },

  // Models
  async getChatModels(): Promise<GroqModel[]> {
    const resp = await fetch(`${API_BASE}/chat/models`, { headers: authHeaders() });
    return handleResponse(resp);
  },

  async getImageModels(): Promise<ImageModel[]> {
    const resp = await fetch(`${API_BASE}/image/models`, { headers: authHeaders() });
    return handleResponse(resp);
  },

  // Conversations
  async listConversations(): Promise<Conversation[]> {
    const resp = await fetch(`${API_BASE}/conversations`, { headers: authHeaders() });
    return handleResponse(resp);
  },

  async createConversation(title?: string, model?: string): Promise<Conversation> {
    const resp = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ title, model }),
    });
    return handleResponse(resp);
  },

  async getConversation(id: string): Promise<Conversation> {
    const resp = await fetch(`${API_BASE}/conversations/${id}`, { headers: authHeaders() });
    return handleResponse(resp);
  },

  async updateConversation(id: string, updates: { title?: string; model?: string }): Promise<Conversation> {
    const resp = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(updates),
    });
    return handleResponse(resp);
  },

  async deleteConversation(id: string): Promise<void> {
    const resp = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(resp);
  },

  async addMessage(conversationId: string, message: Partial<Message>): Promise<Message> {
    const resp = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(message),
    });
    return handleResponse(resp);
  },

  // Chat streaming
  async streamChat(
    request: ChatRequest,
    onChunk: (content: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const resp = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(request),
      signal,
    });

    if (!resp.ok) {
      const errorBody = await resp.json().catch(() => ({ error: resp.statusText }));
      throw new Error(errorBody.error || `Chat failed (${resp.status})`);
    }

    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            fullContent += parsed.content;
            onChunk(parsed.content);
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (e) {
          if (e instanceof Error && e.message && !e.message.includes('JSON')) {
            throw e;
          }
        }
      }
    }

    return fullContent;
  },

  // Image generation
  async generateImage(prompt: string, model?: string): Promise<{ image: string; model: string }> {
    const resp = await fetch(`${API_BASE}/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ prompt, model }),
    });
    return handleResponse(resp);
  },

  // Enterprise data
  async listEntViews(): Promise<{ name: string }[]> {
    const resp = await fetch(`${API_BASE}/ent-data/views`, { headers: authHeaders() });
    return handleResponse(resp);
  },

  // File parsing
  async parseFile(file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch(`${API_BASE}/files/parse`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    return handleResponse(resp);
  },
};
