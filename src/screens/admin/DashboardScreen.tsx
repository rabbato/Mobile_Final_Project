import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ActivityIndicator, Icon, Divider } from 'react-native-paper';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface Stats {
  totalSpots: number;
  availableSpots: number;
  totalReservations: number;
  activeReservations: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <Card.Content style={styles.statContent}>
      <Icon source={icon} size={32} color={color} />
      <Text variant="displaySmall" style={[styles.statValue, { color }]}>{value}</Text>
      <Text variant="bodySmall" style={styles.statLabel}>{title}</Text>
    </Card.Content>
  </Card>
);

export const DashboardScreen = () => {
  const [stats, setStats] = useState<Stats>({
    totalSpots: 0,
    availableSpots: 0,
    totalReservations: 0,
    activeReservations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use two separate booleans to avoid race condition
    let spotsData = { total: 0, available: 0 };
    let resData = { total: 0, active: 0 };
    let spotsReady = false;
    let resReady = false;

    const tryFlush = () => {
      if (spotsReady && resReady) {
        setStats({
          totalSpots: spotsData.total,
          availableSpots: spotsData.available,
          totalReservations: resData.total,
          activeReservations: resData.active,
        });
        setLoading(false);
      }
    };

    const unsubSpots = onSnapshot(collection(db, 'parkingSpots'), (snap) => {
      spotsData = {
        total: snap.size,
        available: snap.docs.filter(d => d.data().available).length,
      };
      spotsReady = true;
      tryFlush();
    });

    const unsubRes = onSnapshot(collection(db, 'reservations'), (snap) => {
      resData = {
        total: snap.size,
        active: snap.docs.filter(d => d.data().status === 'active').length,
      };
      resReady = true;
      tryFlush();
    });

    return () => { unsubSpots(); unsubRes(); };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const occupancyRate = stats.totalSpots > 0
    ? Math.round(((stats.totalSpots - stats.availableSpots) / stats.totalSpots) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcome}>
        <Icon source="shield-account" size={28} color="#FF8C42" />
        <Text variant="headlineSmall" style={styles.welcomeText}>Admin Dashboard</Text>
      </View>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Real-time overview of your parking network
      </Text>

      <Divider style={{ marginVertical: 16 }} />

      <Text variant="titleMedium" style={styles.sectionTitle}>Parking Spots</Text>
      <View style={styles.grid}>
        <StatCard title="Total Spots" value={stats.totalSpots} icon="parking" color="#2A6B9C" />
        <StatCard title="Available" value={stats.availableSpots} icon="check-circle" color="#2e7d32" />
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Reservations</Text>
      <View style={styles.grid}>
        <StatCard title="All Time" value={stats.totalReservations} icon="calendar-check" color="#6a1b9a" />
        <StatCard title="Active Now" value={stats.activeReservations} icon="clock-fast" color="#FF8C42" />
      </View>

      <Card style={styles.occupancyCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.occupancyTitle}>Occupancy Rate</Text>
          <Text variant="displaySmall" style={styles.occupancyValue}>{occupancyRate}%</Text>
          <Text variant="bodySmall" style={{ opacity: 0.6 }}>
            {stats.totalSpots - stats.availableSpots} of {stats.totalSpots} spots occupied
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcome: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  welcomeText: { fontWeight: '700', color: '#1a1a1a' },
  subtitle: { opacity: 0.55, marginTop: 4 },
  sectionTitle: { fontWeight: '700', marginBottom: 10, color: '#444' },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12 },
  statContent: { alignItems: 'center', paddingVertical: 8 },
  statValue: { fontWeight: '800', marginTop: 4 },
  statLabel: { opacity: 0.6, textAlign: 'center', marginTop: 2 },
  occupancyCard: { borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF8C42' },
  occupancyTitle: { fontWeight: '700', marginBottom: 4 },
  occupancyValue: { color: '#FF8C42', fontWeight: '800' },
});
