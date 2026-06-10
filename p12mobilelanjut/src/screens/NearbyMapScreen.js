import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Circle, Marker } from 'react-native-maps';
import { collection, doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';

import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { getDistanceKm } from '../utils/geo';

const RADIUS_KM = 5;

export default function NearbyMapScreen({ navigation }) {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadLocation = async () => {
    try {
      setLoadingLocation(true);
      setErrorMessage('');

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setErrorMessage('Izin lokasi ditolak. Aktifkan permission lokasi untuk melihat marker sekitar.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCurrentLocation(coords);

      await setDoc(
        doc(db, 'users', user.uid),
        {
          location: {
            ...coords,
            updatedAt: Timestamp.now(),
          },
        },
        { merge: true }
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    loadLocation();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list = snapshot.docs
          .map((userDoc) => userDoc.data())
          .filter((item) => item.uid !== user.uid && item.location?.latitude && item.location?.longitude);

        setUsers(list);
      },
      (error) => {
        Alert.alert('Gagal memuat map users', error.message);
      }
    );

    return unsubscribe;
  }, [user.uid]);

  const nearbyUsers = useMemo(() => {
    if (!currentLocation) return [];

    return users
      .map((item) => {
        const point = {
          latitude: item.location.latitude,
          longitude: item.location.longitude,
        };

        return {
          ...item,
          distanceKm: getDistanceKm(currentLocation, point),
        };
      })
      .filter((item) => item.distanceKm !== null && item.distanceKm <= RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [currentLocation, users]);

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="map-outline" size={48} color="#c084fc" />
        <Text style={styles.title}>Map native</Text>
        <Text style={styles.message}>react-native-maps berjalan di Android/iOS. Jalankan lewat Expo Go atau emulator.</Text>
      </SafeAreaView>
    );
  }

  if (loadingLocation) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#c084fc" />
        <Text style={styles.message}>Mengambil lokasi perangkat...</Text>
      </SafeAreaView>
    );
  }

  if (!currentLocation) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="location-outline" size={48} color="#fb7185" />
        <Text style={styles.title}>Lokasi belum aktif</Text>
        <Text style={styles.message}>{errorMessage || 'Lokasi belum tersedia.'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={loadLocation}>
          <Text style={styles.primaryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.065,
          longitudeDelta: 0.065,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={currentLocation}
          title="Lokasi Saya"
          pinColor="#4f46e5"
        />
        <Circle
          center={currentLocation}
          radius={RADIUS_KM * 1000}
          strokeColor="rgba(124, 58, 237, 0.55)"
          fillColor="rgba(124, 58, 237, 0.12)"
        />
        {nearbyUsers.map((item) => (
          <Marker
            key={item.uid}
            coordinate={{
              latitude: item.location.latitude,
              longitude: item.location.longitude,
            }}
            title={item.name || item.email}
            description={`${item.distanceKm.toFixed(2)} km dari Anda`}
            onCalloutPress={() => navigation.navigate('Chat', { chatUser: item })}
          />
        ))}
      </MapView>

      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Nearby Users</Text>
            <Text style={styles.sheetSubtitle}>Radius {RADIUS_KM} km dari lokasi Anda</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadLocation}>
            <Ionicons name="refresh" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {nearbyUsers.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada teman yang membagikan lokasi di radius ini.</Text>
        ) : (
          nearbyUsers.slice(0, 4).map((item) => (
            <TouchableOpacity
              key={item.uid}
              style={styles.nearbyRow}
              onPress={() => navigation.navigate('Chat', { chatUser: item })}
            >
              <View style={styles.nearbyIcon}>
                <Ionicons name="person" size={17} color="#c084fc" />
              </View>
              <View style={styles.nearbyCopy}>
                <Text style={styles.nearbyName}>{item.name || item.email}</Text>
                <Text style={styles.nearbyDistance}>{item.distanceKm.toFixed(2)} km dari Anda</Text>
              </View>
              <Ionicons name="chatbubble-outline" size={19} color="#94a3b8" />
            </TouchableOpacity>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 14,
  },
  message: {
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  primaryButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  sheet: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    backgroundColor: '#111827',
    padding: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#243044',
    paddingTop: 10,
    marginTop: 10,
  },
  nearbyIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#581c8726',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  nearbyCopy: {
    flex: 1,
  },
  nearbyName: {
    color: '#ffffff',
    fontWeight: '800',
  },
  nearbyDistance: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
});
