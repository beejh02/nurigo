import {
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  SubmittedMarketBoundaryDraft,
} from '../types';


type PolygonEditorPanelProps = {
  registeredBoundaryCount: number;
  pointCount: number;
  submittedDraft: SubmittedMarketBoundaryDraft | null;
  isSaving: boolean;
  onUndo: () => void;
  onReset: () => void;
  onRequestSave: () => void;
  onClearSubmittedDraft: () => void;
};


export function PolygonEditorPanel({
  registeredBoundaryCount,
  pointCount,
  submittedDraft,
  isSaving,
  onUndo,
  onReset,
  onRequestSave,
  onClearSubmittedDraft,
}: PolygonEditorPanelProps) {
  return (
    <View style={styles.controlPanel}>
      <Text style={styles.title}>
        Polygon 편집
      </Text>


      <Text style={styles.registeredMarketText}>
        검수된 전통시장 경계: {registeredBoundaryCount}개
      </Text>


      {submittedDraft ? (
        <Text style={styles.savedMarketName}>
          DB 저장 영역: {submittedDraft.name}
        </Text>
      ) : (
        <Text style={styles.pointCount}>
          선택된 정점: {pointCount}개
        </Text>
      )}


      {!submittedDraft && (
        <>
          <View style={styles.buttonRow}>
            <View style={styles.button}>
              <Button
                title="실행 취소"

                disabled={
                  pointCount === 0
                  || isSaving
                }

                onPress={
                  onUndo
                }
              />
            </View>


            <View style={styles.button}>
              <Button
                title="전체 초기화"

                disabled={
                  pointCount === 0
                  || isSaving
                }

                onPress={
                  onReset
                }
              />
            </View>
          </View>


          <View style={styles.saveButton}>
            <Button
              title={
                isSaving
                  ? 'DB 저장 중...'
                  : 'DB에 Polygon 저장'
              }

              disabled={
                pointCount < 3
                || isSaving
              }

              onPress={
                onRequestSave
              }
            />
          </View>


          {pointCount < 3 ? (
            <Text style={styles.helpText}>
              최소 3개의 정점을 선택하세요.
            </Text>
          ) : (
            <Text style={styles.readyText}>
              저장 가능한 영역입니다.
            </Text>
          )}


          {pointCount > 0 && (
            <Text style={styles.helpText}>
              뒤로가기를 누르면 마지막 정점이 삭제됩니다.
            </Text>
          )}
        </>
      )}


      {submittedDraft && (
        <>
          <Text style={styles.savedText}>
            draft revision {submittedDraft.revision} · {submittedDraft.points.length}개 정점
          </Text>


          <Text
            style={styles.marketIdText}

            selectable={
              true
            }
          >
            시장 ID: {submittedDraft.marketId}
          </Text>


          <View style={styles.saveButton}>
            <Button
              title="새 영역 만들기"

              onPress={
                onClearSubmittedDraft
              }
            />
          </View>
        </>
      )}
    </View>
  );
}


const styles =
  StyleSheet.create({
    controlPanel: {
      position:
        'absolute',

      top:
        50,

      left:
        20,

      right:
        20,

      backgroundColor:
        'white',

      padding:
        14,

      borderRadius:
        12,

      elevation:
        5,
    },


    title: {
      fontSize:
        18,

      fontWeight:
        '700',

      marginBottom:
        5,
    },


    registeredMarketText: {
      fontSize:
        13,

      fontWeight:
        '600',

      marginBottom:
        4,
    },


    pointCount: {
      fontSize:
        14,
    },


    savedMarketName: {
      fontSize:
        16,

      fontWeight:
        '700',

      marginTop:
        4,
    },


    buttonRow: {
      flexDirection:
        'row',

      gap:
        10,

      marginTop:
        10,
    },


    button: {
      flex:
        1,
    },


    saveButton: {
      marginTop:
        10,
    },


    helpText: {
      marginTop:
        8,

      fontSize:
        12,

      textAlign:
        'center',
    },


    readyText: {
      marginTop:
        8,

      textAlign:
        'center',

      fontSize:
        13,

      fontWeight:
        '700',
    },


    savedText: {
      marginTop:
        8,

      textAlign:
        'center',
    },


    marketIdText: {
      marginTop:
        6,

      color:
        '#555555',

      fontSize:
        11,

      textAlign:
        'center',
    },
  });
