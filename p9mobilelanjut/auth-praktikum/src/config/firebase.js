import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyB-7BCqX8aCWJi9fkHWtl88LM3ZC38v8-s',
  authDomain: 'auth-praktikum-c5818.firebaseapp.com',
  projectId: 'auth-praktikum-c5818',
  storageBucket: 'auth-praktikum-c5818.firebasestorage.app',
  messagingSenderId: '182576531119',
  appId: '1:182576531119:web:0adf66f47b76212a30765a',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
