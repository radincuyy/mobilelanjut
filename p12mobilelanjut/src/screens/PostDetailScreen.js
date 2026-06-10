import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';

import PostImage from '../components/PostImage';
import { db } from '../config/firebase';
import { createPostDeepLink, saveImageToGallery, showPostShareSheet } from '../utils/mediaActions';

export default function PostDetailScreen({ route }) {
  const { postId } = route.params || {};
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPost = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'posts', postId));
        if (!mounted) return;

        if (snapshot.exists()) {
          setPost({ id: snapshot.id, ...snapshot.data() });
        } else {
          setPost(null);
        }
      } catch (error) {
        Alert.alert('Gagal memuat post', error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPost();

    return () => {
      mounted = false;
    };
  }, [postId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.centerText}>Memuat post...</Text>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#fb7185" />
        <Text style={styles.title}>Post tidak ditemukan</Text>
        <Text style={styles.centerText}>ID post tidak tersedia atau sudah dihapus.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.authorRow}>
          {post.authorPhotoURL ? (
            <Image source={{ uri: post.authorPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(post.authorName || post.authorEmail || 'P').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.authorCopy}>
            <Text style={styles.authorName}>{post.authorName || post.authorEmail}</Text>
            <Text style={styles.deepLink} numberOfLines={1}>{createPostDeepLink(post.id)}</Text>
          </View>
        </View>

        <PostImage uri={post.imageURL} filter={post.filter} style={styles.image} />

        {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => showPostShareSheet(post)}>
            <Ionicons name="share-social-outline" size={19} color="#38bdf8" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              saveImageToGallery(post.imageURL).catch((error) => {
                Alert.alert('Gagal menyimpan', error.message);
              });
            }}
          >
            <Ionicons name="download-outline" size={19} color="#34d399" />
            <Text style={styles.actionText}>Save to Gallery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerText: {
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  authorCopy: {
    flex: 1,
    marginLeft: 11,
  },
  authorName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  deepLink: {
    color: '#60a5fa',
    fontSize: 12,
    marginTop: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 8,
  },
  caption: {
    color: '#e5e7eb',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 14,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  actionButton: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 7,
  },
});
