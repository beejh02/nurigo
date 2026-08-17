import {
  StyleSheet,
  Text,
  View,
} from 'react-native';


type ScreenMessageProps = {
  children: string;
};


export function ScreenMessage({
  children,
}: ScreenMessageProps) {
  return (
    <View style={styles.container}>
      <Text>
        {children}
      </Text>
    </View>
  );
}


const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },
  });
