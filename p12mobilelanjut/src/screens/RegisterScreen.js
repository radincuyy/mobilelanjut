
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text, StyleSheet } from 'react-native';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '../config/firebase';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Gagal', 'Nama lengkap harus diisi.');
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(cred.user, {
        displayName: name,
      });

      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        name: name,
        email: email,
        photoURL: '',
        isOnline: true,
      });

      await sendEmailVerification(cred.user);

      Alert.alert(
        'Sukses',
        'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.'
      );
    } catch (e) {
      Alert.alert('Gagal', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buat Akun Baru</Text>

      <TextInput
        style={styles.input}
        placeholder="Nama Lengkap"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.buttonContainer}>
        <Button title="Register" onPress={handleRegister} color="#6366f1" />
      </View>

      <Text style={styles.loginText} onPress={() => navigation.navigate('Login')}>
        Sudah punya akun? Login di sini
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
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
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loginText: {
    color: '#6366f1',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});