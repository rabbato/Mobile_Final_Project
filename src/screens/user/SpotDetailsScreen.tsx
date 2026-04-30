import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import {
  Text, Card, Button, ActivityIndicator,
  Snackbar, Divider, Icon,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

const FAVORITES_KEY = '@parkspot_favorites';

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
}

const weatherDescription = (code: number): string => {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Rain showers';
  return 'Thunderstorm';
};

const weatherIcon = (code: number): string => {
  if (code === 0) return 'weather-sunny';
  if (code <= 3) return 'weather-partly-cloudy';
  if (code <= 48) return 'weather-fog';
  if (code <= 67) return 'weather-rainy';
  if (code <= 77) return 'weather-snowy';
  return 'weather-lightning-rainy';
};

export const SpotDetailsScreen = ({ route, navigation }: any) => {
  const { spot } = route.params;
  const { user } = useAuth();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Public Web API — Open-Meteo (free, no API key required)
  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${spot.latitude}&longitude=${spot.longitude}&current_weather=true&temperature_unit=celsius`
    )
      .then(r => r.json())
      .then(data => setWeather(data.current_weather))
      .catch(() => setWeather(null))
      .finally(() => setWeatherLoading(false));
  }, []);

  // Check AsyncStorage for existing favorite
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then(stored => {
      if (stored) {
        const list: string[] = JSON.parse(stored);
        setIsFavorite(list.includes(spot.id));
      }
    });
  }, []);

  // Native Feature #3 — Share via react-native Share API
  const handleShare = async () => {
    try {
      await Share.share({
        title: 'ParkSpot — Parking Spot',
        message:
          `🅿️ ${spot.name}\n` +
          `📍 ${spot.address ?? 'See location on ParkSpot app'}\n` +
          `💵 $${spot.pricePerHour}/hr\n` +
          `${spot.available ? '✅ Available now!' : '❌ Currently occupied'}`,
      });
    } catch {
      setSnackbar('Could not open share sheet');
    }
  };

  // Native Feature #4 — AsyncStorage: save/remove favorite
  const toggleFavorite = async () => {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    const list: string[] = stored ? JSON.parse(stored) : [];
    let updated: string[];
    if (isFavorite) {
      updated = list.filter(id => id !== spot.id);
      setSnackbar('Removed from favorites');
    } else {
      updated = [...list, spot.id];
      setSnackbar('Saved to favorites!');
    }
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    setIsFavorite(!isFavorite);
  };

  const openBooking = () => {
    navigation.navigate('Booking', { spot });
  };

  const openChat = () => {
    const conversationId = `${spot.id}_${user?.uid}`;
    navigation.navigate('Messages', {
      screen: 'Chat',
      params: {
        conversationId,
        spotId: spot.id,
        spotName: spot.name,
        adminId: spot.adminId ?? '',
        adminEmail: spot.adminEmail ?? '',
        userId: user?.uid ?? '',
        userEmail: user?.email ?? '',
      },
    });
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Availability banner */}
        <View style={[styles.banner, { backgroundColor: spot.available ? '#e8f5e9' : '#ffebee' }]}>
          <Icon
            source={spot.available ? 'check-circle' : 'close-circle'}
            size={20}
            color={spot.available ? '#2e7d32' : '#c62828'}
          />
          <Text
            variant="labelLarge"
            style={{ marginLeft: 6, color: spot.available ? '#2e7d32' : '#c62828' }}
          >
            {spot.available ? 'Available Now' : 'Currently Occupied'}
          </Text>
        </View>

        {/* Spot info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.name}>{spot.name}</Text>
            {spot.address ? (
              <View style={styles.row}>
                <Icon source="map-marker" size={16} color="#888" />
                <Text variant="bodyMedium" style={styles.address}>{spot.address}</Text>
              </View>
            ) : null}
            {spot.description ? (
              <Text variant="bodyMedium" style={styles.desc}>{spot.description}</Text>
            ) : null}
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.priceRow}>
              <Icon source="currency-usd" size={22} color="#2A6B9C" />
              <Text variant="headlineMedium" style={styles.price}>
                {spot.pricePerHour}
              </Text>
              <Text variant="bodyMedium" style={styles.priceLabel}> / hour</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Weather card — Public Web API: Open-Meteo */}
        <Card style={styles.card}>
          <Card.Title
            title="Weather at This Location"
            subtitle="Powered by Open-Meteo (open-meteo.com)"
            left={(p) => <Icon source="weather-partly-cloudy" size={p.size} color="#2A6B9C" />}
          />
          <Card.Content>
            {weatherLoading ? (
              <ActivityIndicator />
            ) : weather ? (
              <View style={styles.weatherRow}>
                <Icon source={weatherIcon(weather.weathercode)} size={48} color="#FF8C42" />
                <View style={{ marginLeft: 16 }}>
                  <Text variant="displaySmall" style={styles.temp}>
                    {Math.round(weather.temperature)}°C
                  </Text>
                  <Text variant="bodyLarge">{weatherDescription(weather.weathercode)}</Text>
                  <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                    Wind: {weather.windspeed} km/h
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={{ opacity: 0.5 }}>Weather data unavailable</Text>
            )}
          </Card.Content>
        </Card>

        {/* Secondary actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            icon={isFavorite ? 'heart' : 'heart-outline'}
            onPress={toggleFavorite}
            style={styles.actionBtn}
            textColor={isFavorite ? '#e53935' : undefined}
          >
            {isFavorite ? 'Saved' : 'Save'}
          </Button>
          <Button
            mode="outlined"
            icon="share-variant"
            onPress={handleShare}
            style={styles.actionBtn}
          >
            Share
          </Button>
          <Button
            mode="outlined"
            icon="chat-outline"
            onPress={openChat}
            style={styles.actionBtn}
          >
            Message
          </Button>
        </View>

        {/* Primary: Book This Spot */}
        {spot.available && (
          <Button
            mode="contained"
            icon="calendar-plus"
            onPress={openBooking}
            style={styles.bookBtn}
            contentStyle={{ paddingVertical: 8 }}
          >
            Book This Spot
          </Button>
        )}

      </ScrollView>
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  card: { marginBottom: 12, borderRadius: 12 },
  name: { fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  address: { marginLeft: 4, opacity: 0.65 },
  desc: { marginTop: 8, opacity: 0.75, lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { color: '#2A6B9C', fontWeight: '800' },
  priceLabel: { opacity: 0.6 },
  weatherRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  temp: { fontWeight: '700', color: '#FF8C42' },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionBtn: { flex: 1 },
  bookBtn: { borderRadius: 10, backgroundColor: '#1A3A5C', marginBottom: 16 },
});
