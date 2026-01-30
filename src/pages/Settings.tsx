import { useState } from 'react';
import { Layout } from '../components/Layout';
import { User, Bell, Shield, Palette, Globe, Mail, Lock, Trash2, Save } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'preferences', label: 'Preferences', icon: Globe }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${
                      activeTab === tab.id
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        defaultValue="AyaCode"
                        className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Email
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          defaultValue="aya@bytebattle.dev"
                          className="flex-1 px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
                        />
                        <button className="px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors">
                          Verify
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        defaultValue="Passionate developer competing in ByteBattle challenges"
                        className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors resize-none"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="px-6 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { id: 'email_duels', label: 'Duel invitations', description: 'Get notified when someone challenges you' },
                    { id: 'email_hackathons', label: 'Hackathon updates', description: 'News about upcoming hackathons' },
                    { id: 'email_problems', label: 'New problems', description: 'Weekly digest of new problems' },
                    { id: 'email_achievements', label: 'Achievements', description: 'When you unlock badges or level up' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0">
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{item.label}</div>
                        <div className="text-sm text-[var(--text-muted)]">{item.description}</div>
                      </div>
                      <label className="relative inline-block w-12 h-6">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-12 h-6 bg-[var(--surface-2)] rounded-full peer peer-checked:bg-[var(--brand-primary)] transition-colors cursor-pointer"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Change Password</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="px-6 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Two-Factor Authentication</h2>
                  <p className="text-[var(--text-secondary)] mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <button className="px-6 py-2 border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Appearance</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Light', 'Dark', 'System'].map((theme) => (
                        <button
                          key={theme}
                          className="px-4 py-3 border-2 border-[var(--border-default)] rounded-lg hover:border-[var(--brand-primary)] transition-colors"
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                      Code Editor Theme
                    </label>
                    <select className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors">
                      <option>VS Code Dark</option>
                      <option>Monokai</option>
                      <option>Dracula</option>
                      <option>GitHub Light</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Settings */}
            {activeTab === 'preferences' && (
              <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Preferences</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                      Default Programming Language
                    </label>
                    <select className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors">
                      <option>Python</option>
                      <option>JavaScript</option>
                      <option>C++</option>
                      <option>Java</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                      Timezone
                    </label>
                    <select className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors">
                      <option>UTC</option>
                      <option>America/New_York</option>
                      <option>Europe/Paris</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
