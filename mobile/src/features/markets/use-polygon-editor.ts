import {
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  BackHandler,
} from 'react-native';

import {
  savePolygonToDocument,
} from './polygon-storage';

import type {
  Coordinate,
  SavedMarketPolygon,
} from './types';


export function usePolygonEditor() {
  const [points, setPoints] =
    useState<Coordinate[]>([]);

  const [savedPolygon, setSavedPolygon] =
    useState<SavedMarketPolygon | null>(null);

  const [marketName, setMarketName] =
    useState('');

  const [isNameModalVisible, setIsNameModalVisible] =
    useState(false);


  useEffect(() => {
    const handleBackPress = () => {
      if (isNameModalVisible) {
        setIsNameModalVisible(
          false,
        );

        return true;
      }


      if (points.length > 0) {
        setPoints(
          (currentPoints) =>
            currentPoints.slice(0, -1),
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
  }, [
    isNameModalVisible,
    points.length,
  ]);


  const addPoint = (
    point: Coordinate,
  ) => {
    setPoints(
      (currentPoints) => [
        ...currentPoints,
        point,
      ],
    );
  };


  const undoPoint = () => {
    setPoints(
      (currentPoints) =>
        currentPoints.slice(0, -1),
    );
  };


  const reset = () => {
    setPoints(
      [],
    );
  };


  const requestSave = () => {
    if (points.length < 3) {
      Alert.alert(
        '저장 불가',
        'Polygon은 최소 3개의 정점이 필요합니다.',
      );

      return;
    }


    setIsNameModalVisible(
      true,
    );
  };


  const confirmSave = () => {
    if (!marketName.trim()) {
      Alert.alert(
        '이름 필요',
        '시장 이름을 입력해주세요.',
      );

      return;
    }


    if (points.length < 3) {
      Alert.alert(
        '저장 불가',
        'Polygon은 최소 3개의 정점이 필요합니다.',
      );

      return;
    }


    try {
      const result =
        savePolygonToDocument(
          marketName,
          points,
        );


      setSavedPolygon(
        result.polygon,
      );

      setPoints(
        [],
      );

      setMarketName(
        '',
      );

      setIsNameModalVisible(
        false,
      );


      console.log(
        '저장된 Polygon:',
        result.polygon,
      );

      console.log(
        'JSON 저장 위치:',
        result.uri,
      );


      Alert.alert(
        '저장 완료',
        `${result.polygon.name} 영역이 저장되었습니다.\n\n${result.uri}`,
      );
    } catch (saveError) {
      console.error(
        'Polygon 저장 실패:',
        saveError,
      );


      Alert.alert(
        '저장 실패',
        saveError instanceof Error
          ? saveError.message
          : 'Polygon 저장 중 오류가 발생했습니다.',
      );
    }
  };


  return {
    points,
    savedPolygon,
    marketName,
    isNameModalVisible,
    setMarketName,
    addPoint,
    undoPoint,
    reset,
    requestSave,
    confirmSave,
    closeNameModal: () => {
      setIsNameModalVisible(
        false,
      );
    },
    clearSavedPolygon: () => {
      setSavedPolygon(
        null,
      );
    },
  };
}
