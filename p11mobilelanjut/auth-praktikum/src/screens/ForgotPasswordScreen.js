
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text, StyleSheet } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Gagal', 'Silakan masukkan email Anda.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Sukses', 'Link reset password telah dikirim ke email Anda.');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Login');
      }
    } catch (e) {
      Alert.alert('Gagal', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Masukkan email terdaftar untuk menerima link reset.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.buttonContainer}>
        <Button title="Reset Password" onPress={handleReset} color="#6366f1" />
      </View>
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 8,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});