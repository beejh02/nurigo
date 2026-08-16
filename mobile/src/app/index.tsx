import { useEffect, useState } from 'react';
import {
  BackHandler,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';

import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapPolygonOverlay,
} from '@mj-studio/react-native-naver-map';

type Coordinate = {
  latitude: number;
  longitude: number;
};

export default function HomeScreen() {
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [polygonPoints, setPolygonPoints] =
    useState<Coordinate[]>([]);

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

  useEffect(() => {
    const handleBackPress = () => {
      if (polygonPoints.length > 0) {
        setPolygonPoints((prev) =>
          prev.slice(0, -1),
        );

        return true;
      }

      return false;
    };

    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress,
      );

    return () => {
      subscription.remove();
    };
  }, [polygonPoints.length]);

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

  const { latitude, longitude } =
    location.coords;

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
        onTapMap={(event) => {
          const newPoint: Coordinate = {
            latitude: event.latitude,
            longitude: event.longitude,
          };

          setPolygonPoints((prev) => [
            ...prev,
            newPoint,
          ]);
        }}
      >
        {/* 현재 위치 */}
        <NaverMapMarkerOverlay
          latitude={latitude}
          longitude={longitude}
          caption={{
            text: '현재 위치',
          }}
        />

        {/* 사용자가 찍은 좌표 */}
        {polygonPoints.map((point, index) => (
          <NaverMapMarkerOverlay
            key={`${point.latitude}-${point.longitude}-${index}`}
            latitude={point.latitude}
            longitude={point.longitude}
            caption={{
              text: `${index + 1}`,
            }}
          />
        ))}

        {/* 지점이 3개 이상이면 Polygon 생성 */}
        {polygonPoints.length >= 3 && (
          <NaverMapPolygonOverlay
            coords={polygonPoints}
            color="rgba(0, 120, 255, 0.25)"
            outlineColor="rgba(0, 120, 255, 1)"
            outlineWidth={2}
          />
        )}
      </NaverMapView>

      <View style={styles.controlPanel}>
        <Text style={styles.title}>
          Polygon 편집
        </Text>

        <Text style={styles.pointCount}>
          선택된 지점: {polygonPoints.length}개
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="마지막 지점 취소"
            disabled={polygonPoints.length === 0}
            onPress={() => {
              setPolygonPoints((prev) =>
                prev.slice(0, -1),
              );
            }}
          />

          <Button
            title="전체 초기화"
            disabled={polygonPoints.length === 0}
            onPress={() => {
              setPolygonPoints([]);
            }}
          />
        </View>

        {polygonPoints.length >= 3 && (
          <Text style={styles.completeText}>
            Polygon 생성 완료
          </Text>
        )}

        {polygonPoints.length > 0 && (
          <Text style={styles.helpText}>
            Android 뒤로가기를 누르면 마지막 지점이
            삭제됩니다.
          </Text>
        )}
      </View>
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

  controlPanel: {
    position: 'absolute',

    top: 50,
    left: 20,
    right: 20,

    backgroundColor: 'white',

    padding: 14,

    borderRadius: 12,

    elevation: 5,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',

    marginBottom: 5,
  },

  pointCount: {
    fontSize: 14,
  },

  buttonContainer: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    marginTop: 10,
  },

  completeText: {
    marginTop: 10,

    textAlign: 'center',

    fontWeight: '700',
  },

  helpText: {
    marginTop: 8,

    fontSize: 12,

    textAlign: 'center',
  },
});