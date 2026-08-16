import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

import {
  NaverMapView,
  NaverMapMarkerOverlay,
} from '@mj-studio/react-native-naver-map';

export default function HomeScreen() {
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLocation() {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('위치 권한이 필요합니다.');
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setLocation(currentLocation);
    }

    loadLocation();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <Text>현재 위치 확인 중...</Text>
      </View>
    );
  }

  const { latitude, longitude } = location.coords;

  return (
    <View style={styles.container}>
      <NaverMapView
        style={styles.map}
        camera={{
          latitude,
          longitude,
          zoom: 16,
        }}
        isShowLocationButton={true}
      >
        <NaverMapMarkerOverlay
          latitude={latitude}
          longitude={longitude}
          caption={{
            text: '현재 위치',
          }}
        />
      </NaverMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});