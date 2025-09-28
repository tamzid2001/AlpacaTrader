import OpenAI from "openai";
import { storage } from "../storage";
import { 
  InsertChatConversation, 
  InsertChatMessage, 
  MessageType, 
  IntentType, 
  UrgencyLevel 
} from "@shared/schema";
import { randomUUID } from "crypto";

// Initialize OpenAI with error handling
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    console.log('✅ AI Chat Service initialized with OpenAI');
  } else {
    console.warn('⚠️ OPENAI_API_KEY not found - AI chat service disabled');
  }
} catch (error) {
  console.error('❌ OpenAI initialization failed:', error);
}

export interface ChatServiceResponse {
  response: string;
  conversationId: string;
  messageId: string;
  modelUsed: string;
  detectedIntent?: IntentType;
  urgency?: UrgencyLevel;
  contextUsed?: any;
  streaming?: boolean;
}

export interface UserContext {
  currentCourseId?: string;
  currentLessonId?: string;
  recentProgress?: any[];
  enrolledCourses?: any[];
  userLevel?: string;
  currentPage?: string;
}

export class AIChatService {
  private readonly PRIMARY_MODEL = 'gpt-4o-mini'; // Use gpt-4o-mini as it's available and fast
  private readonly FALLBACK_MODEL = 'gpt-3.5-turbo';
  private readonly TEMPERATURE = 0.7;
  private readonly MAX_TOKENS = 1000;

  constructor() {
    if (!openai) {
      console.warn('⚠️ AIChatService: OpenAI client not available');
    }
  }

  /**
   * Process a user message and generate AI response with full context awareness
   */
  async processMessage(
    userId: string,
    message: string,
    conversationId?: string,
    userContext?: UserContext,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ChatServiceResponse> {
    if (!openai) {
      throw new Error('OpenAI service is not available');
    }

    try {
      const startTime = Date.now();

      // Get or create conversation
      let conversation;
      let finalConversationId: string;
      
      if (conversationId) {
        conversation = await storage.getChatConversation(conversationId);
        if (!conversation || conversation.userId !== userId) {
          throw new Error('Invalid conversation ID or access denied');
        }
        finalConversationId = conversationId;
      } else {
        // Create new conversation
        const conversationData: InsertChatConversation = {
          userId,
          title: this.generateConversationTitle(message),
          currentCourseId: userContext?.currentCourseId,
          contextSnapshot: userContext,
          isActive: true,
        };
        conversation = await storage.createChatConversation(conversationData);
        finalConversationId = conversation.id;
      }

      // Detect intent and urgency
      const { intent, urgency, extractedTopic } = await this.analyzeIntent(message);

      // Build context-aware system prompt
      const systemPrompt = await this.buildSystemPrompt(userId, userContext, intent);

      // Get conversation history for context
      const recentMessages = await storage.getConversationMessages(finalConversationId, 10);
      
      // Build messages array with conversation history
      const messages = await this.buildMessagesArray(systemPrompt, message, recentMessages);

      // Generate AI response using gpt-4o-mini
      const response = await openai.chat.completions.create({
        model: this.PRIMARY_MODEL,
        messages,
        temperature: this.TEMPERATURE,
        max_tokens: this.MAX_TOKENS,
      });

      const aiResponse = response.choices[0].message.content || 'I apologize, but I was unable to generate a response. Please try again.';
      const responseTime = Date.now() - startTime;

      // Save user message
      const userMessageData: InsertChatMessage = {
        conversationId: finalConversationId,
        content: message,
        messageType: 'user' as MessageType,
        detectedIntent: intent,
        urgency,
        extractedTopic,
        contextUsed: userContext,
        responseTime: null,
        ipAddress,
        userAgent,
      };
      await storage.createChatMessage(userMessageData);

      // Save AI response message
      const aiMessageData: InsertChatMessage = {
        conversationId: finalConversationId,
        content: aiResponse,
        messageType: 'ai' as MessageType,
        aiModel: this.PRIMARY_MODEL,
        systemPrompt,
        temperature: this.TEMPERATURE,
        tokens: response.usage?.total_tokens || null,
        detectedIntent: intent,
        urgency,
        extractedTopic,
        contextUsed: userContext,
        responseTime,
        ipAddress,
        userAgent,
      };
      const savedMessage = await storage.createChatMessage(aiMessageData);

      // Update conversation metadata
      await storage.updateChatConversation(finalConversationId, {
        lastMessageAt: new Date(),
        messageCount: (conversation.messageCount || 0) + 2, // user + AI message
        avgResponseTime: this.calculateAverageResponseTime(
          conversation.avgResponseTime || 0, 
          conversation.messageCount || 0, 
          responseTime
        ),
      });

      return {
        response: aiResponse,
        conversationId: finalConversationId,
        messageId: savedMessage.id,
        modelUsed: this.PRIMARY_MODEL,
        detectedIntent: intent,
        urgency,
        contextUsed: userContext,
        streaming: false,
      };

    } catch (error: any) {
      console.error('❌ AI Chat Service Error:', error);
      
      // Fallback response
      if (error.message.includes('gpt-5-nano')) {
        console.log('🔄 Attempting fallback to gpt-3.5-turbo...');
        return this.processMessageWithFallback(userId, message, conversationId, userContext, ipAddress, userAgent);
      }
      
      throw new Error(`Failed to process message: ${error.message}`);
    }
  }

  /**
   * Process message with streaming response
   */
  async processMessageStream(
    userId: string,
    message: string,
    conversationId?: string,
    userContext?: UserContext,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AsyncIterableIterator<string>> {
    if (!openai) {
      throw new Error('OpenAI service is not available');
    }

    try {
      // Similar setup as processMessage but with streaming
      let conversation;
      let finalConversationId: string;
      
      if (conversationId) {
        conversation = await storage.getChatConversation(conversationId);
        if (!conversation || conversation.userId !== userId) {
          throw new Error('Invalid conversation ID or access denied');
        }
        finalConversationId = conversationId;
      } else {
        const conversationData: InsertChatConversation = {
          userId,
          title: this.generateConversationTitle(message),
          currentCourseId: userContext?.currentCourseId,
          contextSnapshot: userContext,
          isActive: true,
        };
        conversation = await storage.createChatConversation(conversationData);
        finalConversationId = conversation.id;
      }

      const { intent, urgency, extractedTopic } = await this.analyzeIntent(message);
      const systemPrompt = await this.buildSystemPrompt(userId, userContext, intent);
      const recentMessages = await storage.getConversationMessages(finalConversationId, 10);
      const messages = await this.buildMessagesArray(systemPrompt, message, recentMessages);

      // Create streaming completion
      const stream = await openai.chat.completions.create({
        model: this.PRIMARY_MODEL,
        messages,
        temperature: this.TEMPERATURE,
        max_tokens: this.MAX_TOKENS,
        stream: true,
      });

      // Save user message immediately
      const userMessageData: InsertChatMessage = {
        conversationId: finalConversationId,
        content: message,
        messageType: 'user' as MessageType,
        detectedIntent: intent,
        urgency,
        extractedTopic,
        contextUsed: userContext,
        responseTime: null,
        ipAddress,
        userAgent,
      };
      await storage.createChatMessage(userMessageData);

      return this.createStreamIterator(stream, finalConversationId, intent, urgency, extractedTopic, userContext, systemPrompt, ipAddress, userAgent);

    } catch (error: any) {
      console.error('❌ AI Chat Service Stream Error:', error);
      throw new Error(`Failed to process streaming message: ${error.message}`);
    }
  }

  /**
   * Analyze user message to detect intent and urgency
   */
  private async analyzeIntent(message: string): Promise<{
    intent: IntentType;
    urgency: UrgencyLevel;
    extractedTopic: string;
  }> {
    try {
      // Simple keyword-based intent detection (can be enhanced with ML models)
      const lowerMessage = message.toLowerCase();
      let intent: IntentType = 'general_inquiry';
      let urgency: UrgencyLevel = 'low';

      // Intent detection based on keywords
      if (lowerMessage.includes('course') || lowerMessage.includes('lesson') || lowerMessage.includes('learn')) {
        intent = 'course_question';
      } else if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
        intent = 'technical_support';
        urgency = 'medium';
      } else if (lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('explain')) {
        intent = 'learning_help';
      } else if (lowerMessage.includes('navigate') || lowerMessage.includes('find') || lowerMessage.includes('where')) {
        intent = 'platform_navigation';
      }

      // Urgency detection
      if (lowerMessage.includes('urgent') || lowerMessage.includes('critical') || lowerMessage.includes('immediately')) {
        urgency = 'high';
      } else if (lowerMessage.includes('important') || lowerMessage.includes('soon') || lowerMessage.includes('problem')) {
        urgency = 'medium';
      }

      // Extract main topic (first 50 characters or until punctuation)
      const extractedTopic = message.split(/[.!?]/)[0].substring(0, 50);

      return { intent, urgency, extractedTopic };
    } catch (error) {
      console.error('Intent analysis error:', error);
      return { 
        intent: 'general_inquiry', 
        urgency: 'low', 
        extractedTopic: message.substring(0, 50) 
      };
    }
  }

  /**
   * Build context-aware system prompt based on user context and intent
   */
  private async buildSystemPrompt(
    userId: string,
    userContext?: UserContext,
    intent?: IntentType
  ): Promise<string> {
    let basePrompt = `You are an AI support agent for PropFarming Pro, a comprehensive financial learning platform. You help users with course-related questions, technical issues, and general platform support. 

Your personality: Be helpful, professional, encouraging, and educational. Provide clear, actionable guidance.`;

    // Add user context if available
    if (userContext?.currentCourseId) {
      basePrompt += `\n\nUser Context: The user is currently in a course (ID: ${userContext.currentCourseId}).`;
    }

    if (userContext?.enrolledCourses?.length) {
      basePrompt += `\nThe user is enrolled in ${userContext.enrolledCourses.length} course(s).`;
    }

    // Add intent-specific instructions
    switch (intent) {
      case 'learning_help':
        basePrompt += `\n\nFocus: Help the user understand financial concepts, provide learning strategies, and encourage their educational journey. Ask clarifying questions if needed.`;
        break;
      case 'technical_support':
        basePrompt += `\n\nFocus: Provide technical troubleshooting steps. Be systematic and ask for specific details about the issue.`;
        break;
      case 'course_question':
        basePrompt += `\n\nFocus: Answer questions about course content, structure, and requirements. Provide helpful study tips.`;
        break;
      case 'platform_navigation':
        basePrompt += `\n\nFocus: Guide the user through platform features and navigation. Provide step-by-step instructions.`;
        break;
      default:
        basePrompt += `\n\nFocus: Provide general support and determine how best to help the user.`;
    }

    basePrompt += `\n\nImportant: Always be encouraging about the user's learning journey. If you cannot help with something, direct them to contact support directly.`;

    return basePrompt;
  }

  /**
   * Build messages array including conversation history
   */
  private async buildMessagesArray(
    systemPrompt: string,
    currentMessage: string,
    recentMessages: any[]
  ): Promise<Array<{ role: 'system' | 'user' | 'assistant'; content: string }>> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history (excluding current message)
    recentMessages
      .reverse() // Most recent first
      .forEach(msg => {
        if (msg.messageType === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.messageType === 'ai') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      });

    // Add current user message
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  /**
   * Fallback processing with alternative model
   */
  private async processMessageWithFallback(
    userId: string,
    message: string,
    conversationId?: string,
    userContext?: UserContext,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ChatServiceResponse> {
    // Implementation similar to processMessage but with fallback model
    // This is a simplified version - in production you'd want the full implementation
    try {
      const response = await openai!.chat.completions.create({
        model: this.FALLBACK_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for PropFarming Pro.' },
          { role: 'user', content: message }
        ],
        temperature: this.TEMPERATURE,
      });

      return {
        response: response.choices[0].message.content || 'Fallback response generated.',
        conversationId: conversationId || randomUUID(),
        messageId: randomUUID(),
        modelUsed: this.FALLBACK_MODEL,
      };
    } catch (error: any) {
      throw new Error(`Both primary and fallback models failed: ${error.message}`);
    }
  }

  /**
   * Create async iterator for streaming responses
   */
  private async *createStreamIterator(
    stream: any,
    conversationId: string,
    intent: IntentType,
    urgency: UrgencyLevel,
    extractedTopic: string,
    userContext?: UserContext,
    systemPrompt?: string,
    ipAddress?: string,
    userAgent?: string
  ): AsyncIterableIterator<string> {
    let fullResponse = '';
    let chunkCount = 0;
    const startTime = Date.now();

    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          chunkCount++;
          yield content;
        }
      }

      // Save the complete AI response after streaming is done
      if (fullResponse) {
        const responseTime = Date.now() - startTime;
        const aiMessageData: InsertChatMessage = {
          conversationId,
          content: fullResponse,
          messageType: 'ai' as MessageType,
          aiModel: this.PRIMARY_MODEL,
          systemPrompt,
          temperature: this.TEMPERATURE,
          detectedIntent: intent,
          urgency,
          extractedTopic,
          contextUsed: userContext,
          responseTime,
          streamingChunks: chunkCount,
          ipAddress,
          userAgent,
        };
        await storage.createChatMessage(aiMessageData);
      }
    } catch (error) {
      console.error('Streaming error:', error);
      yield '\n\n[Stream interrupted - please try again]';
    }
  }

  /**
   * Generate a conversation title from the first message
   */
  private generateConversationTitle(message: string): string {
    // Take first 50 characters and clean up
    const title = message.substring(0, 50).trim();
    return title.length < message.length ? `${title}...` : title;
  }

  /**
   * Calculate rolling average response time
   */
  private calculateAverageResponseTime(
    currentAvg: number,
    messageCount: number,
    newResponseTime: number
  ): number {
    if (messageCount === 0) return newResponseTime;
    return Math.round(((currentAvg * messageCount) + newResponseTime) / (messageCount + 1));
  }

  /**
   * Get user's learning context for better responses
   */
  async getUserLearningContext(userId: string): Promise<UserContext> {
    try {
      const user = await storage.getUser(userId);
      const enrollments = await storage.getUserEnrollments(userId);
      
      return {
        enrolledCourses: enrollments.map(e => ({
          id: e.courseId,
          title: e.course?.title,
          progress: e.progress
        })),
        userLevel: user?.role || 'user',
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {};
    }
  }
}

// Export singleton instance
export const aiChatService = new AIChatService();