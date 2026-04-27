import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import { discussionsService } from '../../src/services/appServices';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function Discussions() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['discussions', search],
    queryFn: () => discussionsService.getAll({ page: 1, limit: 30, search: search || undefined }),
    staleTime: 30_000,
  });

  const discussions = data?.data ?? data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchText}
            placeholder="Search discussions..."
            placeholderTextColor={Theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
        <Pressable style={styles.newBtn} onPress={() => router.push('/discussion/new')}>
          <Text style={styles.newBtnText}>+ New</Text>
        </Pressable>
      </View>

      {isLoading
        ? <ActivityIndicator color={Theme.colors.brandPrimary} style={{ flex: 1 }} />
        : (
          <FlatList
            data={discussions}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>No discussions yet</Text>
                <Text style={styles.emptyText}>Be the first to start a conversation</Text>
              </View>
            }
            renderItem={({ item: d }: any) => (
              <Pressable style={styles.card} onPress={() => router.push(`/discussion/${d.id}`)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{d.title}</Text>
                  {d.isPinned && <Text style={styles.pinBadge}>📌</Text>}
                </View>

                {d.tags?.length > 0 && (
                  <View style={styles.tags}>
                    {d.tags.slice(0, 3).map((t: string) => (
                      <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
                    ))}
                  </View>
                )}

                <View style={styles.cardMeta}>
                  <Text style={styles.metaAuthor}>by {d.author?.username ?? 'Anonymous'}</Text>
                  <View style={styles.metaRight}>
                    <Text style={styles.metaItem}>💬 {d._count?.comments ?? d.commentsCount ?? 0}</Text>
                    <Text style={styles.metaItem}>⬆ {d.upvotes ?? d._count?.upvotes ?? 0}</Text>
                    <Text style={styles.metaItem}>🕒 {timeAgo(d.createdAt)}</Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  searchRow: { flexDirection: 'row', padding: 12, gap: 10, alignItems: 'center' },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.borderRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, paddingHorizontal: 12, paddingVertical: 10 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchText: { flex: 1, fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 15 },
  newBtn: { backgroundColor: Theme.colors.brandPrimary, borderRadius: Theme.layout.borderRadius,
    paddingHorizontal: 14, paddingVertical: 10 },
  newBtnText: { fontFamily: Theme.fonts.title, color: '#0b1020', fontSize: 14 },
  list: { padding: 12, paddingBottom: 40 },
  card: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold', flex: 1 },
  pinBadge: { fontSize: 16, marginLeft: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: { backgroundColor: Theme.colors.surface2, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: Theme.colors.borderDefault },
  tagText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaAuthor: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12, flex: 1 },
  metaRight: { flexDirection: 'row', gap: 12 },
  metaItem: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 22, marginBottom: 8 },
  emptyText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 15 },
});
