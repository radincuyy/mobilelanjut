import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Linking } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { useChatNotifications } from './src/hooks/useChatNotifications';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import StoryCameraScreen from './src/screens/StoryCameraScreen';
import NearbyMapScreen from './src/screens/NearbyMapScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [ExpoLinking.createURL('/'), 'p12mobilelanjut://'],
  config: {
    screens: {
      Home: 'home',
      Chat: 'chat/:chatUserId',
      CreatePost: 'create-post',
      StoryCamera: 'story-camera',
      NearbyMap: 'nearby',
      PostDetail: 'post/:postId',
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) return url;

    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification.request.content.data?.url;
  },
  subscribe(listener) {
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });

    const notificationSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url;
        if (url) {
          listener(url);
        }
      }
    );

    return () => {
      linkingSubscription.remove();
      notificationSubscription.remove();
    };
  },
};

const screenOptions = {
  headerStyle: {
    backgroundColor: '#1e293b',
  },
  headerTintColor: '#ffffff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  headerShadowVisible: false,
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Registrasi' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: 'Post dengan Filter' }}
      />
      <Stack.Screen
        name="StoryCamera"
        component={StoryCameraScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NearbyMap"
        component={NearbyMapScreen}
        options={{ title: 'Nearby Users Map' }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Detail Post' }}
      />
    </Stack.Navigator>
  );
}

function Root() {
  const { user, loading, resetIdleTimer } = useAuth();
  useChatNotifications(user);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={user ? resetIdleTimer : undefined}
    >
      <NavigationContainer linking={linking}>
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
