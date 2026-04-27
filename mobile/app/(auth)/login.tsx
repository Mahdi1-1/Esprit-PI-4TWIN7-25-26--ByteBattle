import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useState } from 'react';
import { Theme } from '../../src/constants/Theme';
import { authService } from '../../src/services/authService';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Step 1: get the JWT token
      const res = await authService.login(email.trim(), password);
      await authService.saveTokens(res.access_token, res.refresh_token);

      // Step 2: fetch full profile (includes level, xp, elo not in JWT response)
      const fullUser = await authService.getMe();
      login(fullUser);

      router.replace('/(tabs)');
    } catch (err: any) {
      if (__DEV__) console.error('[Login Error]', err?.response?.data ?? err.message);
      const msg = err?.response?.data?.message || 'Invalid email or password.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo / Title */}
        <View style={styles.header}>
          <Text style={styles.logo}>⚔</Text>
          <Text style={styles.title}>BYTEBATTLE</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Error Banner */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form Card */}
        <View style={styles.card}>
          {/* Google Button */}
          <Pressable style={styles.googleBtn} onPress={() => Alert.alert('Google OAuth', 'Use expo-auth-session to initiate OAuth flow on mobile')}>
            <Text style={styles.googleText}>🔵  Continue with Google</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or with your email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor={Theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Theme.colors.textMuted}
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
          </View>

          {/* Forgot password */}
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </Link>

          {/* Submit */}
          <Pressable style={[styles.submitBtn, loading && styles.disabledBtn]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>SIGN IN</Text>
            }
          </Pressable>
        </View>

        {/* Sign up link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable><Text style={styles.footerLink}>Create one</Text></Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontFamily: Theme.fonts.title, fontSize: 32, color: Theme.colors.brandPrimary, letterSpacing: 4,
    textShadowColor: 'rgba(0,229,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  subtitle: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, marginTop: 4, fontSize: 16 },
  errorBanner: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: Theme.colors.stateError,
    borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: Theme.colors.stateError, fontFamily: Theme.fonts.ui, fontSize: 14 },
  card: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 24, marginBottom: 24 },
  googleBtn: { borderWidth: 1, borderColor: Theme.colors.borderDefault, borderRadius: Theme.layout.borderRadius,
    padding: 14, alignItems: 'center', marginBottom: 20 },
  googleText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Theme.colors.borderDefault },
  dividerText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, marginHorizontal: 12, fontSize: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontFamily: Theme.fonts.title, color: Theme.colors.brandSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: Theme.colors.surface2, borderWidth: 1, borderColor: Theme.colors.borderDefault,
    borderRadius: Theme.layout.borderRadius, color: Theme.colors.textPrimary, fontFamily: Theme.fonts.ui,
    padding: 12, fontSize: 16 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 20 },
  forgotText: { fontFamily: Theme.fonts.ui, color: Theme.colors.brandPrimary, fontSize: 14 },
  submitBtn: { backgroundColor: Theme.colors.brandPrimary, borderRadius: Theme.layout.borderRadius,
    padding: 16, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  submitText: { fontFamily: Theme.fonts.title, color: '#0b1020', fontSize: 16, letterSpacing: 2 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 14 },
  footerLink: { fontFamily: Theme.fonts.ui, color: Theme.colors.brandPrimary, fontSize: 14, fontWeight: 'bold' },
});
