import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { getUserData, UserData } from "../utils/auth";

interface Message {
  _id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: any;
}

const ChatConversationScreen = ({ route, navigation }: any) => {
  const { conversationId, title } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadUserData();
    fetchMessages();
  }, []);

  useEffect(() => {
    // Set navigation header
    navigation.setOptions({
      headerTitle: title || "Chat",
    });
  }, [title]);

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${BASE_URL}/chat/messages/${conversationId}`);
      const data = await response.json();

      if (response.ok) {
        setMessages(data);
        // Scroll to bottom after messages load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert("Error", "Failed to load messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    if (!userData?._id) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    const userMessage = inputText.trim();
    setInputText("");
    setSending(true);

    // Optimistically add user message
    const tempUserMessage: Message = {
      _id: Date.now().toString(),
      conversationId,
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`${BASE_URL}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userData._id,
        },
        body: JSON.stringify({
          conversationId,
          content: userMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Replace temp message with actual messages (user + assistant)
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m._id !== tempUserMessage._id);
          return [...withoutTemp, data.userMessage, data.aiMessage];
        });

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert("Error", data.message || "Failed to send message");
        // Remove temp message on error
        setMessages((prev) => prev.filter((m) => m._id !== tempUserMessage._id));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m._id !== tempUserMessage._id));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format markdown text for AI responses
  const formatMarkdownText = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      // Bold headers (## Header or **Header**)
      if (line.trim().startsWith('##')) {
        const headerText = line.replace(/^#+\s*/, '').trim();
        elements.push(
          <Text key={`header-${index}`} style={styles.headerText}>
            {headerText}
          </Text>
        );
      }
      // Bold text wrapped in **text**
      else if (line.includes('**')) {
        const parts = line.split('**');
        const textElements: (string | JSX.Element)[] = [];
        parts.forEach((part, i) => {
          if (i % 2 === 1) {
            // Odd indices are bold
            textElements.push(
              <Text key={`bold-${index}-${i}`} style={styles.boldText}>
                {part}
              </Text>
            );
          } else {
            textElements.push(part);
          }
        });
        elements.push(
          <Text key={`line-${index}`} style={styles.regularText}>
            {textElements}
          </Text>
        );
      }
      // Bullet points
      else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const bulletText = line.replace(/^[-•]\s*/, '').trim();
        elements.push(
          <Text key={`bullet-${index}`} style={styles.bulletText}>
            • {bulletText}
          </Text>
        );
      }
      // Numbered lists
      else if (/^\d+\./.test(line.trim())) {
        elements.push(
          <Text key={`numbered-${index}`} style={styles.bulletText}>
            {line.trim()}
          </Text>
        );
      }
      // Regular text
      else if (line.trim()) {
        elements.push(
          <Text key={`text-${index}`} style={styles.regularText}>
            {line}
          </Text>
        );
      }
      // Empty line (spacing)
      else {
        elements.push(<View key={`space-${index}`} style={{ height: 8 }} />);
      }
    });
    
    return elements;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {isUser ? (
            <Text style={[styles.messageText, styles.userText]}>
              {item.content}
            </Text>
          ) : (
            <View style={styles.assistantTextContainer}>
              {formatMarkdownText(item.content)}
            </View>
          )}
          <Text style={[styles.messageTime, isUser ? styles.userTime : styles.assistantTime]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#259D8A" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <>
          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  messagesList: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  assistantMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#259D8A",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  assistantText: {
    color: "#333",
  },
  assistantTextContainer: {
    width: "100%",
  },
  headerText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#259D8A",
    marginBottom: 6,
    marginTop: 4,
  },
  boldText: {
    fontWeight: "700",
    color: "#333",
  },
  regularText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    marginBottom: 3,
    paddingLeft: 8,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userTime: {
    color: "#E0F7F5",
  },
  assistantTime: {
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#259D8A",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#A3D7D5",
  },
});

export default ChatConversationScreen;
