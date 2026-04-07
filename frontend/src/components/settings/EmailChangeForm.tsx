// Email Change Form Component
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { profileService } from '../../services/profileService';
import { Mail, Loader, AlertCircle, CheckCircle } from 'lucide-react';

export function EmailChangeForm() {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Check if OAuth user
    const isOAuthUser = user?.isOAuthUser;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!currentPassword.trim() || !newEmail.trim()) {
            setError('All fields are required.');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            setError(t('settings.account.email.invalid'));
            return;
        }

        setLoading(true);
        try {
            const updatedUser = await profileService.changeEmail({ currentPassword, newEmail });
            updateUser({ email: newEmail });
            setSuccess(t('settings.account.email.success'));
            setCurrentPassword('');
            setNewEmail('');
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError(t('settings.security.password.incorrect'));
            } else if (err.response?.status === 409) {
                setError(t('settings.account.email.inUse'));
            } else {
                setError(err.response?.data?.message || t('settings.account.email.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (isOAuthUser) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    <span className="font-medium">{t('settings.account.email')}</span>
                </div>

                <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[var(--warning)]">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">{t('settings.account.email.oauth')}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {t('settings.account.email.oauthDesc')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span className="font-medium">{t('settings.account.email')}</span>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg text-[var(--error)]">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 p-3 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-lg text-[var(--success)]">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{success}</span>
                </div>
            )}

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('settings.account.email.current')}
                    </label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-muted)] cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('settings.security.password.current')}
                    </label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('settings.account.email.new')}
                    </label>
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="new@example.com"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        required
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
                {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                ) : (
                    <Mail className="w-4 h-4" />
                )}
                {t('settings.account.email.change')}
            </button>
        </form>
    );
}
