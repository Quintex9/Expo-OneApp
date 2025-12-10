import { View, Text, StyleSheet } from 'react-native';
import {person} from '../data.json'

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profie Screen (Blank page)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});
