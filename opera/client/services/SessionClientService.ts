import { sanitizeApiError } from "@/client/services/error";

/**
 * Frontend Service for interacting with the Sessions API.
 * This abstracts the fetch calls and provides a clean interface for UI components.
 */

export const SessionClientService = {
  /**
   * Fetches a list of sessions for the current user.
   */
  async getSessions(page: number = 1, limit: number = 20) {
    const response = await fetch(`/api/sessions?page=${page}&limit=${limit}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(sanitizeApiError(errorData.error || 'Failed to fetch sessions'));
    }
    return response.json();
  },

  /**
   * Fetches a single session by ID.
   */
  async getSession(id: string) {
    const response = await fetch(`/api/sessions/${id}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(sanitizeApiError(errorData.error || 'Failed to fetch session'));
    }
    return response.json();
  },

  /**
   * Creates a new mind dump session.
   */
  async createSession(payload: {
    dump_text: string;
    debate_rounds: number;
    conversation_type: string;
    emotional_state: string;
    personas?: string[];
  }) {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(sanitizeApiError(errorData.error || 'Failed to create session'));
    }
    return response.json();
  },

  /**
   * Triggers the rebuttal process for a session.
   */
  async sendRebuttal(sessionId: string, content: string, target?: string) {
    const response = await fetch(`/api/sessions/${sessionId}/rebuttal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, target }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(sanitizeApiError(errorData.error || 'Failed to send rebuttal'));
    }
    return response.json();
  }
};
