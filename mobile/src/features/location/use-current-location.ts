import { useEffect, useState } from 'react';

import * as Location from 'expo-location';


type CurrentLocationState = {
  location: Location.LocationObject | null;
  error: string | null;
  isLoading: boolean;
};


export function useCurrentLocation(): CurrentLocationState {
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {
    let isActive = true;


    async function loadLocation() {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();


        if (!isActive) {
          return;
        }


        if (status !== 'granted') {
          setError(
            '위치 권한이 필요합니다.',
          );

          return;
        }


        const currentLocation =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });


        if (isActive) {
          setLocation(
            currentLocation,
          );
        }
      } catch (locationError) {
        console.error(
          '현재 위치 가져오기 실패:',
          locationError,
        );


        if (isActive) {
          setError(
            '현재 위치를 가져올 수 없습니다.',
          );
        }
      }
    }


    loadLocation();


    return () => {
      isActive = false;
    };
  }, []);


  return {
    location,
    error,
    isLoading:
      !location && !error,
  };
}
