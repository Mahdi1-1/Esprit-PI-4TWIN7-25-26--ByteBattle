import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { Image } from 'react-native';
import { Theme } from '../../src/constants/Theme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { dashboardService } from '../../src/services/dashboardService';
import { profileService } from '../../src/services/profileService';

const SKILL_LABELS: Record<string, string> = {
  Algorithm: 'Algorithm', CleanCode: 'Clean Code',
  DataStructures: 'Data Structs', DynamicProgramming: 'Dyn. Prog.',
  Graph: 'Graph / Trees', Debug: 'Debug', Speed: 'Speed',
};

export default function HomeTab() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  const [recommended, stats, skills] = useQueries({
    queries: [
      { queryKey: ['recommended'], queryFn: dashboardService.getRecommended, staleTime: 60_000 },
      { queryKey: ['profile-stats'], queryFn: profileService.getProfileStats, staleTime: 60_000 },
      { queryKey: ['skills'], queryFn: dashboardService.getSkills, staleTime: 120_000 },
    ],
  });

  const xpPct = (user?.xp ?? 0) / (1000 * (user?.level ?? 1));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Text style={styles.greeting}>WELCOME BACK, <Text style={styles.username}>{user?.username?.toUpperCase() ?? 'WARRIOR'}</Text> 👋</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: profileService.getAvatarUrl(user?.profileImage, user?.username) }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.username}</Text>
            <Text style={styles.eloText}>ELO: <Text style={styles.eloValue}>{stats.data?.elo ?? user?.elo ?? '—'}</Text></Text>
            <Text style={styles.rankText}>
              Rank #{stats.data?.leaderboardPosition ?? '—'} / {stats.data?.totalUsers ?? '—'}
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNum}>{user?.level ?? 1}</Text>
            <Text style={styles.levelLabel}>LVL</Text>
          </View>
        </View>

        {/* XP Bar */}
        <View style={styles.xpBarContainer}>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${Math.min(xpPct * 100, 100)}%` as any }]} />
          </View>
          <Text style={styles.xpText}>{user?.xp ?? 0} / {1000 * (user?.level ?? 1)} XP</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'WINS', value: stats.data?.duelsWon ?? '—' },
            { label: 'SOLVED', value: stats.data?.challengesSolved ?? '—' },
            { label: 'WIN%', value: stats.data ? `${stats.data.winRate.toFixed(0)}%` : '—' },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          <Pressable style={[styles.actionCard, styles.actionCyan]} onPress={() => router.push('/duel/matchmaking')}>
            <Text style={styles.actionIcon}>⚔️</Text>
            <Text style={styles.actionTitle}>QUICK DUEL</Text>
            <Text style={styles.actionDesc}>Challenge a player now</Text>
          </Pressable>
          <Pressable style={[styles.actionCard, styles.actionPurple]} onPress={() => router.push('/(tabs)/problems')}>
            <Text style={styles.actionIcon}>💻</Text>
            <Text style={styles.actionTitle}>SOLO BATTLE</Text>
            <Text style={styles.actionDesc}>Solve a challenge</Text>
          </Pressable>
          <Pressable style={[styles.actionCard, styles.actionBlue]} onPress={() => router.push('/hackathon')}>
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionTitle}>HACKATHON</Text>
            <Text style={styles.actionDesc}>Team competition</Text>
          </Pressable>
        </View>

        {/* Recommended Battles */}
        <Text style={styles.sectionTitle}>RECOMMENDED BATTLES</Text>
        {recommended.isLoading
          ? <ActivityIndicator color={Theme.colors.brandPrimary} style={{ marginVertical: 20 }} />
          : (recommended.data ?? []).slice(0, 5).map((p: any) => (
            <Pressable key={p._id || p.id} style={styles.problemCard} onPress={() => router.push(`/problems/${p._id || p.id}`)}>
              <View style={styles.problemHeader}>
                <Text style={styles.problemTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={[styles.problemDiff, {
                  color: p.difficulty === 'easy' ? Theme.colors.stateSuccess
                    : p.difficulty === 'medium' ? Theme.colors.stateWarning : Theme.colors.stateError
                }]}>
                  {p.difficulty?.toUpperCase()}
                </Text>
              </View>
              {p.tags?.length > 0 && (
                <View style={styles.tagsRow}>
                  {p.tags.slice(0, 3).map((t: string) => (
                    <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
                  ))}
                </View>
              )}
            </Pressable>
          ))
        }
        {!recommended.isLoading && (recommended.data ?? []).length === 0 && (
          <Text style={styles.emptyText}>No recommendations yet. Solve some challenges!</Text>
        )}

        {/* Skills */}
        <Text style={styles.sectionTitle}>YOUR SKILLS</Text>
        {skills.isLoading
          ? <ActivityIndicator color={Theme.colors.brandPrimary} style={{ marginVertical: 20 }} />
          : Object.entries(skills.data ?? {}).map(([key, val]: [string, any]) => (
            <View key={key} style={styles.skillRow}>
              <View style={styles.skillHeader}>
                <Text style={styles.skillName}>{SKILL_LABELS[key] ?? key}</Text>
                <Text style={styles.skillPct}>{val}%</Text>
              </View>
              <View style={styles.skillBarBg}>
                <View style={[styles.skillBarFill, { width: `${val}%` as any }]} />
              </View>
            </View>
          ))
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  greeting: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13, letterSpacing: 1, marginBottom: 16 },
  username: { color: Theme.colors.brandPrimary, fontFamily: Theme.fonts.title },
  profileCard: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: Theme.colors.brandPrimary, marginRight: 12 },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 18 },
  eloText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  eloValue: { color: Theme.colors.brandPrimary, fontWeight: 'bold' },
  rankText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  levelBadge: { backgroundColor: Theme.colors.surface2, borderRadius: 8, padding: 8, alignItems: 'center', minWidth: 52 },
  levelNum: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 24 },
  levelLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1 },
  xpBarContainer: { marginBottom: 20 },
  xpBarBg: { height: 6, backgroundColor: Theme.colors.surface2, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  xpBarFill: { height: '100%', backgroundColor: Theme.colors.brandPrimary, borderRadius: 3 },
  xpText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, textAlign: 'right' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 14, alignItems: 'center' },
  statValue: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 22 },
  statLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, marginTop: 2 },
  sectionTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 14,
    letterSpacing: 2, marginBottom: 12, marginTop: 8 },
  actionsRow: { gap: 10, marginBottom: 24 },
  actionCard: { borderRadius: Theme.layout.cardRadius, borderWidth: 1, padding: 16, marginBottom: 2 },
  actionCyan: { backgroundColor: 'rgba(0,229,255,0.08)', borderColor: 'rgba(0,229,255,0.3)' },
  actionPurple: { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.3)' },
  actionBlue: { backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.3)' },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 15, letterSpacing: 1 },
  actionDesc: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  problemCard: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 14, marginBottom: 10 },
  problemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  problemTitle: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 16, flex: 1, marginRight: 8 },
  problemDiff: { fontFamily: Theme.fonts.title, fontSize: 12, letterSpacing: 1 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { backgroundColor: Theme.colors.surface2, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11 },
  emptyText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, textAlign: 'center', padding: 20 },
  skillRow: { marginBottom: 14 },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  skillName: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 13 },
  skillPct: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 13, fontWeight: 'bold' },
  skillBarBg: { height: 6, backgroundColor: Theme.colors.surface2, borderRadius: 3, overflow: 'hidden' },
  skillBarFill: { height: '100%', backgroundColor: `${Theme.colors.brandPrimary}CC`, borderRadius: 3 },
});
