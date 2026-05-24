import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, AppState } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const appStateRef = useRef(AppState.currentState);
  const backgroundedAtRef = useRef(null);
  const idleTimerRef = useRef(null);
  const userRef = useRef(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(
    async (showIdleAlert = false) => {
      clearIdleTimer();

      const currentUser = auth.currentUser;
      if (currentUser) {
        updateDoc(doc(db, 'users', currentUser.uid), {
          isOnline: false,
        }).catch(() => { });
      }

      try {
        await signOut(auth);
      } catch (e) { }

      try {
        await AsyncStorage.removeItem('auth_token');
      } catch (e) { }

      if (showIdleAlert === true) {
        Alert.alert(
          'Sesi berakhir',
          'Anda otomatis logout karena idle selama 5 menit.'
        );
      }
    },
    [clearIdleTimer]
  );

  const resetIdleTimer = useCallback(() => {
    clearIdleTimer();

    if (!userRef.current) return;

    idleTimerRef.current = setTimeout(() => {
      logout(true);
    }, IDLE_TIMEOUT_MS);
  }, [clearIdleTimer, logout]);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const unsub = onAuthStateChanged(auth, (u) => {
      clearTimeout(safetyTimeout);

      setUser(u);
      setLoading(false);

      if (u) {
        const runBackgroundTasks = async () => {
          try {
            const token = await u.getIdToken();
            await AsyncStorage.setItem('auth_token', token);
          } catch (e) { }

          try {
            await setDoc(doc(db, 'users', u.uid), {
              uid: u.uid,
              email: u.email,
              name: u.displayName || u.email.split('@')[0],
              isOnline: true,
            }, { merge: true });
          } catch (e) {
            Alert.alert(
              'Gagal Sinkronisasi Firestore',
              `Gagal memperbarui status user di Firestore.\n\nError: ${e.message}\n\nPastikan Cloud Firestore telah diaktifkan di Firebase Console Anda.`
            );
          }
        };

        runBackgroundTasks();
      } else {
        AsyncStorage.removeItem('auth_token').catch(() => { });
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsub();
    };
  }, []);

  useEffect(() => {
    userRef.current = user;

    if (user) {
      resetIdleTimer();

      setDoc(doc(db, 'users', user.uid), { isOnline: true }, { merge: true })
        .catch((e) => {
          Alert.alert(
            'Gagal Sinkronisasi Firestore',
            `Gagal memperbarui status user di Firestore.\n\nError: ${e.message}`
          );
        });
    } else {
      clearIdleTimer();
    }
  }, [user, resetIdleTimer, clearIdleTimer]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      const wasInBackground = appStateRef.current?.match(/inactive|background/);
      const isMovingToBackground = nextAppState.match(/inactive|background/);

      if (isMovingToBackground && userRef.current && userRef.current.uid) {
        backgroundedAtRef.current = Date.now();
        resetIdleTimer();

        try {
          await updateDoc(doc(db, 'users', userRef.current.uid), {
            isOnline: false,
          });
        } catch (e) { }
      }

      if (wasInBackground && nextAppState === 'active') {
        const idleDuration = backgroundedAtRef.current
          ? Date.now() - backgroundedAtRef.current
          : 0;

        if (idleDuration >= IDLE_TIMEOUT_MS) {
          logout(true);
        } else {
          resetIdleTimer();

          if (userRef.current && userRef.current.uid) {
            try {
              await updateDoc(doc(db, 'users', userRef.current.uid), {
                isOnline: true,
              });
            } catch (e) { }
          }
        }

        backgroundedAtRef.current = null;
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
      clearIdleTimer();
    };
  }, [clearIdleTimer, logout, resetIdleTimer]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, resetIdleTimer }}>
      {children}
    </AuthContext.Provider>
  );
}

