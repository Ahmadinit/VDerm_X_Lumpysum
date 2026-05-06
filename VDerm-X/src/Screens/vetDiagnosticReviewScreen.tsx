import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserData, UserData } from '../utils/auth';
import { BASE_URL } from '../config';

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: string;
  dataSharing?: {
    enabled?: boolean;
    analysisText?: string;
    images?: string[];
  };
}

const VetDiagnosticReviewScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      const data = await getUserData();
      if (!data || data.role !== 'vet') {
        navigation.replace('Home');
        return;
      }

      setUserData(data);
      const response = await fetch(`${BASE_URL}/appointments/vet/${data._id}`, {
        headers: {
          'x-user-id': data._id,
          'x-user-role': 'vet',
        },
      });
      const items = await response.json();
      setAppointments(Array.isArray(items) ? items.filter((item: Appointment) => item.dataSharing?.enabled) : []);
    } catch (error) {
      console.error('Error loading diagnostics:', error);
      Alert.alert('Error', 'Failed to load diagnostic reviews');
    } finally {
      setLoading(false);
    }
  };

  const openDiagnostic = async (appointment: Appointment) => {
    if (!userData?._id) return;
    setSelectedAppointment(appointment);
    setDetailLoading(true);
    setDiagnosticData(null);
    try {
      const response = await fetch(`${BASE_URL}/appointments/chat/${appointment._id}/diagnostic`, {
        headers: {
          'x-user-id': userData._id,
        },
      });
      const data = await response.json();
      setDiagnosticData(data);
    } catch (error) {
      console.error('Error fetching diagnostic data:', error);
      Alert.alert('Error', 'Could not load shared diagnostic data');
    } finally {
      setDetailLoading(false);
    }
  };

  const openChat = (appointmentId: string) => {
    navigation.navigate('AppointmentChat', { appointmentId });
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDiagnostic(item)}>
      <View style={styles.rowBetween}>
        <Text style={styles.date}>{item.appointmentDate}</Text>
        <Ionicons name="flask-outline" size={18} color="#0066cc" />
      </View>
      <Text style={styles.time}>{item.appointmentTime}</Text>
      <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
      <Text style={styles.meta}>Shared diagnostic data is available</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diagnostic Review</Text>
        <Text style={styles.subtitle}>Shared analysis and image review</Text>
      </View>

      {appointments.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No shared diagnostic cases yet</Text>
        </View>
      ) : (
        <FlatList data={appointments} keyExtractor={(item) => item._id} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}

      {selectedAppointment && (
        <ScrollView style={styles.detailPanel} contentContainerStyle={styles.detailContent}>
          <Text style={styles.detailTitle}>Selected Case</Text>
          <Text style={styles.detailMeta}>{selectedAppointment.appointmentDate} • {selectedAppointment.appointmentTime}</Text>
          <Text style={styles.detailReason}>{selectedAppointment.reason}</Text>

          {detailLoading ? (
            <ActivityIndicator size="small" color="#0066cc" />
          ) : (
            <>
              <Text style={styles.detailSection}>Shared data</Text>
              <View style={styles.detailBox}>
                <Text style={styles.detailText}>
                  {diagnosticData?.analysisText || selectedAppointment.dataSharing?.analysisText || 'No analysis text returned by the server.'}
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => openChat(selectedAppointment._id)}>
                <Text style={styles.primaryButtonText}>Open Appointment Chat</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#A3D7D5', paddingTop: 44, paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: '#0F172A', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#355B58', marginTop: 6 },
  list: { padding: 20, paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  time: { color: '#475569', marginTop: 4, marginBottom: 8 },
  reason: { color: '#334155' },
  meta: { marginTop: 10, fontSize: 12, color: '#0066cc', fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyText: { marginTop: 10, color: '#64748B', fontSize: 16, textAlign: 'center' },
  detailPanel: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '48%' },
  detailContent: { padding: 20, paddingBottom: 34 },
  detailTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  detailMeta: { color: '#64748B', marginTop: 6 },
  detailReason: { color: '#334155', marginTop: 12, marginBottom: 14, lineHeight: 20 },
  detailSection: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  detailBox: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  detailText: { color: '#334155', lineHeight: 20 },
  primaryButton: { marginTop: 16, backgroundColor: '#0066cc', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
});

export default VetDiagnosticReviewScreen;
