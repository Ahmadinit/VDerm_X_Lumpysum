// VDerm-X/src/Screens/appointmentBookingScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Vet {
  _id: string;
  firstName: string;
  lastName: string;
  specializations: string[];
  profileImage?: string;
  averageRating: number;
  totalReviews: number;
  responseTime: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DiagnosisData {
  _id: string;
  image: string;
  analysis: string;
}

const AppointmentBookingScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1); // 1: Select Vet, 2: Select Date/Time, 3: Share Data, 4: Confirm
  const [vets, setVets] = useState<Vet[]>([]);
  const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [shareData, setShareData] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    loadUserData();
    if (step === 1) {
      fetchVets();
    }
  }, [step]);

  const loadUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const apiUrl = await AsyncStorage.getItem('apiUrl');
      if (userId) setUserId(userId);
      if (apiUrl) setApiUrl(apiUrl);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchVets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/vets`);
      const data = await response.json();
      setVets(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load vets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedVet || !appointmentDate) {
      Alert.alert('Error', 'Please select vet and date');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/appointments/availability/${selectedVet._id}?date=${appointmentDate}&duration=30`,
      );
      const data = await response.json();
      
      // Convert slot strings to TimeSlot objects
      const slots = data.slots.map((time: string) => ({
        time,
        available: true,
      }));
      setAvailableSlots(slots);
    } catch (error) {
      Alert.alert('Error', 'Failed to load available slots');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setAppointmentDate(date);
    setSelectedTime('');
    setAvailableSlots([]);
  };

  const bookAppointment = async () => {
    if (!selectedVet || !appointmentDate || !selectedTime || !reason) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        vetId: selectedVet._id,
        appointmentDate,
        appointmentTime: selectedTime,
        reason,
        userNotes,
        dataSharing: shareData ? {
          enabled: true,
          diagnosisId: diagnosisData?._id,
          images: diagnosisData ? [diagnosisData.image] : [],
          analysisText: diagnosisData?.analysis,
        } : undefined,
      };

      const response = await fetch(`${apiUrl}/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to book appointment');
      }

      const appointment = await response.json();
      Alert.alert('Success', 'Appointment booked successfully');
      
      // Store appointment ID and navigate to chat
      await AsyncStorage.setItem('lastAppointmentId', appointment._id);
      navigation.navigate('AppointmentChat', { appointmentId: appointment._id });
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Select Vet
  if (step === 1) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Select a Veterinarian</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0066cc" />
        ) : (
          <FlatList
            data={vets}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.vetCard,
                  selectedVet?._id === item._id && styles.vetCardSelected,
                ]}
                onPress={() => {
                  setSelectedVet(item);
                  setStep(2);
                }}
              >
                <Text style={styles.vetName}>
                  Dr. {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.vetSpec}>
                  {item.specializations.join(', ')}
                </Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.rating}>⭐ {item.averageRating}/5</Text>
                  <Text style={styles.reviews}>({item.totalReviews} reviews)</Text>
                  <Text style={styles.responseTime}>
                    Response: {item.responseTime}min
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>
    );
  }

  // Step 2: Select Date & Time
  if (step === 2) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Select Date & Time</Text>
        <Text style={styles.subtitle}>
          Dr. {selectedVet?.firstName} {selectedVet?.lastName}
        </Text>

        <Text style={styles.label}>Select Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-05-15"
          value={appointmentDate}
          onChangeText={handleDateSelect}
        />

        {appointmentDate && (
          <TouchableOpacity
            style={styles.button}
            onPress={fetchAvailableSlots}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : 'Get Available Slots'}
            </Text>
          </TouchableOpacity>
        )}

        {availableSlots.length > 0 && (
          <>
            <Text style={styles.label}>Available Time Slots</Text>
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.timeSlot,
                    selectedTime === slot.time && styles.timeSlotSelected,
                  ]}
                  onPress={() => setSelectedTime(slot.time)}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTime === slot.time && styles.timeSlotTextSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Reason for Visit</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Describe the issue or concern"
          value={reason}
          onChangeText={setReason}
          multiline
        />

        <Text style={styles.label}>Additional Notes (Optional)</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Any additional information"
          value={userNotes}
          onChangeText={setUserNotes}
          multiline
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => setStep(3)}
          disabled={!selectedTime || !reason}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => setStep(1)}
        >
          <Text style={styles.buttonTextSecondary}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 3: Share Data
  if (step === 3) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Share Diagnostic Data (Optional)</Text>

        <View style={styles.shareCard}>
          <TouchableOpacity
            style={styles.shareToggle}
            onPress={() => setShareData(!shareData)}
          >
            <View style={styles.checkbox}>
              {shareData && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.shareLabel}>
              Share recent diagnostic results with vet
            </Text>
          </TouchableOpacity>

          {shareData && (
            <View style={styles.shareDetails}>
              <Text style={styles.label}>Select Diagnosis to Share</Text>
              {diagnosisData ? (
                <View style={styles.diagnosisCard}>
                  <Text style={styles.diagnosisText}>
                    {diagnosisData.analysis.substring(0, 100)}...
                  </Text>
                  <TouchableOpacity
                    onPress={() => setDiagnosisData(null)}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    // Would normally open diagnosis selection modal
                    Alert.alert('Info', 'Load from previous diagnoses');
                  }}
                >
                  <Text style={styles.buttonText}>Select from History</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setStep(4)}
        >
          <Text style={styles.buttonText}>Review & Confirm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => setStep(2)}
        >
          <Text style={styles.buttonTextSecondary}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 4: Confirm
  if (step === 4) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Confirm Appointment</Text>

        <View style={styles.confirmCard}>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Veterinarian:</Text>
            <Text style={styles.confirmValue}>
              Dr. {selectedVet?.firstName} {selectedVet?.lastName}
            </Text>
          </View>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Date:</Text>
            <Text style={styles.confirmValue}>{appointmentDate}</Text>
          </View>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Time:</Text>
            <Text style={styles.confirmValue}>{selectedTime}</Text>
          </View>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Reason:</Text>
            <Text style={styles.confirmValue}>{reason}</Text>
          </View>

          {userNotes && (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Notes:</Text>
              <Text style={styles.confirmValue}>{userNotes}</Text>
            </View>
          )}

          {shareData && (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Data Sharing:</Text>
              <Text style={styles.confirmValue}>Enabled</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={bookAppointment}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Booking...' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => setStep(3)}
        >
          <Text style={styles.buttonTextSecondary}>Edit</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: 'white',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonTextSecondary: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  vetCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  vetCardSelected: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f4ff',
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vetSpec: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  reviews: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  responseTime: {
    fontSize: 11,
    color: '#0066cc',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  timeSlot: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '30%',
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  timeSlotText: {
    fontSize: 12,
    color: '#333',
  },
  timeSlotTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  shareCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  shareToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#0066cc',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  shareDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  diagnosisCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  diagnosisText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  removeText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  confirmCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  confirmRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: '40%',
  },
  confirmValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default AppointmentBookingScreen;
