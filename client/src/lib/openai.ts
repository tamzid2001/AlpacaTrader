// This file handles OpenAI integration for the support chat feature
// Uses the latest gpt-5 model for AI-powered responses

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
}

export async function sendChatMessage(message: string): Promise<string> {
  try {
    const response = await fetch('/api/support/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error('Chat API error:', error);
    throw new Error('Failed to get AI response. Please try again or contact support.');
  }
}

export function generateMessageId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function createUserMessage(content: string): ChatMessage {
  return {
    id: generateMessageId(),
    content,
    sender: 'user',
    timestamp: new Date(),
  };
}

export function createAIMessage(content: string): ChatMessage {
  return {
    id: generateMessageId(),
    content,
    sender: 'ai',
    timestamp: new Date(),
  };
}
