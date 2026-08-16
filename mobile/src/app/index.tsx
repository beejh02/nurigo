import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
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
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <Text>현재 위치 확인 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nurigo</Text>

      <Text>
        Latitude: {location.coords.latitude}
      </Text>

      <Text>
        Longitude: {location.coords.longitude}
      </Text>

      <Text>
        Accuracy: {location.coords.accuracy} m
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
});