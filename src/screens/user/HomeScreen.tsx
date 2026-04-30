import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Text, FAB, Snackbar, IconButton, Surface } from 'react-native-paper';
import { collection, onSnapshot } from 'firebase/firestore';
import { DrawerActions } from '@react-navigation/native';
import * as Location from 'expo-location';
import { db } from '../../services/firebase';

interface ParkingSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  pricePerHour: number;
  available: boolean;
  address?: string;
}

const DEFAULT_REGION = {
  latitude: 33.8938,
  longitude: 35.5018,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const HomeScreen = ({ navigation }: any) => {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'parkingSpots'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ParkingSpot[];
      setSpots(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Native Feature #1 — Geolocation via expo-location
  const locateUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setSnackbar('Location permission denied');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      });
      setSnackbar('Showing your current location');
    } catch {
      setSnackbar('Could not get location');
    }
  };

  useEffect(() => {
    locateUser();
  }, []);

  const availableCount = spots.filter(s => s.available).length;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {spots.map(spot => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            pinColor={spot.available ? 'green' : 'red'}
          >
            <Callout onPress={() => navigation.navigate('SpotDetails', { spot })}>
              <View style={styles.callout}>
                <Text variant="titleSmall" style={styles.calloutTitle}>{spot.name}</Text>
                {spot.address ? (
                  <Text variant="bodySmall" style={styles.calloutAddr}>{spot.address}</Text>
                ) : null}
                <Text variant="bodySmall">${spot.pricePerHour}/hr</Text>
                <Text
                  variant="bodySmall"
                  style={{ color: spot.available ? '#2e7d32' : '#c62828', fontWeight: '600' }}
                >
                  {spot.available ? '● Available' : '● Occupied'}
                </Text>
                <Text variant="bodySmall" style={styles.calloutTap}>Tap for details →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Top overlay bar with drawer toggle */}
      <Surface style={styles.topBar} elevation={2}>
        <IconButton
          icon="menu"
          size={22}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
        <Text variant="titleMedium" style={styles.topTitle}>ParkSpot</Text>
        <View style={styles.badge}>
          <Text variant="labelSmall" style={styles.badgeText}>
            {loading ? '…' : `${availableCount} free`}
          </Text>
        </View>
      </Surface>

      {/* GPS FAB */}
      <FAB
        icon="crosshairs-gps"
        style={styles.fab}
        size="small"
        onPress={locateUser}
        label="Locate Me"
      />

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2500}>
        {snackbar}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    backgroundColor: '#fff',
  },
  topTitle: { flex: 1, fontWeight: '700', color: '#2A6B9C' },
  badge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 12,
  },
  badgeText: { color: '#2e7d32', fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#2A6B9C',
  },
  callout: { padding: 8, minWidth: 160 },
  calloutTitle: { fontWeight: '700', marginBottom: 2 },
  calloutAddr: { opacity: 0.6, marginBottom: 2 },
  calloutTap: { color: '#2A6B9C', marginTop: 4 },
});
