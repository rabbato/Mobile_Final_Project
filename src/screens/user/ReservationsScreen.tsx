import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Text, Card, Chip, Button, ActivityIndicator,
  Snackbar, Divider, Icon,
} from 'react-native-paper';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Reservation {
  id: string;
  spotId: string;
  spotName: string;
  userId: string;
  adminId: string;
  adminEmail?: string;
  userEmail?: string;
  startTime: any;
  endTime: any;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'completed';
  createdAt?: any;
}

const STATUS_BG: Record<string, string> = {
  pending: '#FFF8E1',
  confirmed: '#E8F5E9',
  active: '#E8F5E9',
  completed: '#E3F2FD',
  cancelled: '#FFEBEE',
  expired: '#F3E5F5',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#F57F17',
  confirmed: '#2E7D32',
  active: '#2E7D32',
  completed: '#1565C0',
  cancelled: '#C62828',
  expired: '#6A1B9A',
};

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'Unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const ReservationsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');

  // CRUD — Read: fetch user's reservations in real-time
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'reservations'),
      where('userId', '==', user.uid),
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Reservation))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });

      // 30-min late policy: expire confirmed reservations where start + 30 min has passed
      const now = Date.now();
      const expiryMs = 30 * 60 * 1000;
      const toExpire = data.filter(r => {
        if (r.status !== 'confirmed') return false;
        const startMs = r.startTime?.toMillis?.() ?? 0;
        return startMs > 0 && now > startMs + expiryMs;
      });
      await Promise.all(
        toExpire.map(r => updateDoc(doc(db, 'reservations', r.id), { status: 'expired' }))
      );

      setReservations(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  // CRUD — Update: cancel reservation
  const cancelReservation = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reservations', id), { status: 'cancelled' });
      setSnackbar('Reservation cancelled.');
    } catch (err: any) {
      setSnackbar(err.message);
    }
  };

  const openChat = (item: Reservation) => {
    const conversationId = `${item.spotId}_${item.userId}`;
    navigation.navigate('Messages', {
      screen: 'Chat',
      params: {
        conversationId,
        spotId: item.spotId,
        spotName: item.spotName,
        adminId: item.adminId,
        adminEmail: item.adminEmail ?? '',
        userId: item.userId,
        userEmail: item.userEmail ?? '',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reservations.length === 0 ? (
        <View style={styles.empty}>
          <Icon source="calendar-blank" size={64} color="#ccc" />
          <Text variant="bodyLarge" style={styles.emptyTitle}>No reservations yet</Text>
          <Text variant="bodySmall" style={styles.emptyHint}>
            Find a parking spot on the map and book a time slot
          </Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text variant="titleMedium" style={styles.spotName} numberOfLines={1}>
                    {item.spotName}
                  </Text>
                  <Chip
                    compact
                    style={{ backgroundColor: STATUS_BG[item.status] ?? '#f5f5f5' }}
                    textStyle={{ color: STATUS_COLOR[item.status] ?? '#333', fontWeight: '700' }}
                  >
                    {item.status}
                  </Chip>
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <View style={styles.infoRow}>
                  <Icon source="clock-start" size={16} color="#888" />
                  <Text variant="bodySmall" style={styles.infoText}>
                    {formatDate(item.startTime)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon source="clock-end" size={16} color="#888" />
                  <Text variant="bodySmall" style={styles.infoText}>
                    {formatDate(item.endTime)}
                  </Text>
                </View>
                <Text variant="titleSmall" style={styles.price}>
                  ${item.totalPrice?.toFixed(2)}
                </Text>

                <View style={styles.cardActions}>
                  {(item.status === 'pending' || item.status === 'confirmed') && (
                    <Button
                      mode="outlined"
                      onPress={() => cancelReservation(item.id)}
                      style={styles.cancelBtn}
                      textColor="#c62828"
                      icon="cancel"
                      compact
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    mode="text"
                    icon="chat-outline"
                    onPress={() => openChat(item)}
                    compact
                  >
                    Message Owner
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2500}>
        {snackbar}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 12, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spotName: { flex: 1, fontWeight: '700', marginRight: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  infoText: { marginLeft: 6, opacity: 0.7 },
  price: { color: '#2A6B9C', fontWeight: '700', marginTop: 8 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  cancelBtn: { borderColor: '#c62828', borderRadius: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { marginTop: 16, fontWeight: '600', opacity: 0.6 },
  emptyHint: { marginTop: 8, opacity: 0.4, textAlign: 'center' },
});
