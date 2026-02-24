import type { ReactNode } from "react";
import type { Theme } from "./types";

interface ToolbarButtonProps {
  onClick: () => void;
  theme: Theme;
  title: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
}

export function ToolbarButton({
  onClick,
  title,
  icon,
  label,
  active = false,
  danger = false,
}: ToolbarButtonProps) {
  const baseClasses =
    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[var(--btn-radius)] transition-all duration-200 theme-btn border border-[var(--border-default)]";

  let colorClasses: string;
  if (danger) {
    colorClasses =
      "bg-[var(--surface-2)] hover:bg-[var(--state-error)]/10 text-[var(--state-error)] hover:text-[var(--state-error)]";
  } else if (active) {
    colorClasses =
      "bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border-[var(--brand-primary)]";
  } else {
    colorClasses =
      "bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)]";
  }

  return (
    <button
      onClick={onClick}
      title={title}
      className={`${baseClasses} ${colorClasses}`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
