import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import { challengesService, Challenge } from '../../src/services/challengesService';

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'] as const;
type Diff = typeof DIFFICULTIES[number];
const DIFF_COLORS: Record<Diff, string> = {
  all: Theme.colors.textMuted,
  easy: Theme.colors.stateSuccess,
  medium: Theme.colors.stateWarning,
  hard: Theme.colors.stateError,
};

export default function ProblemsTab() {
  const router = useRouter();
  const [filter, setFilter] = useState<Diff>('all');

  const { data: all, isLoading, error, refetch } = useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: () => challengesService.getAll({ limit: 100 }),
    staleTime: 60_000,
  });

  const filtered = (all ?? []).filter(c => filter === 'all' || c.difficulty === filter);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Filter tabs */}
      <View style={styles.filters}>
        {DIFFICULTIES.map(d => (
          <Pressable key={d} style={[styles.filterBtn, filter === d && { borderColor: DIFF_COLORS[d], backgroundColor: `${DIFF_COLORS[d]}22` }]}
            onPress={() => setFilter(d)}>
            <Text style={[styles.filterText, filter === d && { color: DIFF_COLORS[d] }]}>{d.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading && <ActivityIndicator color={Theme.colors.brandPrimary} style={{ flex: 1 }} />}

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ Cannot reach server. Check your network or API URL.</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>RETRY</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !error && (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No battles found for this filter.</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/problems/${item.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={[styles.diffBadge, { backgroundColor: `${DIFF_COLORS[item.difficulty]}22`,
                  borderColor: DIFF_COLORS[item.difficulty] }]}>
                  <Text style={[styles.diffText, { color: DIFF_COLORS[item.difficulty] }]}>
                    {item.difficulty?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                {item.tags?.slice(0, 3).map(t => (
                  <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
                ))}
                {item.kind && (
                  <View style={[styles.tag, { borderColor: item.kind === 'CODE' ? Theme.colors.brandPrimary : Theme.colors.brandSecondary }]}>
                    <Text style={[styles.tagText, { color: item.kind === 'CODE' ? Theme.colors.brandPrimary : Theme.colors.brandSecondary }]}>
                      {item.kind}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  filters: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: Theme.colors.borderDefault, backgroundColor: Theme.colors.surface1 },
  filterText: { fontFamily: Theme.fonts.title, fontSize: 11, letterSpacing: 1, color: Theme.colors.textMuted },
  list: { padding: 12, paddingBottom: 40 },
  card: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 16, flex: 1, marginRight: 8, fontWeight: 'bold' },
  diffBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  diffText: { fontFamily: Theme.fonts.title, fontSize: 11, letterSpacing: 1 },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: Theme.colors.surface2, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Theme.colors.borderDefault },
  tagText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11 },
  emptyText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, textAlign: 'center', padding: 40 },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontFamily: Theme.fonts.ui, color: Theme.colors.stateError, textAlign: 'center', marginBottom: 16 },
  retryBtn: { borderWidth: 1, borderColor: Theme.colors.brandPrimary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, letterSpacing: 2 },
});
