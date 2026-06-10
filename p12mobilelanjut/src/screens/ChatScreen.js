// src/screens/ChatScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  writeBatch,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../config/firebase';

export default function ChatScreen({ route, navigation }) {
  const initialChatUser = route.params?.chatUser || null;
  const linkedChatUserId = route.params?.chatUserId || null;
  const { user } = useAuth();

  const [chatUser, setChatUser] = useState(initialChatUser);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingChatUser, setLoadingChatUser] = useState(!initialChatUser && !!linkedChatUserId);
  const flatListRef = useRef(null);

  const currentUid = user.uid;
  const targetUid = chatUser?.uid || linkedChatUserId;
  const roomId = targetUid ? [currentUid, targetUid].sort().join('_') : '';

  useEffect(() => {
    if (initialChatUser) {
      setChatUser(initialChatUser);
      setLoadingChatUser(false);
      return undefined;
    }

    if (!linkedChatUserId) return undefined;

    let mounted = true;

    const loadLinkedUser = async () => {
      try {
        setLoadingChatUser(true);
        const snapshot = await getDoc(doc(db, 'users', linkedChatUserId));
        if (!mounted) return;

        if (snapshot.exists()) {
          setChatUser(snapshot.data());
        } else {
          Alert.alert('User tidak ditemukan', 'Teman chat dari deep link tidak tersedia.');
        }
      } catch (error) {
        Alert.alert('Gagal membuka chat', error.message);
      } finally {
        if (mounted) setLoadingChatUser(false);
      }
    };

    loadLinkedUser();

    return () => {
      mounted = false;
    };
  }, [initialChatUser, linkedChatUserId]);

  useEffect(() => {
    if (!chatUser || !targetUid || !roomId) return undefined;

    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerName}>{chatUser.name || chatUser.email}</Text>
          <View style={styles.headerStatusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: chatUser.isOnline ? '#10b981' : '#64748b' },
              ]}
            />
            <Text style={styles.headerStatus}>
              {chatUser.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      ),
      headerStyle: {
        backgroundColor: '#1e293b',
      },
      headerTintColor: '#ffffff',
    });

    const q = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() });
        });
        setMessages(msgs);

        const batch = writeBatch(db);
        let hasUpdates = false;

        snapshot.forEach((msgDoc) => {
          const data = msgDoc.data();
          if (data.senderId === targetUid && !data.read) {
            batch.update(doc(db, 'messages', msgDoc.id), { read: true });
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          batch.commit().catch(() => {});
        }
      },
      (error) => {
        Alert.alert(
          'Error Memuat Chat',
          `Pesan gagal dimuat. Kemungkinan besar karena index Firestore belum dibuat.\n\nError: ${error.message}\n\nSilakan periksa terminal Expo / log metro untuk menyalin link pembuatan index.`
        );
      }
    );

    return unsubscribe;
  }, [roomId, chatUser, targetUid, navigation]);

  const uploadImageAsync = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `chat_images/${roomId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handlePickImage = async () => {
    if (!targetUid) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Izin ditolak', 'Aplikasi membutuhkan akses galeri Anda.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (pickerResult.canceled) return;

    try {
      setUploading(true);
      const uri = pickerResult.assets[0].uri;
      const downloadURL = await uploadImageAsync(uri);

      await addDoc(collection(db, 'messages'), {
        senderId: currentUid,
        receiverId: targetUid,
        roomId: roomId,
        text: '',
        imageURL: downloadURL,
        timestamp: Timestamp.now(),
        read: false,
      });
    } catch (e) {
      Alert.alert(
        'Gagal mengirim gambar',
        'Storage/Unknown. Harap periksa apakah Anda sudah mengaktifkan Firebase Storage di Firebase Console dan mengupdate rules-nya.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSendText = async () => {
    if (!text.trim() || !targetUid) return;

    const messageText = text;
    setText('');

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: currentUid,
        receiverId: targetUid,
        roomId: roomId,
        text: messageText,
        imageURL: '',
        timestamp: Timestamp.now(),
        read: false,
      });
    } catch (e) {
      Alert.alert('Gagal mengirim pesan', e.message);
    }
  };



  const formatTime = (firebaseTimestamp) => {
    if (!firebaseTimestamp) return '';
    const date = firebaseTimestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUid;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {item.imageURL ? (
            <Image source={{ uri: item.imageURL }} style={styles.messageImage} resizeMode="cover" />
          ) : (
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
              {item.text}
            </Text>
          )}

          <View style={styles.metaContainer}>
            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
            {isMe && (
              <Ionicons
                name={item.read ? 'checkmark-done-sharp' : 'checkmark-sharp'}
                size={16}
                color={item.read ? '#38bdf8' : '#94a3b8'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loadingChatUser || !chatUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingChatUser}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Membuka chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {uploading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>Mengunggah gambar...</Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity onPress={handlePickImage} style={styles.iconButton}>
            <Ionicons name="image-outline" size={26} color="#94a3b8" />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Ketik pesan..."
            placeholderTextColor="#64748b"
            value={text}
            onChangeText={setText}
            multiline
          />

          <TouchableOpacity onPress={handleSendText} style={styles.sendButton}>
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerStatus: {
    fontSize: 12,
    color: '#94a3b8',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  theirMessageWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1.5,
  },
  myBubble: {
    backgroundColor: '#6366f1',
    borderTopRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  theirMessageText: {
    color: '#f8fafc',
  },
  messageImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  iconButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#1e293b',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 8,
  },
  loadingChatUser: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
