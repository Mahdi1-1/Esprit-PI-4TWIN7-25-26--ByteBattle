import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/constants/Theme';

export default function Analytics() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={styles.icon}>📊</Text>
        <Text style={styles.title}>ANALYTICS</Text>
        <Text style={styles.desc}>This feature is coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  header: { padding: 16 },
  backBtn: { padding: 8 },
  backText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 16 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 24, letterSpacing: 2, marginBottom: 8 },
  desc: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 16, textAlign: 'center' },
});
