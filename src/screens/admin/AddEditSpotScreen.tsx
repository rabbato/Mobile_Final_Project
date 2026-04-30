import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Switch } from 'react-native';
import {
  Text, TextInput, Button, Card, Snackbar, Icon, Divider,
} from 'react-native-paper';
import {
  addDoc, collection, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

export const AddEditSpotScreen = ({ route, navigation }: any) => {
  const { spot } = route.params ?? {};
  const { user } = useAuth();
  const isEditing = !!spot?.id;

  const [name, setName] = useState<string>(spot?.name ?? '');
  const [address, setAddress] = useState<string>(spot?.address ?? '');
  const [latitude, setLatitude] = useState<string>(spot?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState<string>(spot?.longitude?.toString() ?? '');
  const [pricePerHour, setPricePerHour] = useState<string>(spot?.pricePerHour?.toString() ?? '');
  const [description, setDescription] = useState<string>(spot?.description ?? '');
  const [available, setAvailable] = useState<boolean>(spot?.available ?? true);
  const [imageUri, setImageUri] = useState<string | null>(spot?.imageUri ?? null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  // Native Feature #2 — Camera / Photo Library via expo-image-picker
  const pickImage = async () => {
    const camResult = await ImagePicker.requestCameraPermissionsAsync();
    if (camResult.status === 'granted') {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [16, 9],
      });
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        return;
      }
    }
    // Fall back to gallery
    const galResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (galResult.status !== 'granted') {
      setSnackbar('Camera and gallery permissions are needed');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // CRUD — Create / Update
  const handleSave = async () => {
    if (!name.trim() || !latitude || !longitude || !pricePerHour) {
      setSnackbar('Name, latitude, longitude and price are required');
      return;
    }
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const price = parseFloat(pricePerHour);
    if (isNaN(lat) || isNaN(lon) || isNaN(price) || price < 0) {
      setSnackbar('Latitude, longitude and price must be valid numbers');
      return;
    }

    setSaving(true);
    const data = {
      name: name.trim(),
      address: address.trim(),
      latitude: lat,
      longitude: lon,
      pricePerHour: price,
      description: description.trim(),
      available,
      imageUri,
      updatedAt: serverTimestamp(),
    };

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'parkingSpots', spot.id), data);
        setSnackbar('Spot updated!');
      } else {
        await addDoc(collection(db, 'parkingSpots'), {
          ...data,
          createdAt: serverTimestamp(),
          adminId: user?.uid,
          adminEmail: user?.email ?? '',
        });
        setSnackbar('Spot added!');
      }
      setTimeout(() => navigation.goBack(), 1200);
    } catch (err: any) {
      setSnackbar(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="bodySmall" style={styles.hint}>
        {isEditing ? 'Update the details below.' : 'Fill in the details to add a new spot.'}
      </Text>

      {/* Photo picker */}
      <Card style={styles.photoCard} onPress={pickImage}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.photo} />
            <Button
              mode="text"
              icon="camera"
              onPress={pickImage}
              style={styles.changePhoto}
            >
              Change Photo
            </Button>
          </>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Icon source="camera-plus" size={48} color="#bbb" />
            <Text variant="bodyMedium" style={styles.photoHint}>
              Tap to take or select a photo
            </Text>
            <Text variant="bodySmall" style={styles.photoSub}>
              (Native: Camera / Gallery)
            </Text>
          </View>
        )}
      </Card>

      <TextInput
        label="Spot Name *"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Address"
        value={address}
        onChangeText={setAddress}
        mode="outlined"
        style={styles.input}
      />
      <View style={styles.row}>
        <TextInput
          label="Latitude *"
          value={latitude}
          onChangeText={setLatitude}
          mode="outlined"
          keyboardType="decimal-pad"
          style={[styles.input, styles.flex]}
        />
        <View style={{ width: 10 }} />
        <TextInput
          label="Longitude *"
          value={longitude}
          onChangeText={setLongitude}
          mode="outlined"
          keyboardType="decimal-pad"
          style={[styles.input, styles.flex]}
        />
      </View>
      <TextInput
        label="Price per Hour ($) *"
        value={pricePerHour}
        onChangeText={setPricePerHour}
        mode="outlined"
        keyboardType="decimal-pad"
        style={styles.input}
        left={<TextInput.Affix text="$" />}
      />
      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <Divider style={{ marginVertical: 8 }} />

      <View style={styles.switchRow}>
        <View>
          <Text variant="bodyMedium" style={{ fontWeight: '600' }}>Available</Text>
          <Text variant="bodySmall" style={{ opacity: 0.55 }}>
            {available ? 'Spot is open for reservations' : 'Spot is closed / occupied'}
          </Text>
        </View>
        <Switch
          value={available}
          onValueChange={setAvailable}
          trackColor={{ true: '#2A6B9C' }}
        />
      </View>

      <Button
        mode="contained"
        icon={isEditing ? 'content-save' : 'plus-circle'}
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        style={styles.saveBtn}
        contentStyle={{ paddingVertical: 6 }}
      >
        {isEditing ? 'Update Spot' : 'Add Spot'}
      </Button>

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
  hint: { opacity: 0.55, marginBottom: 16 },
  photoCard: { borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  photo: { width: '100%', height: 180 },
  changePhoto: { alignSelf: 'center', marginVertical: 4 },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  photoHint: { marginTop: 8, opacity: 0.6 },
  photoSub: { opacity: 0.35, marginTop: 2 },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  saveBtn: { borderRadius: 8, backgroundColor: '#2A6B9C' },
});
