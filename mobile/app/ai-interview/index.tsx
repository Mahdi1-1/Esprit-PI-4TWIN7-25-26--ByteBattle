import {
  View, Text, StyleSheet, Pressable, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/constants/Theme';

export default function AIInterview() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🤖</Text>
          <Text style={styles.heroTitle}>MOCK INTERVIEW</Text>
          <Text style={styles.heroSub}>Practice technical interviews with our AI</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>CHOOSE ROLE</Text>
          <View style={styles.rolesGrid}>
            {['Frontend', 'Backend', 'Fullstack', 'DevSecOps'].map(r => (
              <Pressable key={r} style={styles.roleBtn}>
                <Text style={styles.roleText}>{r}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.startBtn} onPress={() => {}}>
          <Text style={styles.startText}>START INTERVIEW</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  header: { padding: 16 },
  backBtn: { padding: 8 },
  backText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 16 },
  content: { padding: 16, alignItems: 'center' },
  hero: { alignItems: 'center', marginBottom: 32 },
  heroIcon: { fontSize: 64, marginBottom: 16 },
  heroTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 24, letterSpacing: 2, marginBottom: 8 },
  heroSub: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 14, textAlign: 'center' },
  card: { width: '100%', backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius, borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 20, marginBottom: 24 },
  cardTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 14, letterSpacing: 1, marginBottom: 16 },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleBtn: { flex: 1, minWidth: '45%', backgroundColor: Theme.colors.surface2, borderWidth: 1, borderColor: Theme.colors.borderDefault, borderRadius: 8, padding: 12, alignItems: 'center' },
  roleText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 14 },
  startBtn: { width: '100%', backgroundColor: Theme.colors.brandPrimary, borderRadius: Theme.layout.borderRadius, padding: 18, alignItems: 'center' },
  startText: { fontFamily: Theme.fonts.title, color: '#0b1020', fontSize: 16, letterSpacing: 2 },
});
