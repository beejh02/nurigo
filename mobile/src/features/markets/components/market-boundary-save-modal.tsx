import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';


type MarketBoundarySaveModalProps = {
  visible: boolean;
  marketName: string;
  regionCode: string;
  adminToken: string;
  isSaving: boolean;
  onChangeMarketName: (marketName: string) => void;
  onChangeRegionCode: (regionCode: string) => void;
  onChangeAdminToken: (token: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};


export function MarketBoundarySaveModal({
  visible,
  marketName,
  regionCode,
  adminToken,
  isSaving,
  onChangeMarketName,
  onChangeRegionCode,
  onChangeAdminToken,
  onCancel,
  onConfirm,
}: MarketBoundarySaveModalProps) {
  return (
    <Modal
      visible={
        visible
      }

      transparent={
        true
      }

      animationType="fade"

      onRequestClose={
        onCancel
      }
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            DB에 경계 저장
          </Text>


          <Text style={styles.modalDescription}>
            새 시장과 선택한 Polygon을 PostGIS에 draft로 저장합니다.
          </Text>


          <Text style={styles.inputLabel}>
            시장명
          </Text>


          <TextInput
            style={styles.input}

            value={
              marketName
            }

            onChangeText={
              onChangeMarketName
            }

            placeholder="예: 문창전통시장"

            editable={
              !isSaving
            }

            autoFocus={
              true
            }
          />


          <Text style={styles.inputLabel}>
            지역 코드
          </Text>


          <TextInput
            style={styles.input}

            value={
              regionCode
            }

            onChangeText={
              onChangeRegionCode
            }

            placeholder="예: daejeon"

            editable={
              !isSaving
            }

            autoCapitalize="none"

            autoCorrect={
              false
            }
          />


          <Text style={styles.inputLabel}>
            관리자 토큰
          </Text>


          <TextInput
            style={styles.input}

            value={
              adminToken
            }

            onChangeText={
              onChangeAdminToken
            }

            placeholder="관리자 토큰"

            editable={
              !isSaving
            }

            secureTextEntry={
              true
            }

            autoCapitalize="none"

            autoCorrect={
              false
            }

            returnKeyType="send"

            onSubmitEditing={
              onConfirm
            }
          />


          <Text style={styles.tokenHelp}>
            토큰은 앱 파일이나 환경변수에 저장하지 않습니다.
          </Text>


          <View style={styles.modalButtonRow}>
            <Pressable
              style={[
                styles.modalButton,
                styles.cancelButton,
                isSaving
                  ? styles.disabledButton
                  : null,
              ]}

              disabled={
                isSaving
              }

              onPress={
                onCancel
              }
            >
              <Text>
                취소
              </Text>
            </Pressable>


            <Pressable
              style={[
                styles.modalButton,
                styles.confirmButton,
                isSaving
                  ? styles.disabledButton
                  : null,
              ]}

              disabled={
                isSaving
              }

              onPress={
                onConfirm
              }
            >
              <Text style={styles.confirmButtonText}>
                {isSaving
                  ? '저장 중...'
                  : 'DB 저장'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}


const styles =
  StyleSheet.create({
    modalBackground: {
      flex:
        1,

      backgroundColor:
        'rgba(0,0,0,0.45)',

      justifyContent:
        'center',

      padding:
        24,
    },


    modalContainer: {
      backgroundColor:
        'white',

      borderRadius:
        16,

      padding:
        20,
    },


    modalTitle: {
      fontSize:
        20,

      fontWeight:
        '700',
    },


    modalDescription: {
      marginTop:
        8,

      marginBottom:
        10,

      fontSize:
        13,
    },


    inputLabel: {
      marginTop:
        8,

      marginBottom:
        4,

      fontSize:
        13,

      fontWeight:
        '600',
    },


    input: {
      borderWidth:
        1,

      borderColor:
        '#ccc',

      borderRadius:
        8,

      paddingHorizontal:
        12,

      paddingVertical:
        10,

      fontSize:
        16,
    },


    tokenHelp: {
      marginTop:
        6,

      color:
        '#666666',

      fontSize:
        12,
    },


    modalButtonRow: {
      flexDirection:
        'row',

      gap:
        10,

      marginTop:
        16,
    },


    modalButton: {
      flex:
        1,

      paddingVertical:
        12,

      alignItems:
        'center',

      borderRadius:
        8,
    },


    cancelButton: {
      backgroundColor:
        '#eeeeee',
    },


    confirmButton: {
      backgroundColor:
        '#222222',
    },


    disabledButton: {
      opacity:
        0.5,
    },


    confirmButtonText: {
      color:
        'white',

      fontWeight:
        '700',
    },
  });
