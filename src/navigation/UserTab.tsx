import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { DrawerActions } from '@react-navigation/native';
import { IconButton, Icon } from 'react-native-paper';
import { HomeScreen } from '../screens/user/HomeScreen';
import { SpotDetailsScreen } from '../screens/user/SpotDetailsScreen';
import { BookingScreen } from '../screens/user/BookingScreen';
import { ReservationsScreen } from '../screens/user/ReservationsScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';
import { ConversationsScreen } from '../screens/shared/ConversationsScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const MessagesStack = createStackNavigator();

const menuLeft = (navigation: any) => (
  <IconButton
    icon="menu"
    size={24}
    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
  />
);

const HomeStackNavigator = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen
      name="HomeMap"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <HomeStack.Screen
      name="SpotDetails"
      component={SpotDetailsScreen}
      options={{ title: 'Spot Details', headerBackTitle: 'Map' }}
    />
    <HomeStack.Screen
      name="Booking"
      component={BookingScreen}
      options={{ title: 'Book a Spot', headerBackTitle: 'Details' }}
    />
  </HomeStack.Navigator>
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

export const UserTab = () => (
  <Tab.Navigator
    screenOptions={({ route, navigation }) => ({
      headerShown: true,
      headerLeft: () => menuLeft(navigation),
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, string> = {
          Home: 'map-marker-radius',
          Reservations: 'calendar-clock',
          Messages: 'chat-outline',
          Profile: 'account-circle',
        };
        return <Icon source={icons[route.name] ?? 'circle'} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2A6B9C',
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeStackNavigator}
      options={{ headerShown: false }}
    />
    <Tab.Screen name="Reservations" component={ReservationsScreen} />
    <Tab.Screen
      name="Messages"
      component={MessagesStackNavigator}
      options={{ headerShown: false }}
    />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);
