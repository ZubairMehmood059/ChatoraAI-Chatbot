/**
 * Chatora AI Reusable API Client Service Layer
 * Encapsulates all backend HTTP and SSE interactions behind a clean interface.
 * Automatically injects Supabase Bearer Auth Token into requests.
 */

import { getActiveAuthToken } from '../context/AuthContext';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: 'complete' | 'stopped' | 'error';
  requestId?: string;
  error?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  snippet?: string;
  userId?: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  userId?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  service: string;
  model: string;
  configured: boolean;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  email: string;
  createdAt?: string;
}

export interface StreamCallbacks {
  onStart?: (requestId: string) => void;
  onChunk?: (chunkText: string) => void;
  onDone?: (fullText: string, updatedTitle?: string) => void;
  onError?: (error: Error, requestId?: string) => void;
}

// Configurable API base url (empty by default for relative proxy/same-origin calls)
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    ...customHeaders,
  };
  const token = getActiveAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Health Status
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Health probe failed');
    return res.json();
  },

  // Conversation Management (per-user scoped when authenticated)
  async getConversations(): Promise<ConversationSummary[]> {
    const res = await fetch(`${API_BASE}/api/conversations`, {
      headers: getHeaders(),
    });
    if (res.status === 401) {
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('Failed to load conversations');
    return res.json();
  },

  async getConversation(id: string): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/api/conversations/${encodeURIComponent(id)}`, {
      headers: getHeaders(),
    });
    if (res.status === 403) {
      throw new Error('Forbidden: You do not have permission to view this conversation');
    }
    if (!res.ok) throw new Error('Failed to load conversation details');
    return res.json();
  },

  async createConversation(title?: string): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/api/conversations`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: title || 'New Chat' }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async renameConversation(id: string, title: string): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/api/conversations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title }),
    });
    if (res.status === 403) {
      throw new Error('Forbidden: You do not have permission to edit this conversation');
    }
    if (!res.ok) throw new Error('Failed to rename conversation');
    return res.json();
  },

  async togglePinConversation(id: string, pinned: boolean): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/api/conversations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ pinned }),
    });
    if (res.status === 403) {
      throw new Error('Forbidden: You do not have permission to update this conversation');
    }
    if (!res.ok) throw new Error('Failed to update conversation pin status');
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/conversations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 403) {
      throw new Error('Forbidden: You do not have permission to delete this conversation');
    }
    if (!res.ok) throw new Error('Failed to delete conversation');
  },

  async clearAllConversations(): Promise<void> {
    const res = await fetch(`${API_BASE}/api/conversations`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear conversations');
  },

  // Document Upload & Text Extraction
  async uploadFile(fileName: string, fileContent: string, fileType?: string): Promise<{
    fileName: string;
    fileType: string;
    content: string;
  }> {
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ fileName, fileContent, fileType }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to process document upload');
    }
    return res.json();
  },

  // Chat Streaming via Server-Sent Events with Bearer Auth
  async streamChat(
    payload: {
      conversationId: string;
      message: string;
      history?: Array<{ role: string; content: string }>;
      responseStyle?: 'concise' | 'balanced' | 'detailed';
      responseLanguage?: string;
    },
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      signal,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to connect to AI provider');
    }

    if (!response.body) {
      throw new Error('Readable stream not supported by browser environment');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let currentRequestId = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        const lines = textChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);
              if (event.type === 'start') {
                currentRequestId = event.requestId || '';
                callbacks.onStart?.(currentRequestId);
              } else if (event.type === 'chunk') {
                accumulatedText += event.text || '';
                callbacks.onChunk?.(event.text || '');
              } else if (event.type === 'done') {
                callbacks.onDone?.(accumulatedText || event.fullText || '', event.title);
              } else if (event.type === 'error') {
                callbacks.onError?.(new Error(event.error || 'Text generation error'), event.requestId || currentRequestId);
              }
            } catch {
              // Ignore partial JSON across streaming packets
            }
          }
        }
      }
    } catch (streamErr: unknown) {
      const isAbort =
        signal?.aborted ||
        (streamErr instanceof Error &&
          (streamErr.name === 'AbortError' || streamErr.message?.toLowerCase().includes('aborted'))) ||
        (typeof DOMException !== 'undefined' &&
          streamErr instanceof DOMException &&
          streamErr.name === 'AbortError');

      if (isAbort) {
        // User aborted/stopped generation intentionally
        throw streamErr;
      }
      callbacks.onError?.(
        streamErr instanceof Error ? streamErr : new Error(String(streamErr)),
        currentRequestId
      );
    }
  },

  // Auth User Profile Verification
  auth: {
    async getCurrentUser(): Promise<{ authenticated: boolean; user?: UserProfile }> {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: getHeaders(),
      });
      if (!res.ok) return { authenticated: false };
      return res.json();
    },
  },

  // Feedback Submission
  async submitFeedback(payload: {
    name: string;
    email: string;
    category: 'bug' | 'feature' | 'general' | 'praise';
    message: string;
    hp_website?: string;
  }): Promise<{ success: boolean; referenceId: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/feedback`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit feedback');
    }
    return data;
  },
};
