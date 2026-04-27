import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import { challengesService } from '../../src/services/challengesService';

export default function ProblemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: problem, isLoading, error } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => challengesService.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading challenge...</Text>
      </View>
    );
  }

  if (error || !problem) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>⚠ Failed to load this challenge.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← GO BACK</Text>
        </Pressable>
      </View>
    );
  }

  const diffColor = problem.difficulty === 'easy' ? Theme.colors.stateSuccess
    : problem.difficulty === 'medium' ? Theme.colors.stateWarning : Theme.colors.stateError;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.diffBadge, { borderColor: diffColor, backgroundColor: `${diffColor}22` }]}>
            <Text style={[styles.diffText, { color: diffColor }]}>{problem.difficulty?.toUpperCase()}</Text>
          </View>
          {problem.kind && (
            <View style={[styles.kindBadge,
              { borderColor: problem.kind === 'CODE' ? Theme.colors.brandPrimary : Theme.colors.brandSecondary }]}>
              <Text style={[styles.kindText,
                { color: problem.kind === 'CODE' ? Theme.colors.brandPrimary : Theme.colors.brandSecondary }]}>
                {problem.kind}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{problem.title}</Text>

        {/* Tags */}
        {problem.tags?.length > 0 && (
          <View style={styles.tags}>
            {problem.tags.map((t: string) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 DESCRIPTION</Text>
          <Text style={styles.body}>{problem.descriptionMd || 'No description available.'}</Text>
        </View>

        {/* Examples */}
        {problem.examples?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 EXAMPLES</Text>
            {problem.examples.map((ex: any, i: number) => (
              <View key={i} style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>Input:</Text>
                <Text style={styles.exampleCode}>{ex.input}</Text>
                <Text style={styles.exampleLabel}>Output:</Text>
                <Text style={styles.exampleCode}>{ex.output ?? ex.expectedOutput}</Text>
                {ex.explanation && <>
                  <Text style={styles.exampleLabel}>Explanation:</Text>
                  <Text style={styles.body}>{ex.explanation}</Text>
                </>}
              </View>
            ))}
          </View>
        )}

        {/* Constraints */}
        {problem.constraints && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ CONSTRAINTS</Text>
            <Text style={styles.body}>{JSON.stringify(problem.constraints, null, 2)}</Text>
          </View>
        )}

        {/* Language badges */}
        {problem.allowedLanguages?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔤 ALLOWED LANGUAGES</Text>
            <View style={styles.tags}>
              {problem.allowedLanguages.map((lang: string) => (
                <View key={lang} style={[styles.tag, { borderColor: Theme.colors.brandPrimary }]}>
                  <Text style={[styles.tagText, { color: Theme.colors.brandPrimary }]}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CTA */}
        <View style={styles.cta}>
          <Pressable style={styles.fightBtn} onPress={() => {}}>
            <Text style={styles.fightBtnText}>⚔ START BATTLE</Text>
          </Pressable>
          <Pressable style={styles.duelBtn} onPress={() => router.push('/duel/matchmaking')}>
            <Text style={styles.duelBtnText}>⚡ CHALLENGE A PLAYER</Text>
          </Pressable>
          <Pressable style={styles.backBtn2} onPress={() => router.back()}>
            <Text style={styles.backBtn2Text}>← RETREAT</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background, padding: 20 },
  loadingText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, marginTop: 12, fontSize: 16 },
  errorText: { fontFamily: Theme.fonts.ui, color: Theme.colors.stateError, fontSize: 16, marginBottom: 20 },
  content: { padding: 16, paddingBottom: 60 },
  header: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  diffBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  diffText: { fontFamily: Theme.fonts.title, fontSize: 12, letterSpacing: 1 },
  kindBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  kindText: { fontFamily: Theme.fonts.title, fontSize: 12, letterSpacing: 1 },
  title: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 24,
    marginBottom: 14, lineHeight: 32 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: Theme.colors.surface2, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Theme.colors.borderDefault },
  tagText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12 },
  section: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16, marginBottom: 14 },
  sectionTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 13,
    letterSpacing: 2, marginBottom: 12 },
  body: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 15, lineHeight: 24 },
  exampleBox: { backgroundColor: Theme.colors.surface2, borderRadius: 8, padding: 12, marginBottom: 10 },
  exampleLabel: { fontFamily: Theme.fonts.title, color: Theme.colors.textMuted, fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  exampleCode: { fontFamily: 'monospace', color: Theme.colors.brandPrimary, fontSize: 13, marginBottom: 8, lineHeight: 20 },
  cta: { gap: 10, marginTop: 8 },
  fightBtn: { backgroundColor: Theme.colors.brandPrimary, borderRadius: Theme.layout.borderRadius,
    padding: 18, alignItems: 'center', shadowColor: Theme.colors.brandPrimary, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  fightBtnText: { fontFamily: Theme.fonts.title, color: '#0b1020', fontSize: 16, letterSpacing: 3 },
  duelBtn: { borderWidth: 2, borderColor: Theme.colors.brandSecondary, borderRadius: Theme.layout.borderRadius,
    padding: 16, alignItems: 'center' },
  duelBtnText: { fontFamily: Theme.fonts.title, color: Theme.colors.brandSecondary, fontSize: 14, letterSpacing: 2 },
  backBtn: { borderWidth: 1, borderColor: Theme.colors.borderStrong, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { fontFamily: Theme.fonts.title, color: Theme.colors.textSecondary, letterSpacing: 2 },
  backBtn2: { borderWidth: 1, borderColor: Theme.colors.borderDefault, borderRadius: Theme.layout.borderRadius,
    padding: 14, alignItems: 'center' },
  backBtn2Text: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 14, letterSpacing: 1 },
});
