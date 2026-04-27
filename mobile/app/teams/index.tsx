import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import { teamsService } from '../../src/services/appServices';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function Teams() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  const { data: myTeams, isLoading } = useQuery({
    queryKey: ['teams-mine'],
    queryFn: teamsService.getMine,
    staleTime: 60_000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>MY TEAMS</Text>
        <Pressable style={styles.createBtn} onPress={() => {}}>
          <Text style={styles.createText}>+ New</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Theme.colors.brandPrimary} style={{ flex: 1 }} />
      ) : (myTeams ?? []).length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No teams yet</Text>
          <Text style={styles.emptyText}>Create a team to participate in Hackathons</Text>
        </View>
      ) : (
        <FlatList
          data={myTeams}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: team }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{team.name}</Text>
                {team.ownerId === user?.id && (
                  <View style={styles.captainBadge}>
                    <Text style={styles.captainText}>CAPTAIN</Text>
                  </View>
                )}
              </View>

              <Text style={styles.membersCount}>
                👥 {team.members?.length ?? 1} / 4 Members
              </Text>

              {team.members?.length > 0 && (
                <View style={styles.membersList}>
                  {team.members.map((m: any, i: number) => (
                    <View key={i} style={styles.memberBox}>
                      <Text style={styles.memberRole}>{m.role === 'captain' ? '👑' : '👤'}</Text>
                      <Text style={styles.memberName}>{m.user?.username ?? 'Member'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Theme.colors.borderDefault },
  backBtn: { padding: 8 },
  backText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 16 },
  title: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 18, letterSpacing: 2 },
  createBtn: { backgroundColor: Theme.colors.brandPrimary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  createText: { fontFamily: Theme.fonts.title, color: '#0b1020', fontSize: 12, letterSpacing: 1 },
  list: { padding: 16 },
  card: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius, borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 20 },
  captainBadge: { backgroundColor: `${Theme.colors.brandPrimary}22`, borderWidth: 1, borderColor: Theme.colors.brandPrimary, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  captainText: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 10, letterSpacing: 1 },
  membersCount: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13, marginBottom: 12 },
  membersList: { backgroundColor: Theme.colors.surface2, borderRadius: 8, padding: 10 },
  memberBox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  memberRole: { fontSize: 16 },
  memberName: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 22, marginBottom: 8 },
  emptyText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 15 },
});
