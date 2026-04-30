import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { AuthStack } from './AuthStack';
import { UserDrawer } from './UserDrawer';
import { AdminDrawer } from './AdminDrawer';
import { ActivityIndicator } from 'react-native-paper';
import { View } from 'react-native';

export const AppNavigator = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (userRole === 'admin' ? <AdminDrawer /> : <UserDrawer />) : <AuthStack />}
    </NavigationContainer>
  );
};