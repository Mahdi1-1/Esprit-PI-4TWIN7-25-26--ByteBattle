import { ReactNode } from 'react';

interface CanvasToolButtonProps {
  icon: string;
  name: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function CanvasToolButton({
  icon,
  name,
  shortcut,
  active = false,
  disabled = false,
  onClick
}: CanvasToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative
        w-10 h-10 
        flex items-center justify-center
        border border-[var(--border-default)]
        bg-[var(--surface-1)]
        theme-btn
        transition-all duration-150
        ${active ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)] border-[var(--brand-primary)]' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-[var(--brand-primary)] hover:bg-[var(--surface-2)]'}
      `}
      title={`${name}${shortcut ? ` (${shortcut})` : ''}`}
    >
      <span className="text-lg">{icon}</span>
      
      {/* Tooltip */}
      <div className="
        absolute left-full ml-2 px-2 py-1
        bg-[var(--surface-3)] border border-[var(--border-default)]
        rounded text-xs whitespace-nowrap
        opacity-0 pointer-events-none
        group-hover:opacity-100
        transition-opacity duration-150
        z-50
      ">
        {name}
        {shortcut && <span className="ml-2 text-[var(--text-muted)]">{shortcut}</span>}
      </div>
    </button>
  );
}

interface ColorSwatchProps {
  color: string;
  active?: boolean;
  onClick?: () => void;
}

export function ColorSwatch({ color, active = false, onClick }: ColorSwatchProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-8 h-8 rounded-md
        border-2 transition-all
        ${active ? 'border-[var(--brand-primary)] scale-110' : 'border-[var(--border-default)]'}
        hover:scale-110
      `}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

interface StickyNoteProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function StickyNote({ color, size = 'md', children }: StickyNoteProps) {
  const sizes = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-48 h-48'
  };

  return (
    <div
      className={`
        ${sizes[size]}
        p-4
        shadow-md
        font-handwriting
        ${color}
        rotate-[-2deg]
        hover:rotate-0
        transition-transform
      `}
    >
      {children}
    </div>
  );
}

interface LayerItemProps {
  name: string;
  visible: boolean;
  locked: boolean;
  selected?: boolean;
  onToggleVisible: () => void;
  onToggleLock: () => void;
  onSelect: () => void;
  onRename: (name: string) => void;
}

export function LayerItem({
  name,
  visible,
  locked,
  selected = false,
  onToggleVisible,
  onToggleLock,
  onSelect,
  onRename
}: LayerItemProps) {
  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1.5
        text-sm
        rounded
        cursor-pointer
        transition-colors
        ${selected ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)]' : 'hover:bg-[var(--surface-2)]'}
      `}
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisible();
        }}
        className="text-base hover:text-[var(--brand-primary)]"
      >
        {visible ? '👁️' : '👁️‍🗨️'}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleLock();
        }}
        className="text-base hover:text-[var(--brand-primary)]"
      >
        {locked ? '🔒' : '🔓'}
      </button>
      <span className="flex-1 truncate">{name}</span>
    </div>
  );
}

interface MiniMapProps {
  className?: string;
}

export function MiniMap({ className = '' }: MiniMapProps) {
  return (
    <div className={`
      w-full h-32
      bg-[var(--surface-1)]
      border border-[var(--border-default)]
      rounded-lg
      overflow-hidden
      relative
      ${className}
    `}>
      <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-xs">
        Mini Map
      </div>
      {/* Viewport indicator */}
      <div className="absolute inset-4 border-2 border-[var(--brand-primary)] opacity-50 pointer-events-none" />
    </div>
  );
}

interface CanvasTimerProps {
  minutes: number;
  seconds: number;
  warning?: boolean;
  critical?: boolean;
}

export function CanvasTimer({ minutes, seconds, warning = false, critical = false }: CanvasTimerProps) {
  const color = critical 
    ? 'text-[var(--state-error)]' 
    : warning 
    ? 'text-[var(--state-warning)]' 
    : 'text-[var(--text-primary)]';

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5
      border border-[var(--border-default)]
      rounded-lg
      font-mono font-bold
      ${color}
      ${critical ? 'animate-pulse' : ''}
    `}>
      <span>⏱️</span>
      <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
    </div>
  );
}

interface ExportDropdownProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportJSON: () => void;
}

export function ExportDropdown({ onExportPNG, onExportSVG, onExportJSON }: ExportDropdownProps) {
  return (
    <div className="
      absolute top-full right-0 mt-2
      w-48
      bg-[var(--surface-1)]
      border border-[var(--border-default)]
      rounded-lg
      shadow-lg
      overflow-hidden
      z-50
    ">
      <button
        onClick={onExportPNG}
        className="
          w-full px-4 py-2 text-left text-sm
          hover:bg-[var(--surface-2)]
          transition-colors
        "
      >
        📷 Export PNG
      </button>
      <button
        onClick={onExportSVG}
        className="
          w-full px-4 py-2 text-left text-sm
          hover:bg-[var(--surface-2)]
          transition-colors
        "
      >
        🎨 Export SVG
      </button>
      <button
        onClick={onExportJSON}
        className="
          w-full px-4 py-2 text-left text-sm
          hover:bg-[var(--surface-2)]
          transition-colors
        "
      >
        💾 Export JSON
      </button>
    </div>
  );
}

interface HintPanelProps {
  hintNumber: number;
  totalHints: number;
  hint: string;
  onNextHint: () => void;
  disabled?: boolean;
}

export function HintPanel({ hintNumber, totalHints, hint, onNextHint, disabled = false }: HintPanelProps) {
  return (
    <div className="
      theme-card
      bg-[var(--surface-1)]
      border-[var(--border-default)]
      p-4
      space-y-3
    ">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--brand-primary)]">
          💡 Indice {hintNumber}/{totalHints}
        </h4>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">{hint}</p>
      <button
        onClick={onNextHint}
        disabled={disabled || hintNumber >= totalHints}
        className="
          w-full px-4 py-2
          text-sm
          bg-[var(--surface-2)]
          border border-[var(--border-default)]
          rounded-lg
          hover:border-[var(--brand-primary)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        Indice suivant
      </button>
    </div>
  );
}

interface CanvasToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export function CanvasToast({ message, type = 'info', onClose }: CanvasToastProps) {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const colors = {
    success: 'border-[var(--state-success)]',
    error: 'border-[var(--state-error)]',
    info: 'border-[var(--brand-primary)]',
    warning: 'border-[var(--state-warning)]'
  };

  return (
    <div className={`
      flex items-center gap-3 px-4 py-3
      bg-[var(--surface-1)]
      border-l-4 ${colors[type]}
      rounded-lg
      shadow-lg
      min-w-[300px]
      max-w-md
    `}>
      <span className="text-xl">{icons[type]}</span>
      <span className="flex-1 text-sm text-[var(--text-primary)]">{message}</span>
      <button
        onClick={onClose}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        ✕
      </button>
    </div>
  );
}
