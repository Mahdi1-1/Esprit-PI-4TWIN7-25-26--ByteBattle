import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Theme } from '../src/constants/Theme';
import { useAuthStore } from '../src/store/useAuthStore';
import { authService } from '../src/services/authService';
import { settingsService } from '../src/services/appServices';
import { tokenStorage } from '../src/api/axiosClient';

type Section = 'profile' | 'security' | 'preferences';

export default function Settings() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const storeLogout = useAuthStore(s => s.logout);
  const [section, setSection] = useState<Section>('profile');

  // Profile form
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await authService.logout();
          storeLogout();
          router.replace('/');
        }
      }
    ]);
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) { Alert.alert('Error', 'Username cannot be empty.'); return; }
    setSavingProfile(true);
    try {
      await settingsService.update({ username: username.trim(), bio: bio.trim() });
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update profile.';
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : msg);
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { Alert.alert('Error', 'All fields are required.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Error', 'New passwords do not match.'); return; }
    if (newPw.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    setSavingPw(true);
    try {
      await settingsService.changePassword(currentPw, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('Success', 'Password changed successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to change password.';
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : msg);
    } finally { setSavingPw(false); }
  };

  const sections: { key: Section; label: string; icon: string }[] = [
    { key: 'profile', label: 'Profile', icon: '👤' },
    { key: 'security', label: 'Security', icon: '🔒' },
    { key: 'preferences', label: 'Preferences', icon: '⚙️' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Section tabs */}
        <View style={styles.tabs}>
          {sections.map(s => (
            <Pressable key={s.key} style={[styles.tab, section === s.key && styles.tabActive]}
              onPress={() => setSection(s.key)}>
              <Text style={styles.tabIcon}>{s.icon}</Text>
              <Text style={[styles.tabText, section === s.key && styles.tabTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Profile section */}
        {section === 'profile' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>PROFILE SETTINGS</Text>

            <View style={styles.field}>
              <Text style={styles.label}>USERNAME</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor={Theme.colors.textMuted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={[styles.input, styles.readOnly]}>
                <Text style={styles.readOnlyText}>{user?.email}</Text>
              </View>
              <Text style={styles.hint}>Email cannot be changed</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>BIO</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                multiline
                placeholder="Tell us about yourself..."
                placeholderTextColor={Theme.colors.textMuted}
                textAlignVertical="top"
              />
            </View>

            <Pressable style={[styles.saveBtn, savingProfile && styles.disabledBtn]}
              onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile
                ? <ActivityIndicator color="#0b1020" />
                : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
              }
            </Pressable>
          </View>
        )}

        {/* Security section */}
        {section === 'security' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>CHANGE PASSWORD</Text>

            {[
              { label: 'CURRENT PASSWORD', val: currentPw, set: setCurrentPw },
              { label: 'NEW PASSWORD', val: newPw, set: setNewPw },
              { label: 'CONFIRM NEW PASSWORD', val: confirmPw, set: setConfirmPw },
            ].map(f => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.val}
                  onChangeText={f.set}
                  secureTextEntry
                  placeholderTextColor={Theme.colors.textMuted}
                  placeholder="••••••••"
                />
              </View>
            ))}

            <Pressable style={[styles.saveBtn, savingPw && styles.disabledBtn]}
              onPress={handleChangePassword} disabled={savingPw}>
              {savingPw
                ? <ActivityIndicator color="#0b1020" />
                : <Text style={styles.saveBtnText}>CHANGE PASSWORD</Text>
              }
            </Pressable>
          </View>
        )}

        {/* Preferences section */}
        {section === 'preferences' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>APP PREFERENCES</Text>

            {[
              { label: 'Email notifications', subLabel: 'Receive duel and hackathon alerts' },
              { label: 'Sound effects', subLabel: 'Play sounds during duels' },
              { label: 'Code syntax hints', subLabel: 'Show syntax highlighting in editor' },
            ].map(pref => (
              <View key={pref.label} style={styles.prefRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefLabel}>{pref.label}</Text>
                  <Text style={styles.prefSub}>{pref.subLabel}</Text>
                </View>
                <Switch
                  value={true}
                  trackColor={{ false: Theme.colors.surface2, true: `${Theme.colors.brandPrimary}66` }}
                  thumbColor={Theme.colors.brandPrimary}
                />
              </View>
            ))}
          </View>
        )}

        {/* Danger zone */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={[styles.sectionTitle, { color: Theme.colors.stateError }]}>DANGER ZONE</Text>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>🚪  SIGN OUT</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 16, paddingBottom: 60 },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { flex: 1, borderRadius: Theme.layout.cardRadius, borderWidth: 1,
    borderColor: Theme.colors.borderDefault, padding: 12, alignItems: 'center',
    backgroundColor: Theme.colors.surface1 },
  tabActive: { borderColor: Theme.colors.brandPrimary, backgroundColor: `${Theme.colors.brandPrimary}22` },
  tabIcon: { fontSize: 20, marginBottom: 4 },
  tabText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12 },
  tabTextActive: { color: Theme.colors.brandPrimary, fontWeight: 'bold' },
  card: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 20, marginBottom: 16 },
  dangerCard: { borderColor: `${Theme.colors.stateError}44` },
  sectionTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 14,
    letterSpacing: 2, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontFamily: Theme.fonts.title, color: Theme.colors.brandSecondary, fontSize: 11,
    letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: Theme.colors.surface2, borderWidth: 1, borderColor: Theme.colors.borderDefault,
    borderRadius: Theme.layout.borderRadius, color: Theme.colors.textPrimary, fontFamily: Theme.fonts.ui,
    padding: 12, fontSize: 15 },
  textArea: { minHeight: 100, paddingTop: 12 },
  readOnly: { opacity: 0.6, justifyContent: 'center' },
  readOnlyText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 15 },
  hint: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, marginTop: 4 },
  saveBtn: { backgroundColor: Theme.colors.brandPrimary, borderRadius: Theme.layout.borderRadius,
    padding: 14, alignItems: 'center', marginTop: 8 },
  disabledBtn: { opacity: 0.6 },
  saveBtnText: { fontFamily: Theme.fonts.title, color: '#0b1020', fontSize: 15, letterSpacing: 2 },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Theme.colors.borderDefault },
  prefLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 15, marginBottom: 2 },
  prefSub: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12 },
  logoutBtn: { backgroundColor: `${Theme.colors.stateError}22`, borderWidth: 1,
    borderColor: Theme.colors.stateError, borderRadius: Theme.layout.borderRadius, padding: 14, alignItems: 'center' },
  logoutBtnText: { fontFamily: Theme.fonts.title, color: Theme.colors.stateError, fontSize: 16, letterSpacing: 2 },
});
