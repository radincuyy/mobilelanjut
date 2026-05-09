import React from 'react';
import { Button, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={{ padding: 20 }}>
      <Text>Selamat datang</Text>
      <Text>{user?.email}</Text>
      <Text>
        Email {user?.emailVerified ? 'sudah diverifikasi' : 'belum diverifikasi'}
      </Text>
      <Button title="Logout" onPress={() => logout()} />
    </View>
  );
}
