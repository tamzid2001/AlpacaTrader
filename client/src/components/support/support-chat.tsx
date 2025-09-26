import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { sendChatMessage, createUserMessage, createAIMessage, type ChatMessage } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import ContactForm from "@/components/support/contact-form";

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
        userName={user?.displayName || undefined}
      />
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="support-widget">
      {/* Support Agent Icon */}
      <Button
        onClick={toggleChat}
        className="w-16 h-16 bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        data-testid="button-support-toggle"
      >
        <i className="fas fa-headset text-primary-foreground text-xl"></i>
      </Button>

      {/* Support Chat Panel */}
      {isOpen && (
        <Card className="absolute bottom-20 right-0 w-96 h-[500px] shadow-2xl border border-border flex flex-col">
          {/* Chat Header */}
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border bg-primary rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <i className="fas fa-robot text-primary text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground" data-testid="text-ai-agent-title">
                  AI Support Agent
                </h3>
                <p className="text-xs text-primary-foreground/80" data-testid="text-online-status">
                  Online now
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleChat}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              data-testid="button-close-chat"
            >
              <i className="fas fa-times"></i>
            </Button>
          </CardHeader>

          {/* Chat Messages */}
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4" data-testid="chat-messages">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.sender === 'user' ? 'justify-end' : ''
                    }`}
                    data-testid={`message-${message.sender}-${message.id}`}
                  >
                    {message.sender === 'ai' && (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-robot text-primary-foreground text-xs"></i>
                      </div>
                    )}
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-secondary'
                      }`}
                    >
                      <p className="text-sm" data-testid={`text-message-${message.id}`}>
                        {message.content}
                      </p>
                    </div>
                    {message.sender === 'user' && (
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user text-muted-foreground text-xs"></i>
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-start space-x-3" data-testid="loading-message">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-primary-foreground text-xs"></i>
                    </div>
                    <div className="bg-secondary p-3 rounded-lg max-w-xs">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>

          {/* Chat Input */}
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2 mb-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 text-sm"
                disabled={isLoading}
                data-testid="input-chat-message"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                data-testid="button-send-message"
              >
                <i className="fas fa-paper-plane"></i>
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
                className="text-xs text-primary hover:underline p-0 h-auto"
                data-testid="button-contact-support"
              >
                Contact Support Team
              </Button>
              <span className="text-xs text-muted-foreground" data-testid="text-response-time">
                Response within 1-2 business days
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
