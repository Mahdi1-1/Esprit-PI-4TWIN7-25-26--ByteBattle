import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  Code2,
  Globe,
  Medal,
  Megaphone,
  MessageSquare,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  Swords,
  Trash2,
  Trophy,
  User,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { EditorThemeSelector } from '../components/settings/EditorThemeSelector';
import { EmailChangeForm } from '../components/settings/EmailChangeForm';
import { PasswordChangeForm } from '../components/settings/PasswordChangeForm';
import { ProfilePhotoUpload } from '../components/settings/ProfilePhotoUpload';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { profileService } from '../services/profileService';
import { notificationsService } from '../services/notificationsService';
import type { NotificationPreference } from '../types/notification.types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notification.types';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const { colorScheme, toggleColorScheme } = useTheme();

  const [bio, setBio] = useState(user?.bio || '');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoClearSignal, setPhotoClearSignal] = useState(0);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreference>(
    DEFAULT_NOTIFICATION_PREFERENCES as unknown as NotificationPreference,
  );
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
    { id: 'preferences', label: t('settings.preferences'), icon: Globe },
  ];

  const notificationCategoryOptions = [
    {
      key: 'hackathon',
      label: 'Hackathon',
      desc: 'Team joins, status changes, results',
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      key: 'duel',
      label: 'Duel',
      desc: 'Opponent matched, duel results, ELO milestones',
      icon: <Swords className="w-4 h-4" />,
    },
    {
      key: 'discussion',
      label: 'Discussion',
      desc: 'Replies, mentions, votes on your posts',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      key: 'submission',
      label: 'Submission',
      desc: 'Grading results for your submissions',
      icon: <Code2 className="w-4 h-4" />,
    },
    {
      key: 'achievement',
      label: 'Achievement',
      desc: 'Badges earned and level-up milestones',
      icon: <Medal className="w-4 h-4" />,
    },
    {
      key: 'system',
      label: 'System',
      desc: 'Platform announcements and maintenance',
      icon: <Megaphone className="w-4 h-4" />,
    },
  ] as const;

  const deliveryChannelOptions = [
    { key: 'inApp', label: 'In-App', desc: 'Show notifications in the bell dropdown' },
    { key: 'email', label: 'Email', desc: 'Send notification emails (requires email verified)' },
    { key: 'push', label: 'Push', desc: 'Browser push notifications' },
  ] as const;

  const normalizeNotificationPrefs = (
    raw?: Partial<NotificationPreference> | null,
  ): NotificationPreference => {
    const base = DEFAULT_NOTIFICATION_PREFERENCES;
    return {
      hackathon: typeof raw?.hackathon === 'boolean' ? raw.hackathon : base.hackathon,
      duel: typeof raw?.duel === 'boolean' ? raw.duel : base.duel,
      discussion: typeof raw?.discussion === 'boolean' ? raw.discussion : base.discussion,
      submission: typeof raw?.submission === 'boolean' ? raw.submission : base.submission,
      canvas: typeof raw?.canvas === 'boolean' ? raw.canvas : base.canvas,
      achievement: typeof raw?.achievement === 'boolean' ? raw.achievement : base.achievement,
      system: typeof raw?.system === 'boolean' ? raw.system : base.system,
      inApp: typeof raw?.inApp === 'boolean' ? raw.inApp : base.inApp,
      email: typeof raw?.email === 'boolean' ? raw.email : base.email,
      push: typeof raw?.push === 'boolean' ? raw.push : base.push,
      quietStart: raw?.quietStart ?? base.quietStart,
      quietEnd: raw?.quietEnd ?? base.quietEnd,
    };
  };

  const renderAnimatedSwitch = (enabled: boolean, onToggle: () => void, ariaLabel: string) => (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] ${
        enabled
          ? 'border-emerald-500 bg-emerald-500'
          : 'border-[var(--border-default)] bg-[var(--surface-2)]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out ${
          enabled ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );

  useEffect(() => {
    if (activeTab !== 'notifications') {
      return;
    }

    notificationsService
      .getPreferences()
      .then((p) => {
        if (p) {
          setPrefs(normalizeNotificationPrefs(p));
        }
      })
      .catch(() => {
        // Keep local defaults when server preferences are unavailable.
      });
  }, [activeTab]);

  const togglePref = (key: keyof NotificationPreference) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePrefs = async () => {
    setPrefsSaving(true);
    try {
      const savedPrefs = await notificationsService.updatePreferences(prefs);
      setPrefs(normalizeNotificationPrefs(savedPrefs));
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setPrefsSaving(false);
    }
  };

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
      const serverMsg: string = error?.response?.data?.message ?? '';
      if (serverMsg) {
        setBioError(serverMsg);
      } else if (error?.response?.status === 500) {
        setBioError('Erreur serveur lors de la sauvegarde. Veuillez reessayer.');
      } else {
        setBioError('Une erreur est survenue. Veuillez reessayer.');
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
          <div className="lg:col-span-1">
            <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-1.5 sm:p-2">
              <ul className="flex flex-col gap-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors min-h-[44px]
                        ${
                          activeTab === tab.id
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

          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {activeTab === 'profile' && (
              <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">{t('settings.profile')}</h2>

                <ProfilePhotoUpload onFileSelect={setSelectedPhoto} clearPreviewSignal={photoClearSignal} />

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Username</label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full px-3 sm:px-4 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg text-[var(--text-muted)] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">{t('settings.profile.bio')}</label>
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
                    {bioSuccess && <span className="text-xs text-[var(--state-success)]">Saved!</span>}
                    {bioError && <span className="text-xs text-[var(--state-error)]">{bioError}</span>}
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

            {activeTab === 'notifications' && (
              <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6 space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">{t('settings.notifications')}</h2>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Notification Categories</h3>
                  <div className="space-y-2">
                    {notificationCategoryOptions.map(({ key, label, desc, icon }) => {
                      const enabled = Boolean((prefs as any)[key]);

                      return (
                        <div
                          key={key}
                          className="group flex items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3 transition-colors hover:border-[var(--brand-primary)]/30"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                              {icon}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-[var(--text-primary)] text-sm">{label}</div>
                              <div className="text-xs text-[var(--text-muted)] leading-relaxed truncate">{desc}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`hidden sm:inline-flex min-w-[4.5rem] justify-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                                enabled
                                  ? 'bg-emerald-500/15 text-emerald-500'
                                  : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                              }`}
                            >
                              {enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            {renderAnimatedSwitch(
                              enabled,
                              () => togglePref(key as keyof NotificationPreference),
                              `Toggle ${label} notifications`,
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Delivery Channels</h3>
                  <div className="space-y-2">
                    {deliveryChannelOptions.map(({ key, label, desc }) => {
                      const enabled = Boolean((prefs as any)[key]);

                      return (
                        <div
                          key={key}
                          className="group flex items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3 transition-colors hover:border-[var(--brand-primary)]/30"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-[var(--text-primary)] text-sm">{label}</div>
                            <div className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`hidden sm:inline-flex min-w-[4.5rem] justify-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                                enabled
                                  ? 'bg-emerald-500/15 text-emerald-500'
                                  : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                              }`}
                            >
                              {enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            {renderAnimatedSwitch(
                              enabled,
                              () => togglePref(key as keyof NotificationPreference),
                              `Toggle ${label} notifications`,
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Quiet Hours</h3>
                  <p className="text-xs text-[var(--text-muted)] mb-3">
                    During quiet hours only critical notifications will push to you.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Start</label>
                      <input
                        type="time"
                        value={prefs.quietStart ?? '22:00'}
                        onChange={(e) => setPrefs((p) => ({ ...p, quietStart: e.target.value }))}
                        className="px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">End</label>
                      <input
                        type="time"
                        value={prefs.quietEnd ?? '08:00'}
                        onChange={(e) => setPrefs((p) => ({ ...p, quietEnd: e.target.value }))}
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

            {activeTab === 'security' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6">
                  <EmailChangeForm />
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6">
                  <PasswordChangeForm />
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">Two-Factor Authentication</h2>
                  <p className="text-[var(--text-secondary)] mb-4">Add an extra layer of security to your account</p>
                  <button className="px-4 sm:px-6 py-2 min-h-[44px] border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">{t('settings.appearance')}</h2>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['light', 'dark'] as const).map((themeOption) => (
                      <button
                        key={themeOption}
                        onClick={() => {
                          if (themeOption === 'dark' && colorScheme !== 'dark') {
                            toggleColorScheme();
                          }
                          if (themeOption === 'light' && colorScheme !== 'light') {
                            toggleColorScheme();
                          }
                        }}
                        className={`
                          flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors
                          ${
                            colorScheme === themeOption
                              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                              : 'border-[var(--border-default)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)]'
                          }
                        `}
                      >
                        {themeOption === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        <span>{themeOption === 'dark' ? t('settings.theme.dark') : t('settings.theme.light')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">{t('settings.preferences')}</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">{t('settings.language')}</label>
                      <LanguageSwitcher />
                    </div>

                    <EditorThemeSelector />
                  </div>
                </div>

                <div className="bg-[var(--surface)] border border-red-500/20 rounded-lg p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-red-500">{t('settings.dangerzone.title')}</h2>
                  <p className="text-[var(--text-secondary)] mt-2 mb-4">{t('settings.dangerzone.delete.desc')}</p>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 sm:px-6 py-2 min-h-[44px] bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('settings.dangerzone.delete.button')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-red-500/30 bg-[var(--surface)] p-5 sm:p-6">
            <h3 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              {t('settings.dangerzone.delete.modal.title')}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {t('settings.dangerzone.delete.modal.desc')}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg outline-none focus:border-red-500"
                />
              </div>
            </div>

            {deleteError && <p className="text-sm text-red-500 mt-3">{deleteError}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                  setDeleteConfirmation('');
                  setDeletePassword('');
                }}
                className="px-4 py-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-2)]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:opacity-90 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : t('settings.dangerzone.delete.button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
