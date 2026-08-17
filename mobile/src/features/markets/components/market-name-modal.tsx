import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';


type MarketNameModalProps = {
  visible: boolean;
  marketName: string;
  onChangeMarketName: (name: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};


export function MarketNameModal({
  visible,
  marketName,
  onChangeMarketName,
  onCancel,
  onConfirm,
}: MarketNameModalProps) {
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
              onChangeMarketName
            }

            placeholder="예: 전통시장"

            autoFocus={
              true
            }

            returnKeyType="done"

            onSubmitEditing={
              onConfirm
            }
          />


          <View style={styles.modalButtonRow}>
            <Pressable
              style={[
                styles.modalButton,
                styles.cancelButton,
              ]}

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
              ]}

              onPress={
                onConfirm
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
        6,

      marginBottom:
        14,

      fontSize:
        13,
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


    confirmButtonText: {
      color:
        'white',

      fontWeight:
        '700',
    },
  });
