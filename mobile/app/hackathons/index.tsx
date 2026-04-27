import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../src/constants/Theme';

export default function GenericScreen({ route }: { route?: any }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MODULE LOADING...</Text>
      <Text style={styles.text}>This module is currently being transferred to the mobile network.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    padding: 20,
  },
  title: {
    fontFamily: Theme.fonts.title,
    color: Theme.colors.stateWarning,
    fontSize: 24,
    marginBottom: 10,
  },
  text: {
    fontFamily: Theme.fonts.ui,
    color: Theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  }
});
