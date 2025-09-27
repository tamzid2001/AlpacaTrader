import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { sendChatMessage, createUserMessage, createAIMessage, type ChatMessage } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import ContactForm from "@/components/support/contact-form";
import { MessageCircle, Bot, User, Send, X, AlertCircle, Sparkles, Clock } from "lucide-react";

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createAIMessage("Hi! I'm your AI assistant. How can I help you with your learning today?")
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = createUserMessage(inputValue);
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const aiResponse = await sendChatMessage(inputValue);
      const aiMessage = createAIMessage(aiResponse);
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = createAIMessage(
        "I'm sorry, I'm having trouble responding right now. Please try again or contact our support team for assistance."
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
        className="w-16 h-16 bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-xl group relative"
        data-testid="button-support-toggle"
      >
        <MessageCircle className="w-6 h-6 text-primary-foreground transition-transform group-hover:scale-110" />
        {/* Online indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </Button>

      {/* Support Chat Panel */}
      {isOpen && (
        <Card className="absolute bottom-20 right-0 w-96 h-[500px] shadow-2xl border border-border flex flex-col animate-in slide-in-from-right-5 fade-in-0 duration-300">
          {/* Chat Header */}
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary to-primary/90 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground" data-testid="text-ai-agent-title">
                  AI Support Agent
                </h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-xs text-primary-foreground/90" data-testid="text-online-status">
                    Online now
                  </p>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleChat}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors"
              data-testid="button-close-chat"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          {/* Chat Messages */}
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
                    <div
                      className={`max-w-xs p-3 rounded-lg shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-auto rounded-br-sm'
                          : 'bg-secondary/80 backdrop-blur-sm rounded-bl-sm border border-border/50'
                      }`}
                    >
                      <p className="text-sm leading-relaxed" data-testid={`text-message-${message.id}`}>
                        {message.content}
                      </p>
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
                      <Clock className="w-4 h-4 text-primary-foreground animate-pulse" />
                    </div>
                    <div className="bg-secondary/80 backdrop-blur-sm p-4 rounded-lg rounded-bl-sm max-w-xs border border-border/50 shadow-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>

          {/* Chat Input */}
          <div className="p-4 border-t border-border bg-gradient-to-r from-background to-background/95">
            <div className="flex space-x-2 mb-3">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
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
            <div className="flex justify-between items-center">
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
                📧 Contact Support Team
              </Button>
              <span className="text-xs text-muted-foreground flex items-center space-x-1" data-testid="text-response-time">
                <Clock className="w-3 h-3" />
                <span>Response within 1-2 business days</span>
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
