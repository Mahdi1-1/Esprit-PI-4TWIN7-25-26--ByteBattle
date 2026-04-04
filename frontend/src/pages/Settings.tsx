// Settings Page - Complete User Profile & Settings
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { profileService } from '../services/profileService';
import { User, Bell, Shield, Palette, Globe, Trash2, Save, AlertTriangle, Sun, Moon } from 'lucide-react';
import { ProfilePhotoUpload } from '../components/settings/ProfilePhotoUpload';
import { PasswordChangeForm } from '../components/settings/PasswordChangeForm';
import { EmailChangeForm } from '../components/settings/EmailChangeForm';
import { EditorThemeSelector } from '../components/settings/EditorThemeSelector';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTheme } from '../context/ThemeContext';

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

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    } catch (error) {
      console.error('Failed to save profile:', error);
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
      <Navbar />
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
              <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">{t('settings.notifications')}</h2>
                <div className="space-y-4">
                  {[
                    { id: 'email_duels', label: 'Duel invitations', description: 'Get notified when someone challenges you' },
                    { id: 'email_hackathons', label: 'Hackathon updates', description: 'News about upcoming hackathons' },
                    { id: 'email_problems', label: 'New problems', description: 'Weekly digest of new problems' },
                    { id: 'email_achievements', label: 'Achievements', description: 'When you unlock badges or level up' }
                  ].map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0 gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)]">{item.label}</div>
                        <div className="text-sm text-[var(--text-muted)]">{item.description}</div>
                      </div>
                      <label className="relative inline-block w-12 h-6 shrink-0 cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-12 h-6 bg-[var(--surface-1)] rounded-full peer peer-checked:bg-[var(--brand-primary)] transition-colors cursor-pointer"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                      </label>
                    </div>
                  ))}
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
