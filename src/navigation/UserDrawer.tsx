import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { Text, Avatar, Divider, Icon } from 'react-native-paper';
import { UserTab } from './UserTab';
import { useAuth } from '../contexts/AuthContext';

const Drawer = createDrawerNavigator();

const AboutScreen = () => (
  <View style={styles.aboutContainer}>
    <Icon source="car" size={72} color="#2A6B9C" />
    <Text variant="headlineSmall" style={styles.aboutTitle}>ParkSpot</Text>
    <Text variant="bodyMedium" style={styles.aboutBody}>
      Find and reserve parking spots near you. Browse available spots on the map,
      check live weather conditions at the location, and make reservations instantly.
    </Text>
    <Divider style={{ width: '80%', marginVertical: 20 }} />
    <Text variant="bodySmall" style={styles.aboutVersion}>
      v1.0.0 — CSC457 Final Project
    </Text>
    <Text variant="bodySmall" style={{ opacity: 0.4, marginTop: 4 }}>
      Built with React Native + Firebase
    </Text>
  </View>
);

const DrawerContent = (props: any) => {
  const { logOut, user } = useAuth();
  const currentRoute = props.state.routes[props.state.index]?.name;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.header}>
        <Avatar.Text
          size={64}
          label={(user?.email || 'U').charAt(0).toUpperCase()}
          style={styles.avatar}
        />
        <Text variant="titleSmall" style={styles.email} numberOfLines={1}>
          {user?.email}
        </Text>
        <Text variant="bodySmall" style={styles.role}>Parking Seeker</Text>
      </View>

      <Divider style={styles.divider} />

      <DrawerItem
        label="Map & Parking"
        focused={currentRoute === 'Main'}
        icon={({ color, size }) => <Icon source="map-marker-radius" size={size} color={color} />}
        onPress={() => props.navigation.navigate('Main')}
      />
      <DrawerItem
        label="About"
        focused={currentRoute === 'About'}
        icon={({ color, size }) => <Icon source="information-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate('About')}
      />

      <Divider style={styles.divider} />

      <DrawerItem
        label="Logout"
        icon={({ color, size }) => <Icon source="logout" size={size} color={color} />}
        onPress={logOut}
        labelStyle={{ color: '#D32F2F' }}
      />
    </DrawerContentScrollView>
  );
};

export const UserDrawer = () => (
  <Drawer.Navigator
    drawerContent={(props) => <DrawerContent {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Drawer.Screen name="Main" component={UserTab} />
    <Drawer.Screen name="About" component={AboutScreen} />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  drawerContent: { flex: 1, paddingTop: 16 },
  header: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: { backgroundColor: '#2A6B9C' },
  email: { marginTop: 10, textAlign: 'center', fontWeight: '600' },
  role: { marginTop: 2, opacity: 0.55 },
  divider: { marginVertical: 8 },
  aboutContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F5F7FA',
  },
  aboutTitle: { marginTop: 16, fontWeight: 'bold', color: '#2A6B9C' },
  aboutBody: { textAlign: 'center', lineHeight: 22, marginTop: 12, opacity: 0.75 },
  aboutVersion: { opacity: 0.45 },
});
