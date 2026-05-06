import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserData, UserData } from '../utils/auth';
import { BASE_URL } from '../config';

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  rejectionReason?: string;
  linkedChatId?: string;
  userNotes?: string;
  userId?: { username?: string; email?: string };
  dataSharing?: {
    enabled?: boolean;
    analysisText?: string;
    images?: string[];
    notes?: string;
  };
  medicalRecords?: {
    notes?: string;
    prescription?: string;
    followUpDate?: string;
  };
}

const VetAppointmentsScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [medicalRecordOpenId, setMedicalRecordOpenId] = useState<string | null>(null);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [medicalPrescription, setMedicalPrescription] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [savingMedical, setSavingMedical] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await getUserData();
      if (!data || data.role !== 'vet') {
        navigation.replace('Home');
        return;
      }

      setUserData(data);
      await fetchAppointments(data._id);
    } catch (error) {
      console.error('Error loading vet appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAppointments = async (vetId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/appointments/vet/${vetId}`, {
        headers: {
          'x-user-id': vetId,
          'x-user-role': 'vet',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vet appointments:', error);
      Alert.alert('Error', 'Failed to connect to server');
      setAppointments([]);
    }
  };

  const refresh = () => {
    setRefreshing(true);
    if (userData?._id) {
      fetchAppointments(userData._id).finally(() => setRefreshing(false));
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, action: 'confirm' | 'reject') => {
    if (!userData?._id) return;

    try {
      const endpoint = action === 'confirm'
        ? `${BASE_URL}/appointments/${appointmentId}/confirm`
        : `${BASE_URL}/appointments/${appointmentId}/reject`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userData._id,
          'x-user-role': 'vet',
        },
        body: action === 'reject' ? JSON.stringify({ rejectionReason: rejectionReason.trim() }) : undefined,
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      setRejectionReason('');
      setRejectingId(null);
      await fetchAppointments(userData._id);
      Alert.alert('Success', `Appointment ${action}ed successfully`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', `Failed to ${action} appointment`);
    }
  };

  const openChat = (appointmentId: string) => {
    navigation.navigate('AppointmentChat', { appointmentId });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#10B981';
      case 'completed': return '#2563EB';
      case 'rejected': return '#EF4444';
      default: return '#64748B';
    }
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.date}>{item.appointmentDate}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '20' }]}>
          <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.time}>{item.appointmentTime}</Text>
      <Text style={styles.patient}>Patient: {item.userId?.username || 'Unknown patient'}</Text>
      <Text style={styles.reason} numberOfLines={3}>{item.reason}</Text>
      {item.userNotes ? <Text style={styles.notes}>Notes: {item.userNotes}</Text> : null}
      {item.dataSharing?.enabled ? <Text style={styles.shared}>Shared analysis available</Text> : null}
      {item.linkedChatId ? <Text style={styles.shared}>Chat linked</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => openChat(item._id)}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>

        {item.status === 'pending' && (
          <>
            <TouchableOpacity style={styles.confirmButton} onPress={() => updateAppointmentStatus(item._id, 'confirm')}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={() => setRejectingId(item._id)}>
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}

        {(item.status === 'confirmed' || item.status === 'completed') && (
          <TouchableOpacity style={styles.medicalButton} onPress={() => setMedicalRecordOpenId(item._id)}>
            <Text style={styles.medicalButtonText}>Medical Records</Text>
          </TouchableOpacity>
        )}
      </View>

      {rejectingId === item._id && (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectLabel}>Rejection reason</Text>
          <TextInput
            style={styles.rejectInput}
            placeholder="Add a short reason"
            value={rejectionReason}
            onChangeText={setRejectionReason}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.confirmButton} onPress={() => updateAppointmentStatus(item._id, 'reject')}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => { setRejectingId(null); setRejectionReason(''); }}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {medicalRecordOpenId === item._id && (
        <View style={styles.medicalBox}>
          <Text style={styles.rejectLabel}>Medical record entry</Text>
          <TextInput
            style={styles.multiInput}
            placeholder="Vet notes"
            value={medicalNotes}
            onChangeText={setMedicalNotes}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Prescription"
            value={medicalPrescription}
            onChangeText={setMedicalPrescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Follow-up date YYYY-MM-DD"
            value={followUpDate}
            onChangeText={setFollowUpDate}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.confirmButton} disabled={savingMedical} onPress={() => saveMedicalRecord(item._id)}>
              <Text style={styles.buttonText}>{savingMedical ? 'Saving...' : 'Save Record'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => { setMedicalRecordOpenId(null); setMedicalNotes(''); setMedicalPrescription(''); setFollowUpDate(''); }}>
              <Text style={styles.secondaryText}>Close</Text>
            </TouchableOpacity>
          </View>
          {item.medicalRecords?.notes ? (
            <View style={styles.recordPreview}>
              <Text style={styles.recordLabel}>Saved record</Text>
              <Text style={styles.recordText}>{item.medicalRecords.notes}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );

  const saveMedicalRecord = async (appointmentId: string) => {
    if (!userData?._id) return;
    if (!medicalNotes.trim()) {
      Alert.alert('Missing data', 'Please add vet notes before saving');
      return;
    }

    try {
      setSavingMedical(true);
      const response = await fetch(`${BASE_URL}/appointments/${appointmentId}/medical-records`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userData._id,
          'x-user-role': 'vet',
        },
        body: JSON.stringify({
          notes: medicalNotes.trim(),
          prescription: medicalPrescription.trim() || undefined,
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save medical record');
      }

      setMedicalRecordOpenId(null);
      setMedicalNotes('');
      setMedicalPrescription('');
      setFollowUpDate('');
      await fetchAppointments(userData._id);
      Alert.alert('Success', 'Medical record saved');
    } catch (error) {
      console.error('Error saving medical record:', error);
      Alert.alert('Error', 'Failed to save medical record');
    } finally {
      setSavingMedical(false);
    }
  };

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
        <Text style={styles.title}>Appointment Management</Text>
        <Text style={styles.subtitle}>Approve, reject, and review patient visits</Text>
      </View>

      {appointments.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No vet appointments found</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#A3D7D5', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: '#0F172A', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#355B58', marginTop: 6 },
  list: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  time: { color: '#475569', marginTop: 4, marginBottom: 8 },
  reason: { color: '#334155', lineHeight: 20 },
  notes: { color: '#64748B', marginTop: 8, fontSize: 12 },
  shared: { color: '#259D8A', marginTop: 8, fontSize: 12, fontWeight: '600' },
  patient: { color: '#259D8A', marginBottom: 8, fontWeight: '700' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0066cc', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, gap: 8 },
  confirmButton: { backgroundColor: '#259D8A', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  rejectButton: { backgroundColor: '#ef4444', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  secondaryButton: { backgroundColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  medicalButton: { backgroundColor: '#0066cc', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondaryText: { color: '#0F172A', fontWeight: '700' },
  rejectBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  rejectLabel: { fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  rejectInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, marginBottom: 12 },
  medicalBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  multiInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, marginBottom: 12, minHeight: 90, textAlignVertical: 'top' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, marginBottom: 12 },
  medicalButtonText: { color: '#fff', fontWeight: '700' },
  recordPreview: { marginTop: 12, backgroundColor: '#F0FDF4', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  recordLabel: { fontWeight: '700', color: '#166534', marginBottom: 6 },
  recordText: { color: '#166534' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 10, color: '#64748B', fontSize: 16 },
});

export default VetAppointmentsScreen;
