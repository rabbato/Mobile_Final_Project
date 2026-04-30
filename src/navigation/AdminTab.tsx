import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { DrawerActions } from '@react-navigation/native';
import { IconButton, Icon } from 'react-native-paper';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { ManageSpotsScreen } from '../screens/admin/ManageSpotsScreen';
import { AddEditSpotScreen } from '../screens/admin/AddEditSpotScreen';
import { AdminReservationsScreen } from '../screens/admin/AdminReservationsScreen';
import { ManageUsersScreen } from '../screens/admin/ManageUsersScreen';
import { ConversationsScreen } from '../screens/shared/ConversationsScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';

const Tab = createBottomTabNavigator();
const SpotsStack = createStackNavigator();
const MessagesStack = createStackNavigator();

const menuLeft = (navigation: any) => (
  <IconButton
    icon="menu"
    size={24}
    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
  />
);

const SpotsStackNavigator = () => (
  <SpotsStack.Navigator>
    <SpotsStack.Screen
      name="SpotsList"
      component={ManageSpotsScreen}
      options={({ navigation }) => ({
        title: 'Manage Spots',
        headerLeft: () => menuLeft(navigation),
      })}
    />
    <SpotsStack.Screen
      name="AddEditSpot"
      component={AddEditSpotScreen}
      options={{ title: 'Add / Edit Spot', headerBackTitle: 'Spots' }}
    />
  </SpotsStack.Navigator>
);

const MessagesStackNavigator = () => (
  <MessagesStack.Navigator>
    <MessagesStack.Screen
      name="Conversations"
      component={ConversationsScreen}
      options={{ title: 'Messages' }}
    />
    <MessagesStack.Screen
      name="Chat"
      component={ChatScreen}
      options={({ route }: any) => ({ title: route.params?.spotName ?? 'Chat' })}
    />
  </MessagesStack.Navigator>
);

export const AdminTab = () => (
  <Tab.Navigator
    screenOptions={({ route, navigation }) => ({
      headerShown: true,
      headerLeft: () => menuLeft(navigation),
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, string> = {
          Dashboard: 'view-dashboard',
          Spots: 'parking',
          Reservations: 'calendar-check',
          Messages: 'chat-outline',
          Users: 'account-group',
        };
        return <Icon source={icons[route.name] ?? 'circle'} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#FF8C42',
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen
      name="Spots"
      component={SpotsStackNavigator}
      options={{ headerShown: false }}
    />
    <Tab.Screen name="Reservations" component={AdminReservationsScreen} />
    <Tab.Screen
      name="Messages"
      component={MessagesStackNavigator}
      options={{ headerShown: false }}
    />
    <Tab.Screen name="Users" component={ManageUsersScreen} />
  </Tab.Navigator>
);
