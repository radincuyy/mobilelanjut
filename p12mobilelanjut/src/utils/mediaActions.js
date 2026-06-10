import { Alert, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export const APP_SCHEME = 'p12mobilelanjut';

export function createPostDeepLink(postId) {
  return `${APP_SCHEME}://post/${postId}`;
}

function getFileExtension(uri) {
  const cleanUri = uri.split('?')[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1] : 'jpg';
}

export async function ensureLocalMediaFile(uri, prefix = 'p12-media') {
  if (!uri) {
    throw new Error('Media tidak tersedia.');
  }

  if (uri.startsWith('file://')) {
    return uri;
  }

  const extension = getFileExtension(uri);
  const localUri = `${FileSystem.cacheDirectory}${prefix}-${Date.now()}.${extension}`;
  const result = await FileSystem.downloadAsync(uri, localUri);
  return result.uri;
}

export async function saveImageToGallery(uri) {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Izin ditolak', 'Aplikasi membutuhkan akses galeri untuk menyimpan media.');
    return false;
  }

  const localUri = await ensureLocalMediaFile(uri, 'p12-save');
  await MediaLibrary.saveToLibraryAsync(localUri);
  Alert.alert('Tersimpan', 'Media berhasil disimpan ke galeri.');
  return true;
}

export async function shareMediaFile(uri) {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    Alert.alert('Tidak tersedia', 'Fitur share file belum tersedia di perangkat ini.');
    return;
  }

  const localUri = await ensureLocalMediaFile(uri, 'p12-share');
  await Sharing.shareAsync(localUri, {
    dialogTitle: 'Bagikan media',
    mimeType: 'image/jpeg',
  });
}

export async function sharePostLink(post) {
  const link = createPostDeepLink(post.id);
  const message = post.caption
    ? `${post.caption}\n\nBuka post: ${link}`
    : `Buka post: ${link}`;

  await Share.share({
    title: 'Bagikan post',
    message,
    url: link,
  });
}

export function showPostShareSheet(post) {
  Alert.alert('Bagikan Post', 'Pilih cara membagikan konten.', [
    {
      text: 'Media',
      onPress: () => {
        shareMediaFile(post.imageURL).catch((error) => {
          Alert.alert('Gagal share media', error.message);
        });
      },
    },
    {
      text: 'Deep Link',
      onPress: () => {
        sharePostLink(post).catch((error) => {
          Alert.alert('Gagal share link', error.message);
        });
      },
    },
    { text: 'Batal', style: 'cancel' },
  ]);
}
