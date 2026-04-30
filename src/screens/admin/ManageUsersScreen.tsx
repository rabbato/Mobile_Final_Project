import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Avatar, Icon, Divider } from 'react-native-paper';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface UserData {
  id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: any;
  displayName?: string;
  phone?: string;
}

export const ManageUsersScreen = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // CRUD — Read: fetch all users in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as UserData))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
      setUsers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const userCount = users.filter(u => u.role === 'user').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text variant="headlineSmall" style={styles.header}>
              Users ({users.length})
            </Text>
            <View style={styles.summaryRow}>
              <Chip icon="account" compact style={styles.summaryChip}>
                {userCount} seekers
              </Chip>
              <Chip icon="shield-account" compact style={[styles.summaryChip, { backgroundColor: '#fff3e0' }]}>
                {adminCount} admins
              </Chip>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon source="account-group" size={64} color="#ccc" />
            <Text variant="bodyLarge" style={{ marginTop: 12, opacity: 0.5 }}>No users yet</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const initial = (item.displayName || item.email || 'U').charAt(0).toUpperCase();
          const isAdmin = item.role === 'admin';
          const joinDate = item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
              })
            : 'Unknown date';

          return (
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Avatar.Text
                  size={44}
                  label={initial}
                  style={{ backgroundColor: isAdmin ? '#FF8C42' : '#2A6B9C' }}
                />
                <View style={styles.info}>
                  <Text variant="bodyMedium" style={styles.emailText} numberOfLines={1}>
                    {item.email}
                  </Text>
                  {item.displayName ? (
                    <Text variant="bodySmall" style={styles.nameText}>{item.displayName}</Text>
                  ) : null}
                  {item.phone ? (
                    <View style={styles.row}>
                      <Icon source="phone" size={12} color="#aaa" />
                      <Text variant="bodySmall" style={styles.phoneText}>{item.phone}</Text>
                    </View>
                  ) : null}
                  <Text variant="bodySmall" style={styles.joinDate}>Joined {joinDate}</Text>
                </View>
                <Chip
                  compact
                  style={{ backgroundColor: isAdmin ? '#fff3e0' : '#e8eaf6' }}
                  textStyle={{ color: isAdmin ? '#e65100' : '#283593', fontWeight: '700' }}
                >
                  {item.role}
                </Chip>
              </Card.Content>
            </Card>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  headerSection: { marginBottom: 16 },
  header: { fontWeight: '700', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryChip: { backgroundColor: '#e8eaf6' },
  card: { borderRadius: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  emailText: { fontWeight: '600' },
  nameText: { opacity: 0.65, marginTop: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  phoneText: { marginLeft: 3, opacity: 0.55 },
  joinDate: { opacity: 0.4, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
