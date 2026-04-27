import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import { leaderboardService, profileService, LeaderboardEntry } from '../../src/services/profileService';
import { useAuthStore } from '../../src/store/useAuthStore';

type Tab = 'global' | 'monthly' | 'language';

export default function LeaderboardTab() {
  const [activeTab, setActiveTab] = useState<Tab>('global');
  const user = useAuthStore(s => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', activeTab],
    queryFn: async () => {
      const [lb, myRank] = await Promise.allSettled([
        leaderboardService.getGlobal({ limit: 50, sort: 'elo' }),
        leaderboardService.getMyRank(),
      ]);
      const entries: LeaderboardEntry[] = lb.status === 'fulfilled'
        ? (lb.value?.data ?? []).map((u: any, i: number) => ({
          rank: i + 1, username: u.username, profileImage: u.profileImage,
          elo: u.elo || 0, duelsWon: u.duelsWon || 0, duelsLost: u.duelsLost || 0,
          winRate: u.winRate || 0, isCurrentUser: u.username === user?.username,
        }))
        : [];
      const me = myRank.status === 'fulfilled' ? {
        rank: myRank.value?.rank ?? 0, username: myRank.value?.username ?? '',
        profileImage: myRank.value?.profileImage, elo: myRank.value?.elo ?? 0,
        duelsWon: myRank.value?.duelsWon ?? 0, duelsLost: myRank.value?.duelsLost ?? 0,
        winRate: myRank.value?.winRate ?? 0, isCurrentUser: true,
      } as LeaderboardEntry : null;
      return { entries, me };
    },
    staleTime: 60_000,
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'global', label: 'GLOBAL' },
    { key: 'monthly', label: 'THIS MONTH' },
    { key: 'language', label: 'BY LANG' },
  ];

  const medalColor = (rank: number) => rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
  const medalEmoji = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabs}>
          {tabs.map(t => (
            <Pressable key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]} onPress={() => setActiveTab(t.key)}>
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {isLoading
          ? <ActivityIndicator color={Theme.colors.brandPrimary} style={{ flex: 1 }} />
          : (
            <FlatList
              data={data?.entries ?? []}
              keyExtractor={item => String(item.rank)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              ListHeaderComponent={
                <>
                  {/* My position card */}
                  {data?.me && (
                    <View style={styles.myCard}>
                      <Text style={styles.myCardLabel}>YOUR POSITION</Text>
                      <View style={styles.myCardRow}>
                        <Text style={styles.myRank}>#{data.me.rank}</Text>
                        <Image source={{ uri: profileService.getAvatarUrl(data.me.profileImage, data.me.username) }}
                          style={styles.myAvatar} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.myName}>{data.me.username}</Text>
                          <Text style={styles.myStats}>{data.me.duelsWon}W / {data.me.duelsLost}L · {data.me.winRate.toFixed(1)}%</Text>
                        </View>
                        <Text style={styles.myElo}>{data.me.elo} ELO</Text>
                      </View>
                    </View>
                  )}

                  {/* Top 3 Podium */}
                  {(data?.entries ?? []).length >= 3 && (
                    <View style={styles.podium}>
                      {[data!.entries[1], data!.entries[0], data!.entries[2]].filter(Boolean).map((e, idx) => (
                        <View key={e.rank} style={[styles.podiumCard,
                          e.rank === 1 && styles.podiumFirst,
                          { marginTop: e.rank === 1 ? 0 : 20 }
                        ]}>
                          <Text style={styles.podiumMedal}>{medalEmoji(e.rank)}</Text>
                          <Image source={{ uri: profileService.getAvatarUrl(e.profileImage, e.username) }}
                            style={[styles.podiumAvatar, { borderColor: medalColor(e.rank) }]} />
                          <Text style={styles.podiumName} numberOfLines={1}>{e.username}</Text>
                          <Text style={[styles.podiumElo, { color: medalColor(e.rank) }]}>{e.elo}</Text>
                          <Text style={styles.podiumWinRate}>{e.duelsWon}W · {e.winRate.toFixed(0)}%</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Table header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.colHead, { width: 40 }]}>#</Text>
                    <Text style={[styles.colHead, { flex: 1 }]}>PLAYER</Text>
                    <Text style={[styles.colHead, { width: 70, textAlign: 'right' }]}>ELO</Text>
                    <Text style={[styles.colHead, { width: 55, textAlign: 'right' }]}>WIN%</Text>
                  </View>
                </>
              }
              renderItem={({ item }) => (
                <View style={[styles.row, item.isCurrentUser && styles.rowMe]}>
                  <View style={{ width: 40, flexDirection: 'row', alignItems: 'center' }}>
                    {item.rank <= 3
                      ? <Text style={{ fontSize: 18 }}>{medalEmoji(item.rank)}</Text>
                      : <Text style={styles.rowRank}>#{item.rank}</Text>
                    }
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Image source={{ uri: profileService.getAvatarUrl(item.profileImage, item.username) }} style={styles.rowAvatar} />
                    <Text style={styles.rowName} numberOfLines={1}>{item.username}</Text>
                  </View>
                  <Text style={styles.rowElo}>{item.elo}</Text>
                  <Text style={styles.rowWR}>{item.winRate.toFixed(1)}%</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No rankings available.</Text>}
            />
          )
        }
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  container: { flex: 1 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  tab: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center',
    backgroundColor: Theme.colors.surface1, borderWidth: 1, borderColor: Theme.colors.borderDefault },
  tabActive: { borderColor: Theme.colors.brandPrimary, backgroundColor: `${Theme.colors.brandPrimary}22` },
  tabText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1 },
  tabTextActive: { color: Theme.colors.brandPrimary, fontWeight: 'bold' },
  list: { padding: 16, paddingBottom: 40 },
  myCard: { backgroundColor: `${Theme.colors.brandPrimary}15`, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: `${Theme.colors.brandPrimary}40`, padding: 14, marginBottom: 16 },
  myCardLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 10 },
  myCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  myRank: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 20, width: 40 },
  myAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Theme.colors.brandPrimary },
  myName: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 16 },
  myStats: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  myElo: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 18 },
  podium: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  podiumCard: { flex: 1, backgroundColor: Theme.colors.surface1, borderRadius: 10,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 12, alignItems: 'center' },
  podiumFirst: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.05)' },
  podiumMedal: { fontSize: 24, marginBottom: 6 },
  podiumAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, marginBottom: 6 },
  podiumName: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 12,
    textAlign: 'center', fontWeight: 'bold' },
  podiumElo: { fontFamily: Theme.fonts.title, fontSize: 18, marginTop: 4 },
  podiumWinRate: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  tableHeader: { flexDirection: 'row', paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: Theme.colors.borderStrong, marginBottom: 4 },
  colHead: { fontFamily: Theme.fonts.title, color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: Theme.colors.borderDefault },
  rowMe: { backgroundColor: `${Theme.colors.brandPrimary}10` },
  rowRank: { fontFamily: Theme.fonts.title, color: Theme.colors.textMuted, fontSize: 13 },
  rowAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: Theme.colors.borderDefault },
  rowName: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 15, fontWeight: 'bold', flex: 1 },
  rowElo: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 16, width: 70, textAlign: 'right' },
  rowWR: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 13, width: 55, textAlign: 'right' },
  emptyText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, textAlign: 'center', padding: 40 },
});
