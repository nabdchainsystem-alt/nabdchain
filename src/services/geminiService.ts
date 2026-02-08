/**
 * Gemini AI Service
 *
 * SECURITY NOTE: AI API calls are now proxied through the backend.
 * The Gemini API key is stored server-side only (in server/.env).
 * This prevents exposing the API key to browser users.
 */
import { appLogger } from '../utils/logger';
import { API_URL } from '../config/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

/**
 * Check if AI features are available by calling the backend.
 * Returns true if the backend has AI configured.
 */
async function isAIAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/ai/credits`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Sends a message to the AI via backend proxy.
 * @param message User message
 * @param history Previous chat history (currently not used with proxy)
 * @returns AsyncGenerator yielding the full response (streaming not yet supported via proxy)
 */
export async function* chatWithGemini(message: string, _history: { role: string; parts: string }[]) {
  // Future: implement streaming via backend; for now, yields a single full response
  const response = await generateResponse(message);
  yield response;
}

/**
 * Simple single-shot response generation via backend proxy.
 * @param prompt User prompt
 * @returns Generated response text
 */
export async function generateResponse(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/ai/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        promptType: 'general',
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return 'AI features require authentication. Please sign in.';
      }
      const error = await response.json().catch(() => ({}));
      return error.error || 'AI service temporarily unavailable.';
    }

    const data = await response.json();
    return data.response || data.text || 'I processed that, but have no words.';
  } catch (error) {
    appLogger.error('AI API Error:', error);
    return 'AI service is currently unavailable. Please try again later.';
  }
}

/**
 * Generates subtasks for a given task title via backend proxy.
 * @param taskTitle The title of the main task
 * @returns Array of subtask strings
 */
export async function generateSubtasks(taskTitle: string): Promise<string[]> {
  try {
    const prompt = `Generate 3-5 concise, actionable subtasks for the task: "${taskTitle}". Return ONLY the subtasks as a JSON array of strings.`;

    const response = await fetch(`${API_URL}/ai/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        promptType: 'gtd',
      }),
    });

    if (!response.ok) {
      appLogger.warn('AI subtask generation failed, returning empty array.');
      return [];
    }

    const data = await response.json();
    const text = data.response || data.text || '';

    // Clean up potential markdown code blocks
    const cleanText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    try {
      return JSON.parse(cleanText);
    } catch {
      // If parsing fails, return empty array
      return [];
    }
  } catch (error) {
    appLogger.error('Failed to generate subtasks:', error);
    return [];
  }
}

// Export for backwards compatibility
export { isAIAvailable };
