
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';

import { auth } from '../config/firebase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await sendEmailVerification(cred.user);

      Alert.alert(
        'Sukses',
        'Cek email Anda untuk verifikasi.'
      );
    } catch (e) {
      Alert.alert('Gagal', e.message);
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

      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}