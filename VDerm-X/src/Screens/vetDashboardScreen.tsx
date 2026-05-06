import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserData, UserData, clearUserData } from '../utils/auth';
import { BASE_URL } from '../config';

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  userId?: { username?: string; email?: string };
  dataSharing?: {
    enabled?: boolean;
  };
  userNotes?: string;
  linkedChatId?: string;
}

const VetDashboardScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await clearUserData();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const loadDashboard = async () => {
    try {
      const data = await getUserData();
      if (!data || data.role !== 'vet') {
        navigation.replace('Home');
        return;
      }

      setUserData(data);
      await AsyncStorage.setItem('currentRole', 'vet');
      const latestAppointments = await fetchAppointments(data._id);
      await fetchUnreadCounts(data._id, latestAppointments);
    } catch (error) {
      console.error('Error loading vet dashboard:', error);
      Alert.alert('Error', 'Failed to load vet dashboard');
    } finally {
      setLoading(false);
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
      const nextAppointments = Array.isArray(data) ? data : [];
      setAppointments(nextAppointments);
      return nextAppointments;
    } catch (error) {
      console.error('Error fetching vet appointments:', error);
      setAppointments([]);
      return [];
    }
  };

  const fetchUnreadCounts = async (vetId: string, sourceAppointments: Appointment[] = []) => {
    try {
      const items = await Promise.all(
        sourceAppointments
          .filter((item) => item.linkedChatId)
          .map(async (appointment) => {
            const response = await fetch(`${BASE_URL}/appointments/chat/${appointment._id}/unread`, {
              headers: { 'x-user-id': vetId },
            });
            const data = await response.json();
            return Number(data?.unreadCount || 0);
          }),
      );
      setUnreadCount(items.reduce((sum, value) => sum + value, 0));
    } catch {
      setUnreadCount(0);
    }
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter((item) => item.status === 'pending').length,
    confirmed: appointments.filter((item) => item.status === 'confirmed').length,
    shared: appointments.filter((item) => item.dataSharing?.enabled).length,
    unread: unreadCount,
  };

  const quickAction = (label: string, icon: keyof typeof Ionicons.glyphMap, onPress: () => void) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#0066cc" />
      <Text style={styles.actionText}>{label}</Text>
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
    <View style={styles.screenContainer}>
      {/* Header with user profile and logout */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.profileButton} onPress={() => setShowUserMenu(true)}>
          <Text style={styles.profileInitial}>
            {userData?.username?.charAt(0).toUpperCase() || 'D'}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>VDerm-X</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#0066cc" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, Dr. {userData?.username || 'Vet'}</Text>
        <Text style={styles.subheading}>Manage consultations and shared diagnostics</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Appointments</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.confirmed}</Text><Text style={styles.statLabel}>Confirmed</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.unread}</Text><Text style={styles.statLabel}>Unread Chats</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {quickAction('Appointments', 'calendar-outline', () => navigation.navigate('VetAppointments'))}
        {quickAction('Inbox', 'chatbubble-ellipses-outline', () => navigation.navigate('VetChatInbox'))}
        {quickAction('Diagnostics', 'flask-outline', () => navigation.navigate('VetDiagnosticReview'))}
      </View>

      <Text style={styles.sectionTitle}>Recent Requests</Text>
      {appointments.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="event-busy" size={36} color="#999" />
          <Text style={styles.emptyText}>No appointments yet</Text>
        </View>
      ) : (
        appointments.slice(0, 3).map((appointment) => (
          <View key={appointment._id} style={styles.requestCard}>
            <View style={styles.requestTopRow}>
              <Text style={styles.requestDate}>{appointment.appointmentDate}</Text>
              <View style={[styles.statusBadge, appointment.status === 'pending' ? styles.pending : appointment.status === 'confirmed' ? styles.confirmed : styles.completed]}>
                <Text style={styles.statusText}>{appointment.status}</Text>
              </View>
            </View>
            <Text style={styles.patientLine}>Patient: {appointment.userId?.username || 'Unknown patient'}</Text>
            <Text style={styles.requestReason} numberOfLines={2}>{appointment.reason}</Text>
            <Text style={styles.requestMeta}>{appointment.appointmentTime} • {appointment.dataSharing?.enabled ? 'shared diagnosis' : 'no data shared'}{appointment.linkedChatId ? ' • chat linked' : ''}</Text>
          </View>
        ))
      )}
      </ScrollView>

      {/* User Profile Modal */}
      <Modal
        visible={showUserMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowUserMenu(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profile</Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalText}>Name: Dr. {userData?.username || 'Vet'}</Text>
            <Text style={styles.modalText}>Email: {userData?.email || 'N/A'}</Text>
            {userData?.specialization && (
              <Text style={styles.modalText}>Specialization: {userData.specialization}</Text>
            )}
            <View style={styles.modalDivider} />
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                setShowUserMenu(false);
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#E8F6F6' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 16,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffe0e0',
    borderRadius: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  container: { flex: 1, backgroundColor: '#E8F6F6' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#A3D7D5', borderRadius: 24, padding: 20, marginBottom: 18 },
  greeting: { color: '#0F172A', fontSize: 24, fontWeight: '700' },
  subheading: { color: '#355B58', marginTop: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#0066cc' },
  statLabel: { fontSize: 13, color: '#64748B', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 8, marginBottom: 12 },
  actionsRow: { gap: 12 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 10 },
  actionText: { marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#0F172A' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#64748B' },
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12 },
  requestTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  requestDate: { fontWeight: '700', color: '#0F172A' },
  patientLine: { color: '#259D8A', fontWeight: '600', marginBottom: 6 },
  requestReason: { color: '#334155', marginBottom: 8 },
  requestMeta: { color: '#64748B', fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pending: { backgroundColor: '#FFF7ED' },
  confirmed: { backgroundColor: '#ECFDF5' },
  completed: { backgroundColor: '#EFF6FF' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#334155', textTransform: 'uppercase' },
});

export default VetDashboardScreen;
