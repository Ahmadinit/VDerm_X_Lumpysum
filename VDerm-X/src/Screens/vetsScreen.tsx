import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BASE_URL } from "../config";

interface Vet {
  _id: string;
  username: string;
  email: string;
  specialization?: string;
  contact?: string;
  area?: string;
  availability?: string;
}

const VetsScreen = ({ navigation }: { navigation: any }) => {
  const [search, setSearch] = useState("");
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVets();
  }, []);

  const fetchVets = async () => {
    try {
      const response = await fetch(`${BASE_URL}/vets`);
      const data = await response.json();
      
      if (response.ok) {
        setVets(data);
      } else {
        Alert.alert("Error", "Failed to load vets");
      }
    } catch (error) {
      console.error("Error fetching vets:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const filteredVets = vets.filter((vet) =>
    vet.username.toLowerCase().includes(search.toLowerCase()) ||
    vet.specialization?.toLowerCase().includes(search.toLowerCase()) ||
    vet.area?.toLowerCase().includes(search.toLowerCase())
  );

  const handleBookAppointment = (vet: Vet) => {
    // TODO: Navigate to appointment booking screen
    Alert.alert("Coming Soon", `Book appointment with Dr. ${vet.username}`);
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const renderVet = ({ item }: { item: Vet }) => (
    <View style={styles.vetItem}>
      <View style={styles.vetHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(item.username)}</Text>
        </View>
        <View style={styles.vetInfo}>
          <Text style={styles.vetName}>Dr. {item.username}</Text>
          {item.specialization && (
            <Text style={styles.vetSpecialization}>{item.specialization}</Text>
          )}
          {item.area && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.vetDetail}>{item.area}</Text>
            </View>
          )}
          {item.availability && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.vetDetail}>{item.availability}</Text>
            </View>
          )}
          {item.contact && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color="#666" />
              <Text style={styles.vetDetail}>{item.contact}</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity 
        style={styles.bookButton}
        onPress={() => handleBookAppointment(item)}
      >
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sea Green Background Section */}
      <View style={styles.headerContainer}>
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, number..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={(text) => setSearch(text)}
          />
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        </View>

        {/* Header */}
        <Text style={styles.header}>Vets</Text>
      </View>

      {/* Vets List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#259D8A" />
          <Text style={styles.loadingText}>Loading vets...</Text>
        </View>
      ) : filteredVets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="pets" size={64} color="#CCC" />
          <Text style={styles.emptyText}>
            {search ? "No vets found" : "No vets available"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVets}
          renderItem={renderVet}
          keyExtractor={(item) => item._id}
          style={styles.vetsList}
          contentContainerStyle={styles.vetsListContent}
        />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#A5A5A5" />
          <Text style={styles.navTextInactive}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Vets")}
        >
          <MaterialIcons name="pets" size={28} color="#259D8A" />
          <Text style={styles.navText}>Vets</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate("Diagnosis")}
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
    backgroundColor: "#F7F8FA",
  },
  headerContainer: {
    backgroundColor: "#A3D7D5",
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    marginTop: 50,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 5,
  },
  searchIcon: {
    marginLeft: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  vetsList: {
    flex: 1,
  },
  vetsListContent: {
    paddingBottom: 20,
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
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  vetItem: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  vetHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#259D8A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  vetSpecialization: {
    fontSize: 14,
    color: "#259D8A",
    fontWeight: "500",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  vetDetail: {
    fontSize: 13,
    color: "#666",
  },
  bookButton: {
    backgroundColor: "#259D8A",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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

export default VetsScreen;
