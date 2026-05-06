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
import { getUserData } from '../utils/auth';
import { BASE_URL } from '../config';
import { Platform } from 'react-native';

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

const AppointmentBookingScreen = ({ navigation, route }: any) => {
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
  const [apiUrl, setApiUrl] = useState(BASE_URL);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<(number | null)[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    loadUserData();
    // Check if a vet was passed in route params
    if (route?.params?.selectedVet) {
      setSelectedVet(route.params.selectedVet);
      setStep(2); // Skip to date/time selection
    } else if (step === 1) {
      fetchVets();
    }
  }, [route?.params?.selectedVet]);

  // Generate calendar days for the current month
  useEffect(() => {
    generateCalendarDays();
  }, [calendarMonth]);

  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create array with null for empty slots and day numbers
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    setCalendarDays(days);
  };

  const previousMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));
  };

  const getApiUrl = () => apiUrl || BASE_URL;

  const getApiBaseCandidates = () => {
    const candidates = [
      getApiUrl(),
      BASE_URL,
      Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000',
    ];

    return Array.from(new Set(candidates.filter(Boolean)));
  };

  const fetchWithTimeout = async (url: string, init?: RequestInit, timeoutMs: number = 8000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const fetchFromApi = async (path: string, init?: RequestInit) => {
    let lastError: unknown = null;

    for (const baseUrl of getApiBaseCandidates()) {
      try {
        return await fetchWithTimeout(`${baseUrl}${path}`, init);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Failed to reach API');
  };

  const fetchOccupiedSlots = async (date: string) => {
    if (!selectedVet) {
      Alert.alert('Error', 'Please select a vet first.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetchFromApi(`/appointments/availability/${selectedVet._id}?date=${date}&duration=30`);
      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }

      const data = await response.json();
      const availableTimes = new Set<string>(data.slots || []);
      const defaultSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
        '15:30', '16:00', '16:30', '17:00'
      ];

      setAvailableSlots(
        defaultSlots.map((time) => ({
          time,
          available: availableTimes.has(time),
        })),
      );
    } catch (error) {
      console.error('Error fetching occupied slots:', error);
      Alert.alert('Error', 'Failed to load occupied slots.');
    } finally {
      setLoading(false);
    }
  };

  const selectDate = (day: number) => {
    const selectedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dateString = selectedDate.toISOString().split('T')[0];
    setAppointmentDate(dateString);
    setSelectedTime('');
    showStandardTimeSlots();
    setShowDatePicker(false);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      calendarMonth.getMonth() === today.getMonth() &&
      calendarMonth.getFullYear() === today.getFullYear()
    );
  };

  const isBeforeToday = (day: number) => {
    const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const loadUserData = async () => {
    try {
      const currentUser = await getUserData();
      if (!currentUser || !currentUser._id) {
        console.log('No user logged in, redirecting to login');
        navigation.replace('Login');
        setDataLoaded(true);
        return;
      }

      if (currentUser.role === 'vet') {
        navigation.replace('VetDashboard');
        setDataLoaded(true);
        return;
      }

      setUserId(currentUser._id);
      console.log('Loaded userId:', currentUser._id);

      const storedApiUrl = await AsyncStorage.getItem('apiUrl');
      if (storedApiUrl) setApiUrl(storedApiUrl);
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading user data:', error);
      navigation.replace('Login');
      setDataLoaded(true);
    }
  };

  const fetchVets = async () => {
    try {
      setLoading(true);
      const response = await fetchFromApi('/vets');
      const data = await response.json();
      setVets(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load vets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Show standard time slots
  const showStandardTimeSlots = () => {
    const defaultSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
      '15:30', '16:00', '16:30', '17:00'
    ];
    const slots = defaultSlots.map((time) => ({
      time,
      available: true,
    }));
    setAvailableSlots(slots);
  };

  const bookAppointment = async () => {
    if (!userId) {
      Alert.alert('Error', 'User data not loaded. Please go back and try again.');
      return;
    }
    
    if (!selectedVet || !appointmentDate || !selectedTime || !reason) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        vetId: selectedVet._id,
        userId: userId,
        appointmentDate,
        appointmentTime: selectedTime,
        reason,
        userNotes,
        dataSharing: shareData ? {
          enabled: true,
          diagnosisId: diagnosisData?._id,
        } : { enabled: false },
      };
      const response = await fetchFromApi('/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to book appointment');
      }

      const appointment = await response.json();
      Alert.alert('Success', 'Appointment booked successfully');
      
      // Store appointment ID and navigate to chat
      await AsyncStorage.setItem('lastAppointmentId', appointment._id);
      navigation.navigate('AppointmentChat', { appointmentId: appointment._id });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to book appointment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getVetDisplayName = () => {
    if (!selectedVet) {
      return 'Veterinarian';
    }

    const fullName = `${selectedVet.firstName || ''} ${selectedVet.lastName || ''}`.trim();
    return fullName ? `Dr. ${fullName}` : 'Veterinarian';
  };

  // Step 1: Select Vet
  if (step === 1) {
    if (!dataLoaded) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      );
    }

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
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Select Date & Time</Text>
        <Text style={styles.subtitle}>
          {getVetDisplayName()}
        </Text>

        <Text style={styles.label}>Select Date</Text>
        
        {/* Date Picker Button */}
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <Text style={styles.datePickerButtonText}>
            {appointmentDate || 'Tap to select date'}
          </Text>
          <Text style={styles.datePickerIcon}>📅</Text>
        </TouchableOpacity>

        {/* Calendar */}
        {showDatePicker && (
          <View style={styles.calendarContainer}>
            <>
              {/* Month Navigation */}
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={previousMonth}>
                  <Text style={styles.monthArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={nextMonth}>
                  <Text style={styles.monthArrow}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Day headers */}
              <View style={styles.dayHeaderRow}>
                {dayNames.map((day) => (
                  <Text key={day} style={styles.dayHeader}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, index) => {
                  const isDisabled = day === null || isBeforeToday(day || 0);
                  const isSelected = day && appointmentDate === `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isTodayDate = day && isToday(day);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDay,
                        ...(isDisabled ? [styles.calendarDayDisabled] : []),
                        ...(isSelected ? [styles.calendarDaySelected] : []),
                        ...(isTodayDate ? [styles.calendarDayToday] : []),
                      ]}
                      onPress={() => day && !isDisabled && selectDate(day)}
                      disabled={isDisabled}
                    >
                      {day && <Text style={[
                        styles.calendarDayText,
                        ...(isDisabled ? [styles.calendarDayTextDisabled] : []),
                        ...(isSelected ? [styles.calendarDayTextSelected] : []),
                      ]}>{day}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </>
          </View>
        )}
        {/* Standard slots helper */}
        {appointmentDate && availableSlots.length === 0 && !loading && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#ff9800', marginTop: 10 }]}
            onPress={showStandardTimeSlots}
          >
            <Text style={styles.buttonText}>📅 Use Standard Time Slots</Text>
          </TouchableOpacity>
        )}

        {/* Display selected date */}
        {appointmentDate && (
          <Text style={styles.selectedDateText}>
            Selected: {appointmentDate}
          </Text>
        )}

        {availableSlots && availableSlots.length > 0 && (
          <>
            <Text style={styles.label}>Available Time Slots</Text>
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.timeSlot,
                    selectedTime === slot.time && styles.timeSlotSelected,
                    !slot.available && styles.timeSlotDisabled,
                  ]}
                  onPress={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTime === slot.time && styles.timeSlotTextSelected,
                      !slot.available && styles.timeSlotTextDisabled,
                    ]}
                  >
                    {slot.time}{!slot.available ? ' (Booked)' : ''}
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
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 3: Share Data
  if (step === 3) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Image Analysis Sharing</Text>
        <Text style={styles.subtitle}>Allow vet to access your diagnostic results</Text>

        <View style={styles.shareCard}>
          <Text style={styles.label}>🔐 Share Diagnostic Data with Veterinarian</Text>
          
          <TouchableOpacity
            style={styles.shareToggle}
            onPress={() => setShareData(!shareData)}
          >
            <View style={styles.checkbox}>
              {shareData && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shareLabel}>
                {shareData ? '✅ Sharing Enabled' : '❌ Sharing Disabled'}
              </Text>
              <Text style={styles.shareInfoText}>
                {shareData 
                  ? 'Your diagnostic images and analysis will be visible to the vet during appointment'
                  : 'Your diagnostic data will NOT be shared with the vet'}
              </Text>
            </View>
          </TouchableOpacity>

          {shareData && (
            <View style={styles.shareDetails}>
              <Text style={styles.label}>📸 Diagnostic Data to Share</Text>
              <Text style={styles.shareInfoText}>
                Select which diagnostic analysis you want to share with {getVetDisplayName()}
              </Text>
              
              {diagnosisData ? (
                <View style={styles.diagnosisCard}>
                  <Text style={styles.diagnosisText}>
                    📋 {diagnosisData.analysis.substring(0, 80)}...
                  </Text>
                  <Text style={styles.shareInfoText}>
                    Diagnosis ID: {diagnosisData._id}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setDiagnosisData(null)}
                    style={{ marginTop: 10 }}
                  >
                    <Text style={styles.removeText}>Remove Selection</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    // Load diagnosis from previous diagnoses
                    Alert.alert(
                      'Load Diagnosis',
                      'This would load your previous diagnostic results. (Feature coming soon)',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Text style={styles.buttonText}>Select from History</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!shareData && (
            <View style={{ 
              marginTop: 15, 
              paddingTop: 15, 
              borderTopWidth: 1, 
              borderTopColor: '#eee' 
            }}>
              <Text style={styles.shareInfoText}>
                💡 Sharing your diagnostic analysis helps the vet provide better consultation during the appointment.
              </Text>
            </View>
          )}
        </View>

        <View style={{ 
          backgroundColor: '#f0f4ff', 
          padding: 12, 
          borderRadius: 8, 
          borderLeftWidth: 4, 
          borderLeftColor: '#0066cc',
          marginBottom: 20
        }}>
          <Text style={{ fontSize: 12, color: '#0066cc', fontWeight: '600', marginBottom: 5 }}>
            ℹ️ Data Privacy
          </Text>
          <Text style={{ fontSize: 11, color: '#666', lineHeight: 16 }}>
            Your data sharing preferences are secure and encrypted. You can always revoke access after the appointment.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setStep(4)}
        >
          <Text style={styles.buttonText}>Continue</Text>
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
            <Text style={styles.confirmValue}>{getVetDisplayName()}</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
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

  /* Date picker / calendar */
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  datePickerIcon: {
    fontSize: 20,
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  calendarCloseButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 15,
  },
  calendarCloseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedDateText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: '#f0f4ff',
    padding: 10,
    borderRadius: 6,
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

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  monthArrow: {
    fontSize: 24,
    color: '#0066cc',
    paddingHorizontal: 10,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    color: '#666',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  calendarDayDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#f0f0f0',
  },
  calendarDaySelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#0066cc',
  },
  calendarDayText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  calendarDayTextDisabled: {
    color: '#ccc',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: '700',
  },

  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
    marginBottom: 8,
  },
  timeSlotSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  timeSlotDisabled: {
    backgroundColor: '#f2f2f2',
    borderColor: '#e0e0e0',
    opacity: 0.65,
  },
  timeSlotText: {
    fontSize: 12,
    color: '#333',
  },
  timeSlotTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  timeSlotTextDisabled: {
    color: '#999',
  },

  shareCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
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
    fontWeight: '500',
  },
  shareDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  shareInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18,
  },
  diagnosisCard: {
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  diagnosisText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
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
    borderWidth: 1,
    borderColor: '#ddd',
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
