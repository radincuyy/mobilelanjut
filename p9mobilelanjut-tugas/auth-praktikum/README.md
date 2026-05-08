# Auth Praktikum - Tugas Mandiri

Project ini mengembangkan praktikum `auth-praktikum` dengan fitur tambahan:

## Fitur Tambahan

**Login dengan Google menggunakan expo-auth-session**

User dapat login menggunakan akun Google lewat `expo-auth-session/providers/google`. Token dari Google dikirim ke Firebase Authentication menggunakan `GoogleAuthProvider` dan `signInWithCredential`.

Implementasi utama ada di:

- `src/screens/LoginScreen.js`

**Auto-logout setelah 5 menit idle**

User akan otomatis logout jika tidak ada aktivitas selama 5 menit. Timer akan di-reset ketika user menyentuh layar selama masih login. App juga memantau perubahan state aplikasi menggunakan `AppState`, sehingga ketika aplikasi masuk background lalu kembali aktif, durasi idle tetap dicek.

Implementasi utama ada di:

- `src/contexts/AuthContext.js`
- `App.js`

## Teknologi

- Expo
- React Native
- Firebase Authentication
- Expo AuthSession
- Expo WebBrowser
- Expo SecureStore
- Expo Local Authentication

## Konfigurasi Google Login

1. Buka Firebase Console.
2. Pilih project Firebase yang dipakai aplikasi.
3. Masuk ke **Authentication > Sign-in method**.
4. Aktifkan provider **Google**.
5. Buka Google Cloud Console, lalu buat OAuth Client ID untuk Web dan Android/iOS jika diperlukan.
6. Salin client ID ke `src/screens/LoginScreen.js`:

```js
const GOOGLE_WEB_CLIENT_ID = 'ISI_WEB_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = 'ISI_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = 'ISI_IOS_CLIENT_ID.apps.googleusercontent.com';
```

Untuk testing awal, minimal isi `GOOGLE_WEB_CLIENT_ID`. Jika menggunakan development build Android/iOS, isi juga client ID native sesuai platform.

## Cara Menjalankan

```bash
npm install
npx expo start
```

Scan QR menggunakan Expo Go di HP fisik.

## Cara Test Fitur

1. Aktifkan provider Google di Firebase.
2. Isi Google client ID di `LoginScreen.js`.
3. Jalankan aplikasi dengan `npx expo start`.
4. Tekan tombol **Login dengan Google**.
5. Pilih akun Google dan izinkan akses.
6. Setelah login berhasil, user masuk ke Home Screen.
7. Biarkan aplikasi idle selama 5 menit, atau pindahkan aplikasi ke background selama 5 menit.
8. Aplikasi akan otomatis logout dan kembali ke halaman Login.
9. Jika user menyentuh layar sebelum 5 menit, timer idle akan di-reset.

## Cara Test Fitur Auth Lain

1. Login email/password.
2. Logout dan pastikan kembali ke Login Screen.
3. Login biometric setelah pernah login dengan password.
4. Forgot password dan cek email reset password.

## Link Repository

https://github.com/radincuyy/mobilelanjut

Folder tugas:

```text
p9mobilelanjut-tugas/auth-praktikum
```

## Checklist Video Demo

- Tunjukkan register/login.
- Tunjukkan tombol Login dengan Google.
- Tunjukkan konfigurasi Google client ID di `LoginScreen.js`.
- Tunjukkan lokasi fitur auto-logout di `AuthContext.js`.
- Tunjukkan timer idle memakai `setTimeout`.
- Tunjukkan listener `AppState`.
- Tunjukkan aplikasi kembali ke Login Screen setelah auto-logout.
