import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/adminService';
import {
  Users, Activity, CheckCircle, AlertTriangle, Swords,
  Loader, MessageSquare, Code2, Shield, TrendingUp,
  Clock, Zap, Award, RefreshCw, Target,
  ArrowUpRight, ArrowDownRight, Minus,
  Brain, Bell, Trophy, Mic, PenTool, LayoutGrid,
  Database, BarChart2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface TimeSeriesPoint {
  date: string;
  registrations: number;
  submissions: number;
  acceptedSubmissions: number;
  duels: number;
  hackathonSubmissions: number;
}
interface DashboardData {
  users: {
    total: number; active: number; banned: number; suspended: number;
    premium: number; admins: number; moderators: number; regularUsers: number;
    newToday: number; newTodayTrend: number; newThisWeek: number;
    avgLevel: number; avgXp: number; avgElo: number;
  };
  challenges: number;
  submissions: { total: number; accepted: number; acceptRate: number };
  submissions24h: number; submissions24hTrend: number;
  submissions7d: number; submissions7dTrend: number;
  verdictRatio: Record<string, number>;
  topLanguages: { language: string; count: number }[];
  duels: { total: number; active: number; completed: number };
  hackathons: { total: number; active: number; submissions: number; teams: number };
  interviews: number; discussions: number; comments: number;
  openReports: number; totalReports: number;
  notifications: { total: number; unread: number };
  badges: { total: number; awarded: number };
  companies: { total: number; members: number };
  aiReviews: number;
  recentActivity: { id: string; actor: string; action: string; entityType: string; time: string }[];
}
interface RetentionData {
  dau: number; wau: number; mau: number; dauMauRatio: number;
  newUsers: { d1: number; d7: number; d30: number };
  retentionRate: number;
  topSubmitters: { username: string; count: number; elo: number }[];
  topDuelPlayers: { username: string; count: number; elo: number }[];
}
interface PerformanceData {
  difficultyDistribution: { difficulty: string; count: number }[];
  topChallenges: { title: string; difficulty: string; attempts: number; accepted: number; acceptRate: number }[];
  avgExecutionTimeMs: number;
  hourlyHeatmap: { hour: number; count: number }[];
}
interface ModuleMetric { label: string; value: string; raw: number; }
interface ModuleData {
  key: string; label: string; icon: string; color: string;
  total: number; last7d: number; growth7d: number;
  uniqueUsers7d: number; engagementRate: number; metrics: ModuleMetric[];
}
interface ModuleUsageData { modules: ModuleData[]; totalActivity: number; period: string; }

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  .d-root { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text-primary); min-height: 100vh; }
  .d-mono { font-family: 'DM Mono', monospace; }

  .d-layout { min-height: 100vh; }
  .d-topbar {
    position: fixed; top: 0; left: 0; right: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px; height: 60px;
    border-bottom: 1px solid var(--border-default);
    background: var(--surface-1);
    z-index: 100; gap: 20px;
  }
  .d-navbar {
    position: fixed; top: 60px; left: 0; right: 0;
    height: 46px; z-index: 90;
    background: var(--surface-1);
    border-bottom: 1px solid var(--border-default);
    display: flex; align-items: center;
    padding: 0 20px; gap: 2px;
    overflow-x: auto; overflow-y: hidden;
    scrollbar-width: none;
  }
  .d-navbar::-webkit-scrollbar { display: none; }
  .d-navbar-sep {
    width: 1px; height: 16px;
    background: var(--border-default);
    flex-shrink: 0; margin: 0 8px;
  }
  .d-navbar-group-label {
    font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text-muted); white-space: nowrap; flex-shrink: 0;
    padding: 0 4px;
  }
  .d-main {
    margin-top: 106px;
    padding: 28px 32px 80px;
    background: var(--surface-2); overflow-x: hidden;
    min-height: calc(100vh - 106px);
  }

  .d-nav-item {
    display: flex; align-items: center; gap: 7px;
    padding: 5px 11px; border-radius: 7px;
    font-size: 12px; font-weight: 500; color: var(--text-secondary);
    cursor: pointer; transition: all 0.14s ease; border: 1px solid transparent;
    text-decoration: none; white-space: nowrap; flex-shrink: 0;
  }
  .d-nav-item:hover { background: var(--surface-2); color: var(--text-primary); }
  .d-nav-item.active { background: rgba(99,102,241,0.1); color: var(--brand-primary); border-color: rgba(99,102,241,0.2); font-weight: 600; }

  .d-card { background: var(--surface-1); border: 1px solid var(--border-default); border-radius: 14px; transition: box-shadow 0.2s ease, border-color 0.2s ease; }
  .d-card:hover { box-shadow: 0 4px 22px rgba(0,0,0,0.22); border-color: rgba(99,102,241,0.13); }

  .d-kpi { background: var(--surface-1); border: 1px solid var(--border-default); border-radius: 14px; padding: 20px; transition: all 0.2s ease; position: relative; overflow: hidden; }
  .d-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.28); }
  .d-kpi-shine { position: absolute; top: 0; left: 0; right: 0; height: 1px; opacity: 0; transition: opacity 0.3s ease; }
  .d-kpi:hover .d-kpi-shine { opacity: 1; }

  .d-section-title {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text-muted); font-family: 'DM Mono', monospace;
    display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
  }
  .d-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border-default); }
  .d-section-idx { color: var(--brand-primary); background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); padding: 2px 7px; border-radius: 5px; font-size: 9px; }

  .d-panel-hd { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 13px; border-bottom: 1px solid var(--border-default); }
  .d-panel-hd-left { display: flex; align-items: center; gap: 9px; }
  .d-panel-icon { width: 27px; height: 27px; border-radius: 7px; background: rgba(99,102,241,0.1); color: var(--brand-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .d-panel-title { font-size: 12.5px; font-weight: 700; color: var(--text-primary); }
  .d-panel-body { padding: 16px 20px; }

  .d-trend { display: inline-flex; align-items: center; gap: 3px; padding: 3px 7px; border-radius: 6px; font-size: 10px; font-weight: 700; font-family: 'DM Mono', monospace; }
  .d-trend-up   { background: rgba(34,197,94,0.12); color: #22c55e; }
  .d-trend-down { background: rgba(239,68,68,0.12); color: #ef4444; }
  .d-trend-flat { background: rgba(107,114,128,0.15); color: var(--text-muted); }

  .d-track { height: 5px; background: var(--surface-2); border-radius: 99px; overflow: hidden; }
  .d-track-thin { height: 3px; background: var(--surface-2); border-radius: 99px; overflow: hidden; }
  .d-fill { height: 100%; border-radius: 99px; transition: width 0.8s cubic-bezier(0.16,1,0.3,1); }

  .d-rank { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border-default); transition: padding-left 0.14s ease; }
  .d-rank:last-child { border-bottom: none; }
  .d-rank:hover { padding-left: 3px; }
  .d-rank-n { width: 24px; height: 24px; border-radius: 7px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--text-muted); flex-shrink: 0; }

  .d-stat { display: flex; align-items: center; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid var(--border-default); }
  .d-stat:last-child { border-bottom: none; }

  .d-act { display: flex; align-items: flex-start; gap: 11px; padding: 11px 8px; border-radius: 8px; border-bottom: 1px solid var(--border-default); transition: background 0.14s ease; margin: 0 -8px; }
  .d-act:last-child { border-bottom: none; }
  .d-act:hover { background: var(--surface-2); }

  .d-range { display: flex; background: var(--surface-2); border-radius: 8px; padding: 3px; gap: 2px; border: 1px solid var(--border-default); }
  .d-range-btn { padding: 5px 12px; border-radius: 5px; font-size: 10.5px; font-weight: 700; font-family: 'DM Mono', monospace; cursor: pointer; border: none; outline: none; transition: all 0.14s ease; }
  .d-range-btn.active { background: var(--brand-primary); color: #fff; }
  .d-range-btn:not(.active) { background: transparent; color: var(--text-secondary); }
  .d-range-btn:not(.active):hover { color: var(--text-primary); background: var(--surface-1); }

  .d-chart-tab { padding: 5px 13px; border-radius: 7px; font-size: 11.5px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-default); transition: all 0.14s ease; outline: none; }
  .d-chart-tab.active { background: rgba(99,102,241,0.12); color: var(--brand-primary); border-color: rgba(99,102,241,0.3); }
  .d-chart-tab:not(.active) { background: transparent; color: var(--text-secondary); }
  .d-chart-tab:not(.active):hover { color: var(--text-primary); background: var(--surface-2); }

  @keyframes d-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
  .d-pulse { animation: d-pulse 2.2s ease-in-out infinite; }

  @keyframes d-fadein { from{opacity:0;transform:translateY(9px)} to{opacity:1;transform:translateY(0)} }
  .d-fade { animation: d-fadein 0.38s ease both; }

  .d-heat { flex: 1; height: 36px; border-radius: 5px; cursor: default; transition: transform 0.12s ease; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px; min-width: 0; }
  .d-heat:hover { transform: scaleY(1.1); transform-origin: bottom; }

  .d-mod { background: var(--surface-1); border: 1px solid var(--border-default); border-radius: 14px; padding: 18px; transition: all 0.2s ease; position: relative; overflow: hidden; }
  .d-mod:hover { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(0,0,0,0.28); border-color: rgba(99,102,241,0.13); }
`;

// ─────────────────────────────────────────────────────────
// Chart primitives — new types
// ─────────────────────────────────────────────────────────

/** Stepped sparkline */
function StepSparkline({ data, color = '#6366f1', width = 90, height = 30 }: {
  data: number[]; color?: string; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1); const min = Math.min(...data, 0); const range = max - min || 1;
  const step = width / (data.length - 1);
  const toX = (i: number) => i * step;
  const toY = (v: number) => height - 2 - ((v - min) / range) * (height - 6);
  let d = '';
  data.forEach((v, i) => {
    const x = toX(i); const y = toY(v);
    if (i === 0) { d += `M${x.toFixed(1)},${y.toFixed(1)}`; return; }
    const prevY = toY(data[i - 1]);
    d += ` L${x.toFixed(1)},${prevY.toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `${d} L${toX(data.length - 1).toFixed(1)},${height} L0,${height} Z`;
  const gId = `ss${color.replace(/\W/g, '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="2.5" fill={color} />
    </svg>
  );
}

/** Line chart with data-point dots */
function LinePointChart({ series, labels, colors, height = 200 }: {
  series: { name: string; data: number[] }[];
  labels: string[];
  colors: string[];
  height?: number;
}) {
  const n = series[0]?.data.length ?? 0;
  if (n < 2) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No data available</div>;
  const W = 600; const pL = 42; const pR = 10; const pT = 12; const pB = 28;
  const cW = W - pL - pR; const cH = height - pT - pB;
  const maxV = Math.max(...series.flatMap(s => s.data), 1);
  const stp = cW / (n - 1);
  const toX = (i: number) => pL + i * stp;
  const toY = (v: number) => pT + cH - (v / maxV) * cH;
  const lblStep = Math.ceil(n / 6);
  const ticks = [0, 0.5, 1].map(t => Math.round(t * maxV));

  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height }}>
      <defs>
        {series.map((_, si) => (
          <linearGradient key={si} id={`lpc${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[si % colors.length]} stopOpacity="0.13" />
            <stop offset="100%" stopColor={colors[si % colors.length]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {ticks.map((t, i) => {
        const y = toY(t);
        return (
          <g key={i}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.05" strokeDasharray={i === 0 ? '' : '4 3'} />
            <text x={pL - 5} y={y + 4} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.28" fontFamily="DM Mono, monospace">
              {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t}
            </text>
          </g>
        );
      })}
      {labels.map((l, i) => {
        if (i % lblStep !== 0 && i !== n - 1) return null;
        return <text key={i} x={toX(i)} y={height - 6} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.28" fontFamily="DM Mono, monospace">{l.slice(5)}</text>;
      })}
      {series.map((s, si) => {
        const pts = s.data.map((v, i) => [toX(i), toY(v)] as [number, number]);
        const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
        const area = `${line} L${pts[n-1][0].toFixed(1)},${(pT+cH).toFixed(1)} L${pts[0][0].toFixed(1)},${(pT+cH).toFixed(1)} Z`;
        const c = colors[si % colors.length];
        return (
          <g key={si}>
            <path d={area} fill={`url(#lpc${si})`} />
            <path d={line} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map(([x, y], i) => {
              if (i % lblStep !== 0 && i !== n - 1) return null;
              return <circle key={i} cx={x} cy={y} r="3" fill={c} stroke="var(--surface-1)" strokeWidth="2" />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal gauge bars — replaces donut */
function GaugeChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sorted.map((s, i) => {
        const pct = Math.round((s.value / total) * 100);
        return (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</span>
              </div>
              <span className="d-mono" style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${s.color}80, ${s.color})`, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Lollipop chart — replaces bar chart */
function LollipopChart({ data, color = '#6366f1', height = 120 }: {
  data: { label: string; value: number }[]; color?: string; height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 580; const slotW = W / data.length;
  const stemW = Math.max(1, slotW * 0.14);
  const dotR = Math.max(2, Math.min(slotW * 0.18, 5));
  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height }}>
      {data.map((d, i) => {
        const bh = (d.value / max) * (height - dotR * 2 - 6);
        const cx = i * slotW + slotW / 2;
        const cy = height - dotR - 3 - bh;
        const opacity = 0.35 + (d.value / max) * 0.65;
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={cy + dotR} y2={height - 3} stroke={color} strokeWidth={stemW} strokeOpacity={opacity * 0.55} />
            <circle cx={cx} cy={cy} r={dotR} fill={color} opacity={opacity} />
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Helpers & constants
// ─────────────────────────────────────────────────────────

const VERDICT_COLORS: Record<string, string> = { AC: '#22c55e', WA: '#ef4444', TLE: '#f59e0b', RE: '#f97316', CE: '#a855f7', QUEUED: '#6b7280' };
const VERDICT_LABELS: Record<string, string> = { AC: 'Accepted', WA: 'Wrong Answer', TLE: 'Time Limit', RE: 'Runtime Error', CE: 'Compile Error', QUEUED: 'Queued' };
const DIFF_COLORS: Record<string, string> = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const LANG_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function relativeTime(s: string) {
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`;
}
function Trend({ value, dir }: { value: number; dir: 'up' | 'down' | 'flat' }) {
  return (
    <span className={`d-trend d-trend-${dir}`}>
      {dir === 'up' ? <ArrowUpRight size={9} /> : dir === 'down' ? <ArrowDownRight size={9} /> : <Minus size={9} />}
      {Math.abs(value)}%
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Building blocks
// ─────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon, trend, trendDir, sparkData, sparkColor, accent = '#6366f1' }: {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; trend?: number; trendDir?: 'up' | 'down' | 'flat';
  sparkData?: number[]; sparkColor?: string; accent?: string;
}) {
  return (
    <div className="d-kpi d-fade">
      <div className="d-kpi-shine" style={{ background: `linear-gradient(90deg, transparent, ${accent}99, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 15 }}>
        <div style={{ width: 33, height: 33, borderRadius: 9, background: `${accent}18`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${accent}25`, flexShrink: 0 }}>
          {icon}
        </div>
        {trend !== undefined && trendDir && <Trend value={Math.abs(trend)} dir={trendDir} />}
      </div>
      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1, color: 'var(--text-primary)', marginBottom: 4 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="d-mono" style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, minHeight: 22 }}>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{sub}</div>}
        {sparkData && sparkData.length >= 2 && (
          <div style={{ opacity: 0.6, flexShrink: 0, marginLeft: 'auto' }}>
            <StepSparkline data={sparkData} color={sparkColor || accent} width={66} height={26} />
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ idx, children }: { idx: number; children: React.ReactNode }) {
  return (
    <div className="d-section-title">
      <span className="d-section-idx d-mono">{String(idx).padStart(2, '0')}</span>
      {children}
    </div>
  );
}

function Panel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="d-card" style={style}>{children}</div>;
}

function PanelHead({ icon, title, right }: { icon: React.ReactNode; title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="d-panel-hd">
      <div className="d-panel-hd-left">
        <div className="d-panel-icon">{icon}</div>
        <span className="d-panel-title">{title}</span>
      </div>
      {right && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{right}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sidebar nav config
// ─────────────────────────────────────────────────────────

const NAV = [
  { label: 'Overview', items: [
    { id: 'kpis', label: 'Key Metrics', icon: <Activity size={13} /> },
    { id: 'trends', label: 'Trends', icon: <TrendingUp size={13} /> },
  ]},
  { label: 'Analytics', items: [
    { id: 'engagement', label: 'Engagement', icon: <Users size={13} /> },
    { id: 'submissions', label: 'Submissions', icon: <Code2 size={13} /> },
    { id: 'patterns', label: 'Activity', icon: <Clock size={13} /> },
  ]},
  { label: 'Platform', items: [
    { id: 'platform', label: 'Platform', icon: <Database size={13} /> },
    { id: 'modules', label: 'Modules', icon: <LayoutGrid size={13} /> },
    { id: 'audit', label: 'Audit Trail', icon: <Shield size={13} /> },
  ]},
];

// ─────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [timeSeries, setTimeSeries] = useState<{ days: number; series: TimeSeriesPoint[] } | null>(null);
  const [retention, setRetention] = useState<RetentionData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [moduleUsage, setModuleUsage] = useState<ModuleUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(30);
  const [activeChart, setActiveChart] = useState<'submissions' | 'registrations' | 'duels'>('submissions');
  const [refreshing, setRefreshing] = useState(false);
  const [activeNav, setActiveNav] = useState('kpis');

  const loadAll = useCallback(async (days: number) => {
    try {
      const [kpis, ts, ret, perf, mods] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getTimeSeries(days),
        adminService.getRetentionMetrics(),
        adminService.getPerformanceMetrics(),
        adminService.getModuleUsage(),
      ]);
      if (kpis.status === 'fulfilled') setData(kpis.value);
      if (ts.status === 'fulfilled') setTimeSeries(ts.value);
      if (ret.status === 'fulfilled') setRetention(ret.value);
      if (perf.status === 'fulfilled') setPerformance(perf.value);
      if (mods.status === 'fulfilled') setModuleUsage(mods.value);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadAll(timeRange); }, [loadAll, timeRange]);

  if (loading) {
    return (
      <AdminLayout>
        <style>{STYLES}</style>
        <div className="d-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 12 }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-primary)' }} />
          <p className="d-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Loading analytics…</p>
        </div>
      </AdminLayout>
    );
  }

  const users = data?.users ?? { total: 0, active: 0, banned: 0, suspended: 0, premium: 0, admins: 0, moderators: 0, regularUsers: 0, newToday: 0, newTodayTrend: 0, newThisWeek: 0, avgLevel: 0, avgXp: 0, avgElo: 0 };
  const submissions = data?.submissions ?? { total: 0, accepted: 0, acceptRate: 0 };
  const topLanguages = data?.topLanguages ?? [];
  const verdictRatio = data?.verdictRatio ?? {};
  const duels = data?.duels ?? { total: 0, active: 0, completed: 0 };
  const hackathons = data?.hackathons ?? { total: 0, active: 0, submissions: 0, teams: 0 };
  const recentActivity = data?.recentActivity ?? [];
  const tsData = timeSeries?.series ?? [];
  const tsLabels = tsData.map(d => d.date);
  const subSpark = tsData.slice(-14).map(d => d.submissions);
  const regSpark = tsData.slice(-14).map(d => d.registrations);
  const duelSpark = tsData.slice(-14).map(d => d.duels);

  const chartSeriesMap: Record<string, { name: string; data: number[] }[]> = {
    submissions: [{ name: 'Total', data: tsData.map(d => d.submissions) }, { name: 'Accepted', data: tsData.map(d => d.acceptedSubmissions) }],
    registrations: [{ name: 'Registrations', data: tsData.map(d => d.registrations) }],
    duels: [{ name: 'Duels', data: tsData.map(d => d.duels) }, { name: 'Hackathon Subs', data: tsData.map(d => d.hackathonSubmissions) }],
  };
  const chartColorsMap: Record<string, string[]> = {
    submissions: ['#6366f1', '#22c55e'],
    registrations: ['#3b82f6'],
    duels: ['#f59e0b', '#a855f7'],
  };

  const verdictSegments = Object.entries(verdictRatio).filter(([, v]) => v > 0)
    .map(([k, v]) => ({ label: VERDICT_LABELS[k] || k, value: v, color: VERDICT_COLORS[k] || '#6b7280' }));
  const diffSegments = (performance?.difficultyDistribution ?? []).map(d => ({ label: d.difficulty, value: d.count, color: DIFF_COLORS[d.difficulty] || '#6b7280' }));
  const topLangTotal = topLanguages.reduce((s, l) => s + l.count, 0) || 1;
  const peakHour = performance?.hourlyHeatmap?.reduce((m, d) => d.count > m.count ? d : m, { hour: 0, count: 0 });

  const MODULE_ICONS: Record<string, React.ReactNode> = {
    code: <Code2 size={15} />, canvas: <PenTool size={15} />, swords: <Swords size={15} />,
    trophy: <Trophy size={15} />, mic: <Mic size={15} />, message: <MessageSquare size={15} />,
    brain: <Brain size={15} />, bell: <Bell size={15} />,
  };

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <AdminLayout>
      <style>{STYLES}</style>
      <div className="d-root">

          {/* ── Topbar ── */}
          <header className="d-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="d-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 6px #22c55e55' }} />
              <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-primary)', margin: 0 }}>
                Analytics Dashboard
              </h1>
              <span className="d-mono" style={{ fontSize: 10.5, color: 'var(--text-muted)', borderLeft: '1px solid var(--border-default)', paddingLeft: 14 }}>
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="d-range">
                {([7, 14, 30] as const).map(d => (
                  <button key={d} className={`d-range-btn${timeRange === d ? ' active' : ''}`} onClick={() => setTimeRange(d)}>{d}d</button>
                ))}
              </div>
              <button onClick={() => { setRefreshing(true); loadAll(timeRange); }} disabled={refreshing}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.14s ease', opacity: refreshing ? 0.6 : 1 }}>
                <RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                Refresh
              </button>
            </div>
          </header>

          {/* ── Horizontal fixed navbar ── */}
          <nav className="d-navbar">
            {NAV.map((sec, si) => (
              <React.Fragment key={sec.label}>
                {si > 0 && <span className="d-navbar-sep" />}
                <span className="d-navbar-group-label">{sec.label}</span>
                {sec.items.map(item => (
                  <a
                    key={item.id}
                    className={`d-nav-item${activeNav === item.id ? ' active' : ''}`}
                    onClick={() => scrollTo(item.id)}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                ))}
              </React.Fragment>
            ))}
          </nav>

          {/* ── Main ── */}
          <main className="d-main">

            {/* §1 KPIs */}
            <section id="section-kpis" style={{ marginBottom: 44 }}>
              <SectionTitle idx={1}>Key Metrics</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 12 }}>
                <KpiCard title="Total Users" value={users.total} icon={<Users size={15} />} sub={`${users.active.toLocaleString()} active`} accent="#6366f1" sparkData={regSpark} />
                <KpiCard title="New Today" value={users.newToday} icon={<TrendingUp size={15} />} sub={`${users.newThisWeek} this week`} accent="#3b82f6"
                  trend={users.newTodayTrend} trendDir={users.newTodayTrend > 0 ? 'up' : users.newTodayTrend < 0 ? 'down' : 'flat'} sparkData={regSpark} sparkColor="#3b82f6" />
                <KpiCard title="Submissions 24h" value={data?.submissions24h ?? 0} icon={<Activity size={15} />} sub={`${submissions.acceptRate}% accept rate`} accent="#10b981"
                  trend={data?.submissions24hTrend ?? 0} trendDir={(data?.submissions24hTrend ?? 0) > 0 ? 'up' : (data?.submissions24hTrend ?? 0) < 0 ? 'down' : 'flat'} sparkData={subSpark} sparkColor="#10b981" />
                <KpiCard title="Submissions 7d" value={data?.submissions7d ?? 0} icon={<Zap size={15} />} sub={`${submissions.total.toLocaleString()} total`} accent="#f59e0b"
                  trend={data?.submissions7dTrend ?? 0} trendDir={(data?.submissions7dTrend ?? 0) > 0 ? 'up' : (data?.submissions7dTrend ?? 0) < 0 ? 'down' : 'flat'} sparkData={subSpark} sparkColor="#f59e0b" />
                <KpiCard title="Active Duels" value={duels.active} icon={<Swords size={15} />} sub={`${duels.total.toLocaleString()} total`} accent="#ec4899" sparkData={duelSpark} sparkColor="#ec4899" />
                <KpiCard title="Open Reports" value={data?.openReports ?? 0} icon={<AlertTriangle size={15} />} sub={`of ${data?.totalReports ?? 0} total`} accent={(data?.openReports ?? 0) > 10 ? '#ef4444' : '#f59e0b'} />
              </div>
            </section>

            {/* §2 Trends — asymmetric: chart + summary col */}
            <section id="section-trends" style={{ marginBottom: 44 }}>
              <SectionTitle idx={2}>Trends Over Time</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 12 }}>
                <Panel>
                  <PanelHead icon={<BarChart2 size={14} />} title="Activity over time" />
                  <div className="d-panel-body">
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 18 }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {(['submissions', 'registrations', 'duels'] as const).map(k => (
                          <button key={k} className={`d-chart-tab${activeChart === k ? ' active' : ''}`} onClick={() => setActiveChart(k)} style={{ textTransform: 'capitalize' }}>{k}</button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 14 }}>
                        {chartSeriesMap[activeChart].map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 16, height: 2, borderRadius: 2, display: 'inline-block', backgroundColor: chartColorsMap[activeChart][i] }} />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <LinePointChart series={chartSeriesMap[activeChart]} labels={tsLabels} colors={chartColorsMap[activeChart]} height={200} />
                  </div>
                </Panel>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Total Submissions', value: submissions.total, color: '#6366f1', icon: <Activity size={14} /> },
                    { label: 'Accepted', value: submissions.accepted, color: '#22c55e', icon: <CheckCircle size={14} /> },
                    { label: 'Challenges', value: data?.challenges ?? 0, color: '#3b82f6', icon: <Target size={14} /> },
                    { label: 'Avg Elo', value: users.avgElo, color: '#f59e0b', icon: <Award size={14} /> },
                  ].map(({ label, value, color, icon }) => (
                    <Panel key={label} style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                        <div style={{ width: 25, height: 25, borderRadius: 7, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{label}</span>
                      </div>
                      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{value.toLocaleString()}</div>
                    </Panel>
                  ))}
                </div>
              </div>
            </section>

            {/* §3 Engagement */}
            <section id="section-engagement" style={{ marginBottom: 44 }}>
              <SectionTitle idx={3}>Engagement & Retention</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(245px, 1fr))', gap: 12 }}>

                <Panel>
                  <PanelHead icon={<Users size={14} />} title="Active Users" right={`DAU/MAU: ${retention?.dauMauRatio ?? 0}%`} />
                  <div className="d-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                      { label: 'DAU', sub: '24 hours', value: retention?.dau ?? 0, color: '#22c55e' },
                      { label: 'WAU', sub: '7 days', value: retention?.wau ?? 0, color: '#3b82f6' },
                      { label: 'MAU', sub: '30 days', value: retention?.mau ?? 0, color: '#6366f1' },
                    ].map(({ label, sub, value, color }) => {
                      const pct = Math.round((value / (retention?.mau || 1)) * 100);
                      return (
                        <div key={label}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div>
                              <span className="d-mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>{sub}</span>
                            </div>
                            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 17, fontWeight: 800, color }}>{value.toLocaleString()}</span>
                          </div>
                          <div className="d-track">
                            <div className="d-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ paddingTop: 11, borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Retention Rate</span>
                      <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 800, color: 'var(--brand-primary)' }}>{retention?.retentionRate ?? 0}%</span>
                    </div>
                  </div>
                </Panel>

                <Panel>
                  <PanelHead icon={<TrendingUp size={14} />} title="New User Cohorts" />
                  <div className="d-panel-body">
                    {[
                      { label: 'Last 24 hours', value: retention?.newUsers.d1 ?? 0, accent: '#22c55e' },
                      { label: 'Last 7 days', value: retention?.newUsers.d7 ?? 0, accent: '#3b82f6' },
                      { label: 'Last 30 days', value: retention?.newUsers.d30 ?? 0, accent: '#6366f1' },
                    ].map(({ label, value, accent }) => (
                      <div key={label} className="d-stat">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                        </div>
                        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel>
                  <PanelHead icon={<Award size={14} />} title="Top Submitters" right="30d" />
                  <div className="d-panel-body">
                    {(retention?.topSubmitters ?? []).length === 0
                      ? <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No data yet</p>
                      : (retention?.topSubmitters ?? []).map((u, i) => (
                        <div key={u.username} className="d-rank">
                          <span className="d-rank-n">{i + 1}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                          <div style={{ textAlign: 'right' }}>
                            <div className="d-mono" style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 600 }}>{u.count} subs</div>
                            <div className="d-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.elo} elo</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </Panel>

                <Panel>
                  <PanelHead icon={<Swords size={14} />} title="Top Duelists" right="30d" />
                  <div className="d-panel-body">
                    {(retention?.topDuelPlayers ?? []).length === 0
                      ? <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No data yet</p>
                      : (retention?.topDuelPlayers ?? []).map((u, i) => (
                        <div key={u.username} className="d-rank">
                          <span className="d-rank-n">{i + 1}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                          <div style={{ textAlign: 'right' }}>
                            <div className="d-mono" style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{u.count} duels</div>
                            <div className="d-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.elo} elo</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </Panel>
              </div>
            </section>

            {/* §4 Submissions */}
            <section id="section-submissions" style={{ marginBottom: 44 }}>
              <SectionTitle idx={4}>Submission Analytics</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

                <Panel>
                  <PanelHead icon={<CheckCircle size={14} />} title="Verdict Distribution" />
                  <div className="d-panel-body">
                    <GaugeChart segments={verdictSegments.length ? verdictSegments : [{ label: 'No data', value: 1, color: '#374151' }]} />
                    <div style={{ paddingTop: 12, marginTop: 12, borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total submissions</span>
                      <span className="d-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{submissions.total.toLocaleString()}</span>
                    </div>
                  </div>
                </Panel>

                <Panel>
                  <PanelHead icon={<Code2 size={14} />} title="Top Languages" />
                  <div className="d-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {topLanguages.slice(0, 6).map((lang, i) => {
                      const pct = Math.round((lang.count / topLangTotal) * 100);
                      const c = LANG_COLORS[i % LANG_COLORS.length];
                      return (
                        <div key={lang.language}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{lang.language}</span>
                            <div style={{ display: 'flex', gap: 7 }}>
                              <span className="d-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{lang.count.toLocaleString()}</span>
                              <span className="d-mono" style={{ fontSize: 10, fontWeight: 700, color: c }}>{pct}%</span>
                            </div>
                          </div>
                          <div className="d-track">
                            <div className="d-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}80, ${c})` }} />
                          </div>
                        </div>
                      );
                    })}
                    {topLanguages.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No data</p>}
                  </div>
                </Panel>

                <Panel>
                  <PanelHead icon={<Target size={14} />} title="Challenge Difficulty" />
                  <div className="d-panel-body">
                    <GaugeChart segments={diffSegments.length ? diffSegments : [{ label: 'No data', value: 1, color: '#374151' }]} />
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-default)' }}>
                      <p className="d-mono" style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 11 }}>Most Attempted</p>
                      {(performance?.topChallenges ?? []).slice(0, 3).map((ch, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--border-default)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                            <span className="d-mono" style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>#{i + 1}</span>
                            <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{ch.title}</span>
                          </div>
                          <span className="d-mono" style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, flexShrink: 0, color: ch.acceptRate > 50 ? '#22c55e' : ch.acceptRate > 25 ? '#f59e0b' : '#ef4444', background: ch.acceptRate > 50 ? 'rgba(34,197,94,0.1)' : ch.acceptRate > 25 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)' }}>{ch.acceptRate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>
              </div>
            </section>

            {/* §5 Activity Patterns */}
            <section id="section-patterns" style={{ marginBottom: 44 }}>
              <SectionTitle idx={5}>Activity Patterns</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                <Panel>
                  <PanelHead icon={<Clock size={14} />}
                    title={<>Hourly Heatmap <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>last 7d</span></>}
                    right={peakHour ? <span>Peak: <span className="d-mono" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{String(peakHour.hour).padStart(2, '0')}:00</span></span> : undefined} />
                  <div className="d-panel-body">
                    {performance?.hourlyHeatmap ? (
                      <>
                        <div style={{ display: 'flex', gap: 2.5 }}>
                          {performance.hourlyHeatmap.map(d => {
                            const it = d.count / Math.max(...performance.hourlyHeatmap.map(x => x.count), 1);
                            return (
                              <div key={d.hour} className="d-heat" title={`${String(d.hour).padStart(2, '0')}:00 — ${d.count}`}
                                style={{ background: `rgba(99,102,241,${Math.max(0.07, it * 0.82)})` }}>
                                {d.count > 0 && it > 0.5 && <span className="d-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{d.count}</span>}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                          {[0, 4, 8, 12, 16, 20, 23].map(h => <span key={h} className="d-mono" style={{ fontSize: 8.5, color: 'var(--text-muted)' }}>{String(h).padStart(2, '0')}h</span>)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13, paddingTop: 12, borderTop: '1px solid var(--border-default)' }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Low</span>
                          <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'linear-gradient(to right, rgba(99,102,241,0.07), rgba(99,102,241,0.82))' }} />
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>High</span>
                        </div>
                      </>
                    ) : <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No data</p>}
                  </div>
                </Panel>

                <Panel>
                  <PanelHead icon={<Activity size={14} />}
                    title={<>Daily Submissions <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>last {timeRange}d</span></>}
                    right={<span className="d-mono">{tsData.reduce((s, d) => s + d.submissions, 0).toLocaleString()} total</span>} />
                  <div className="d-panel-body">
                    {tsData.length > 1 ? (
                      <>
                        <LollipopChart data={tsData.map(d => ({ label: d.date.slice(5), value: d.submissions }))} color="#6366f1" height={130} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                          <span className="d-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{tsData[0]?.date.slice(5)}</span>
                          <span className="d-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{tsData[tsData.length - 1]?.date.slice(5)}</span>
                        </div>
                      </>
                    ) : <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No data</p>}
                  </div>
                </Panel>
              </div>
            </section>

            {/* §6 Platform Overview */}
            <section id="section-platform" style={{ marginBottom: 44 }}>
              <SectionTitle idx={6}>Platform Overview</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(245px, 1fr))', gap: 12 }}>

                <Panel>
                  <PanelHead icon={<Users size={14} />} title="User Breakdown" />
                  <div className="d-panel-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
                      {[
                        { label: 'Regular Users', value: users.regularUsers ?? 0, color: '#3b82f6' },
                        { label: 'Moderators', value: users.moderators ?? 0, color: '#f59e0b' },
                        { label: 'Admins', value: users.admins ?? 0, color: '#ef4444' },
                        { label: 'Premium', value: users.premium ?? 0, color: '#a855f7' },
                        { label: 'Suspended', value: users.suspended ?? 0, color: '#6b7280' },
                        { label: 'Banned', value: users.banned ?? 0, color: '#dc2626' },
                      ].map(item => {
                        const pct = users.total > 0 ? Math.round((item.value / users.total) * 100) : 0;
                        return (
                          <div key={item.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 7 }}>
                                <span className="d-mono" style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value.toLocaleString()}</span>
                                <span className="d-mono" style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 24, textAlign: 'right' }}>{pct}%</span>
                              </div>
                            </div>
                            <div className="d-track-thin">
                              <div className="d-fill" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ paddingTop: 11, borderTop: '1px solid var(--border-default)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, textAlign: 'center' }}>
                      {[{ v: users.avgLevel, l: 'Avg Lvl' }, { v: users.avgXp.toLocaleString(), l: 'Avg XP' }, { v: users.avgElo, l: 'Avg Elo' }].map(x => (
                        <div key={x.l} style={{ padding: '6px 0' }}>
                          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{x.v}</div>
                          <div className="d-mono" style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>

                <Panel>
                  <PanelHead icon={<Swords size={14} />} title="Duels & Hackathons" />
                  <div className="d-panel-body">
                    {[
                      { label: 'Total Duels', value: duels.total, sub: `${duels.active} active · ${duels.completed} done` },
                      { label: 'Total Hackathons', value: hackathons.total, sub: `${hackathons.active} active` },
                      { label: 'Hackathon Teams', value: hackathons.teams ?? 0, sub: 'registered' },
                      { label: 'Hackathon Subs', value: hackathons.submissions ?? 0, sub: 'submitted' },
                    ].map(item => (
                      <div key={item.label} className="d-stat">
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>{item.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.sub}</div>
                        </div>
                        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel>
                  <PanelHead icon={<MessageSquare size={14} />} title="Community" />
                  <div className="d-panel-body">
                    {[
                      { label: 'Discussions', value: data?.discussions ?? 0, sub: `${data?.comments ?? 0} comments` },
                      { label: 'AI Interviews', value: data?.interviews ?? 0, sub: 'sessions' },
                      { label: 'AI Reviews', value: data?.aiReviews ?? 0, sub: 'code reviews' },
                      { label: 'Notifications', value: data?.notifications?.total ?? 0, sub: `${data?.notifications?.unread ?? 0} unread` },
                    ].map(item => (
                      <div key={item.label} className="d-stat">
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>{item.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.sub}</div>
                        </div>
                        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{(item.value ?? 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel>
                  <PanelHead icon={<Shield size={14} />} title="Moderation & Rewards" />
                  <div className="d-panel-body">
                    {[
                      { label: 'Open Reports', value: data?.openReports ?? 0, sub: `of ${data?.totalReports ?? 0} total`, warn: (data?.openReports ?? 0) > 5 },
                      { label: 'Badge Types', value: data?.badges?.total ?? 0, sub: 'defined', warn: false },
                      { label: 'Badges Awarded', value: data?.badges?.awarded ?? 0, sub: 'earned', warn: false },
                      { label: 'Companies', value: data?.companies?.total ?? 0, sub: `${data?.companies?.members ?? 0} members`, warn: false },
                    ].map(item => (
                      <div key={item.label} className="d-stat">
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>{item.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.sub}</div>
                        </div>
                        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 800, color: item.warn ? '#ef4444' : 'var(--text-primary)' }}>
                          {(item.value ?? 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </section>

            {/* §7 Modules */}
            <section id="section-modules" style={{ marginBottom: 44 }}>
              <SectionTitle idx={7}>Module Usage & Engagement</SectionTitle>
              {(() => {
                const modules = moduleUsage?.modules ?? [];
                const totalAct = moduleUsage?.totalActivity || 1;
                if (!modules.length) return (
                  <Panel><div className="d-panel-body" style={{ textAlign: 'center', padding: '36px 0' }}><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No module data</p></div></Panel>
                );
                const sorted = [...modules].sort((a, b) => b.last7d - a.last7d);
                const maxLast7d = Math.max(...sorted.map(m => m.last7d), 1);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Panel>
                      <PanelHead icon={<LayoutGrid size={14} />} title="Activity Share" right={<span className="d-mono">{totalAct.toLocaleString()} events</span>} />
                      <div className="d-panel-body">
                        <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 13 }}>
                          {sorted.filter(m => m.last7d > 0).map(m => {
                            const pct = Math.round((m.last7d / totalAct) * 100);
                            return <div key={m.key} title={`${m.label}: ${pct}%`} style={{ width: `${pct}%`, backgroundColor: m.color, minWidth: pct > 0 ? 3 : 0, transition: 'width 0.7s ease' }} />;
                          })}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                          {sorted.filter(m => m.last7d > 0).map(m => {
                            const pct = Math.round((m.last7d / totalAct) * 100);
                            return (
                              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: m.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</span>
                                <span className="d-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Panel>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))', gap: 10 }}>
                      {sorted.map(mod => {
                        const barPct = Math.round((mod.last7d / maxLast7d) * 100);
                        const up = mod.growth7d >= 0;
                        return (
                          <div key={mod.key} className="d-mod">
                            <div style={{ position: 'absolute', top: -18, right: -18, width: 72, height: 72, borderRadius: '50%', background: mod.color, filter: 'blur(28px)', opacity: 0.08, pointerEvents: 'none' }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${mod.color}18`, color: mod.color, border: `1px solid ${mod.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {MODULE_ICONS[mod.icon] ?? <Activity size={15} />}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{mod.label}</span>
                              </div>
                              <span className="d-mono" style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: up ? 'rgba(34,197,94,0.1)' : mod.growth7d < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.12)', color: up ? '#22c55e' : mod.growth7d < 0 ? '#ef4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                {up ? <ArrowUpRight size={9} /> : mod.growth7d < 0 ? <ArrowDownRight size={9} /> : <Minus size={9} />}
                                {Math.abs(mod.growth7d)}%
                              </span>
                            </div>
                            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 25, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 2 }}>{mod.last7d.toLocaleString()}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 11 }}>
                              events 7d &nbsp;·&nbsp; <span className="d-mono" style={{ fontWeight: 600 }}>{mod.total.toLocaleString()}</span> total
                            </div>
                            <div className="d-track" style={{ marginBottom: 13 }}>
                              <div className="d-fill" style={{ width: `${barPct}%`, background: `linear-gradient(90deg, ${mod.color}80, ${mod.color})` }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{mod.key === 'notifications' ? 'Read rate' : `${mod.uniqueUsers7d} users`}</span>
                              <span className="d-mono" style={{ fontSize: 12, fontWeight: 700, color: mod.color }}>{mod.engagementRate}%</span>
                            </div>
                            <div className="d-track-thin" style={{ marginBottom: mod.metrics.length > 0 ? 12 : 0 }}>
                              <div className="d-fill" style={{ width: `${Math.min(mod.engagementRate, 100)}%`, backgroundColor: mod.color, opacity: 0.6 }} />
                            </div>
                            {mod.metrics.length > 0 && (
                              <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {mod.metrics.map(m => (
                                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{m.label}</span>
                                    <span className="d-mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{m.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* §8 Audit */}
            <section id="section-audit">
              <SectionTitle idx={8}>Audit Trail</SectionTitle>
              <Panel>
                <PanelHead icon={<Clock size={14} />} title="Recent Admin Activity" />
                <div className="d-panel-body">
                  {recentActivity.length === 0
                    ? <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '36px 0' }}>No recent activity</p>
                    : recentActivity.map(item => {
                      const dotColors: Record<string, string> = { USER_ROLE_CHANGED: '#f59e0b', USER_BANNED: '#ef4444', CHALLENGE_CREATED: '#22c55e', REPORT_RESOLVED: '#3b82f6' };
                      const dot = Object.entries(dotColors).find(([k]) => item.action.includes(k))?.[1] || '#6b7280';
                      return (
                        <div key={item.id} className="d-act">
                          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: dot, flexShrink: 0, marginTop: 5 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, lineHeight: 1.4, margin: 0 }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{item.actor}</span>
                              <span style={{ color: 'var(--text-secondary)', marginLeft: 7 }}>{item.action.toLowerCase().replace(/_/g, ' ')}</span>
                            </p>
                            <p className="d-mono" style={{ margin: '2px 0 0', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.entityType}</p>
                          </div>
                          <span className="d-mono" style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>{relativeTime(item.time)}</span>
                        </div>
                      );
                    })}
                </div>
              </Panel>
            </section>

          </main>
      </div>
    </AdminLayout>
  );
}