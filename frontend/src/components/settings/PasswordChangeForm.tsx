// Password Change Form Component
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { profileService } from '../../services/profileService';
import { PasswordStrength } from './PasswordStrength';
import { Lock, Loader, AlertCircle, CheckCircle } from 'lucide-react';

export function PasswordChangeForm() {
    const { user } = useAuth();
    const { t } = useLanguage();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Check if OAuth user
    const isOAuthUser = user?.isOAuthUser;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError(t('settings.security.password.mismatch'));
            return;
        }

        setLoading(true);
        try {
            await profileService.changePassword({ currentPassword, newPassword });
            setSuccess(t('settings.security.password.success'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError(t('settings.security.password.incorrect'));
            } else {
                setError(err.response?.data?.message || t('settings.security.password.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (isOAuthUser) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">{t('settings.security.password')}</span>
                </div>

                <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[var(--warning)]">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">{t('settings.security.password.oauth')}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {t('settings.security.password.oauthDesc')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                <span className="font-medium">{t('settings.security.password')}</span>
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
                        {t('settings.security.password.new')}
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        required
                        minLength={8}
                    />
                    <PasswordStrength password={newPassword} />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('settings.security.password.confirm')}
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <Lock className="w-4 h-4" />
                )}
                {t('settings.security.password.change')}
            </button>
        </form>
    );
}
