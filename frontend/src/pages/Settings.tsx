// Settings Page - Complete User Profile & Settings
import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { profileService } from '../services/profileService';
import { User, Bell, Shield, Palette, Globe, Trash2, Save, AlertTriangle, Sun, Moon, Trophy, Swords, MessageSquare, Code2, Medal, Megaphone, Check } from 'lucide-react';
import { ProfilePhotoUpload } from '../components/settings/ProfilePhotoUpload';
import { PasswordChangeForm } from '../components/settings/PasswordChangeForm';
import { EmailChangeForm } from '../components/settings/EmailChangeForm';
import { EditorThemeSelector } from '../components/settings/EditorThemeSelector';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTheme } from '../context/ThemeContext';
import { notificationsService } from '../services/notificationsService';
import type { NotificationPreference } from '../types/notification.types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notification.types';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const { colorScheme, toggleColorScheme } = useTheme();

  // Bio state
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoClearSignal, setPhotoClearSignal] = useState(0);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notification preferences state
  const [prefs, setPrefs] = useState<NotificationPreference>(DEFAULT_NOTIFICATION_PREFERENCES as unknown as NotificationPreference);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  useEffect(() => {
    if (activeTab === 'notifications') {
      notificationsService.getPreferences().then(p => {
        if (p) setPrefs(p);
      }).catch(() => {});
    }
  }, [activeTab]);

  const handleSavePrefs = async () => {
    setPrefsSaving(true);
    try {
      await notificationsService.updatePreferences(prefs);
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setPrefsSaving(false);
    }
  };

  const togglePref = (key: keyof NotificationPreference) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
    { id: 'preferences', label: t('settings.preferences'), icon: Globe },
  ];

  const handleSaveProfile = async () => {
    setBioSaving(true);
    setBioSuccess(false);
    setBioError(null);
    try {
      if (selectedPhoto) {
        const result = await profileService.uploadPhoto(selectedPhoto);
        updateUser({ profileImage: result.profileImage });
        setSelectedPhoto(null);
        setPhotoClearSignal(Date.now());
      }

      await profileService.updateProfile({ bio });
      updateUser({ bio });
      setBioSuccess(true);
      setTimeout(() => setBioSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      const serverMsg: string = error?.response?.data?.message ?? '';
      if (serverMsg) {
        setBioError(serverMsg);
      } else if (error?.response?.status === 500) {
        setBioError('Erreur serveur lors de la sauvegarde. Veuillez réessayer.');
      } else {
        setBioError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setBioSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('You must type DELETE to confirm');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await profileService.deleteAccount({
        currentPassword: deletePassword,
        confirmation: deleteConfirmation,
      });
      // Logout and redirect
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (error: any) {
      if (error.response?.status === 401) {
        setDeleteError(t('settings.security.password.incorrect'));
      } else {
        setDeleteError(error.response?.data?.message || t('settings.dangerzone.delete.error'));
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">{t('settings.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar - Tabs on mobile */}
            <div className="lg:col-span-1">
            <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-1.5 sm:p-2">
              <ul className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors min-h-[44px]
                  ${activeTab === tab.id
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                  }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium text-base">{tab.label}</span>
                </button>
                </li>
              ))}
              </ul>
            </div>
            </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">{t('settings.profile')}</h2>

                {/* Photo Upload */}
                <ProfilePhotoUpload onFileSelect={setSelectedPhoto} clearPreviewSignal={photoClearSignal} />

                {/* Username (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full px-3 sm:px-4 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg text-[var(--text-muted)] cursor-not-allowed"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    {t('settings.profile.bio')}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={250}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('settings.profile.bio.placeholder')}
                    className="w-full px-3 sm:px-4 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors resize-none min-h-[80px]"
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 mt-1">
                    <span className="text-xs text-[var(--text-muted)]">
                      {t('settings.profile.bio.charCount').replace('{count}', String(bio.length))}
                    </span>
                    {bioSuccess && (
                      <span className="text-xs text-[var(--state-success)]">Saved!</span>
                    )}
                    {bioError && (
                      <span className="text-xs text-[var(--state-error)]">{bioError}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={bioSaving || (bio === (user?.bio || '') && !selectedPhoto)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 min-h-[44px] bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t('common.save')}
                </button>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6 space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">{t('settings.notifications')}</h2>

                {/* Category toggles */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Notification Categories</h3>
                  <div className="space-y-3">
                    {([
                      { key: 'hackathon', label: 'Hackathon', desc: 'Team joins, status changes, results', icon: <Trophy className="w-4 h-4" /> },
                      { key: 'duel', label: 'Duel', desc: 'Opponent matched, duel results, ELO milestones', icon: <Swords className="w-4 h-4" /> },
                      { key: 'discussion', label: 'Discussion', desc: 'Replies, mentions, votes on your posts', icon: <MessageSquare className="w-4 h-4" /> },
                      { key: 'submission', label: 'Submission', desc: 'Grading results for your submissions', icon: <Code2 className="w-4 h-4" /> },
                      { key: 'achievement', label: 'Achievement', desc: 'Badges earned and level-up milestones', icon: <Medal className="w-4 h-4" /> },
                      { key: 'system', label: 'System', desc: 'Platform announcements and maintenance', icon: <Megaphone className="w-4 h-4" /> },
                    ] as const).map(({ key, label, desc, icon }) => (
                      <div key={key} className="flex items-center justify-between py-2.5 border-b border-[var(--border-default)] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="text-[var(--brand-primary)]">{icon}</div>
                          <div>
                            <div className="font-medium text-[var(--text-primary)] text-sm">{label}</div>
                            <div className="text-xs text-[var(--text-muted)]">{desc}</div>
                          </div>
                        </div>
                        <label className="relative inline-block w-11 h-6 shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!(prefs as any)[key]}
                            onChange={() => togglePref(key as keyof NotificationPreference)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[var(--surface-2)] rounded-full peer peer-checked:bg-[var(--brand-primary)] transition-colors" />
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Channel toggles */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Delivery Channels</h3>
                  <div className="space-y-3">
                    {([
                      { key: 'inApp', label: 'In-App', desc: 'Show notifications in the bell dropdown' },
                      { key: 'email', label: 'Email', desc: 'Send notification emails (requires email verified)' },
                      { key: 'push', label: 'Push', desc: 'Browser push notifications' },
                    ] as const).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-2.5 border-b border-[var(--border-default)] last:border-0">
                        <div>
                          <div className="font-medium text-[var(--text-primary)] text-sm">{label}</div>
                          <div className="text-xs text-[var(--text-muted)]">{desc}</div>
                        </div>
                        <label className="relative inline-block w-11 h-6 shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!(prefs as any)[key]}
                            onChange={() => togglePref(key as keyof NotificationPreference)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[var(--surface-2)] rounded-full peer peer-checked:bg-[var(--brand-primary)] transition-colors" />
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiet Hours */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Quiet Hours</h3>
                  <p className="text-xs text-[var(--text-muted)] mb-3">During quiet hours only critical notifications will push to you.</p>
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Start</label>
                      <input
                        type="time"
                        value={prefs.quietStart ?? '22:00'}
                        onChange={e => setPrefs(p => ({ ...p, quietStart: e.target.value }))}
                        className="px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">End</label>
                      <input
                        type="time"
                        value={prefs.quietEnd ?? '08:00'}
                        onChange={e => setPrefs(p => ({ ...p, quietEnd: e.target.value }))}
                        className="px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSavePrefs}
                    disabled={prefsSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </button>
                  {prefsSuccess && (
                    <span className="flex items-center gap-1 text-sm text-[var(--state-success)]">
                      <Check className="w-4 h-4" /> Saved!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Email Change */}
                <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6">
                  <EmailChangeForm />
                </div>

                {/* Password Change */}
                <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6">
                  <PasswordChangeForm />
                </div>

                {/* 2FA placeholder */}
                <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">Two-Factor Authentication</h2>
                  <p className="text-[var(--text-secondary)] mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <button className="px-4 sm:px-6 py-2 min-h-[44px] border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">{t('settings.appearance')}</h2>

                {/* Theme Toggle */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['light', 'dark'] as const).map((themeOption) => (
                      <button
                        key={themeOption}
                        onClick={() => {
                          if (themeOption === 'dark' && colorScheme !== 'dark') toggleColorScheme();
                          if (themeOption === 'light' && colorScheme !== 'light') toggleColorScheme();
                        }}
                        className={`
                          px-4 py-3 min-h-[56px] border-2 rounded-lg transition-colors capitalize flex items-center justify-center gap-2
                          ${colorScheme === themeOption
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10'
                            : 'border-[var(--border-default)] hover:border-[var(--brand-primary)]'}
                        `}
                      >
                        {themeOption === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                        <span>{themeOption === 'dark' ? t('settings.theme.dark') : t('settings.theme.light')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor Theme */}
                <EditorThemeSelector />
              </div>
            )}

            {/* Preferences Settings */}
            {activeTab === 'preferences' && (
              <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">{t('settings.preferences')}</h2>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                    {t('settings.language')}
                  </label>
                  <LanguageSwitcher />
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold text-red-500">{t('settings.dangerzone.title')}</h2>
              </div>
              <p className="text-[var(--text-secondary)] mb-4">
                {t('settings.dangerzone.delete.desc')}
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 min-h-[44px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {t('settings.dangerzone.delete')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-red-500 mb-4">{t('settings.dangerzone.delete')}</h3>
            <p className="text-[var(--text-secondary)] mb-4">
              {t('settings.dangerzone.delete.warning')}
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                {deleteError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('settings.security.password.current')}
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 min-h-[44px] bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('settings.dangerzone.delete.confirm')}
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 sm:px-4 py-2.5 min-h-[44px] bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteConfirmation('');
                  setDeleteError(null);
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmation !== 'DELETE'}
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleteLoading ? 'Deleting...' : t('settings.dangerzone.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
