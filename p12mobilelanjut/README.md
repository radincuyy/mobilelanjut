# P12 Mobile Lanjut - Social Media App Features

Project ini melanjutkan fondasi `p11mobilelanjut/auth-praktikum`: Firebase Auth, register/login, biometric login, auto logout idle, daftar teman, dan chat realtime. Pertemuan 12 menambahkan fitur sosial seperti story, post filter, map user sekitar, notifikasi chat, deep link, share, dan save to gallery.

## Fitur Pertemuan 12

- Story Camera: `CameraView`, flash mode, flip camera, countdown timer, crop rasio 9:16 dengan `expo-image-manipulator`, upload story.
- Post dengan Filter: pilih foto dari galeri, crop 4:5, preview filter, caption, upload ke Firebase Storage dan Firestore.
- Nearby Users Map: simpan lokasi user, tampilkan marker teman dalam radius 5 km dengan `react-native-maps`.
- Push Notif Chat: notifikasi lokal saat ada pesan baru yang belum dibaca, tap notifikasi membuka deep link chat.
- Share & Deep Link: post punya link `p12mobilelanjut://post/{postId}` dan opsi share media/link.
- Save to Gallery: download media post/story lalu simpan ke galeri perangkat.

## Teknologi

- Expo SDK 54
- React Native
- Firebase Authentication, Firestore, Storage
- expo-camera
- expo-image-picker
- expo-image-manipulator
- react-native-maps
- expo-location
- expo-notifications
- expo-sharing
- expo-media-library
- expo-file-system

## Cara Menjalankan

```bash
cd p12mobilelanjut
npm install
npx expo start
```

Scan QR menggunakan Expo Go di HP fisik. Fitur camera, map, media library, dan notification paling aman dites di perangkat fisik.

Catatan Expo Go Android: `expo-notifications` remote push dan akses penuh media library punya batasan di Expo Go, sehingga warning dari Expo bisa muncul. Project ini tetap mempertahankan fitur sesuai instruksi praktikum; untuk push background penuh diperlukan development build.

## Firebase

Project memakai `.env` dari p11. Pastikan Firebase Console sudah mengaktifkan:

- Authentication email/password
- Cloud Firestore
- Firebase Storage

Deploy `firestore.rules` terbaru agar collection `posts` dan `stories` bisa dibaca/tulis oleh user login.

Deploy juga `storage.rules` agar upload foto ke folder `posts`, `stories`, dan `chat_images` tidak ditolak:

```bash
npx firebase-tools@latest login
npx firebase-tools@latest deploy --only firestore:rules,storage --project <PROJECT_ID_FIREBASE>
```

`PROJECT_ID_FIREBASE` sama dengan nilai `EXPO_PUBLIC_FIREBASE_PROJECT_ID` di file `.env`.

## Checklist Demo

1. Login/register dari fitur p11.
2. Buka Home dan tunjukkan feed sosial.
3. Buat story dari kamera dengan countdown, lalu upload.
4. Buat post dari galeri, pilih filter, isi caption, upload.
5. Buka detail post via feed, share deep link, dan save ke gallery.
6. Buka Nearby Map, izinkan lokasi, lihat marker user sekitar.
7. Kirim chat dari akun lain dan tunjukkan notifikasi chat masuk.
