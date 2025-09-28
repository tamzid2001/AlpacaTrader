import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  sendChatMessage, 
  createUserMessage, 
  createAIMessage, 
  getUserConversations,
  getConversationMessages,
  submitMessageFeedback,
  type ChatMessage,
  type Conversation,
  type ChatResponse,
  type UserContext
} from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import ContactForm from "@/components/support/contact-form";
import { 
  MessageCircle, 
  Bot, 
  User, 
  Send, 
  X, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  Star,
  History,
  Brain,
  Zap,
  ArrowLeft,
  RotateCcw,
  ChevronDown,
  MessageSquare,
  Trophy,
  BookOpen
} from "lucide-react";

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  
  // Current conversation state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createAIMessage("Hi! I'm your AI assistant powered by GPT-5 Nano. How can I help you with your learning today? 🚀")
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Conversation management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  
  // UI state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastResponseModel, setLastResponseModel] = useState<string>("gpt-5-nano");

  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load conversations when opening history tab
  useEffect(() => {
    if (isOpen && activeTab === "history" && user) {
      loadConversations();
    }
  }, [isOpen, activeTab, user]);

  const loadConversations = async () => {
    if (!user) return;
    
    setLoadingConversations(true);
    try {
      const userConversations = await getUserConversations(20);
      setConversations(userConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast({
        variant: "destructive",
        title: "Failed to load conversations",
        description: "Please try again later.",
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  // Get user context for better AI responses
  const getUserContext = (): UserContext => {
    // Get current page info from window location
    const currentPath = window.location.pathname;
    let context: UserContext = {
      currentPage: currentPath
    };

    // Extract course/lesson context if on course pages
    if (currentPath.includes('/courses/')) {
      const courseMatch = currentPath.match(/\/courses\/([^\/]+)/);
      if (courseMatch) {
        context.currentCourseId = courseMatch[1];
      }
    }

    return context;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = createUserMessage(inputValue);
    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const userContext = getUserContext();
      const chatResponse: ChatResponse = await sendChatMessage(
        messageText, 
        currentConversationId || undefined,
        userContext
      );

      // Update conversation ID if this is a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(chatResponse.conversationId);
      }

      // Create AI message with enhanced metadata
      const aiMessage = createAIMessage(chatResponse.response);
      aiMessage.aiModel = chatResponse.modelUsed;
      aiMessage.detectedIntent = chatResponse.detectedIntent;
      
      setMessages(prev => [...prev, aiMessage]);
      setLastResponseModel(chatResponse.modelUsed);

      // Show model info if different from expected
      if (chatResponse.modelUsed !== 'gpt-5-nano') {
        toast({
          title: "Using Fallback Model",
          description: `Using ${chatResponse.modelUsed} as GPT-5 Nano is temporarily unavailable.`,
        });
      }

    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = createAIMessage(
        "I'm sorry, I'm having trouble responding right now. This might be due to high demand or a temporary service issue. Please try again in a moment, or contact our support team for immediate assistance. 🛠️"
      );
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageFeedback = async (messageId: string, wasHelpful: boolean, rating?: number) => {
    try {
      await submitMessageFeedback(messageId, rating, undefined, wasHelpful);
      
      // Update local message state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, wasHelpful, userRating: rating } 
          : msg
      ));

      toast({
        title: "Feedback Received",
        description: "Thank you for your feedback! It helps us improve.",
      });
    } catch (error) {
      console.error('Feedback error:', error);
      toast({
        variant: "destructive",
        title: "Feedback Error",
        description: "Failed to submit feedback. Please try again.",
      });
    }
  };

  const loadConversation = async (conversation: Conversation) => {
    try {
      const conversationMessages = await getConversationMessages(conversation.id);
      setMessages(conversationMessages);
      setCurrentConversationId(conversation.id);
      setActiveTab("chat");
      
      toast({
        title: "Conversation Loaded",
        description: `Loaded "${conversation.title}"`,
      });
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast({
        variant: "destructive",
        title: "Failed to load conversation",
        description: "Please try again.",
      });
    }
  };

  const startNewConversation = () => {
    setMessages([createAIMessage("Hi! I'm your AI assistant powered by GPT-5 Nano. How can I help you with your learning today? 🚀")]);
    setCurrentConversationId(null);
    setActiveTab("chat");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (showContactForm) {
      setShowContactForm(false);
    }
  };

  if (showContactForm) {
    return (
      <ContactForm 
        isOpen={showContactForm}
        onClose={() => {
          setShowContactForm(false);
          setIsOpen(true);
        }}
        userEmail={user?.email || undefined}
        userName={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined : undefined}
      />
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="support-widget">
      {/* Support Agent Icon */}
      <Button
        onClick={toggleChat}
        className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative"
        data-testid="button-support-toggle"
      >
        <div className="relative">
          <Brain className="w-6 h-6 text-primary-foreground transition-transform group-hover:scale-110" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white animate-pulse" />
        </div>
        {/* Enhanced online indicator */}
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <Zap className="w-2.5 h-2.5 text-white" />
        </div>
      </Button>

      {/* Enhanced Support Chat Panel */}
      {isOpen && (
        <Card className="absolute bottom-20 right-0 w-96 h-[600px] shadow-2xl border border-border flex flex-col animate-in slide-in-from-right-5 fade-in-0 duration-300">
          {/* Enhanced Chat Header */}
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary via-primary/95 to-primary/90 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/95 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white/50">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground" data-testid="text-ai-agent-title">
                  AI Assistant
                </h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-white/90 text-primary">
                    GPT-5 Nano
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-xs text-primary-foreground/90" data-testid="text-online-status">
                      Online
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={startNewConversation}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                data-testid="button-new-chat"
                title="Start new conversation"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleChat}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                data-testid="button-close-chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Enhanced Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "chat" | "history")} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-2 mb-0">
              <TabsTrigger value="chat" className="text-xs flex items-center space-x-2">
                <MessageCircle className="w-3 h-3" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs flex items-center space-x-2">
                <History className="w-3 h-3" />
                <span>History</span>
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0">
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4" data-testid="chat-messages">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${
                          message.sender === 'user' ? 'justify-end' : ''
                        }`}
                        data-testid={`message-${message.sender}-${message.id}`}
                      >
                        {message.sender === 'ai' && (
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Sparkles className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col space-y-2 max-w-xs">
                          <div
                            className={`p-3 rounded-lg shadow-sm ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-auto rounded-br-sm'
                                : 'bg-secondary/80 backdrop-blur-sm rounded-bl-sm border border-border/50'
                            }`}
                          >
                            <p className="text-sm leading-relaxed" data-testid={`text-message-${message.id}`}>
                              {message.content}
                            </p>
                            {message.sender === 'ai' && message.aiModel && (
                              <div className="mt-2 flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {message.aiModel}
                                </Badge>
                                {message.detectedIntent && (
                                  <Badge variant="secondary" className="text-xs">
                                    {message.detectedIntent.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Message Feedback for AI messages */}
                          {message.sender === 'ai' && (
                            <div className="flex items-center space-x-2 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMessageFeedback(message.id, true)}
                                className={`h-6 px-2 ${message.wasHelpful === true ? 'bg-green-100 text-green-600' : ''}`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMessageFeedback(message.id, false)}
                                className={`h-6 px-2 ${message.wasHelpful === false ? 'bg-red-100 text-red-600' : ''}`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                              {message.userRating && (
                                <div className="flex items-center space-x-1">
                                  {[1,2,3,4,5].map((star) => (
                                    <Star 
                                      key={star}
                                      className={`w-2.5 h-2.5 ${star <= (message.userRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {message.sender === 'user' && (
                          <div className="w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex items-start space-x-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300" data-testid="loading-message">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Brain className="w-4 h-4 text-primary-foreground animate-pulse" />
                        </div>
                        <div className="bg-secondary/80 backdrop-blur-sm p-4 rounded-lg rounded-bl-sm max-w-xs border border-border/50 shadow-sm">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <span className="text-xs text-muted-foreground ml-2">AI is processing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>

              {/* Enhanced Chat Input */}
              <div className="p-4 border-t border-border bg-gradient-to-r from-background to-background/95">
                <div className="flex space-x-2 mb-3">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your learning..."
                    className="flex-1 text-sm focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    disabled={isLoading}
                    data-testid="input-chat-message"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    className="px-3 hover:scale-105 transition-transform duration-200"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setIsOpen(false);
                        setShowContactForm(true);
                      }}
                      className="text-xs text-primary hover:underline p-0 h-auto hover:text-primary/80 transition-colors"
                      data-testid="button-contact-support"
                    >
                      📧 Contact Support
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {lastResponseModel}
                    </Badge>
                    <Clock className="w-3 h-3" />
                    <span>Instant responses</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="flex-1 flex flex-col m-0">
              <CardContent className="flex-1 p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-sm">Recent Conversations</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadConversations}
                    disabled={loadingConversations}
                    className="h-7 text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                
                <ScrollArea className="h-full">
                  {loadingConversations ? (
                    <div className="space-y-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-16 bg-secondary/50 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : conversations.length > 0 ? (
                    <div className="space-y-2">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => loadConversation(conversation)}
                          className="p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm truncate">
                                {conversation.title}
                              </h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {conversation.messageCount} messages
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(conversation.lastMessageAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <History className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs">Start chatting to see your history</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}