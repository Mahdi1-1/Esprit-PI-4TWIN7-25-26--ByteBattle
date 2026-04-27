import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useState } from 'react';
import { Theme } from '../../src/constants/Theme';
import { authService } from '../../src/services/authService';

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { username, email, password } = form;
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.'); return;
    }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.register(username.trim(), email.trim(), password);
      router.replace('/(auth)/login');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>NEW RECRUIT</Text>
          <Text style={styles.subtitle}>Create your ByteBattle account</Text>
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          {[
            { key: 'username', label: 'USERNAME', placeholder: 'Enter your alias', keyboard: 'default', secure: false },
            { key: 'email', label: 'EMAIL', placeholder: 'you@email.com', keyboard: 'email-address', secure: false },
            { key: 'password', label: 'PASSWORD', placeholder: '••••••••', keyboard: 'default', secure: true },
          ].map(f => (
            <View key={f.key} style={styles.inputGroup}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                placeholderTextColor={Theme.colors.textMuted}
                keyboardType={f.keyboard as any}
                autoCapitalize="none"
                secureTextEntry={f.secure}
                value={(form as any)[f.key]}
                onChangeText={update(f.key as any)}
                editable={!loading}
              />
            </View>
          ))}

          <Pressable style={[styles.submitBtn, loading && styles.disabledBtn]} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#0b1020" />
              : <Text style={styles.submitText}>CREATE ACCOUNT</Text>
            }
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable><Text style={styles.footerLink}>Sign in</Text></Pressable>
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
  title: { fontFamily: Theme.fonts.title, fontSize: 28, color: Theme.colors.brandPrimary, letterSpacing: 4,
    textShadowColor: 'rgba(0,229,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
  subtitle: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, marginTop: 4, fontSize: 16 },
  errorBanner: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: Theme.colors.stateError,
    borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: Theme.colors.stateError, fontFamily: Theme.fonts.ui, fontSize: 14 },
  card: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 24, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontFamily: Theme.fonts.title, color: Theme.colors.brandSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: Theme.colors.surface2, borderWidth: 1, borderColor: Theme.colors.borderDefault,
    borderRadius: Theme.layout.borderRadius, color: Theme.colors.textPrimary, fontFamily: Theme.fonts.ui, padding: 12, fontSize: 16 },
  submitBtn: { backgroundColor: Theme.colors.brandPrimary, borderRadius: Theme.layout.borderRadius, padding: 16, alignItems: 'center', marginTop: 8 },
  disabledBtn: { opacity: 0.6 },
  submitText: { fontFamily: Theme.fonts.title, color: '#0b1020', fontSize: 16, letterSpacing: 2 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 14 },
  footerLink: { fontFamily: Theme.fonts.ui, color: Theme.colors.brandPrimary, fontSize: 14, fontWeight: 'bold' },
});
