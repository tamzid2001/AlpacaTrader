import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Button } from '../../components/ui/Button';
import { useState } from 'react';

export default function ChatScreen() {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    console.log('Sending message:', message);
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Trading Assistant</Text>
      </View>
      
      <ScrollView style={styles.messagesContainer}>
        <View style={styles.botMessage}>
          <Text style={styles.botMessageText}>
            Hello! I'm your AI trading assistant. I can help you with market analysis, 
            trading strategies, and financial insights. What would you like to know?
          </Text>
        </View>

        <View style={styles.userMessage}>
          <Text style={styles.userMessageText}>
            What's the current trend for tech stocks?
          </Text>
        </View>

        <View style={styles.botMessage}>
          <Text style={styles.botMessageText}>
            Tech stocks are showing mixed performance today. AAPL and GOOGL are up, 
            while MSFT and TSLA are down. The overall tech sector is consolidating 
            after recent gains. Would you like a detailed analysis of any specific stock?
          </Text>
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Ask me about trading, markets, or strategies..."
          multiline
        />
        <Button
          title="Send"
          onPress={handleSendMessage}
          style={styles.sendButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  botMessage: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    marginRight: 40,
  },
  botMessageText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  userMessage: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    marginLeft: 40,
    alignSelf: 'flex-end',
  },
  userMessageText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    paddingHorizontal: 16,
  },
});