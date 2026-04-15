import { LucideIcon } from 'lucide-react';

interface CompanyStatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
  bgColor?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

export function CompanyStatsCard({ icon: Icon, label, value, color = 'text-[var(--brand-primary)]', bgColor = 'bg-[var(--brand-primary)]/10', trend }: CompanyStatsCardProps) {
  return (
    <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-[var(--radius-md)] ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend.positive ? 'text-[var(--state-success)]' : 'text-[var(--state-error)]'}`}>
            {trend.positive ? '+' : '-'}{Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">{value}</div>
      <div className="text-sm text-[var(--text-secondary)]">{label}</div>
    </div>
  );
}