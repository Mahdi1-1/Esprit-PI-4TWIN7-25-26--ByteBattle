import {
  View, Text, StyleSheet, Pressable, Image, Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../src/constants/Theme';
import { tokenStorage } from '../src/api/axiosClient';
import { useAuthStore } from '../src/store/useAuthStore';
import { authService } from '../src/services/authService';

export default function Landing() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Auto-login if token exists
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await tokenStorage.get('accessToken');
        if (token) {
          const me = await authService.getMe();
          login(me);
          router.replace('/(tabs)');
        }
      } catch {
        await tokenStorage.delete('accessToken');
      }
    };
    checkToken();
  }, []);

  // Glow pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Animated logo */}
        <Animated.Text style={[styles.logoIcon, { opacity: glowOpacity }]}>⚔</Animated.Text>
        <Text style={styles.title}>BYTEBATTLE</Text>
        <Text style={styles.tagline}>CODE. COMPETE. CONQUER.</Text>

        {/* Feature chips */}
        <View style={styles.chips}>
          {['⚡ Real-time Duels', '🧠 AI Challenges', '🏆 Hackathons', '📊 Leaderboard'].map(label => (
            <View key={label} style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttons}>
          <Pressable style={styles.btnPrimary} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.btnPrimaryText}>SIGN IN</Text>
          </Pressable>
          <Pressable style={styles.btnSecondary} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.btnSecondaryText}>CREATE ACCOUNT</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  logoIcon: { fontSize: 72, marginBottom: 16,
    textShadowColor: Theme.colors.brandPrimary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30 },
  title: { fontFamily: Theme.fonts.title, fontSize: 40, color: Theme.colors.brandPrimary, letterSpacing: 6,
    textShadowColor: 'rgba(0,229,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
    marginBottom: 8 },
  tagline: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 15, letterSpacing: 4, marginBottom: 40 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 48 },
  chip: { backgroundColor: Theme.colors.surface1, borderWidth: 1, borderColor: Theme.colors.borderDefault,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 13 },
  buttons: { width: '100%', gap: 14 },
  btnPrimary: { backgroundColor: Theme.colors.brandPrimary, borderRadius: Theme.layout.borderRadius,
    padding: 18, alignItems: 'center',
    shadowColor: Theme.colors.brandPrimary, shadowOpacity: 0.6, shadowRadius: 16, elevation: 10 },
  btnPrimaryText: { fontFamily: Theme.fonts.title, color: '#0b1020', fontSize: 18, letterSpacing: 4 },
  btnSecondary: { borderWidth: 2, borderColor: Theme.colors.borderStrong, borderRadius: Theme.layout.borderRadius,
    padding: 18, alignItems: 'center' },
  btnSecondaryText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 16, letterSpacing: 2 },
});
