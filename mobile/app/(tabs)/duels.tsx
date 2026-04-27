import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import { duelsService } from '../../src/services/appServices';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function DuelsTab() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  const { data: myStats } = useQuery({
    queryKey: ['duel-mystats'],
    queryFn: duelsService.getMyStats,
    retry: false,
  });

  const { data: queueStats } = useQuery({
    queryKey: ['duel-queue'],
    queryFn: duelsService.getQueueStats,
    refetchInterval: 10_000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={{ fontSize: 48 }}>⚔️</Text>
          </View>
          <Text style={styles.heroTitle}>ARENA</Text>
          <Text style={styles.heroSub}>Real-time 1v1 coding battles</Text>
        </View>

        {/* Live queue stats */}
        <View style={styles.statsBar}>
          {[
            { label: 'Online', val: queueStats?.playersOnline ?? '...' },
            { label: 'Active Duels', val: queueStats?.activeDuels ?? '...' },
            { label: 'Wait', val: queueStats ? `~${queueStats.estimatedWaitSeconds}s` : '...' },
          ].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* My duel stats */}
        {myStats && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>MY STATS</Text>
            <View style={styles.myStats}>
              {[
                { label: 'ELO', val: myStats.elo, color: Theme.colors.brandPrimary },
                { label: 'Wins', val: myStats.duelsWon, color: Theme.colors.stateSuccess },
                { label: 'Losses', val: myStats.duelsLost, color: Theme.colors.stateError },
                { label: 'Win %', val: `${myStats.winRate}%`, color: Theme.colors.textPrimary },
              ].map(s => (
                <View key={s.label} style={styles.myStatBox}>
                  <Text style={[styles.myStatVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={styles.myStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            {myStats.recentForm?.length > 0 && (
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Recent: </Text>
                {myStats.recentForm.map((r: string, i: number) => (
                  <View key={i} style={[styles.formChip,
                    { backgroundColor: r === 'W' ? `${Theme.colors.stateSuccess}33` : `${Theme.colors.stateError}33` }]}>
                    <Text style={[styles.formText,
                      { color: r === 'W' ? Theme.colors.stateSuccess : Theme.colors.stateError }]}>{r}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>BATTLE MODES</Text>
        <View style={styles.modesGrid}>
          <Pressable style={styles.modeCard} onPress={() => router.push('/duel/matchmaking')}>
            <Text style={styles.modeIcon}>⚡</Text>
            <Text style={styles.modeTitle}>QUICK MATCH</Text>
            <Text style={styles.modeDesc}>Ranked 1v1 vs similar ELO opponent</Text>
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>RANKED</Text>
            </View>
          </Pressable>

          <Pressable style={[styles.modeCard, styles.modeCardPurple]} onPress={() => {}}>
            <Text style={styles.modeIcon}>🎓</Text>
            <Text style={styles.modeTitle}>PRACTICE</Text>
            <Text style={styles.modeDesc}>Unranked duel for practice</Text>
            <View style={[styles.modeBadge, { borderColor: Theme.colors.brandSecondary }]}>
              <Text style={[styles.modeBadgeText, { color: Theme.colors.brandSecondary }]}>COMING SOON</Text>
            </View>
          </Pressable>
        </View>

        {/* History CTA */}
        <Pressable style={styles.historyBtn} onPress={() => router.push('/duel/history')}>
          <Text style={styles.historyBtnText}>📜 View Match History</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 20, paddingVertical: 20 },
  heroIcon: { width: 90, height: 90, borderRadius: 45,
    backgroundColor: `${Theme.colors.brandPrimary}22`, borderWidth: 2, borderColor: Theme.colors.brandPrimary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 36, letterSpacing: 6,
    textShadowColor: 'rgba(0,229,255,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16 },
  heroSub: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 15, marginTop: 6 },
  statsBar: { flexDirection: 'row', backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', padding: 14 },
  statVal: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 20 },
  statLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, marginTop: 2 },
  card: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16, marginBottom: 16 },
  cardTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 13, letterSpacing: 2, marginBottom: 14 },
  myStats: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  myStatBox: { flex: 1, backgroundColor: Theme.colors.surface2, borderRadius: 8, padding: 10, alignItems: 'center' },
  myStatVal: { fontFamily: Theme.fonts.title, fontSize: 20 },
  myStatLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  formRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  formLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13 },
  formChip: { width: 28, height: 28, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  formText: { fontFamily: Theme.fonts.title, fontSize: 12 },
  sectionTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 14, letterSpacing: 2, marginBottom: 12 },
  modesGrid: { gap: 12, marginBottom: 16 },
  modeCard: { backgroundColor: `${Theme.colors.brandPrimary}0D`, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: `${Theme.colors.brandPrimary}40`, padding: 20 },
  modeCardPurple: { backgroundColor: `${Theme.colors.brandSecondary}0D`, borderColor: `${Theme.colors.brandSecondary}40` },
  modeIcon: { fontSize: 32, marginBottom: 10 },
  modeTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 18, letterSpacing: 2, marginBottom: 6 },
  modeDesc: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13, marginBottom: 12 },
  modeBadge: { alignSelf: 'flex-start', borderWidth: 1, borderColor: Theme.colors.brandPrimary,
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  modeBadgeText: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 11, letterSpacing: 1 },
  historyBtn: { borderWidth: 1, borderColor: Theme.colors.borderDefault, borderRadius: Theme.layout.borderRadius,
    padding: 14, alignItems: 'center' },
  historyBtnText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 15 },
});
