import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../src/constants/Theme';
import { notificationsService } from '../src/services/appServices';

type Notification = {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  senderPhoto?: string;
};

const CATEGORIES = [
  { id: 'all', label: '🔔 All' },
  { id: 'HACKATHON', label: '🏆 Hackathon' },
  { id: 'DUEL', label: '⚔️ Duel' },
  { id: 'DISCUSSION', label: '💬 Discussion' },
  { id: 'SUBMISSION', label: '💻 Submission' },
  { id: 'ACHIEVEMENT', label: '🏅 Achievement' },
  { id: 'SYSTEM', label: '📢 System' },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: Theme.colors.stateError,
  high: '#fb923c',
  medium: '#3b82f6',
  low: Theme.colors.borderDefault,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Notifications() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadNotifs = useCallback(async (reset = false, pageNum = 1) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const res = await notificationsService.getAll(
        pageNum, 20,
        activeTab === 'all' ? undefined : activeTab,
        unreadOnly || undefined,
      );
      const newItems = res.data ?? res ?? [];
      if (reset) setItems(newItems);
      else setItems(prev => [...prev, ...newItems]);
      setHasMore(res.hasMore ?? false);
      setPage(pageNum);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, unreadOnly]);

  // Initial load
  useState(() => { loadNotifs(true); });

  const handleMarkRead = async (id: string) => {
    await notificationsService.markRead(id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    await notificationsService.markAllRead();
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleArchive = async (id: string) => {
    await notificationsService.archive(id);
    setItems(prev => prev.filter(n => n.id !== id));
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) loadNotifs(false, page + 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>NOTIFICATIONS</Text>
        <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
          <Text style={styles.markAllText}>✓✓ Mark all read</Text>
        </Pressable>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {CATEGORIES.map(cat => (
            <Pressable key={cat.id} style={[styles.tab, activeTab === cat.id && styles.tabActive]}
              onPress={() => { setActiveTab(cat.id); setPage(1); loadNotifs(true); }}>
              <Text style={[styles.tabText, activeTab === cat.id && styles.tabTextActive]}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Unread filter */}
      <Pressable style={styles.unreadFilter} onPress={() => { setUnreadOnly(!unreadOnly); loadNotifs(true); }}>
        <View style={[styles.checkbox, unreadOnly && styles.checkboxActive]}>
          {unreadOnly && <Text style={{ color: '#0b1020', fontSize: 12 }}>✓</Text>}
        </View>
        <Text style={styles.filterLabel}>Unread only</Text>
      </Pressable>

      {loading
        ? <ActivityIndicator color={Theme.colors.brandPrimary} style={{ flex: 1 }} />
        : items.length === 0
          ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptyText}>No notifications to show</Text>
            </View>
          )
          : (
            <FlatList
              data={items}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={loadingMore ? <ActivityIndicator color={Theme.colors.brandPrimary} /> : null}
              renderItem={({ item: n }) => (
                <Pressable
                  style={[styles.notifCard, !n.isRead && styles.notifUnread,
                    { borderLeftColor: PRIORITY_COLORS[n.priority] ?? Theme.colors.borderDefault }]}
                  onPress={() => {
                    if (!n.isRead) handleMarkRead(n.id);
                    if (n.actionUrl) router.push(n.actionUrl as any);
                  }}
                >
                  <View style={styles.notifIcon}>
                    <Text style={{ fontSize: 18 }}>
                      {n.category === 'HACKATHON' ? '🏆'
                        : n.category === 'DUEL' ? '⚔️'
                        : n.category === 'DISCUSSION' ? '💬'
                        : n.category === 'SUBMISSION' ? '💻'
                        : n.category === 'ACHIEVEMENT' ? '🏅'
                        : '📢'}
                    </Text>
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={[styles.notifTitle, !n.isRead && styles.notifTitleUnread]} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <Text style={styles.notifMessage} numberOfLines={2}>{n.message}</Text>
                    <Text style={styles.notifTime}>{timeAgo(n.createdAt)}</Text>
                  </View>
                  <View style={styles.notifActions}>
                    {!n.isRead && <View style={styles.unreadDot} />}
                    <Pressable onPress={() => handleArchive(n.id)} hitSlop={10}>
                      <Text style={styles.archiveBtn}>🗑</Text>
                    </Pressable>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 20, letterSpacing: 2 },
  markAllBtn: { backgroundColor: Theme.colors.surface2, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  markAllText: { fontFamily: Theme.fonts.ui, color: Theme.colors.brandPrimary, fontSize: 13 },
  tabsScroll: { maxHeight: 50, marginBottom: 8 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Theme.colors.surface1,
    borderWidth: 1, borderColor: Theme.colors.borderDefault },
  tabActive: { backgroundColor: `${Theme.colors.brandPrimary}22`, borderColor: Theme.colors.brandPrimary },
  tabText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13 },
  tabTextActive: { color: Theme.colors.brandPrimary, fontWeight: 'bold' },
  unreadFilter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: Theme.colors.borderStrong,
    alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Theme.colors.brandPrimary, borderColor: Theme.colors.brandPrimary },
  filterLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 14 },
  list: { padding: 16, paddingBottom: 40 },
  notifCard: { flexDirection: 'row', backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderLeftWidth: 4, borderColor: Theme.colors.borderDefault, padding: 14, marginBottom: 10 },
  notifUnread: { backgroundColor: `${Theme.colors.brandPrimary}0A` },
  notifIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Theme.colors.surface2,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitle: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 14 },
  notifTitleUnread: { color: Theme.colors.textPrimary, fontWeight: 'bold' },
  notifMessage: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  notifTime: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, marginTop: 4 },
  notifActions: { alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },
  archiveBtn: { fontSize: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 16, opacity: 0.4 },
  emptyTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 20, marginBottom: 6 },
  emptyText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 15 },
});
