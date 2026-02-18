import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../App";
import { getUserData, clearUserData, UserData } from "../utils/auth";

const HomeScreen = () => {
  const [activeTab, setActiveTab] = useState("Chats");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, "Home">>();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getUserData();
      if (data) {
        setUserData(data);
        // Set default active tab based on role
        if (data.role === 'vet') {
          setActiveTab("Appointments");
        }
      } else {
        // No user data, redirect to login
        navigation.replace("Login");
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            await clearUserData();
            navigation.replace("Login");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#259D8A" />
      </View>
    );
  }

  const userInitial = userData?.username?.charAt(0).toUpperCase() || "U";
  const isVet = userData?.role === 'vet';

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileIcon} onPress={handleLogout}>
          <Text style={styles.profileInitial}>{userInitial}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image
            source={require("../Assets/logo.png")}
            style={styles.logo}
          />
          {isVet && <Text style={styles.roleLabel}>Veterinarian</Text>}
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#259D8A" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Chats" && styles.activeTab]}
          onPress={() => {
            setActiveTab("Chats");
            navigation.navigate("Chats");
          }}
        >
          <Text
            style={[styles.tabText, activeTab === "Chats" && styles.activeTabText]}
          >
            {isVet ? "Consultations" : "Chats"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Appointments" && styles.activeTab]}
          onPress={() => setActiveTab("Appointments")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Appointments" && styles.activeTabText,
            ]}
          >
            Appointments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.instructions}>
          {isVet 
            ? "Welcome, Dr. " + (userData?.username || "") + "!\nManage your appointments and consultations" 
            : "Start a new chat here\nAsk anything about your pet"}
        </Text>
        {!isVet && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Ask here"
              placeholderTextColor="#A3D7D5"
            />
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#259D8A" />
          <Text style={styles.navText}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Vets")} // Navigate to VetsScreen
        >
          <MaterialIcons name="pets" size={28} color="#A5A5A5" />
          <Text style={styles.navTextInactive}>Vets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}
          onPress={() => navigation.navigate("Diagnosis")} // Navigate to VetsScreen
      
        >
          <MaterialIcons name="healing" size={28} color="#A5A5A5" />
          <Text style={styles.navTextInactive}>Diagnosis</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F6F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 5,
  },
  headerCenter: {
    alignItems: "center",
  },
  roleLabel: {
    fontSize: 12,
    color: "#259D8A",
    fontWeight: "600",
    marginTop: -5,
  },
  profileIcon: {
    width: 40,
    height: 40,
    marginTop: 40,
    backgroundColor: "#259D8A",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    
  },
  profileInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  logo: {
    width: 100,
    marginTop: 20,
    height: 40,
    resizeMode: "contain",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: "#fff",
    marginTop: 10,
    elevation: 2,
  },
  tab: {
    paddingVertical: 12,
    width: "50%",
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#259D8A",
  },
  tabText: {
    fontSize: 16,
    color: "#A5A5A5",
  },
  activeTabText: {
    color: "#259D8A",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  instructions: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#A3D7D5",
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: "#fff",
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#259D8A",
    padding: 5,
    marginRight: 0,
    borderRadius: 25,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    elevation: 5,
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: "#259D8A",
    marginTop: 5,
  },
  navTextInactive: {
    fontSize: 12,
    color: "#A5A5A5",
    marginTop: 5,
  },
});

export default HomeScreen;
