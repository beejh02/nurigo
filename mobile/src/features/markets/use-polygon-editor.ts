import {
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  BackHandler,
} from 'react-native';

import type {
  MarketBoundaryDraftWriter,
} from './repositories/market-boundary-draft-writer';

import type {
  Coordinate,
  SubmittedMarketBoundaryDraft,
} from './types';


type UsePolygonEditorOptions = {
  draftWriter: MarketBoundaryDraftWriter;
};


export function usePolygonEditor({
  draftWriter,
}: UsePolygonEditorOptions) {
  const [points, setPoints] =
    useState<Coordinate[]>([]);

  const [submittedDraft, setSubmittedDraft] =
    useState<SubmittedMarketBoundaryDraft | null>(null);

  const [adminToken, setAdminToken] =
    useState('');

  const [marketName, setMarketName] =
    useState('');

  const [regionCode, setRegionCode] =
    useState('daejeon');

  const [isSaveModalVisible, setIsSaveModalVisible] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);


  useEffect(() => {
    const handleBackPress = () => {
      if (isSaveModalVisible) {
        if (!isSaving) {
          setAdminToken(
            '',
          );

          setIsSaveModalVisible(
            false,
          );
        }


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
    isSaveModalVisible,
    isSaving,
    points.length,
  ]);


  const addPoint = (
    point: Coordinate,
  ) => {
    if (isSaving) {
      return;
    }


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


    setIsSaveModalVisible(
      true,
    );
  };


  const confirmSave = async () => {
    if (!marketName.trim()) {
      Alert.alert(
        '시장명 필요',
        '새로 등록할 시장 이름을 입력해주세요.',
      );

      return;
    }


    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        regionCode.trim(),
      )
    ) {
      Alert.alert(
        '지역 코드 확인',
        '지역 코드는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.',
      );

      return;
    }


    if (!adminToken.trim()) {
      Alert.alert(
        '토큰 필요',
        '백엔드에 설정한 관리자 토큰을 입력해주세요.',
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


    setIsSaving(
      true,
    );


    try {
      const result =
        await draftWriter.createDraft({
          marketName,
          regionCode,
          points,
          adminToken,
        });


      setSubmittedDraft(
        result,
      );

      setPoints(
        [],
      );

      setAdminToken(
        '',
      );

      setMarketName(
        '',
      );

      setIsSaveModalVisible(
        false,
      );


      Alert.alert(
        'DB 저장 완료',
        `${result.name} 경계가 draft revision ${result.revision}로 저장되었습니다.\n시장 ID: ${result.marketId}`,
      );
    } catch (saveError) {
      console.error(
        'Polygon DB 저장 실패:',
        saveError,
      );


      Alert.alert(
        'DB 저장 실패',
        saveError instanceof Error
          ? saveError.message
          : 'Polygon 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  };


  return {
    points,
    submittedDraft,
    adminToken,
    marketName,
    regionCode,
    isSaveModalVisible,
    isSaving,
    setAdminToken,
    setMarketName,
    setRegionCode,
    addPoint,
    undoPoint,
    reset,
    requestSave,
    confirmSave,
    closeSaveModal: () => {
      if (isSaving) {
        return;
      }


      setAdminToken(
        '',
      );

      setIsSaveModalVisible(
        false,
      );
    },
    clearSubmittedDraft: () => {
      setSubmittedDraft(
        null,
      );
    },
  };
}
