import { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Button,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as Location from 'expo-location';

import {
  File,
  Paths,
} from 'expo-file-system';

import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapPolygonOverlay,
  NaverMapPolylineOverlay,
} from '@mj-studio/react-native-naver-map';


type Coordinate = {
  latitude: number;
  longitude: number;
};


type MarketPolygon = {
  id: string;
  name: string;
  createdAt: string;
  points: Coordinate[];
};


export default function HomeScreen() {
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  // 현재 편집 중인 좌표
  const [polygonPoints, setPolygonPoints] =
    useState<Coordinate[]>([]);

  // 저장 완료된 Polygon
  const [savedPolygon, setSavedPolygon] =
    useState<MarketPolygon | null>(null);

  // 시장 이름 입력
  const [marketName, setMarketName] =
    useState('');

  // 이름 입력 Modal
  const [isNameModalVisible, setIsNameModalVisible] =
    useState(false);


  /*
   * 현재 위치 가져오기
   */
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


  /*
   * Android 뒤로가기
   *
   * 편집 중이면 마지막 정점 삭제
   */
  useEffect(() => {
    const handleBackPress = () => {
      if (isNameModalVisible) {
        setIsNameModalVisible(false);

        return true;
      }

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
  }, [
    polygonPoints.length,
    isNameModalVisible,
  ]);


  /*
   * 지도에 새로운 정점 추가
   */
  const addPolygonPoint = (
    latitude: number,
    longitude: number,
  ) => {
    const newPoint: Coordinate = {
      latitude,
      longitude,
    };

    setPolygonPoints((prev) => [
      ...prev,
      newPoint,
    ]);
  };


  /*
   * 저장 버튼
   *
   * 일단 이름 입력 Modal 표시
   */
  const handleSaveButton = () => {
    if (polygonPoints.length < 3) {
      Alert.alert(
        '저장 불가',
        'Polygon은 최소 3개의 정점이 필요합니다.',
      );

      return;
    }

    setIsNameModalVisible(true);
  };


  /*
   * 실제 JSON 저장
   */
  const handleSavePolygon = () => {
    const trimmedName =
      marketName.trim();


    if (!trimmedName) {
      Alert.alert(
        '이름 필요',
        '시장 이름을 입력해주세요.',
      );

      return;
    }


    if (polygonPoints.length < 3) {
      Alert.alert(
        '저장 불가',
        'Polygon은 최소 3개의 정점이 필요합니다.',
      );

      return;
    }


    try {
      const now =
        Date.now();


      const polygonData: MarketPolygon = {
        id: `market-${now}`,

        name: trimmedName,

        createdAt:
          new Date().toISOString(),

        points: [...polygonPoints],
      };


      /*
       * 파일명에 사용할 수 없는 문자를 제거
       */
      const safeMarketName =
        trimmedName
          .replace(/[\\/:*?"<>|]/g, '')
          .replace(/\s+/g, '_');


      const fileName =
        `${safeMarketName}-${now}.json`;


      const file =
        new File(
          Paths.document,
          fileName,
        );


      file.create();


      file.write(
        JSON.stringify(
          polygonData,
          null,
          2,
        ),
      );


      /*
       * 저장 완료 Polygon 표시
       */
      setSavedPolygon(
        polygonData,
      );


      /*
       * 편집 중이던 좌표 제거
       */
      setPolygonPoints([]);


      /*
       * 입력창 초기화
       */
      setMarketName('');


      setIsNameModalVisible(
        false,
      );


      console.log(
        '저장된 Polygon:',
        polygonData,
      );


      console.log(
        'JSON 저장 위치:',
        file.uri,
      );


      Alert.alert(
        '저장 완료',
        `${trimmedName} 영역이 저장되었습니다.\n\n${file.uri}`,
      );
    } catch (error) {
      console.error(
        'Polygon 저장 실패:',
        error,
      );


      Alert.alert(
        '저장 실패',
        'Polygon 저장 중 오류가 발생했습니다.',
      );
    }
  };


  /*
   * 전체 초기화
   */
  const handleReset = () => {
    setPolygonPoints([]);
  };


  /*
   * 저장된 Polygon 제거
   *
   * 현재는 화면에서만 제거한다.
   * JSON 파일 자체는 삭제하지 않는다.
   */
  const handleClearSavedPolygon = () => {
    setSavedPolygon(null);
  };


  /*
   * 에러
   */
  if (error) {
    return (
      <View style={styles.center}>
        <Text>
          {error}
        </Text>
      </View>
    );
  }


  /*
   * 위치 로딩
   */
  if (!location) {
    return (
      <View style={styles.center}>
        <Text>
          현재 위치 확인 중...
        </Text>
      </View>
    );
  }


  const {
    latitude,
    longitude,
  } = location.coords;


  return (
    <View style={styles.container}>

      {/* ========================= */}
      {/* NAVER MAP */}
      {/* ========================= */}

      <NaverMapView
        style={styles.map}

        camera={{
          latitude,
          longitude,
          zoom: 16,
        }}

        isShowLocationButton={true}

        onTapMap={(event) => {
          addPolygonPoint(
            event.latitude,
            event.longitude,
          );
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


        {/* ========================= */}
        {/* 편집 중 정점 */}
        {/* ========================= */}

        {polygonPoints.map(
          (point, index) => (
            <NaverMapMarkerOverlay
              key={
                `${point.latitude}-${point.longitude}-${index}`
              }

              latitude={
                point.latitude
              }

              longitude={
                point.longitude
              }

              caption={{
                text: `${index + 1}`,
              }}

              image={{
                symbol: 'blue',
              }}
            />
          ),
        )}


        {/* ========================= */}
        {/* 편집 중 Polyline */}
        {/* ========================= */}

        {polygonPoints.length >= 2 && (
          <NaverMapPolylineOverlay
            coords={
              polygonPoints
            }

            width={4}

            color="#0078ff"
          />
        )}


        {/* ========================= */}
        {/* 저장 완료 Polygon */}
        {/* ========================= */}

        {savedPolygon && (
          <NaverMapPolygonOverlay

            coords={
              savedPolygon.points
            }

            color="rgba(0, 120, 255, 0.25)"

            outlineColor="#0078ff"

            outlineWidth={3}
          />
        )}

      </NaverMapView>


      {/* ========================= */}
      {/* CONTROL PANEL */}
      {/* ========================= */}

      <View style={styles.controlPanel}>

        <Text style={styles.title}>
          Polygon 편집
        </Text>


        {savedPolygon ? (
          <Text style={styles.savedMarketName}>
            저장된 영역: {savedPolygon.name}
          </Text>
        ) : (
          <Text style={styles.pointCount}>
            선택된 정점: {polygonPoints.length}개
          </Text>
        )}


        {/* 편집 중 */}

        {!savedPolygon && (
          <>
            <View style={styles.buttonRow}>

              <View style={styles.button}>
                <Button
                  title="실행 취소"

                  disabled={
                    polygonPoints.length === 0
                  }

                  onPress={() => {
                    setPolygonPoints(
                      (prev) =>
                        prev.slice(0, -1),
                    );
                  }}
                />
              </View>


              <View style={styles.button}>
                <Button
                  title="전체 초기화"

                  disabled={
                    polygonPoints.length === 0
                  }

                  onPress={
                    handleReset
                  }
                />
              </View>

            </View>


            <View style={styles.saveButton}>

              <Button
                title="Polygon 저장"

                disabled={
                  polygonPoints.length < 3
                }

                onPress={
                  handleSaveButton
                }
              />

            </View>


            {polygonPoints.length < 3 ? (
              <Text style={styles.helpText}>
                최소 3개의 정점을 선택하세요.
              </Text>
            ) : (
              <Text style={styles.readyText}>
                저장 가능한 영역입니다.
              </Text>
            )}


            {polygonPoints.length > 0 && (
              <Text style={styles.helpText}>
                뒤로가기를 누르면 마지막 정점이 삭제됩니다.
              </Text>
            )}
          </>
        )}


        {/* 저장 완료 */}

        {savedPolygon && (
          <>

            <Text style={styles.savedText}>
              {savedPolygon.points.length}개의 정점이 저장되었습니다.
            </Text>


            <View style={styles.saveButton}>

              <Button
                title="새 영역 만들기"

                onPress={
                  handleClearSavedPolygon
                }
              />

            </View>

          </>
        )}

      </View>


      {/* ========================= */}
      {/* 시장 이름 입력 MODAL */}
      {/* ========================= */}

      <Modal
        visible={
          isNameModalVisible
        }

        transparent={true}

        animationType="fade"

        onRequestClose={() => {
          setIsNameModalVisible(false);
        }}
      >

        <View style={styles.modalBackground}>

          <View style={styles.modalContainer}>

            <Text style={styles.modalTitle}>
              시장 이름 입력
            </Text>


            <Text style={styles.modalDescription}>
              저장할 Polygon의 이름을 입력해주세요.
            </Text>


            <TextInput
              style={styles.input}

              value={
                marketName
              }

              onChangeText={
                setMarketName
              }

              placeholder="예: 대전중앙시장"

              autoFocus={true}

              returnKeyType="done"

              onSubmitEditing={
                handleSavePolygon
              }
            />


            <View style={styles.modalButtonRow}>

              <Pressable
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}

                onPress={() => {
                  setIsNameModalVisible(false);
                }}
              >

                <Text>
                  취소
                </Text>

              </Pressable>


              <Pressable
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                ]}

                onPress={
                  handleSavePolygon
                }
              >

                <Text style={styles.confirmButtonText}>
                  저장
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

    </View>
  );
}


const styles =
  StyleSheet.create({

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


    /*
     * 상단 컨트롤 패널
     */

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


    savedMarketName: {
      fontSize: 16,

      fontWeight: '700',

      marginTop: 4,
    },


    buttonRow: {
      flexDirection: 'row',

      gap: 10,

      marginTop: 10,
    },


    button: {
      flex: 1,
    },


    saveButton: {
      marginTop: 10,
    },


    helpText: {
      marginTop: 8,

      fontSize: 12,

      textAlign: 'center',
    },


    readyText: {
      marginTop: 8,

      textAlign: 'center',

      fontSize: 13,

      fontWeight: '700',
    },


    savedText: {
      marginTop: 8,

      textAlign: 'center',
    },


    /*
     * Modal
     */

    modalBackground: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.45)',

      justifyContent: 'center',

      padding: 24,
    },


    modalContainer: {
      backgroundColor: 'white',

      borderRadius: 16,

      padding: 20,
    },


    modalTitle: {
      fontSize: 20,

      fontWeight: '700',
    },


    modalDescription: {
      marginTop: 6,

      marginBottom: 14,

      fontSize: 13,
    },


    input: {
      borderWidth: 1,

      borderColor: '#ccc',

      borderRadius: 8,

      paddingHorizontal: 12,

      paddingVertical: 10,

      fontSize: 16,
    },


    modalButtonRow: {
      flexDirection: 'row',

      gap: 10,

      marginTop: 16,
    },


    modalButton: {
      flex: 1,

      paddingVertical: 12,

      alignItems: 'center',

      borderRadius: 8,
    },


    cancelButton: {
      backgroundColor: '#eeeeee',
    },


    confirmButton: {
      backgroundColor: '#222222',
    },


    confirmButtonText: {
      color: 'white',

      fontWeight: '700',
    },
  });