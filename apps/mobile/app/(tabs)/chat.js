import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function AIChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant for financial education. How can I help you today?",
      isBot: true,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const sampleResponses = [
    "That's a great question about financial markets! Let me help you understand...",
    "Based on current market trends, here's what you should know...",
    "For risk management, I'd recommend considering these key factors...",
    "Let me break down that financial concept for you...",
    "Here are some practical tips for your investment journey...",
    "That's an important aspect of portfolio management. Consider this..."
  ];

  const sendMessage = () => {
    if (message.trim()) {
      // Add user message
      const userMessage = {
        id: messages.length + 1,
        text: message,
        isBot: false,
        timestamp: new Date().toLocaleTimeString()
      };

      // Simulate AI response
      const botResponse = {
        id: messages.length + 2,
        text: sampleResponses[Math.floor(Math.random() * sampleResponses.length)],
        isBot: true,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, userMessage, botResponse]);
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <MaterialIcons name="smart-toy" size={24} color="#0ea5e9" />
        <Text style={styles.headerTitle}>AI Financial Assistant</Text>
        <View style={styles.statusIndicator}>
          <View style={styles.onlineStatus} />
          <Text style={styles.statusText}>Online</Text>
        </View>
      </View>

      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageWrapper,
              msg.isBot ? styles.botMessageWrapper : styles.userMessageWrapper
            ]}
          >
            {msg.isBot && (
              <View style={styles.botAvatar}>
                <MaterialIcons name="smart-toy" size={16} color="#fff" />
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                msg.isBot ? styles.botMessage : styles.userMessage
              ]}
            >
              <Text style={[
                styles.messageText,
                msg.isBot ? styles.botMessageText : styles.userMessageText
              ]}>
                {msg.text}
              </Text>
              <Text style={[
                styles.timestamp,
                msg.isBot ? styles.botTimestamp : styles.userTimestamp
              ]}>
                {msg.timestamp}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Ask about financial markets, investing, or trading..."
            multiline
            maxLength={500}
            data-testid="input-chat-message"
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!message.trim()}
            data-testid="button-send-message"
          >
            <MaterialIcons 
              name="send" 
              size={20} 
              color={message.trim() ? "#fff" : "#ccc"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.quickActions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setMessage("What are the basics of stock market investing?")}
              data-testid="button-quick-action-basics"
            >
              <Text style={styles.quickActionText}>Stock Basics</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setMessage("How do I manage investment risk?")}
              data-testid="button-quick-action-risk"
            >
              <Text style={styles.quickActionText}>Risk Management</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setMessage("Explain portfolio diversification")}
              data-testid="button-quick-action-portfolio"
            >
              <Text style={styles.quickActionText}>Portfolio Tips</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setMessage("What are market indicators?")}
              data-testid="button-quick-action-indicators"
            >
              <Text style={styles.quickActionText}>Market Indicators</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginLeft: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  botMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: '#0ea5e9',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  botMessageText: {
    color: '#1f2937',
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  botTimestamp: {
    color: '#6b7280',
  },
  userTimestamp: {
    color: '#e0f2fe',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    color: '#1f2937',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  quickActions: {
    height: 40,
  },
  quickActionButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickActionText: {
    color: '#0369a1',
    fontSize: 14,
    fontWeight: '500',
  },
});