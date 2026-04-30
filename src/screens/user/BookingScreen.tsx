import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  Text, Button, Chip, HelperText, Snackbar, Divider, Icon,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  addDoc, collection, getDocs, query, where,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

const DURATIONS = [1, 2, 3, 4, 6, 8];

const roundToNextHalfHour = (d: Date) => {
  const ms = 30 * 60 * 1000;
  return new Date(Math.ceil(d.getTime() / ms) * ms);
};

export const BookingScreen = ({ route, navigation }: any) => {
  const { spot } = route.params;
  const { user } = useAuth();

  const [startDate, setStartDate] = useState(
    roundToNextHalfHour(new Date(Date.now() + 60 * 60 * 1000)),
  );
  const [duration, setDuration] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState('');

  const endDate = new Date(startDate.getTime() + duration * 3600000);
  const totalPrice = +(duration * spot.pricePerHour).toFixed(2);

  const onDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!selected) return;
    const updated = new Date(startDate);
    updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setStartDate(updated);
  };

  const onTimeChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (!selected) return;
    const updated = new Date(startDate);
    updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setStartDate(updated);
  };

  const checkAvailability = async (): Promise<boolean> => {
    const q = query(
      collection(db, 'reservations'),
      where('spotId', '==', spot.id),
      where('status', 'in', ['pending', 'confirmed']),
    );
    const snap = await getDocs(q);
    const start = startDate.getTime();
    const end = endDate.getTime();
    for (const d of snap.docs) {
      const r = d.data();
      const rs = r.startTime?.toMillis?.() ?? 0;
      const re = r.endTime?.toMillis?.() ?? 0;
      if (start < re && end > rs) return false;
    }
    return true;
  };

  const handleBook = async () => {
    if (startDate <= new Date()) {
      setError('Start time must be in the future');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const available = await checkAvailability();
      if (!available) {
        setError('This spot is already booked during that window. Please pick a different time.');
        return;
      }
      await addDoc(collection(db, 'reservations'), {
        spotId: spot.id,
        spotName: spot.name,
        userId: user?.uid,
        userEmail: user?.email,
        adminId: spot.adminId,
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
        totalPrice,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSnackbar('Booking request sent! Awaiting admin approval.');
      setTimeout(() => navigation.goBack(), 2200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const fmtFull = (d: Date) =>
    d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  return (
    <View style={styles.outer}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Spot header */}
        <View style={styles.spotHeader}>
          <View style={styles.spotIconWrap}>
            <Icon source="parking" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text variant="titleLarge" style={styles.spotName}>{spot.name}</Text>
            {spot.address ? (
              <Text variant="bodySmall" style={styles.spotAddr}>{spot.address}</Text>
            ) : null}
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Date & Time */}
        <Text variant="labelLarge" style={styles.sectionLabel}>Start Date & Time</Text>
        <View style={styles.pickerRow}>
          <Button
            mode="outlined"
            icon="calendar"
            onPress={() => setShowDatePicker(true)}
            style={styles.pickerBtn}
            contentStyle={styles.pickerContent}
          >
            {fmtDate(startDate)}
          </Button>
          <Button
            mode="outlined"
            icon="clock-outline"
            onPress={() => setShowTimePicker(true)}
            style={styles.pickerBtn}
            contentStyle={styles.pickerContent}
          >
            {fmtTime(startDate)}
          </Button>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            minimumDate={new Date()}
            onChange={onDateChange}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={startDate}
            mode="time"
            onChange={onTimeChange}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />
        )}

        <Divider style={styles.divider} />

        {/* Duration */}
        <Text variant="labelLarge" style={styles.sectionLabel}>Duration</Text>
        <View style={styles.chipRow}>
          {DURATIONS.map(h => (
            <Chip
              key={h}
              selected={duration === h}
              onPress={() => setDuration(h)}
              style={[styles.chip, duration === h && styles.chipActive]}
              textStyle={duration === h ? styles.chipTextActive : styles.chipText}
            >
              {h}h
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />

        {/* Booking summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Check-in</Text>
            <Text style={styles.summaryVal}>{fmtFull(startDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Check-out</Text>
            <Text style={styles.summaryVal}>{fmtFull(endDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rate</Text>
            <Text style={styles.summaryVal}>${spot.pricePerHour}/hr × {duration}h</Text>
          </View>
          <Divider style={{ marginVertical: 10 }} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Policy note */}
        <View style={styles.noteBox}>
          <Icon source="information-outline" size={16} color="#E65100" />
          <Text variant="bodySmall" style={styles.noteText}>
            Reservation requires admin approval. If you don't arrive within 30 minutes of your confirmed start time, the spot will be released.
          </Text>
        </View>

        {error ? (
          <HelperText type="error" visible style={{ marginBottom: 4 }}>{error}</HelperText>
        ) : null}

        <Button
          mode="contained"
          icon="calendar-check"
          onPress={handleBook}
          loading={submitting}
          disabled={submitting}
          style={styles.bookBtn}
          contentStyle={{ paddingVertical: 8 }}
        >
          Request Booking
        </Button>
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2500}>
        {snackbar}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 48 },
  spotHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  spotIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#1A3A5C', alignItems: 'center', justifyContent: 'center',
  },
  spotName: { fontWeight: '800', color: '#1A1A2E' },
  spotAddr: { opacity: 0.55, marginTop: 2 },
  divider: { marginVertical: 18 },
  sectionLabel: { fontWeight: '700', color: '#444', marginBottom: 12 },
  pickerRow: { flexDirection: 'row', gap: 10 },
  pickerBtn: { flex: 1, borderColor: '#2A6B9C' },
  pickerContent: { paddingVertical: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderRadius: 20, borderWidth: 1.5, borderColor: '#C8D8E8' },
  chipActive: { backgroundColor: '#2A6B9C', borderColor: '#2A6B9C' },
  chipText: { color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { opacity: 0.55, fontSize: 13 },
  summaryVal: { fontWeight: '600', fontSize: 13, color: '#333' },
  totalLabel: { fontWeight: '700', fontSize: 16, color: '#1A1A2E' },
  totalPrice: { fontWeight: '800', fontSize: 20, color: '#2A6B9C' },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  noteText: { marginLeft: 8, flex: 1, color: '#E65100', lineHeight: 18 },
  bookBtn: { borderRadius: 10, backgroundColor: '#1A3A5C' },
});
