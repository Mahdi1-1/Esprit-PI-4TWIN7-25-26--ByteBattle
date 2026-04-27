import {
  View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { profileService } from '../../src/services/profileService';

type ActivityItem = {
  type: string; problem?: string; opponent?: string; level?: number; title?: string; date: string;
};

const activityIcon: Record<string, string> = {
  solved: '✓', duel_won: '⚔️', duel_lost: '💔', level_up: '⬆️', discussion: '💬',
};
const activityText = (a: ActivityItem) => {
  if (a.type === 'solved') return `Solved "${a.problem}"`;
  if (a.type === 'duel_won') return `Won duel vs ${a.opponent}`;
  if (a.type === 'duel_lost') return `Lost duel vs ${a.opponent}`;
  if (a.type === 'level_up') return `Reached level ${a.level}`;
  if (a.type === 'discussion') return `Posted "${a.title}"`;
  return a.type;
};

export default function ProfileTab() {
  const user = useAuthStore(s => s.user);
  const router = useRouter();

  const [stats, badges, activity] = useQueries({
    queries: [
      { queryKey: ['profile-stats'], queryFn: profileService.getProfileStats, staleTime: 60_000 },
      { queryKey: ['badges'], queryFn: profileService.getBadges, staleTime: 120_000 },
      { queryKey: ['activity'], queryFn: () => profileService.getActivity(15), staleTime: 60_000 },
    ],
  });

  const avatarUrl = profileService.getAvatarUrl(user?.profileImage, user?.username);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Profile Header */}
        <View style={styles.header}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{user?.username ?? '—'}</Text>
            <Text style={styles.email}>{user?.email ?? ''}</Text>
            <Text style={styles.elo}>ELO: <Text style={styles.eloVal}>{stats.data?.elo ?? '—'}</Text></Text>
          </View>
          <Pressable style={styles.editBtn} onPress={() => router.push('/settings')}>
            <Text style={styles.editBtnText}>⚙️ Edit</Text>
          </Pressable>
        </View>

        {/* XP Bar */}
        <View style={styles.xpCard}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>Level { user?.level ?? 1}</Text>
            <Text style={styles.xpValue}>{user?.xp ?? 0} / {1000 * (user?.level ?? 1)} XP</Text>
          </View>
          <View style={styles.xpBg}>
            <View style={[styles.xpFill, {
              width: `${Math.min(((user?.xp ?? 0) / (1000 * (user?.level ?? 1))) * 100, 100)}%` as any
            }]} />
          </View>
        </View>

        {/* 4 stat boxes */}
        <View style={styles.statsGrid}>
          {stats.isLoading
            ? <ActivityIndicator color={Theme.colors.brandPrimary} />
            : [
              { label: 'Level', val: user?.level ?? '—' },
              { label: 'Elo Rating', val: stats.data?.elo ?? '—' },
              { label: 'Solved', val: stats.data?.challengesSolved ?? '—' },
              { label: 'Duels', val: stats.data ? `${stats.data.duelsWon}W/${stats.data.duelsLost}L` : '—' },
            ].map(s => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))
          }
        </View>

        {/* Detailed Stats */}
        {!stats.isLoading && stats.data && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DETAILED STATISTICS</Text>
            <View style={styles.detailGrid}>
              {[
                { label: 'Duels Won', val: stats.data.duelsWon, color: Theme.colors.stateSuccess },
                { label: 'Duels Lost', val: stats.data.duelsLost, color: Theme.colors.stateError },
                { label: 'Win Rate', val: `${stats.data.winRate.toFixed(1)}%`, color: Theme.colors.stateSuccess },
                { label: 'Challenges', val: stats.data.challengesSolved, color: Theme.colors.brandPrimary },
                { label: 'Discussions', val: stats.data.discussionsCount, color: Theme.colors.brandSecondary },
                { label: 'Comments', val: stats.data.commentsCount, color: Theme.colors.textSecondary },
              ].map(d => (
                <View key={d.label} style={styles.detailCard}>
                  <Text style={[styles.detailVal, { color: d.color }]}>{d.val}</Text>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BADGES & ACHIEVEMENTS
            {badges.data?.length > 0 ? `  (${badges.data.length})` : ''}
          </Text>
          {badges.isLoading
            ? <ActivityIndicator color={Theme.colors.brandPrimary} />
            : badges.data?.length > 0
              ? (
                <View style={styles.badgeGrid}>
                  {badges.data.slice(0, 12).map((b: any, i: number) => (
                    <View key={i} style={styles.badge}>
                      <Text style={styles.badgeIcon}>{b.icon ?? '🏅'}</Text>
                      <Text style={styles.badgeName} numberOfLines={1}>{b.name}</Text>
                    </View>
                  ))}
                </View>
              )
              : <Text style={styles.emptyText}>Solve challenges to earn badges!</Text>
          }
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          {activity.isLoading
            ? <ActivityIndicator color={Theme.colors.brandPrimary} />
            : activity.data?.length > 0
              ? activity.data.slice(0, 10).map((a: ActivityItem, i: number) => (
                <View key={i} style={styles.activityRow}>
                  <View style={styles.activityIcon}>
                    <Text>{activityIcon[a.type] ?? '•'}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityText}>{activityText(a)}</Text>
                    <Text style={styles.activityDate}>
                      {new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              ))
              : <Text style={styles.emptyText}>No recent activity yet.</Text>
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet;
const styles = S.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface1,
    borderRadius: Theme.layout.cardRadius, borderWidth: 1, borderColor: Theme.colors.borderDefault,
    padding: 16, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: Theme.colors.brandPrimary, marginRight: 14 },
  headerInfo: { flex: 1 },
  username: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 20 },
  email: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  elo: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  eloVal: { color: Theme.colors.brandPrimary, fontWeight: 'bold' },
  editBtn: { backgroundColor: Theme.colors.surface2, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  editBtnText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 13 },
  xpCard: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 14, marginBottom: 12 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 14 },
  xpValue: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13 },
  xpBg: { height: 8, backgroundColor: Theme.colors.surface2, borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: Theme.colors.brandPrimary, borderRadius: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: { width: '47%', backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 14, alignItems: 'center' },
  statVal: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 24 },
  statLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12, marginTop: 4 },
  section: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16, marginBottom: 12 },
  sectionTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 13,
    letterSpacing: 2, marginBottom: 14 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailCard: { width: '30%', alignItems: 'center', padding: 8 },
  detailVal: { fontFamily: Theme.fonts.title, fontSize: 22 },
  detailLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { backgroundColor: Theme.colors.surface2, borderRadius: 8, padding: 10, alignItems: 'center', width: '22%' },
  badgeIcon: { fontSize: 24 },
  badgeName: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 10, marginTop: 4, textAlign: 'center' },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Theme.colors.borderDefault },
  activityIcon: { width: 36, height: 36, borderRadius: 18,
    backgroundColor: `${Theme.colors.brandPrimary}22`,
    alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityInfo: { flex: 1 },
  activityText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 14 },
  activityDate: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 14, fontStyle: 'italic', padding: 8 },
});
