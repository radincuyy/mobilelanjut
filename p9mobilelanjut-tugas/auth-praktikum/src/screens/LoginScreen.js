// src/screens/LoginScreen.js

import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { auth } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';
const GOOGLE_WEB_CLIENT_ID = 'ISI_WEB_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = 'ISI_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = 'ISI_IOS_CLIENT_ID.apps.googleusercontent.com';

const isPlaceholderClientId = (clientId) => clientId.startsWith('ISI_');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isGoogleConfigured = !isPlaceholderClientId(GOOGLE_WEB_CLIENT_ID);
  const [googleRequest, googleResponse, promptGoogleLogin] =
    Google.useIdTokenAuthRequest({
      clientId: GOOGLE_WEB_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID,
      androidClientId: isPlaceholderClientId(GOOGLE_ANDROID_CLIENT_ID)
        ? GOOGLE_WEB_CLIENT_ID
        : GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: isPlaceholderClientId(GOOGLE_IOS_CLIENT_ID)
        ? GOOGLE_WEB_CLIENT_ID
        : GOOGLE_IOS_CLIENT_ID,
      selectAccount: true,
    });

  useEffect(() => {
    const loginWithGoogleCredential = async () => {
      if (googleResponse?.type !== 'success') return;

      const idToken =
        googleResponse.params?.id_token || googleResponse.authentication?.idToken;
      const accessToken =
        googleResponse.params?.access_token ||
        googleResponse.authentication?.accessToken;

      if (!idToken && !accessToken) {
        Alert.alert(
          'Login Google gagal',
          'Token Google tidak ditemukan. Periksa konfigurasi client ID.'
        );
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        await signInWithCredential(auth, credential);
      } catch (e) {
        Alert.alert('Login Google gagal', e.message);
      }
    };

    loginWithGoogleCredential();
  }, [googleResponse]);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      await SecureStore.setItemAsync('auth_token', 'logged_in');
      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
      await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
    } catch (e) {
      Alert.alert('Login gagal', e.message);
    }
  };

  const handleBiometric = async () => {
    const savedEmail = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    const savedPassword = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);

    if (!savedEmail || !savedPassword) {
      Alert.alert(
        'Belum ada session',
        'Silakan login dulu dengan password.'
      );
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      Alert.alert(
        'Biometric belum aktif',
        'Aktifkan fingerprint atau face unlock di HP Anda.'
      );
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login dengan biometric',
      fallbackLabel: 'Gunakan password',
    });

    if (result.success) {
      try {
        await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
      } catch (e) {
        Alert.alert('Login gagal', e.message);
      }
    } else {
      Alert.alert('Gagal', 'Biometric tidak cocok.');
    }
  };

  const handleGoogleLogin = async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        'Konfigurasi Google belum lengkap',
        'Isi GOOGLE_WEB_CLIENT_ID di LoginScreen.js, lalu aktifkan Google provider di Firebase Authentication.'
      );
      return;
    }

    try {
      await promptGoogleLogin();
    } catch (e) {
      Alert.alert('Login Google gagal', e.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Login" onPress={handleLogin} />

      <Button
        title="Login dengan Google"
        onPress={handleGoogleLogin}
        disabled={!googleRequest}
      />

      <Button
        title="Login dengan Biometric"
        onPress={handleBiometric}
      />

      <Text onPress={() => navigation.navigate('Register')}>
        Belum punya akun? Daftar
      </Text>

      <Text onPress={() => navigation.navigate('ForgotPassword')}>
        Lupa password?
      </Text>
    </View>
  );
}
