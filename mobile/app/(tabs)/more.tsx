import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/constants/Theme';
import { useAuthStore } from '../../src/store/useAuthStore';

type MenuItem = {
  icon: string;
  label: string;
  desc: string;
  route: string;
  color: string;
};

const MENU_ITEMS: MenuItem[] = [
  { icon: '🏆', label: 'Hackathons', desc: 'Team competitions ICPC-style', route: '/hackathon', color: Theme.colors.stateWarning },
  { icon: '💬', label: 'Forum', desc: 'Discussions & Q&A', route: '/discussion', color: '#3b82f6' },
  { icon: '🔔', label: 'Notifications', desc: 'Alerts for duels, hackathons & more', route: '/notifications', color: '#8b5cf6' },
  { icon: '⚙️', label: 'Settings', desc: 'Edit profile, password, preferences', route: '/settings', color: Theme.colors.textSecondary },
  { icon: '👥', label: 'Teams', desc: 'Manage your hackathon teams', route: '/teams', color: Theme.colors.stateSuccess },
  { icon: '🤖', label: 'AI Interview', desc: 'Mock technical interview with AI', route: '/ai-interview', color: Theme.colors.brandPrimary },
  { icon: '🏢', label: 'Companies', desc: 'Browse company challenges & jobs', route: '/company', color: '#ec4899' },
  { icon: '📊', label: 'Analytics', desc: 'Your performance trends', route: '/analytics', color: '#14b8a6' },
];

export default function MoreTab() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>MORE FEATURES</Text>

        <View style={styles.grid}>
          {MENU_ITEMS.map(item => (
            <Pressable
              key={item.route}
              style={[styles.card, { borderColor: `${item.color}44` }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${item.color}22`, borderColor: `${item.color}66` }]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.desc} numberOfLines={2}>{item.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* App info */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>⚔ BYTEBATTLE</Text>
          <Text style={styles.footerText}>v1.0.0 · Made by ByteBattle Team</Text>
          <Text style={styles.footerSub}>4TWIN7 · ESPRIT · 2025-26</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 14,
    letterSpacing: 2, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, padding: 16 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  icon: { fontSize: 24 },
  label: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 15, marginBottom: 4 },
  desc: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12, lineHeight: 16 },
  footer: { alignItems: 'center', marginTop: 32, paddingTop: 24,
    borderTopWidth: 1, borderTopColor: Theme.colors.borderDefault },
  footerTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 20, letterSpacing: 4, marginBottom: 6 },
  footerText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13, marginBottom: 4 },
  footerSub: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12 },
});
