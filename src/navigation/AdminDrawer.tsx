import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { Text, Avatar, Divider, Icon } from 'react-native-paper';
import { AdminTab } from './AdminTab';
import { useAuth } from '../contexts/AuthContext';

const Drawer = createDrawerNavigator();

const DrawerContent = (props: any) => {
  const { logOut, user } = useAuth();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.header}>
        <Avatar.Icon size={64} icon="shield-account" style={styles.avatar} />
        <Text variant="titleSmall" style={styles.email} numberOfLines={1}>
          {user?.email}
        </Text>
        <Text variant="bodySmall" style={styles.role}>Administrator</Text>
      </View>

      <Divider style={styles.divider} />

      <DrawerItem
        label="Admin Panel"
        focused
        icon={({ color, size }) => <Icon source="view-dashboard" size={size} color={color} />}
        onPress={() => props.navigation.navigate('Admin')}
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

export const AdminDrawer = () => (
  <Drawer.Navigator
    drawerContent={(props) => <DrawerContent {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Drawer.Screen name="Admin" component={AdminTab} />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  drawerContent: { flex: 1, paddingTop: 16 },
  header: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: { backgroundColor: '#FF8C42' },
  email: { marginTop: 10, textAlign: 'center', fontWeight: '600' },
  role: { marginTop: 2, opacity: 0.55, color: '#FF8C42' },
  divider: { marginVertical: 8 },
});
