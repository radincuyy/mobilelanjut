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
import { auth } from '../config/firebase';

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
      await signOut(auth);
      await SecureStore.deleteItemAsync('auth_token');

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
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const token = await u.getIdToken();
        await SecureStore.setItemAsync('auth_token', token);
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  useEffect(() => {
    userRef.current = user;

    if (user) {
      resetIdleTimer();
    } else {
      clearIdleTimer();
    }
  }, [user, resetIdleTimer, clearIdleTimer]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasInBackground = appStateRef.current?.match(/inactive|background/);
      const isMovingToBackground = nextAppState.match(/inactive|background/);

      if (isMovingToBackground && userRef.current) {
        backgroundedAtRef.current = Date.now();
        resetIdleTimer();
      }

      if (wasInBackground && nextAppState === 'active') {
        const idleDuration = backgroundedAtRef.current
          ? Date.now() - backgroundedAtRef.current
          : 0;

        if (idleDuration >= IDLE_TIMEOUT_MS) {
          logout(true);
        } else {
          resetIdleTimer();
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
