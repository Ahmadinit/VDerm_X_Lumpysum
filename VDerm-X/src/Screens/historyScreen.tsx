import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { getUserData, UserData } from "../utils/auth";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../App";

interface Conversation {
  _id: string;
  userId: string;
  diagnosisId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const HistoryScreen = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (userData) {
        fetchDiagnosisConversations();
      }
    }, [userData])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
    if (data) {
      fetchDiagnosisConversations();
    }
  };

  const fetchDiagnosisConversations = async () => {
    if (!userData?._id) return;

    try {
      const response = await fetch(`${BASE_URL}/chat/conversations/${userData._id}`);
      const data = await response.json();

      if (response.ok) {
        // Show all conversations (both general and diagnosis-related)
        setConversations(data);
      } else {
        Alert.alert("Error", "Failed to load history");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    // @ts-ignore - Navigation params will be added
    navigation.navigate("ChatConversation", { 
      conversationId: conversation._id, 
      title: conversation.title 
    });
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (!userData?._id) {
                Alert.alert("Error", "User not authenticated");
                return;
              }

              const response = await fetch(`${BASE_URL}/chat/conversations/${conversationId}`, {
                method: "DELETE",
                headers: {
                  "x-user-id": userData._id,
                },
              });

              if (response.ok) {
                setConversations(conversations.filter(c => c._id !== conversationId));
                Alert.alert("Success", "Conversation deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete conversation");
              }
            } catch (error) {
              console.error("Error deleting conversation:", error);
              Alert.alert("Error", "Failed to delete conversation");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
      onLongPress={() => handleDeleteConversation(item._id)}
      delayLongPress={500}
    >
      <View style={[
        styles.avatarContainer,
        item.diagnosisId ? styles.diagnosisAvatar : styles.generalAvatar
      ]}>
        <Ionicons 
          name={item.diagnosisId ? "document-text" : "chatbubble-ellipses"} 
          size={24} 
          color="#FFFFFF" 
        />
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.conversationDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteConversation(item._id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#259D8A" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No chat history yet</Text>
          <Text style={styles.emptySubtext}>
            Your conversations will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: "#999",
    fontWeight: "600",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#BBB",
    textAlign: "center",
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 15,
    marginVertical: 6,
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  diagnosisAvatar: {
    backgroundColor: "#6CA8F0",
  },
  generalAvatar: {
    backgroundColor: "#259D8A",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  conversationDate: {
    fontSize: 13,
    color: "#999",
  },
  deleteButton: {
    padding: 8,
  },
});

export default HistoryScreen;
