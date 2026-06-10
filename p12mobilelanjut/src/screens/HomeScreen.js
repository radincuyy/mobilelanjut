import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

import PostImage from '../components/PostImage';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { saveImageToGallery, showPostShareSheet } from '../utils/mediaActions';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPosts(snapshot.docs.map((postDoc) => ({ id: postDoc.id, ...postDoc.data() })));
        setLoadingPosts(false);
      },
      (error) => {
        setLoadingPosts(false);
        Alert.alert('Feed belum siap', `Gagal memuat posts.\n\n${error.message}`);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setStories(snapshot.docs.map((storyDoc) => ({ id: storyDoc.id, ...storyDoc.data() })));
      },
      () => {}
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersList = [];
        snapshot.forEach((userDoc) => {
          const data = userDoc.data();
          if (data.uid !== user.uid) {
            usersList.push(data);
          }
        });

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
        Alert.alert('Error Memuat Pengguna', error.message);
      }
    );

    return unsubscribe;
  }, [user.uid]);

  const getInitial = (name, email) => {
    const stringToUse = name || email || 'P';
    return stringToUse.charAt(0).toUpperCase();
  };

  const renderAction = (icon, label, color, onPress) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderStory = (story) => (
    <View key={story.id} style={styles.storyItem}>
      <Image source={{ uri: story.imageURL }} style={styles.storyImage} />
      <Text style={styles.storyName} numberOfLines={1}>
        {story.authorName || 'Story'}
      </Text>
    </View>
  );

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
    >
      <View style={styles.postHeader}>
        {item.authorPhotoURL ? (
          <Image source={{ uri: item.authorPhotoURL }} style={styles.postAvatar} />
        ) : (
          <View style={styles.postAvatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitial(item.authorName, item.authorEmail)}</Text>
          </View>
        )}
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthor}>{item.authorName || item.authorEmail || 'Pengguna'}</Text>
          <Text style={styles.postMeta}>{item.filter ? `Filter ${item.filter}` : 'Post baru'}</Text>
        </View>
      </View>

      <PostImage uri={item.imageURL} filter={item.filter} style={styles.postImage} />

      {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postActionButton}
          onPress={() => showPostShareSheet(item)}
        >
          <Ionicons name="share-social-outline" size={18} color="#38bdf8" />
          <Text style={styles.postActionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postActionButton}
          onPress={() => {
            saveImageToGallery(item.imageURL).catch((error) => {
              Alert.alert('Gagal menyimpan', error.message);
            });
          }}
        >
          <Ionicons name="download-outline" size={18} color="#34d399" />
          <Text style={styles.postActionText}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => navigation.navigate('Chat', { chatUser: item })}
    >
      <View style={styles.userAvatarWrap}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitial(item.name, item.email)}</Text>
          </View>
        )}
        <View style={[styles.onlineBadge, { backgroundColor: item.isOnline ? '#10b981' : '#64748b' }]} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || item.email?.split('@')[0]}</Text>
        <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
      </View>
      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  const listHeader = (
    <>
      <View style={styles.profileSection}>
        <View style={styles.profileLeft}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.myAvatar} />
          ) : (
            <View style={styles.myAvatarPlaceholder}>
              <Text style={styles.myAvatarText}>{getInitial(user.displayName, user.email)}</Text>
            </View>
          )}
          <View style={styles.profileCopy}>
            <Text style={styles.greeting}>
              {user.displayName || user.email?.split('@')[0] || 'Pengguna'}
            </Text>
            <Text style={styles.myEmail} numberOfLines={1}>{user.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={19} color="#fb7185" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsGrid}>
        {renderAction('camera-outline', 'Story', '#22c55e', () => navigation.navigate('StoryCamera'))}
        {renderAction('color-filter-outline', 'Post', '#60a5fa', () => navigation.navigate('CreatePost'))}
        {renderAction('map-outline', 'Nearby', '#c084fc', () => navigation.navigate('NearbyMap'))}
        {renderAction('notifications-outline', 'Notif', '#fb923c', () => {
          Alert.alert('Push Notif Chat', 'Notifikasi lokal aktif saat ada pesan chat baru yang belum dibaca.');
        })}
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Story terbaru</Text>
          <TouchableOpacity onPress={() => navigation.navigate('StoryCamera')}>
            <Text style={styles.sectionLink}>Buat</Text>
          </TouchableOpacity>
        </View>
        {stories.length === 0 ? (
          <View style={styles.emptyStrip}>
            <Text style={styles.emptySmallText}>Belum ada story. Ambil foto 9:16 dari kamera.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {stories.map(renderStory)}
          </ScrollView>
        )}
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Feed</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
            <Text style={styles.sectionLink}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const listFooter = (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Teman Chat</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NearbyMap')}>
          <Text style={styles.sectionLink}>Map</Text>
        </TouchableOpacity>
      </View>

      {loadingUsers ? (
        <View style={styles.loadingInline}>
          <ActivityIndicator color="#6366f1" />
          <Text style={styles.loadingText}>Memuat teman...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyStrip}>
          <Text style={styles.emptySmallText}>Belum ada teman terdaftar.</Text>
        </View>
      ) : (
        users.map((friend) => <View key={friend.uid}>{renderUserItem({ item: friend })}</View>)
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loadingPosts ? (
        <View style={styles.loadingPage}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Memuat feed...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.emptyFeed}>
              <Ionicons name="images-outline" size={42} color="#475569" />
              <Text style={styles.emptyFeedText}>Belum ada post. Upload foto dengan filter dulu.</Text>
            </View>
          }
          ListFooterComponent={listFooter}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  listContent: {
    paddingBottom: 24,
  },
  profileSection: {
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#243044',
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  myAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  myAvatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myAvatarText: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '800',
  },
  profileCopy: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  myEmail: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fb718555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 76,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 7,
  },
  actionLabel: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBlock: {
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionLink: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyStrip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    backgroundColor: '#111827',
    padding: 14,
  },
  emptySmallText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  storyItem: {
    width: 72,
    marginRight: 12,
  },
  storyImage: {
    width: 68,
    height: 92,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: '#1f2937',
  },
  storyName: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },
  postCard: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  postAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  postAuthorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  postAuthor: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  postMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  postImage: {
    width: '100%',
    height: 360,
  },
  caption: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingTop: 11,
  },
  postActions: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  postActionText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  emptyFeed: {
    marginHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    backgroundColor: '#111827',
    padding: 24,
    alignItems: 'center',
  },
  emptyFeedText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    color: '#94a3b8',
    marginLeft: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    backgroundColor: '#111827',
    padding: 12,
    marginBottom: 10,
  },
  userAvatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  userAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#111827',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  userEmail: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
});
