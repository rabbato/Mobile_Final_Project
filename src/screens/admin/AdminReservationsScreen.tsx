import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Text, Card, Chip, Button, ActivityIndicator, Snackbar, Divider, Icon,
} from 'react-native-paper';
import {
  collection, query, where, onSnapshot, doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Reservation {
  id: string;
  spotId: string;
  spotName: string;
  userId: string;
  userEmail: string;
  adminId: string;
  startTime: any;
  endTime: any;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'completed';
  createdAt?: any;
}

const STATUS_BG: Record<string, string> = {
  pending: '#FFF8E1',
  confirmed: '#E8F5E9',
  cancelled: '#FFEBEE',
  expired: '#F3E5F5',
  completed: '#E3F2FD',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#F57F17',
  confirmed: '#2E7D32',
  cancelled: '#C62828',
  expired: '#6A1B9A',
  completed: '#1565C0',
};

const fmt = (ts: any) => {
  if (!ts) return 'Unknown';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

type FilterType = 'pending' | 'confirmed' | 'all';

export const AdminReservationsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');
  const [filter, setFilter] = useState<FilterType>('pending');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'reservations'),
      where('adminId', '==', user.uid),
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Reservation))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setReservations(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const accept = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reservations', id), { status: 'confirmed' });
      setSnackbar('Reservation confirmed!');
    } catch (err: any) {
      setSnackbar(err.message);
    }
  };

  const decline = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reservations', id), { status: 'cancelled' });
      setSnackbar('Reservation declined.');
    } catch (err: any) {
      setSnackbar(err.message);
    }
  };

  const openChat = (item: Reservation) => {
    navigation.navigate('Messages', {
      screen: 'Chat',
      params: {
        conversationId: `${item.spotId}_${item.userId}`,
        spotId: item.spotId,
        spotName: item.spotName,
        adminId: item.adminId,
        adminEmail: user?.email ?? '',
        userId: item.userId,
        userEmail: item.userEmail,
      },
    });
  };

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter(r => r.status === filter);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['pending', 'confirmed', 'all'] as FilterType[]).map(f => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            textStyle={filter === f ? styles.filterChipTextActive : undefined}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </Chip>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Icon source="calendar-blank-outline" size={64} color="#ccc" />
          <Text variant="bodyLarge" style={styles.emptyTitle}>
            {filter === 'pending' ? 'No pending requests' : 'No reservations'}
          </Text>
          <Text variant="bodySmall" style={styles.emptyHint}>
            New bookings from users will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHead}>
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

                <View style={styles.userRow}>
                  <Icon source="account-circle-outline" size={14} color="#888" />
                  <Text variant="bodySmall" style={styles.infoText}>{item.userEmail}</Text>
                </View>

                <Divider style={{ marginVertical: 8 }} />

                <View style={styles.infoRow}>
                  <Icon source="clock-start" size={14} color="#888" />
                  <Text variant="bodySmall" style={styles.infoText}>{fmt(item.startTime)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon source="clock-end" size={14} color="#888" />
                  <Text variant="bodySmall" style={styles.infoText}>{fmt(item.endTime)}</Text>
                </View>
                <Text variant="titleSmall" style={styles.price}>
                  ${item.totalPrice?.toFixed(2)}
                </Text>

                <View style={styles.actions}>
                  {item.status === 'pending' && (
                    <>
                      <Button
                        mode="contained"
                        icon="check-circle"
                        onPress={() => accept(item.id)}
                        style={styles.acceptBtn}
                        compact
                      >
                        Accept
                      </Button>
                      <Button
                        mode="outlined"
                        icon="close-circle-outline"
                        onPress={() => decline(item.id)}
                        style={styles.declineBtn}
                        textColor="#C62828"
                        compact
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  <Button
                    mode="text"
                    icon="chat-outline"
                    onPress={() => openChat(item)}
                    compact
                  >
                    Message
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
  filterRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  filterChip: {},
  filterChipActive: { backgroundColor: '#2A6B9C' },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  card: { marginBottom: 12, borderRadius: 12 },
  cardHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  spotName: { flex: 1, fontWeight: '700', marginRight: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  infoText: { marginLeft: 6, opacity: 0.7 },
  price: { color: '#2A6B9C', fontWeight: '700', marginTop: 8 },
  actions: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 6, marginTop: 10, alignItems: 'center',
  },
  acceptBtn: { backgroundColor: '#2E7D32', borderRadius: 6 },
  declineBtn: { borderColor: '#C62828', borderRadius: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { marginTop: 16, fontWeight: '600', opacity: 0.6 },
  emptyHint: { marginTop: 8, opacity: 0.4, textAlign: 'center' },
});
