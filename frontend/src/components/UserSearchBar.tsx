import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, X, Loader2, Swords, Star } from 'lucide-react';
import api from '../api/axios';
import { profileService } from '../services/profileService';

interface SearchResult {
  id: string;
  username: string;
  profileImage: string | null;
  level: number;
  elo: number;
}

// ─── Rank config by elo ────────────────────────────────────────
const RANK_CONFIG: {
  min: number;
  label: string;
  color: string;      // text color
  bg: string;         // badge bg
  ring: string;       // avatar ring gradient
  icon: string;
}[] = [
  { min: 2400, label: 'Grandmaster', color: 'text-red-400',    bg: 'bg-red-500/15',    ring: 'from-red-500 to-orange-400',    icon: '👑' },
  { min: 2000, label: 'Master',      color: 'text-yellow-300', bg: 'bg-yellow-500/15', ring: 'from-yellow-400 to-amber-300',  icon: '🌟' },
  { min: 1600, label: 'Diamond',     color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   ring: 'from-cyan-400 to-blue-400',    icon: '💎' },
  { min: 1400, label: 'Gold',        color: 'text-yellow-500', bg: 'bg-yellow-600/15', ring: 'from-yellow-500 to-amber-400', icon: '🥇' },
  { min: 1200, label: 'Silver',      color: 'text-slate-300',  bg: 'bg-slate-400/15',  ring: 'from-slate-400 to-slate-300',  icon: '🥈' },
  { min: 0,    label: 'Bronze',      color: 'text-orange-400', bg: 'bg-orange-500/15', ring: 'from-orange-500 to-amber-600', icon: '🥉' },
];

function getRank(elo: number) {
  return RANK_CONFIG.find((r) => elo >= r.min) ?? RANK_CONFIG[RANK_CONFIG.length - 1];
}

export function UserSearchBar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);    
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ─── Open / close ────────────────────────────────────────────
  const openSearch = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIdx(-1);
  }, []);

  // ─── Click outside ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, closeSearch]);

  // ─── Keyboard shortcut: Ctrl+K / Cmd+K ─────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (open) closeSearch();
        else openSearch();
      }
      if (e.key === 'Escape' && open) {
        closeSearch();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, openSearch, closeSearch]);

  // ─── Debounced search ───────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/users/search/public', { params: { q, limit: 8 } });
        setResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ─── Keyboard navigation ───────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && selectedIdx >= 0 && results[selectedIdx]) {
      e.preventDefault();
      goToProfile(results[selectedIdx].username);
    }
  };

  const goToProfile = (username: string) => {
    closeSearch();
    navigate(`/u/${username}`);
  };

  // ─── Elo rank helper ────────────────────────────────────────
  // (now handled by getRank() above)

  // ─── Closed state: just an icon button ──────────────────────
  if (!open) {
    return (
      <button
        onClick={openSearch}
        className="
          w-9 h-9 sm:w-10 sm:h-10
          flex items-center justify-center
          rounded-[var(--radius-md)]
          text-[var(--text-secondary)]
          hover:bg-[var(--surface-2)]
          hover:text-[var(--brand-primary)]
          transition-colors duration-200
        "
        aria-label="Search users (Ctrl+K)"
        title="Search users (Ctrl+K)"
      >
        <Search className="w-5 h-5" />
      </button>
    );
  }

  // ─── Open state: full search bar ────────────────────────────
  return (
    <div ref={containerRef} className="relative">
      {/* Input row */}
      <div className="
        flex items-center gap-2
        bg-[var(--surface-2)] border border-[var(--border-default)]
        rounded-[var(--radius-lg)] px-3 py-1.5
        focus-within:border-[var(--brand-primary)] focus-within:ring-1 focus-within:ring-[var(--brand-primary)]/30
        transition-all duration-200
        w-56 sm:w-72
      ">
        <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIdx(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search users..."
          className="
            flex-1 bg-transparent text-sm text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
            outline-none
          "
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)] flex-shrink-0" />}
        <button
          onClick={closeSearch}
          className="p-0.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Results dropdown */}
      {query.trim().length >= 2 && (
        <div className="
          absolute top-full left-0 mt-2
          w-80
          bg-[var(--surface-1)] border border-[var(--border-default)]
          rounded-2xl shadow-2xl
          overflow-hidden z-[100]
        ">
          {results.length > 0 ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--surface-2)]">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {results.length} result{results.length > 1 ? 's' : ''}
                </span>
                <span className="text-xs text-[var(--text-muted)] opacity-60">↑↓ to navigate</span>
              </div>

              {/* Result rows */}
              <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-default)]/50">
                {results.map((user, idx) => {
                  const rank = getRank(user.elo);
                  const isSelected = idx === selectedIdx;
                  return (
                    <button
                      key={user.id}
                      onClick={() => goToProfile(user.username)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3
                        text-left transition-all duration-150 group
                        ${isSelected
                          ? 'bg-[var(--brand-primary)]/8'
                          : 'hover:bg-[var(--surface-2)]'
                        }
                      `}
                    >
                      {/* Avatar with rank-colored ring */}
                      <div className="relative flex-shrink-0">
                        <div className={`
                          p-[2px] rounded-full bg-gradient-to-br ${rank.ring}
                        `}>
                          <img
                            src={profileService.getPhotoUrl(user.profileImage, user.username)}
                            alt={user.username}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover bg-[var(--surface-2)] block"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
                            }}
                          />
                        </div>
                        {/* Rank icon badge */}
                        <span className="absolute -bottom-0.5 -right-0.5 text-[11px] leading-none select-none">
                          {rank.icon}
                        </span>
                      </div>

                      {/* Username + rank label */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight">
                          {highlightMatch(user.username, query)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${rank.color} ${rank.bg}`}>
                            {rank.label}
                          </span>
                        </div>
                      </div>

                      {/* Stats column */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                        <span className={`text-sm font-bold tabular-nums ${rank.color}`}>
                          {user.elo}
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                          <Star className="w-2.5 h-2.5" />
                          Lv {user.level}
                        </span>
                      </div>

                      {/* Enter indicator */}
                      {isSelected && (
                        <span className="flex-shrink-0 ml-1 text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border-default)] px-1.5 py-0.5 rounded font-mono">
                          ↵
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-[var(--border-default)] bg-[var(--surface-2)]">
                <p className="text-[10px] text-[var(--text-muted)] text-center">
                  Press <kbd className="px-1 py-0.5 bg-[var(--surface-3)] border border-[var(--border-default)] rounded text-[9px] font-mono">Enter</kbd> to open profile
                </p>
              </div>
            </>
          ) : !loading ? (
            <div className="px-4 py-8 text-center space-y-2">
              <div className="text-3xl">🔍</div>
              <p className="text-sm font-medium text-[var(--text-primary)]">No users found</p>
              <p className="text-xs text-[var(--text-muted)]">No match for "{query.trim()}"</p>
            </div>
          ) : (
            <div className="px-4 py-6 flex items-center justify-center gap-2 text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Highlight matched substring ──────────────────────────────
function highlightMatch(text: string, query: string) {
  const q = query.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;

  return (
    <>
      {text.slice(0, idx)}
      <span className="text-[var(--brand-primary)] font-bold">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}
