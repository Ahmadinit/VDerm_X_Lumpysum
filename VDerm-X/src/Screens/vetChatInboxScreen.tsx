import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserData, UserData } from '../utils/auth';
import { BASE_URL } from '../config';

interface AppointmentChatSummary {
  _id: string;
  appointmentId: string;
  lastMessage?: string;
  updatedAt: string;
  unreadCount?: number;
  appointment?: {
    appointmentDate?: string;
    appointmentTime?: string;
    reason?: string;
    userId?: { username?: string };
  };
}

const VetChatInboxScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [items, setItems] = useState<AppointmentChatSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    try {
      const data = await getUserData();
      if (!data || data.role !== 'vet') {
        navigation.replace('Home');
        return;
      }

      setUserData(data);
      await fetchInbox(data._id);
    } catch (error) {
      console.error('Error loading vet inbox:', error);
      Alert.alert('Error', 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  };

  const fetchInbox = async (vetId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/appointments/vet/${vetId}`, {
        headers: {
          'x-user-id': vetId,
          'x-user-role': 'vet',
        },
      });

      const data = await response.json();
      const chats = Array.isArray(data)
        ? data.filter((appointment: any) => appointment.linkedChatId).map((appointment: any) => ({
            _id: appointment.linkedChatId,
            appointmentId: appointment._id,
            updatedAt: appointment.updatedAt || appointment.createdAt || new Date().toISOString(),
            unreadCount: appointment.unreadCount || 0,
            appointment: {
              appointmentDate: appointment.appointmentDate,
              appointmentTime: appointment.appointmentTime,
              reason: appointment.reason,
              userId: appointment.userId,
            },
          }))
        : [];
      setItems(chats);
    } catch (error) {
      console.error('Error fetching inbox:', error);
      setItems([]);
    }
  };

  const openChat = (appointmentId: string) => {
    navigation.navigate('AppointmentChat', { appointmentId });
  };

  const renderItem = ({ item }: { item: AppointmentChatSummary }) => (
    <TouchableOpacity style={styles.card} onPress={() => openChat(item.appointmentId)}>
      <View style={styles.row}>
        <View style={styles.avatar}><Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" /></View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {item.appointment?.userId?.username || 'Patient conversation'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.appointment?.appointmentDate || 'Appointment'} • {item.appointment?.appointmentTime || '--:--'}
          </Text>
          <Text style={styles.preview} numberOfLines={2}>{item.appointment?.reason || 'Open consultation chat'}</Text>
        </View>
        {item.unreadCount ? (
          <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unreadCount}</Text></View>
        ) : null}
      </View>
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
        <Text style={styles.headerTitle}>Consultation Inbox</Text>
        <Text style={styles.headerSub}>Appointment-linked patient chats</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No active appointment chats</Text>
        </View>
      ) : (
        <FlatList data={items} keyExtractor={(item) => item.appointmentId} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#A3D7D5', paddingTop: 44, paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#0F172A', fontSize: 24, fontWeight: '800' },
  headerSub: { color: '#355B58', marginTop: 6 },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#259D8A', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  preview: { fontSize: 13, color: '#334155', marginTop: 8, lineHeight: 18 },
  unreadBadge: { backgroundColor: '#EF4444', minWidth: 24, paddingHorizontal: 7, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyText: { marginTop: 10, color: '#64748B', fontSize: 16 },
});

export default VetChatInboxScreen;
