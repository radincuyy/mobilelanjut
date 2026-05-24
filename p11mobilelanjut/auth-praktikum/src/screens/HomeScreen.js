import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Button,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { auth, db, storage } from '../config/firebase';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load other users from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersList = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Exclude currently logged-in user
          if (data.uid !== user.uid) {
            usersList.push(data);
          }
        });
        // Sort online users first, then by name
        usersList.sort((a, b) => {
          if (a.isOnline && !b.isOnline) return -1;
          if (!a.isOnline && b.isOnline) return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
        setUsers(usersList);
        setLoadingUsers(false);
      },
      (error) => {
        setLoadingUsers(false);
        Alert.alert(
          'Error Memuat Pengguna',
          `Gagal mengambil data teman dari Firestore.\n\nPesan: ${error.message}\n\nPastikan Cloud Firestore sudah diaktifkan di Firebase Console dan aturan keamanan (Rules) sudah diupdate.`
        );
      }
    );

    return unsub;
  }, [user.uid]);



  // Upload Profile Avatar (bonus)
  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Izin ditolak', 'Aplikasi membutuhkan akses galeri Anda.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (pickerResult.canceled) return;

    try {
      setUploading(true);
      const uri = pickerResult.assets[0].uri;
      
      // Upload to Firebase Storage
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `profile_photos/${user.uid}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Update Auth Profile
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL,
      });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL,
      });

      Alert.alert('Sukses', 'Foto profil berhasil diperbarui.');
    } catch (e) {
      Alert.alert(
        'Gagal mengunggah foto',
        'Storage/Unknown. Harap periksa apakah Anda sudah mengaktifkan Firebase Storage di Firebase Console dan mengupdate rules-nya.'
      );
    } finally {
      setUploading(false);
    }
  };

  const getInitial = (name, email) => {
    const stringToUse = name || email || 'C';
    return stringToUse.charAt(0).toUpperCase();
  };

  const renderUserItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => navigation.navigate('Chat', { chatUser: item })}
      >
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {getInitial(item.name, item.email)}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.onlineBadge,
              { backgroundColor: item.isOnline ? '#10b981' : '#64748b' },
            ]}
          />
        </View>

        <View style={styles.userCardInfo}>
          <Text style={styles.userName}>{item.name || item.email.split('@')[0]}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#475569" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handlePickAvatar} style={styles.myAvatarContainer}>
            {uploading ? (
              <ActivityIndicator size="small" color="#6366f1" style={styles.myAvatarImage} />
            ) : user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.myAvatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, styles.myAvatarImage]}>
                <Text style={styles.myAvatarPlaceholderText}>
                  {getInitial(user.displayName, user.email)}
                </Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={12} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileDetails}>
            <Text style={styles.myProfileName}>{user.displayName || 'Pengguna Chat'}</Text>
            <Text style={styles.myProfileEmail}>{user.email}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main User List Section */}
      <View style={styles.usersListContainer}>
        <Text style={styles.sectionTitle}>Teman Chat</Text>

        {loadingUsers ? (
          <View style={styles.loadingUsers}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Memuat daftar teman...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>Belum ada teman terdaftar.</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.uid}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  profileSection: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  myAvatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  myAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1e293b',
  },
  profileDetails: {
    flex: 1,
    marginRight: 8,
  },
  myProfileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  myProfileEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f43f5e',
    backgroundColor: '#fda4af15',
  },
  logoutButtonText: {
    color: '#f43f5e',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 13,
  },
  usersListContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  myAvatarPlaceholderText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  userCardInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  loadingUsers: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#475569',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});

