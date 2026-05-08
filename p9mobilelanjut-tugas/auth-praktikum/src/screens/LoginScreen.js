// src/screens/LoginScreen.js

import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { auth } from '../config/firebase';

const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
