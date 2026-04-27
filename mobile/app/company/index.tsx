import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import { companiesService } from '../../src/services/appServices';

export default function Companies() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesService.getAll,
    staleTime: 60_000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>COMPANIES</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={Theme.colors.brandPrimary} style={{ flex: 1 }} />
      ) : (data ?? []).length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏢</Text>
          <Text style={styles.emptyTitle}>No companies</Text>
          <Text style={styles.emptyText}>Company profiles will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: company }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.logoPlaceholder}>
                  <Text style={{ fontSize: 24 }}>🏢</Text>
                </View>
                <View>
                  <Text style={styles.cardTitle}>{company.name}</Text>
                  {company.verified && <Text style={styles.verified}>✓ Verified</Text>}
                </View>
              </View>
              <Text style={styles.desc} numberOfLines={2}>{company.description ?? 'No description available'}</Text>
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
  list: { padding: 16 },
  card: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius, borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  logoPlaceholder: { width: 50, height: 50, borderRadius: 8, backgroundColor: Theme.colors.surface2, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 18 },
  verified: { fontFamily: Theme.fonts.ui, color: Theme.colors.brandPrimary, fontSize: 12, marginTop: 2 },
  desc: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 14, lineHeight: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 22, marginBottom: 8 },
  emptyText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 15 },
});
