# Mobile Lanjut

Kumpulan praktikum dan tugas mata kuliah **Pemrograman Mobile Lanjut**. Tiap folder mewakili materi pertemuan
Repo: https://github.com/radincuyy/mobilelanjut

## Struktur Folder

| Folder | Pertemuan | Topik |
| --- | --- | --- |
| [p6mobilelanjut/](p6mobilelanjut/) | 6 | Redux Toolkit (cart slice) + Expo Router shop app |
| [p9mobilelanjut/](p9mobilelanjut/) | 9 | Firebase Auth praktikum (email/password + biometric) |
| [p9mobilelanjut-tugas/](p9mobilelanjut-tugas/) | 9 (tugas) | Auth + auto-logout 5 menit idle |
| [p11mobilelanjut/](p11mobilelanjut/) | 11 | Real-time chat application (Firestore) |
| [p12mobilelanjut/](p12mobilelanjut/) | 12 | Social media app features: story, post filter, map, share, notification, gallery |

## Ringkasan Tiap Pertemuan

### Pertemuan 6 — Redux Toolkit & Expo Router
[p6mobilelanjut/](p6mobilelanjut/)

- [praktikcoding/](p6mobilelanjut/praktikcoding/) — latihan singkat `cartSlice` dan `CartScreen` untuk memahami `createSlice` dan `useSelector`/`useDispatch`.
- [my-shop-app/](p6mobilelanjut/my-shop-app/) — aplikasi toko sederhana berbasis Expo Router + Redux Toolkit. Stack: Expo SDK 54, React Native 0.81, `@reduxjs/toolkit`, `react-redux`, `expo-router`.

Menjalankan:

```bash
cd p6mobilelanjut/my-shop-app
npm install
npx expo start
```

### Pertemuan 9 — Firebase Authentication
[p9mobilelanjut/auth-praktikum/](p9mobilelanjut/auth-praktikum/)

Praktikum auth dasar: register, login email/password, login biometric (`expo-local-authentication`), forgot password, dan penyimpanan kredensial via `expo-secure-store`.

Stack: Expo SDK 54, Firebase JS SDK 12, React Navigation v7.

Menjalankan:

```bash
cd p9mobilelanjut/auth-praktikum
npm install
npx expo start
```

### Pertemuan 9 — Tugas Mandiri (Auto-logout)
[p9mobilelanjut-tugas/auth-praktikum/](p9mobilelanjut-tugas/auth-praktikum/)

Pengembangan dari praktikum p9 dengan fitur tambahan **auto-logout setelah 5 menit idle**. Timer di-reset saat user menyentuh layar, dan `AppState` dipantau supaya durasi idle tetap dihitung saat aplikasi masuk background.

Implementasi utama:

- [src/contexts/AuthContext.js](p9mobilelanjut-tugas/auth-praktikum/src/contexts/AuthContext.js)
- [App.js](p9mobilelanjut-tugas/auth-praktikum/App.js)

Detail dan video demo: [p9mobilelanjut-tugas/auth-praktikum/README.md](p9mobilelanjut-tugas/auth-praktikum/README.md).

### Pertemuan 11 — Real-time Chat
[p11mobilelanjut/auth-praktikum/](p11mobilelanjut/auth-praktikum/)

Lanjutan auth-praktikum dengan tambahan fitur chat real-time menggunakan Cloud Firestore, plus `expo-image-picker` untuk attachment. Aturan keamanan ada di [firestore.rules](p11mobilelanjut/auth-praktikum/firestore.rules).

Stack tambahan: `firebase/firestore`, `expo-image-picker`, plus carry-over fitur auth dari p9.

Menjalankan:

```bash
cd p11mobilelanjut/auth-praktikum
npm install
npx expo start
```

### Pertemuan 12 â€” Social Media App Features
[p12mobilelanjut/](p12mobilelanjut/)

Lanjutan dari project p11 dengan fitur social media app: Story Camera, post dengan filter, Nearby Users Map, Push Notif Chat, Share & Deep Link, dan Save to Gallery.

Stack tambahan: `expo-camera`, `expo-image-picker`, `expo-image-manipulator`, `react-native-maps`, `expo-location`, `expo-notifications`, `expo-sharing`, `expo-media-library`, dan `expo-file-system`.

Firebase:

- Authentication email/password
- Cloud Firestore
- Firebase Storage
- Rules lokal: [firestore.rules](p12mobilelanjut/firestore.rules), [storage.rules](p12mobilelanjut/storage.rules), dan [firebase.json](p12mobilelanjut/firebase.json)

Menjalankan:

```bash
cd p12mobilelanjut
npm install
npx expo start -c
```

Detail fitur dan checklist demo: [p12mobilelanjut/README.md](p12mobilelanjut/README.md).

## Prasyarat Umum

- Node.js LTS dan npm
- Expo Go di perangkat fisik (atau Android Studio / Xcode untuk emulator)
- Akun Firebase dengan project yang sudah dibuatkan. Authentication & Firestore diperlukan untuk folder p9/p11, sedangkan p12 juga membutuhkan Firebase Storage.

## Catatan

Tiap folder sudah punya README sendiri yang lebih spesifik. Mulailah dari README pertemuan yang ingin dijalankan agar dependency dan langkah konfigurasinya lebih jelas.
