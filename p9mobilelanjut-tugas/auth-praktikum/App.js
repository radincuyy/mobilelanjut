import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function Root() {
  const { user, loading, resetIdleTimer } = useAuth();

  if (loading) return null;

  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={user ? resetIdleTimer : undefined}
    >
      <NavigationContainer>
        {user ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
