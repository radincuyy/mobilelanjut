import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import PostImage from '../components/PostImage';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../config/firebase';
import { IMAGE_FILTERS } from '../utils/filters';

export default function CreatePostScreen({ navigation }) {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (result.canceled) return;

    try {
      const selected = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        selected.uri,
        [{ resize: { width: 1080 } }],
        {
          compress: 0.86,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setImageUri(manipulated.uri);
    } catch (error) {
      Alert.alert('Gagal memproses foto', error.message);
    }
  };

  const uploadImageAsync = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `posts/${user.uid}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(storageRef);
  };

  const submitPost = async () => {
    if (!imageUri) {
      Alert.alert('Foto belum dipilih', 'Pilih foto dari galeri terlebih dahulu.');
      return;
    }

    try {
      setUploading(true);
      const imageURL = await uploadImageAsync(imageUri);
      const docRef = await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Pengguna',
        authorEmail: user.email,
        authorPhotoURL: user.photoURL || '',
        caption: caption.trim(),
        filter: selectedFilter,
        imageURL,
        createdAt: Timestamp.now(),
      });

      Alert.alert('Berhasil', 'Post berhasil dibuat.');
      navigation.replace('PostDetail', { postId: docRef.id });
    } catch (error) {
      Alert.alert(
        'Gagal membuat post',
        `${error.message}\n\nPastikan Firebase Storage aktif dan rules untuk posts sudah dideploy.`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.picker} onPress={pickImage} activeOpacity={0.85}>
            {imageUri ? (
              <PostImage uri={imageUri} filter={selectedFilter} style={styles.previewImage} />
            ) : (
              <View style={styles.emptyPicker}>
                <Ionicons name="image-outline" size={46} color="#60a5fa" />
                <Text style={styles.emptyPickerTitle}>Pilih Foto</Text>
                <Text style={styles.emptyPickerText}>Galeri + crop 4:5 + kompres preview.</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Filter</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {IMAGE_FILTERS.map((filter) => {
                const isActive = selectedFilter === filter.id;
                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedFilter(filter.id)}
                  >
                    <View style={[styles.filterSwatch, { backgroundColor: filter.overlayColor || '#1f2937' }]} />
                    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.captionBox}>
            <Text style={styles.sectionTitle}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Tulis caption..."
              placeholderTextColor="#64748b"
              value={caption}
              onChangeText={setCaption}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, uploading && styles.buttonDisabled]}
            onPress={submitPost}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Upload Post</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  picker: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 5,
  },
  emptyPicker: {
    aspectRatio: 4 / 5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  emptyPickerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyPickerText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  filterSection: {
    marginTop: 18,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  filterChip: {
    minWidth: 96,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    backgroundColor: '#111827',
    padding: 10,
    marginRight: 10,
  },
  filterChipActive: {
    borderColor: '#60a5fa',
    backgroundColor: '#172554',
  },
  filterSwatch: {
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  filterText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  captionBox: {
    marginTop: 18,
  },
  captionInput: {
    minHeight: 108,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    marginLeft: 8,
  },
});
