import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/src/constants/Theme'; // Assuming aliases exist or relative path falls back or you will fix it

export default function GenericScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MODULE LOADING...</Text>
      <Text style={styles.text}>This route is successfully scaffolded.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b1020', // Cyber dark background
    padding: 20,
  },
  title: {
    color: '#f59e0b',
    fontSize: 24,
    marginBottom: 10,
  },
  text: {
    color: '#818cf8',
    fontSize: 16,
    textAlign: 'center',
  }
});
