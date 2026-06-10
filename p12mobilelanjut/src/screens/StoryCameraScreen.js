import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../config/firebase';
import { saveImageToGallery, shareMediaFile } from '../utils/mediaActions';

const FLASH_MODES = ['off', 'on', 'auto'];

export default function StoryCameraScreen({ navigation }) {
  const cameraRef = useRef(null);
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [countdownValue, setCountdownValue] = useState(null);
  const [capturedUri, setCapturedUri] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const cycleFlash = () => {
    const currentIndex = FLASH_MODES.indexOf(flash);
    setFlash(FLASH_MODES[(currentIndex + 1) % FLASH_MODES.length]);
  };

  const waitForCountdown = () => new Promise((resolve) => {
    if (!countdownSeconds) {
      resolve();
      return;
    }

    let value = countdownSeconds;
    setCountdownValue(value);

    const interval = setInterval(() => {
      value -= 1;
      if (value <= 0) {
        clearInterval(interval);
        setCountdownValue(null);
        resolve();
      } else {
        setCountdownValue(value);
      }
    }, 1000);
  });

  const cropToStoryRatio = async (photo) => {
    if (!photo.width || !photo.height) return photo.uri;

    const targetAspect = 9 / 16;
    const sourceAspect = photo.width / photo.height;
    let crop;

    if (sourceAspect > targetAspect) {
      const width = Math.round(photo.height * targetAspect);
      crop = {
        originX: Math.round((photo.width - width) / 2),
        originY: 0,
        width,
        height: photo.height,
      };
    } else {
      const height = Math.round(photo.width / targetAspect);
      crop = {
        originX: 0,
        originY: Math.round((photo.height - height) / 2),
        width: photo.width,
        height,
      };
    }

    const result = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ crop }],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  };

  const takeStoryPhoto = async () => {
    if (!cameraRef.current || busy) return;

    try {
      setBusy(true);
      await waitForCountdown();

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
      });

      const storyUri = await cropToStoryRatio(photo);
      setCapturedUri(storyUri);
    } catch (error) {
      Alert.alert('Gagal mengambil story', error.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadStoryImageAsync = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `stories/${user.uid}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(storageRef);
  };

  const postStory = async () => {
    if (!capturedUri) return;

    try {
      setUploading(true);
      const imageURL = await uploadStoryImageAsync(capturedUri);
      await addDoc(collection(db, 'stories'), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Pengguna',
        authorPhotoURL: user.photoURL || '',
        imageURL,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
      });

      Alert.alert('Story terkirim', 'Story kamera berhasil masuk ke beranda.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Gagal upload story', error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={52} color="#22c55e" />
        <Text style={styles.permissionTitle}>Izin Kamera</Text>
        <Text style={styles.permissionText}>Aplikasi membutuhkan kamera untuk fitur Story Camera.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Aktifkan Kamera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (capturedUri) {
    return (
      <SafeAreaView style={styles.previewContainer}>
        <Image source={{ uri: capturedUri }} style={styles.storyPreview} resizeMode="cover" />

        <View style={styles.previewTopBar}>
          <TouchableOpacity style={styles.roundButton} onPress={() => setCapturedUri('')}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => {
              saveImageToGallery(capturedUri).catch((error) => {
                Alert.alert('Gagal menyimpan', error.message);
              });
            }}
          >
            <Ionicons name="download-outline" size={20} color="#ffffff" />
            <Text style={styles.secondaryActionText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => {
              shareMediaFile(capturedUri).catch((error) => {
                Alert.alert('Gagal share', error.message);
              });
            }}
          >
            <Ionicons name="share-social-outline" size={20} color="#ffffff" />
            <Text style={styles.secondaryActionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryAction, uploading && styles.buttonDisabled]}
            onPress={postStory}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#ffffff" />
                <Text style={styles.primaryActionText}>Post Story</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        mode="picture"
        ratio="16:9"
      />

      <SafeAreaView style={styles.cameraOverlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.roundButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Story Camera</Text>
          <TouchableOpacity style={styles.roundButton} onPress={cycleFlash}>
            <Ionicons
              name={flash === 'off' ? 'flash-off-outline' : 'flash-outline'}
              size={22}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        {countdownValue ? (
          <View style={styles.countdownWrap}>
            <Text style={styles.countdownText}>{countdownValue}</Text>
          </View>
        ) : null}

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.timerButton}
            onPress={() => setCountdownSeconds((current) => (current === 0 ? 3 : current === 3 ? 5 : 0))}
          >
            <Ionicons name="timer-outline" size={20} color="#ffffff" />
            <Text style={styles.timerText}>{countdownSeconds ? `${countdownSeconds}s` : 'Off'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, busy && styles.buttonDisabled]}
            onPress={takeStoryPhoto}
            disabled={busy}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.timerButton}
            onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={22} color="#ffffff" />
            <Text style={styles.timerText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 14,
  },
  permissionText: {
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  permissionButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  countdownWrap: {
    alignSelf: 'center',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 54,
    fontWeight: '900',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  timerButton: {
    width: 72,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  storyPreview: {
    alignSelf: 'center',
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#111827',
  },
  previewTopBar: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  previewActions: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryAction: {
    height: 46,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#ffffff',
    fontWeight: '800',
    marginLeft: 6,
  },
  primaryAction: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '800',
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
