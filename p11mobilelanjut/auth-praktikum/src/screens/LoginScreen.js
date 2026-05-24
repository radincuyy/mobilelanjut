// src/screens/LoginScreen.js

import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
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
    if (!email || !password) {
      Alert.alert('Gagal', 'Email dan password harus diisi.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
        'Silakan login dulu dengan password sekali.'
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
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue to Chat App</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} color="#6366f1" />
      </View>

      <View style={[styles.buttonContainer, { marginTop: 12 }]}>
        <Button
          title="Login dengan Biometric"
          onPress={handleBiometric}
          color="#3b82f6"
        />
      </View>

      <Text style={styles.linkText} onPress={() => navigation.navigate('Register')}>
        Belum punya akun? Daftar
      </Text>

      <Text style={[styles.linkText, { marginTop: 12 }]} onPress={() => navigation.navigate('ForgotPassword')}>
        Lupa password?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  linkText: {
    color: '#6366f1',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

