// This file handles OpenAI integration for the support chat feature
// Uses the gpt-5-nano model for AI-powered responses

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  messageType?: string;
  aiModel?: string;
  detectedIntent?: string;
  userRating?: number;
  wasHelpful?: boolean;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  messageId: string;
  modelUsed: string;
  detectedIntent?: string;
  urgency?: string;
  contextUsed?: any;
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessageAt: Date;
  messageCount: number;
  isActive: boolean;
}

export interface UserContext {
  currentCourseId?: string;
  currentLessonId?: string;
  enrolledCourses?: any[];
  currentPage?: string;
}

// Send message using new comprehensive chat API
export async function sendChatMessage(
  message: string, 
  conversationId?: string,
  userContext?: UserContext
): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message, 
        conversationId,
        userContext 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Chat API error:', error);
    throw new Error('Failed to get AI response. Please try again or contact support.');
  }
}

// Get user's conversations
export async function getUserConversations(limit?: number): Promise<Conversation[]> {
  try {
    const url = limit ? `/api/chat/conversations?limit=${limit}` : '/api/chat/conversations';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Get conversations error:', error);
    throw new Error('Failed to load conversations.');
  }
}

// Get messages in a conversation
export async function getConversationMessages(conversationId: string, limit?: number): Promise<ChatMessage[]> {
  try {
    const url = limit 
      ? `/api/chat/conversations/${conversationId}/messages?limit=${limit}`
      : `/api/chat/conversations/${conversationId}/messages`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const messages = await response.json();
    return messages.map((msg: any) => convertToClientMessage(msg));
  } catch (error) {
    console.error('Get conversation messages error:', error);
    throw new Error('Failed to load conversation messages.');
  }
}

// Submit feedback for a message
export async function submitMessageFeedback(
  messageId: string,
  rating?: number,
  feedback?: string,
  wasHelpful?: boolean,
  feedbackCategory?: string
): Promise<void> {
  try {
    const response = await fetch('/api/chat/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageId,
        rating,
        feedback,
        wasHelpful,
        feedbackCategory
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Submit feedback error:', error);
    throw new Error('Failed to submit feedback.');
  }
}

// Convert server message format to client format
function convertToClientMessage(serverMessage: any): ChatMessage {
  return {
    id: serverMessage.id,
    content: serverMessage.content,
    sender: serverMessage.messageType === 'user' ? 'user' : 'ai',
    timestamp: new Date(serverMessage.createdAt),
    messageType: serverMessage.messageType,
    aiModel: serverMessage.aiModel,
    detectedIntent: serverMessage.detectedIntent,
    userRating: serverMessage.userRating,
    wasHelpful: serverMessage.wasHelpful,
  };
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
