// src/screens/LoginScreen.js

import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { auth } from '../config/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      await SecureStore.setItemAsync('auth_token', 'logged_in');
    } catch (e) {
      Alert.alert('Login gagal', e.message);
    }
  };

  const handleBiometric = async () => {
    const token = await SecureStore.getItemAsync('auth_token');

    if (!token) {
      Alert.alert(
        'Belum ada session',
        'Silakan login dulu dengan password.'
      );
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login dengan biometric',
      fallbackLabel: 'Gunakan password',
    });

    if (result.success) {
      Alert.alert('Berhasil', 'Welcome back!');
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