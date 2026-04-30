import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Text, Card, Button, FAB, ActivityIndicator,
  Chip, Snackbar, Dialog, Portal, Icon, Divider,
} from 'react-native-paper';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface ParkingSpot {
  id: string;
  name: string;
  pricePerHour: number;
  available: boolean;
  address?: string;
  description?: string;
}

export const ManageSpotsScreen = ({ navigation }: any) => {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ParkingSpot | null>(null);
  const [snackbar, setSnackbar] = useState('');

  // CRUD — Read
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'parkingSpots'), (snap) => {
      setSpots(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ParkingSpot[]);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // CRUD — Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'parkingSpots', deleteTarget.id));
      setSnackbar(`"${deleteTarget.name}" deleted`);
    } catch (err: any) {
      setSnackbar(err.message);
    } finally {
      setDeleteTarget(null);
    }
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
      <FlatList
        data={spots}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text variant="headlineSmall" style={styles.header}>
            Parking Spots ({spots.length})
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon source="parking" size={64} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>No spots added yet</Text>
            <Text variant="bodySmall" style={{ opacity: 0.4 }}>Tap + to add your first spot</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.spotName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Chip
                  compact
                  style={{ backgroundColor: item.available ? '#e8f5e9' : '#ffebee' }}
                  textStyle={{ color: item.available ? '#2e7d32' : '#c62828', fontWeight: '700' }}
                >
                  {item.available ? 'Available' : 'Occupied'}
                </Chip>
              </View>
              {item.address ? (
                <View style={styles.row}>
                  <Icon source="map-marker" size={14} color="#aaa" />
                  <Text variant="bodySmall" style={styles.address}>{item.address}</Text>
                </View>
              ) : null}
              <Text variant="bodyMedium" style={styles.price}>${item.pricePerHour}/hr</Text>
              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  icon="pencil"
                  compact
                  onPress={() => navigation.navigate('AddEditSpot', { spot: item })}
                  style={styles.actionBtn}
                >
                  Edit
                </Button>
                <Button
                  mode="outlined"
                  icon="delete"
                  compact
                  textColor="#c62828"
                  style={[styles.actionBtn, { borderColor: '#c62828' }]}
                  onPress={() => setDeleteTarget(item)}
                >
                  Delete
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      />

      {/* CRUD — Create */}
      <FAB
        icon="plus"
        label="Add Spot"
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditSpot', {})}
      />

      <Portal>
        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>Delete Spot</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete{' '}
              <Text style={{ fontWeight: '700' }}>{deleteTarget?.name}</Text>?
              This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onPress={confirmDelete} textColor="#c62828">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2500}>
        {snackbar}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 90 },
  header: { fontWeight: '700', marginBottom: 12 },
  card: { marginBottom: 12, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  spotName: { flex: 1, fontWeight: '700', marginRight: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  address: { marginLeft: 4, opacity: 0.6 },
  price: { color: '#2A6B9C', fontWeight: '600', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#FF8C42' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, opacity: 0.5, fontWeight: '600' },
});
