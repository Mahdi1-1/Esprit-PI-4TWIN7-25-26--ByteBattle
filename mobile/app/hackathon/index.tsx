import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import { hackathonsService, teamsService } from '../../src/services/appServices';
import { useAuthStore } from '../../src/store/useAuthStore';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Upcoming', lobby: 'Registration Open', checkin: 'Check-in',
  active: 'Active', frozen: 'Frozen', ended: 'Ended',
  archived: 'Archived', cancelled: 'Cancelled',
};
const STATUS_COLORS: Record<string, string> = {
  active: Theme.colors.stateSuccess, frozen: '#3b82f6', lobby: Theme.colors.stateWarning,
  checkin: '#8b5cf6', ended: Theme.colors.textMuted, draft: Theme.colors.textMuted,
  archived: Theme.colors.textMuted, cancelled: Theme.colors.stateError,
};

function HackathonCard({ h, userId, captainTeams, onRegister, isRegistering }: any) {
  const router = useRouter();
  const isOngoing = ['active', 'frozen'].includes(h.status);
  const isFinished = ['ended', 'archived'].includes(h.status);
  const isLobby = h.status === 'lobby';
  const myTeam = h.hackathonTeams?.find((t: any) => t.members?.some((m: any) => m.userId === userId));
  const isRegistered = !!myTeam;
  const title = h.title || h.name || 'Untitled Hackathon';
  const statusColor = STATUS_COLORS[h.status] ?? Theme.colors.textMuted;

  const navigate = () => {
    if (isOngoing) router.push(`/hackathon/${h.id}/workspace`);
    else if (isFinished) router.push(`/hackathon/${h.id}/results`);
    else router.push(`/hackathon/${h.id}/scoreboard`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}22` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[h.status] ?? h.status}
              </Text>
            </View>
            {isRegistered && (
              <View style={[styles.statusBadge, { borderColor: Theme.colors.brandPrimary, backgroundColor: `${Theme.colors.brandPrimary}22` }]}>
                <Text style={[styles.statusText, { color: Theme.colors.brandPrimary }]}>✓ Registered</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          👥 {h._count?.hackathonTeams ?? 0} teams &nbsp;·&nbsp;
          🏆 {Array.isArray(h.challengeIds) ? h.challengeIds.length : 0} problems &nbsp;·&nbsp;
          📅 {h.startTime ? new Date(h.startTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'TBD'}
        </Text>
      </View>

      {/* Description */}
      {h.description && (
        <Text style={styles.cardDesc} numberOfLines={2}>{h.description}</Text>
      )}

      {/* Countdown for active */}
      {isOngoing && h.endTime && (
        <View style={styles.countdown}>
          <Text style={styles.countdownText}>
            ⏱ Ends: {new Date(h.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.cardActions}>
        {isLobby && !isRegistered && (
          <Pressable style={styles.registerBtn}
            disabled={isRegistering || captainTeams.length === 0}
            onPress={onRegister}>
            <Text style={styles.registerBtnText}>
              {captainTeams.length === 0 ? '⚠ Need a captain team' : isRegistering ? 'Registering...' : '📝 Register Team'}
            </Text>
          </Pressable>
        )}
        {(isOngoing || isFinished || h.status === 'checkin') && (
          <Pressable style={styles.enterBtn} onPress={navigate}>
            <Text style={styles.enterBtnText}>
              {isOngoing ? '▶ Enter Workspace' : isFinished ? '📊 View Results' : '✅ Check-in'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function Hackathons() {
  const user = useAuthStore(s => s.user);

  const { data: hackathons, isLoading: loadingH } = useQuery({
    queryKey: ['hackathons'],
    queryFn: hackathonsService.getAll,
    staleTime: 30_000,
  });

  const { data: myTeams } = useQuery({
    queryKey: ['teams-mine'],
    queryFn: teamsService.getMine,
    staleTime: 60_000,
  });

  const all = hackathons?.data ?? hackathons ?? [];
  const captainTeams = (myTeams ?? []).filter((t: any) => t.ownerId === user?.id);

  const sections = [
    { label: '🔴 Ongoing', items: all.filter((h: any) => ['active', 'frozen'].includes(h.status)) },
    { label: '✅ Check-in', items: all.filter((h: any) => h.status === 'checkin') },
    { label: '📝 Registration Open', items: all.filter((h: any) => h.status === 'lobby') },
    { label: '📅 Upcoming', items: all.filter((h: any) => h.status === 'draft') },
    { label: '🏁 Finished', items: all.filter((h: any) => ['ended', 'archived'].includes(h.status)) },
  ].filter(s => s.items.length > 0);

  if (loadingH) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.brandPrimary} />
      </View>
    );
  }

  if (all.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>🏆</Text>
        <Text style={styles.emptyTitle}>No hackathons yet</Text>
        <Text style={styles.emptyText}>Check back soon for upcoming competitions</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={sections}
        keyExtractor={s => s.label}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{section.label}</Text>
            {section.items.map((h: any) => (
              <HackathonCard
                key={h.id} h={h}
                userId={user?.id}
                captainTeams={captainTeams}
                onRegister={() => {
                  const team = captainTeams[0];
                  if (team) teamsService.registerToHackathon(team.id, h.id);
                }}
                isRegistering={false}
              />
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.background },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 18, marginBottom: 12 },
  card: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 17, marginBottom: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBadge: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontFamily: Theme.fonts.ui, fontSize: 12, fontWeight: 'bold' },
  cardMeta: { marginBottom: 8 },
  metaText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13 },
  cardDesc: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 14, marginBottom: 10, lineHeight: 20 },
  countdown: { backgroundColor: Theme.colors.surface2, borderRadius: 6, padding: 8, marginBottom: 10 },
  countdownText: { fontFamily: Theme.fonts.ui, color: Theme.colors.brandPrimary, fontSize: 13 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  registerBtn: { flex: 1, backgroundColor: `${Theme.colors.stateWarning}22`, borderWidth: 1, borderColor: Theme.colors.stateWarning,
    borderRadius: Theme.layout.borderRadius, padding: 12, alignItems: 'center' },
  registerBtnText: { fontFamily: Theme.fonts.title, color: Theme.colors.stateWarning, fontSize: 13, letterSpacing: 1 },
  enterBtn: { flex: 1, backgroundColor: `${Theme.colors.brandPrimary}22`, borderWidth: 1, borderColor: Theme.colors.brandPrimary,
    borderRadius: Theme.layout.borderRadius, padding: 12, alignItems: 'center' },
  enterBtnText: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 13, letterSpacing: 1 },
  emptyTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 22, marginBottom: 8 },
  emptyText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
});
