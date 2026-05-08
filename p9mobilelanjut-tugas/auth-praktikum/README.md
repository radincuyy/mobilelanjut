# Auth Praktikum - Tugas Mandiri

Project ini mengembangkan praktikum `auth-praktikum` dengan fitur tambahan:

## Fitur Tambahan

**Auto-logout setelah 5 menit idle**

User akan otomatis logout jika tidak ada aktivitas selama 5 menit. Timer akan di-reset ketika user menyentuh layar selama masih login. App juga memantau perubahan state aplikasi menggunakan `AppState`, sehingga ketika aplikasi masuk background lalu kembali aktif, durasi idle tetap dicek.

Implementasi utama ada di:

- `src/contexts/AuthContext.js`
- `App.js`

## Teknologi

- Expo
- React Native
- Firebase Authentication
- Expo SecureStore
- Expo Local Authentication

## Cara Menjalankan

```bash
npm install
npx expo start
```

Scan QR menggunakan Expo Go di HP fisik.

## Cara Test Fitur

1. Register akun menggunakan email dan password.
2. Verifikasi email jika diminta.
3. Login menggunakan email dan password.
4. Biarkan aplikasi idle selama 5 menit, atau pindahkan aplikasi ke background selama 5 menit.
5. Aplikasi akan otomatis logout dan kembali ke halaman Login.
6. Jika user menyentuh layar sebelum 5 menit, timer idle akan di-reset.

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
- Tunjukkan lokasi fitur auto-logout di `AuthContext.js`.
- Tunjukkan timer idle memakai `setTimeout`.
- Tunjukkan listener `AppState`.
- Tunjukkan aplikasi kembali ke Login Screen setelah auto-logout.
