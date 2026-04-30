import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text, TextInput, Button, Card, Divider,
  Avatar, Snackbar, ActivityIndicator, Icon,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

// Native Feature #4 — Local Storage via AsyncStorage
const FAVORITES_KEY = '@parkspot_favorites';

export const ProfileScreen = () => {
  const { user, logOut } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [snackbar, setSnackbar] = useState('');

  // CRUD — Read: load profile from Firestore
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setDisplayName(data.displayName ?? '');
        setPhone(data.phone ?? '');
      }
      setLoadingProfile(false);
    });
  }, [user]);

  // Load AsyncStorage favorites count
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then(stored => {
      if (stored) setFavoriteCount((JSON.parse(stored) as string[]).length);
    });
  }, []);

  // CRUD — Update: save profile changes to Firestore
  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName, phone });
      setEditing(false);
      setSnackbar('Profile updated successfully!');
    } catch (err: any) {
      setSnackbar(err.message);
    } finally {
      setSaving(false);
    }
  };

  const clearFavorites = async () => {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    setFavoriteCount(0);
    setSnackbar('Favorites cleared from device storage');
  };

  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const initials = (displayName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <View style={styles.outerContainer}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <Avatar.Text size={80} label={initials} style={styles.avatar} />
        <Text variant="headlineSmall" style={styles.nameText}>
          {displayName || 'Parking User'}
        </Text>
        <Text variant="bodyMedium" style={styles.emailText}>{user?.email}</Text>
      </View>

      {/* Profile Info Card */}
      <Card style={styles.card}>
        <Card.Title title="Profile Information" left={(p) => <Icon source="account" size={p.size} color="#2A6B9C" />} />
        <Card.Content>
          {editing ? (
            <>
              <TextInput
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />
              <View style={styles.editActions}>
                <Button
                  mode="contained"
                  onPress={saveProfile}
                  loading={saving}
                  disabled={saving}
                  style={styles.flex}
                >
                  Save
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setEditing(false)}
                  style={[styles.flex, { marginLeft: 10 }]}
                >
                  Cancel
                </Button>
              </View>
            </>
          ) : (
            <>
              <InfoRow label="Display Name" value={displayName || 'Not set'} />
              <Divider style={{ marginVertical: 6 }} />
              <InfoRow label="Phone" value={phone || 'Not set'} />
              <Divider style={{ marginVertical: 6 }} />
              <InfoRow label="Email" value={user?.email ?? ''} />
              <Button
                mode="outlined"
                icon="pencil"
                onPress={() => setEditing(true)}
                style={{ marginTop: 14 }}
              >
                Edit Profile
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* AsyncStorage favorites card */}
      <Card style={styles.card}>
        <Card.Title
          title="Saved Spots"
          subtitle="Stored locally on this device"
          left={(p) => <Icon source="heart" size={p.size} color="#e53935" />}
        />
        <Card.Content>
          <Text variant="bodyMedium" style={{ marginBottom: 10 }}>
            {favoriteCount === 0
              ? 'No spots saved yet. Tap ♥ on a spot detail page to save it.'
              : `${favoriteCount} spot${favoriteCount > 1 ? 's' : ''} saved to device storage.`}
          </Text>
          {favoriteCount > 0 && (
            <Button
              mode="outlined"
              icon="delete"
              onPress={clearFavorites}
              textColor="#c62828"
              style={{ borderColor: '#c62828', alignSelf: 'flex-start' }}
            >
              Clear Favorites
            </Button>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        icon="logout"
        onPress={logOut}
        style={styles.logoutBtn}
        textColor="#D32F2F"
      >
        Sign Out
      </Button>

    </ScrollView>
    <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2500}>
      {snackbar}
    </Snackbar>
    </View>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text variant="bodySmall" style={styles.infoLabel}>{label}</Text>
    <Text variant="bodyMedium">{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 20, paddingTop: 8 },
  avatar: { backgroundColor: '#2A6B9C' },
  nameText: { marginTop: 12, fontWeight: '700' },
  emailText: { marginTop: 4, opacity: 0.6 },
  card: { marginBottom: 12, borderRadius: 12 },
  input: { marginBottom: 12 },
  editActions: { flexDirection: 'row', marginTop: 4 },
  flex: { flex: 1 },
  infoRow: { paddingVertical: 4 },
  infoLabel: { opacity: 0.55, marginBottom: 2 },
  logoutBtn: { marginTop: 8, borderColor: '#D32F2F' },
});
