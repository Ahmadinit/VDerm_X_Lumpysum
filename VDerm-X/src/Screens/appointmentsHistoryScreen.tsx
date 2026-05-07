// VDerm-X/src/Screens/appointmentsHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserData } from '../utils/auth';

interface Appointment {
  _id: string;
  vetId: {
    username: string;
    specializations: string[];
  };
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  linkedChatId?: string;
}

const AppointmentsHistoryScreen = ({ navigation }: any) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [apiUrl, setApiUrl] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await getUserData();
      if (user?.role === 'vet') {
        navigation.replace('VetAppointments');
        return;
      }

      if (!user || !user._id) {
        Alert.alert('Error', 'Missing user data. Please log in again.');
        setLoading(false);
        return;
      }

      const apiUrl = await AsyncStorage.getItem('apiUrl');
      setUserId(user._id);
      if (apiUrl) setApiUrl(apiUrl);
      await fetchAppointments(user._id, apiUrl);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const fetchAppointments = async (userId?: string, apiUrl?: string | null) => {
    try {
      let id = userId;
      let url = apiUrl;
      
      // If not provided, get from user data
      if (!id || !url) {
        const user = await getUserData();
        if (user?.role === 'vet') {
          navigation.replace('VetAppointments');
          return;
        }
        if (!user || !user._id) {
          Alert.alert('Error', 'Missing user data. Please log in again.');
          setLoading(false);
          return;
        }
        id = user._id;
        url = url || (await AsyncStorage.getItem('apiUrl'));
      }

      if (!id || !url) {
        Alert.alert('Error', 'Missing user data or API configuration');
        setLoading(false);
        return;
      }

      const response = await fetch(`${url}/appointments/user/${id}`, {
        method: 'GET',
        headers: { 'x-user-id': id },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data.sort((a: Appointment, b: Appointment) =>
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime()
      ));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments(userId, apiUrl);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'rejected':
        return '#f44336';
      case 'completed':
        return '#2196f3';
      case 'cancelled':
        return '#999';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', onPress: () => {} },
      {
        text: 'Yes, Cancel',
        onPress: async () => {
          try {
            const response = await fetch(
              `${apiUrl}/appointments/${appointmentId}`,
              {
                method: 'DELETE',
                headers: { 'x-user-id': userId },
              },
            );

            if (response.ok) {
              Alert.alert('Success', 'Appointment cancelled');
              fetchAppointments();
            } else {
              Alert.alert('Error', 'Failed to cancel appointment');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel appointment');
          }
        },
      },
    ]);
  };

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const appointmentDate = new Date(
      `${item.appointmentDate}T${item.appointmentTime}`,
    );
    const isUpcoming = appointmentDate > new Date();

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.headerRow}>
          <View style={styles.vetInfo}>
            <Text style={styles.vetName}>
              Dr. {item.vetId?.username || 'Unknown'}
            </Text>
            <Text style={styles.specialization}>
              {Array.isArray(item.vetId?.specializations) ? item.vetId!.specializations.join(', ') : 'N/A'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detail}>📅 {item.appointmentDate}</Text>
          <Text style={styles.detail}>🕐 {item.appointmentTime}</Text>
        </View>

        <Text style={styles.reason}>Reason: {item.reason}</Text>

        <View style={styles.actionsRow}>
          {item.linkedChatId && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('AppointmentChat', {
                  appointmentId: item._id,
                })
              }
            >
              <Text style={styles.actionButtonText}>💬 Chat</Text>
            </TouchableOpacity>
          )}

          {isUpcoming && item.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelAppointment(item._id)}
            >
              <Text style={styles.actionButtonText}>❌ Cancel</Text>
            </TouchableOpacity>
          )}

          {item.status === 'completed' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('AppointmentDetails', {
                  appointmentId: item._id,
                })
              }
            >
              <Text style={styles.actionButtonText}>📋 Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
    <View style={styles.container}>
      <Text style={styles.title}>My Appointments</Text>

      {appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No appointments yet</Text>
          <TouchableOpacity
            style={styles.newAppointmentButton}
            onPress={() => navigation.navigate('AppointmentBooking')}
          >
            <Text style={styles.buttonText}>Book an Appointment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    padding: 20,
    paddingBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  newAppointmentButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  specialization: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12,
  },
  detail: {
    fontSize: 13,
    color: '#666',
  },
  reason: {
    fontSize: 13,
    color: '#333',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ffe0e0',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});

export default AppointmentsHistoryScreen;
