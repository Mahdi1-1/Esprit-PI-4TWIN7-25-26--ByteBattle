// Password Strength Indicator Component
import { useMemo } from 'react';

interface PasswordStrengthProps {
    password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
    const strength = useMemo(() => {
        if (!password) return { level: 0, label: '', color: '' };

        let score = 0;

        // Length checks
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;

        // Character type checks
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' };
        if (score <= 4) return { level: 2, label: 'Medium', color: 'bg-yellow-500' };
        return { level: 3, label: 'Strong', color: 'bg-green-500' };
    }, [password]);

    if (!password) return null;

    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                <div className={`h-1 flex-1 rounded ${strength.level >= 1 ? strength.color : 'bg-[var(--border)]'}`} />
                <div className={`h-1 flex-1 rounded ${strength.level >= 2 ? strength.color : 'bg-[var(--border)]'}`} />
                <div className={`h-1 flex-1 rounded ${strength.level >= 3 ? strength.color : 'bg-[var(--border)]'}`} />
            </div>
            <p className={`text-xs ${strength.level === 1 ? 'text-red-500' : strength.level === 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                {strength.label}
            </p>
        </div>
    );
}
