// VDerm-X/src/Screens/appointmentChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { getUserData } from '../utils/auth';
import { BASE_URL } from '../config';

interface Message {
  _id: string;
  senderId: string;
  senderType: 'user' | 'vet';
  message: string;
  attachments?: string[];
  timestamp: Date;
  isRead: boolean;
  deletedAt?: Date;
}

interface DiagnosticData {
  image?: string;
  analysisText?: string;
  timestamp?: Date;
}

const AppointmentChatScreen = ({ route }: any) => {
  const { appointmentId } = route.params;
  const socketRef = useRef<Socket | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [typing, setTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [sharedDiagnostic, setSharedDiagnostic] = useState<DiagnosticData | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    initializeChat();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeChat = async () => {
    try {
      const currentUser = await getUserData();
      if (!currentUser || !currentUser._id) {
        Alert.alert('Error', 'Missing user data. Please log in again.');
        return;
      }

      const storedApiUrl = await AsyncStorage.getItem('apiUrl') || BASE_URL;

      setUserId(currentUser._id);
      setUserRole(currentUser.role || 'user');
      setApiUrl(storedApiUrl);

      // Connect to WebSocket
      const wsUrl = storedApiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      const socket = io(wsUrl, {
        query: {
          userId: currentUser._id,
          userRole: currentUser.role,
        },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      // Handle connection
      socket.on('connect', () => {
        console.log('Connected to chat server');
        // Join appointment room
        socket.emit('join_appointment', { appointmentId });
      });

      // Receive chat history
      socket.on('chat_history', (data: any) => {
        const msgs = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(msgs.reverse());
        setSharedDiagnostic(data.sharedDiagnosticData);
        setLoading(false);
      });

      // Receive new message
      socket.on('new_message', (msg: any) => {
        const newMsg = {
          ...msg,
          timestamp: new Date(msg.timestamp),
        };
        setMessages((prev) => [...prev, newMsg]);
        flatListRef.current?.scrollToEnd({ animated: true });
      });

      // Receive typing indicator
      socket.on('user_typing', (data: any) => {
        if (data.userId !== userId) {
          setOtherUserTyping(data.isTyping);
        }
      });

      // Receive message confirmation
      socket.on('message_sent', (data: any) => {
        console.log('Message sent:', data.status);
      });

      // Receive read status
      socket.on('message_read', (data: any) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, isRead: true } : msg,
          ),
        );
      });

      // Receive shared diagnostic data
      socket.on('diagnostic_shared', (data: any) => {
        setSharedDiagnostic(data.sharedData);
      });

      // Receive online users list
      socket.on('online_users', (data: any) => {
        setOnlineUsers(data.onlineUsers);
      });

      // Handle user joined/left
      socket.on('user_joined', (data: any) => {
        console.log(`User ${data.userId} joined`);
      });

      socket.on('user_left', (data: any) => {
        console.log(`User ${data.userId} left`);
      });

      // Handle errors
      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
        Alert.alert('Connection Error', 'Failed to connect to chat');
      });
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to initialize chat');
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!messageText.trim()) return;

    const socket = socketRef.current;
    if (!socket) {
      Alert.alert('Error', 'Not connected to chat');
      return;
    }

    socket.emit('send_message', {
      appointmentId,
      message: messageText.trim(),
      attachments: [],
    });

    setMessageText('');
    setTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    const socket = socketRef.current;
    if (!socket) return;

    if (text.length > 0 && !typing) {
      setTyping(true);
      socket.emit('typing', { appointmentId, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('typing', { appointmentId, isTyping: false });
      }
      setTyping(false);
    }, 1500);
  };

  const markMessagesAsRead = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('mark_read', { appointmentId });
  };

  const checkOnlineUsers = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('check_online', { appointmentId });
  };

  const deleteMessage = (messageId: string) => {
    Alert.alert('Delete Message', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const response = await fetch(
              `${apiUrl}/appointments/chat/${appointmentId}/messages/${messageId}`,
              {
                method: 'DELETE',
                headers: {
                  'x-user-id': userId,
                },
              },
            );

            if (response.ok) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg._id === messageId
                    ? { ...msg, deletedAt: new Date() }
                    : msg,
                ),
              );
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete message');
          }
        },
      },
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.deletedAt) {
      return (
        <View style={[styles.messageBubble, styles.deletedMessage]}>
          <Text style={styles.deletedText}>Message deleted</Text>
        </View>
      );
    }

    const isSender = item.senderId === userId;
    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isSender ? styles.senderContainer : styles.receiverContainer,
        ]}
        onLongPress={() => isSender && deleteMessage(item._id)}
      >
        <View
          style={[
            styles.messageBubble,
            isSender ? styles.senderBubble : styles.receiverBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isSender ? styles.senderText : styles.receiverText,
            ]}
          >
            {item.message}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
          {isSender && item.isRead && ' ✓✓'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Chat</Text>
        <TouchableOpacity
          style={styles.onlineButton}
          onPress={checkOnlineUsers}
        >
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>
            {onlineUsers.length} online
          </Text>
        </TouchableOpacity>
      </View>

      {sharedDiagnostic && (
        <View style={styles.diagnosticBanner}>
          <Text style={styles.diagnosticTitle}>📋 Shared Diagnostic Data</Text>
          {sharedDiagnostic.image && (
            <Image
              source={{ uri: sharedDiagnostic.image }}
              style={styles.diagnosticImage}
            />
          )}
          {sharedDiagnostic.analysisText && (
            <Text style={styles.diagnosticText}>
              {sharedDiagnostic.analysisText}
            </Text>
          )}
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        onEndReached={markMessagesAsRead}
      />

      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>User is typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={handleTyping}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!messageText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    backgroundColor: '#0066cc',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginRight: 6,
  },
  onlineText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  diagnosticBanner: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
  },
  diagnosticTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  diagnosticImage: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginBottom: 8,
  },
  diagnosticText: {
    fontSize: 12,
    color: '#856404',
  },
  messagesList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  senderContainer: {
    justifyContent: 'flex-end',
  },
  receiverContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  senderBubble: {
    backgroundColor: '#0066cc',
  },
  receiverBubble: {
    backgroundColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  senderText: {
    color: 'white',
  },
  receiverText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginHorizontal: 8,
    alignSelf: 'flex-end',
  },
  deletedMessage: {
    backgroundColor: '#f5f5f5',
  },
  deletedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  typingIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AppointmentChatScreen;
