import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { usePermissions } from './hooks/useAuth'
import api from './api'
import {
    AlertTriangle, Siren, ShieldAlert,
    Ticket, ArrowUpRight, Plus, FileDown, PlayCircle,
} from 'lucide-react'

// ─── useTheme ─────────────────────────────────────────────────────────────────
function useTheme() {
    const [isDark, setIsDark] = useState(() => {
        const attr = document.documentElement.getAttribute('data-theme')
        if (attr) return attr !== 'light'
        return !window.matchMedia('(prefers-color-scheme: light)').matches
    })

    useEffect(() => {
        const mo = new MutationObserver(() => {
            const attr = document.documentElement.getAttribute('data-theme')
            setIsDark(attr ? attr !== 'light' : !window.matchMedia('(prefers-color-scheme: light)').matches)
        })
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

        const mq = window.matchMedia('(prefers-color-scheme: light)')
        const mqHandler = (e) => {
            if (!document.documentElement.getAttribute('data-theme')) setIsDark(!e.matches)
        }
        mq.addEventListener('change', mqHandler)

        return () => { mo.disconnect(); mq.removeEventListener('change', mqHandler) }
    }, [])

    return isDark
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const tokens = (isDark) => {
    const d = isDark
    return {
        // Surfaces
        bgCard:        d ? 'rgba(13,27,42,0.7)'          : 'rgba(255,255,255,0.97)',
        bgCardHover:   d ? 'rgba(2,128,144,0.06)'         : 'rgba(2,128,144,0.04)',
        bgSubtle:      d ? 'rgba(27,38,59,0.4)'           : 'rgba(241,245,249,0.8)',
        bgAction:      d ? 'rgba(2,128,144,0.1)'          : 'rgba(2,128,144,0.08)',
        bgActionHover: d ? 'rgba(2,128,144,0.18)'         : 'rgba(2,128,144,0.14)',
        bgDanger:      d ? 'rgba(239,68,68,0.08)'         : 'rgba(220,38,38,0.06)',
        bgDangerHover: d ? 'rgba(239,68,68,0.14)'         : 'rgba(220,38,38,0.1)',
        bgSkeleton:    d ? 'rgba(27,38,59,0.5)'           : 'rgba(203,213,225,0.5)',
        bgBarTrack:    d ? 'rgba(27,38,59,0.8)'           : 'rgba(203,213,225,0.6)',
        // FIX: badge backgrounds for HeroCard "pressure" badge — hardcoded in original
        bgPressureHigh:    d ? 'rgba(245,158,11,0.14)'   : 'rgba(217,119,6,0.1)',
        bgPressureNormal:  d ? 'rgba(2,195,154,0.12)'    : 'rgba(5,150,105,0.09)',
        // FIX: live-feed pulse dot — was Tailwind bg-red-500 class (can't theme)
        dotLive:       '#ef4444',

        // Borders
        border:        d ? '#1b263b'                      : '#e2e8f0',
        borderAction:  d ? 'rgba(2,128,144,0.25)'         : 'rgba(2,128,144,0.3)',
        borderDanger:  d ? 'rgba(239,68,68,0.2)'          : 'rgba(220,38,38,0.22)',
        // FIX: SVG ring track — was using tk.border which is near-invisible on light bg
        svgTrack:      d ? '#1b263b'                      : '#cbd5e1',

        // Text hierarchy
        textPrimary:   d ? '#f1f5f9'  : '#0f172a',
        textSecondary: d ? '#cbd5e1'  : '#1e293b',
        textMuted:     d ? '#94a3b8'  : '#475569',
        textFaint:     d ? '#4a7a8a'  : '#64748b',
        textGhost:     d ? '#2d4a5a'  : '#94a3b8',
        textAction:    d ? '#028090'  : '#0369a1',
        textDanger:    d ? '#f87171'  : '#dc2626',
        // FIX: pressure badge text colors — were hardcoded
        textPressureHigh:   d ? '#d97706'  : '#92400e',
        textPressureNormal: d ? '#059669'  : '#065f46',
    }
}

// ─── Semantic accent palettes ─────────────────────────────────────────────────
//
//  FIX: bg opacities increased for light mode to ensure contrast against white bgCard.
//  Dark opacities preserved exactly.
//  FIX: text colors for light mode darkened for legibility against white.
//

const SEVERITY_LABELS = { 0: 'Info', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

// FIX: added string-key aliases so IncidentRow / mockPotentialIncidents string
// severities ('low', 'high', 'critical' …) also resolve correctly.
const SEVERITY_CFG = {
    // integer keys (vulnerabilities, incidents numeric API)
    0: { bar: '#64748b', bg: (d) => d ? 'rgba(100,116,139,0.12)' : 'rgba(100,116,139,0.13)', text: (d) => d ? '#94a3b8' : '#334155' },
    1: { bar: '#16a34a', bg: (d) => d ? 'rgba(34,197,94,0.12)'   : 'rgba(22,163,74,0.11)',   text: (d) => d ? '#4ade80' : '#14532d' },
    2: { bar: '#d97706', bg: (d) => d ? 'rgba(245,158,11,0.12)'  : 'rgba(217,119,6,0.11)',   text: (d) => d ? '#fbbf24' : '#78350f' },
    3: { bar: '#ea580c', bg: (d) => d ? 'rgba(249,115,22,0.12)'  : 'rgba(234,88,12,0.11)',   text: (d) => d ? '#fb923c' : '#7c2d12' },
    4: { bar: '#dc2626', bg: (d) => d ? 'rgba(239,68,68,0.12)'   : 'rgba(220,38,38,0.11)',   text: (d) => d ? '#f87171' : '#7f1d1d' },
    // FIX: string-key aliases (used by mockPotentialIncidents + any string-severity API)
    info:     null, // resolved below
    low:      null,
    medium:   null,
    high:     null,
    critical: null,
}
SEVERITY_CFG.info     = SEVERITY_CFG[0]
SEVERITY_CFG.low      = SEVERITY_CFG[1]
SEVERITY_CFG.medium   = SEVERITY_CFG[2]
SEVERITY_CFG.high     = SEVERITY_CFG[3]
SEVERITY_CFG.critical = SEVERITY_CFG[4]

// FIX: string→int map for SeverityPill label lookup
const SEVERITY_STRING_TO_INT = { info: 0, low: 1, medium: 2, high: 3, critical: 4 }

const PRIORITY_CFG = {
    // FIX: light mode bg opacities increased from 0.07 → 0.10 for contrast on white
    critical: { bar: '#dc2626', bg: (d) => d ? 'rgba(220,38,38,0.1)'  : 'rgba(220,38,38,0.10)'  },
    high:     { bar: '#ea580c', bg: (d) => d ? 'rgba(234,88,12,0.1)'  : 'rgba(234,88,12,0.10)'  },
    medium:   { bar: '#d97706', bg: (d) => d ? 'rgba(217,119,6,0.1)'  : 'rgba(217,119,6,0.10)'  },
    low:      { bar: '#16a34a', bg: (d) => d ? 'rgba(22,163,74,0.1)'  : 'rgba(22,163,74,0.10)'  },
}

const STATUS_COLORS = {
    open:        '#ef4444',
    in_progress: '#38bdf8',
    resolved:    '#22c55e',
    closed:      '#94a3b8',
}

const STATUS_BADGE_CFG = {
    ok:       { bg: (d) => d ? 'rgba(2,195,154,0.12)'  : 'rgba(5,150,105,0.1)',  text: (d) => d ? '#02c39a' : '#047857', dot: (d) => d ? '#02c39a' : '#047857',  label: 'Operational' },
    degraded: { bg: (d) => d ? 'rgba(245,158,11,0.12)' : 'rgba(217,119,6,0.1)',  text: (d) => d ? '#fbbf24' : '#b45309', dot: (d) => d ? '#f59e0b' : '#d97706',  label: 'Elevated'    },
    critical: { bg: (d) => d ? 'rgba(239,68,68,0.12)'  : 'rgba(220,38,38,0.1)',  text: (d) => d ? '#f87171' : '#b91c1c', dot: (d) => d ? '#ef4444' : '#dc2626',  label: 'Critical'    },
}

const mockPotentialIncidents = [
    { id: 'pi-1', title: 'Suspicious outbound traffic spike', source: 'Netflow', severity: 'high',     time: '2m ago'  },
    { id: 'pi-2', title: 'Multiple failed logins on VPN',    source: 'Auth',    severity: 'medium',   time: '8m ago'  },
    { id: 'pi-3', title: 'New executable from unknown hash', source: 'EDR',     severity: 'critical', time: '15m ago' },
    { id: 'pi-4', title: 'DNS anomaly to parked domains',    source: 'DNS',     severity: 'low',      time: '34m ago' },
]

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

const BASE_STYLES = `
    @keyframes fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .dash-fadein { animation: fadein 0.4s ease-out both; }
`

// ─── Primitives ───────────────────────────────────────────────────────────────

function Card({ children, className = '', style = {}, tk }) {
    return (
        <div
            className={`rounded-xl ${className}`}
            style={{ background: tk.bgCard, border: `1px solid ${tk.border}`, ...style }}
        >
            {children}
        </div>
    )
}

function Divider({ tk }) {
    return <div style={{ borderTop: `1px solid ${tk.border}` }} />
}

function Bar({ value = 0, color, height = 4, tk }) {
    return (
        <div className="w-full overflow-hidden rounded-full" style={{ height, background: tk.bgBarTrack }}>
            <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${clamp(value, 0, 100)}%`, background: color }}
            />
        </div>
    )
}

function StatusBadge({ status, isDark }) {
    const cfg = STATUS_BADGE_CFG[status] ?? STATUS_BADGE_CFG.ok
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ background: cfg.bg(isDark), color: cfg.text(isDark) }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot(isDark) }} />
            {cfg.label}
        </span>
    )
}

function Skeleton({ tk }) {
    return (
        <div className="space-y-2 p-4">
            {[0, 1, 2].map(i => (
                <div key={i} className="h-7 rounded-lg animate-pulse" style={{ background: tk.bgSkeleton }} />
            ))}
        </div>
    )
}

function SectionTitle({ label, meta, tk }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-3.5 w-0.5 rounded-full" style={{ background: '#02c39a' }} />
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: tk.textFaint }}>
                    {label}
                </span>
            </div>
            {meta && <span className="text-[10px]" style={{ color: tk.textGhost }}>{meta}</span>}
        </div>
    )
}

function KVRow({ label, value, valueColor, tk }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-[11px]" style={{ color: tk.textFaint }}>{label}</span>
            <span className="text-[11px] font-semibold" style={{ color: valueColor ?? tk.textSecondary }}>{value}</span>
        </div>
    )
}

// FIX: SeverityPill now accepts both integer and string severity values.
// String values are mapped to their integer equivalents via SEVERITY_STRING_TO_INT
// so the label lookup in SEVERITY_LABELS always resolves correctly.
function SeverityPill({ severity, isDark }) {
    const key = typeof severity === 'string' ? SEVERITY_STRING_TO_INT[severity] : severity
    const cfg = SEVERITY_CFG[key]
    if (!cfg) return null
    return (
        <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: cfg.bg(isDark), color: cfg.text(isDark) }}
        >
            {SEVERITY_LABELS[key] ?? 'Unknown'}
        </span>
    )
}

// ─── Hero Metric Cards ────────────────────────────────────────────────────────

function HeroCard({ label, value, sub, accent, icon: Icon, badge, tk }) {
    return (
        <Card tk={tk} className="relative overflow-hidden p-5 flex flex-col gap-4">
            <div
                className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-10"
                style={{ background: accent, filter: 'blur(24px)' }}
            />
            <div className="flex items-start justify-between gap-2">
                <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                >
                    <Icon size={15} style={{ color: accent }} />
                </div>
                {badge}
            </div>
            <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: tk.textPrimary }}>{value}</p>
                <p className="mt-0.5 text-[11px] font-medium" style={{ color: tk.textFaint }}>{label}</p>
            </div>
            {sub && <p className="text-[10px] leading-relaxed" style={{ color: tk.textGhost }}>{sub}</p>}
        </Card>
    )
}

// ─── Posture Score Card ───────────────────────────────────────────────────────

function PostureCard({ score, socStatus, criticalIssues, isDark, tk }) {
    const color     = score >= 70 ? '#02c39a' : score >= 50 ? '#f59e0b' : '#ef4444'
    const statusKey = criticalIssues > 0 ? 'critical' : score < 60 ? 'degraded' : 'ok'

    return (
        <Card tk={tk} className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                    Security Posture
                </span>
                <StatusBadge status={statusKey} isDark={isDark} />
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                    <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full -rotate-90">
                        {/* FIX: use tk.svgTrack instead of tk.border — visible on both themes */}
                        <circle cx="28" cy="28" r="22" fill="none" stroke={tk.svgTrack} strokeWidth="4" />
                        <circle
                            cx="28" cy="28" r="22" fill="none"
                            stroke={color} strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 22}`}
                            strokeDashoffset={`${2 * Math.PI * 22 * (1 - score / 100)}`}
                            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                    </svg>
                    <span className="text-sm font-bold tabular-nums" style={{ color }}>{score}</span>
                </div>
                <div className="flex-1 space-y-2">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px]" style={{ color: tk.textFaint }}>Score</span>
                            <span className="text-[10px] font-semibold" style={{ color }}>{score}/100</span>
                        </div>
                        <Bar value={score} color={color} height={3} tk={tk} />
                    </div>
                    <p className="text-[10px]" style={{ color: tk.textGhost }}>
                        {criticalIssues} critical issue{criticalIssues !== 1 ? 's' : ''} requiring attention
                    </p>
                </div>
            </div>

            <Divider tk={tk} />
            <KVRow label="SOC Status" value={socStatus} valueColor={color} tk={tk} />
        </Card>
    )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions({ actions, tk }) {
    return (
        <Card tk={tk} className="p-4">
            <div className="mb-3">
                <SectionTitle label="Quick Actions" tk={tk} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {actions.map(action => {
                    const Icon = action.icon
                    return (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                            style={{ background: tk.bgSubtle, border: `1px solid ${tk.border}` }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background  = tk.bgAction
                                e.currentTarget.style.borderColor = tk.borderAction
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background  = tk.bgSubtle
                                e.currentTarget.style.borderColor = tk.border
                            }}
                        >
                            <span className="flex items-center gap-2.5">
                                <Icon size={14} style={{ color: tk.textAction }} />
                                <span className="text-xs font-medium" style={{ color: tk.textMuted }}>
                                    {action.label}
                                </span>
                            </span>
                            <ArrowUpRight size={12} style={{ color: tk.textGhost }} />
                        </button>
                    )
                })}
            </div>
        </Card>
    )
}

// ─── Tickets Section ──────────────────────────────────────────────────────────

function TicketsSection({ ticketStats, loading, error, navigate, isDark, tk }) {
    if (!ticketStats && !loading && !error) return null

    const ticketTotal      = ticketStats?.total ?? 0
    const ticketMine       = ticketStats?.my_tickets ?? 0
    const ticketByStatus   = ticketStats?.by_status ?? []
    const ticketByPriority = ticketStats?.by_priority ?? []
    const ticketOpen       = ticketByStatus.find(s => s._id === 'open')?.count ?? 0
    const ticketInProgress = ticketByStatus.find(s => s._id === 'in_progress')?.count ?? 0

    return (
        <section className="space-y-3">
            <SectionTitle label="Tickets" meta={`${ticketTotal} total`} tk={tk} />

            {error && (
                <Card tk={tk} className="p-4">
                    <p className="text-xs" style={{ color: tk.textDanger }}>{error}</p>
                </Card>
            )}

            {loading && <Card tk={tk}><Skeleton tk={tk} /></Card>}

            {ticketStats && (
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Workflow breakdown */}
                    <Card tk={tk} className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                                Workflow
                            </span>
                            <span
                                className="rounded-full px-2 py-0.5 text-[10px]"
                                style={{ background: tk.bgAction, color: tk.textAction }}
                            >
                                Mine: {ticketMine}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {ticketByStatus.map(s => {
                                const pct   = ticketTotal ? Math.round((s.count / ticketTotal) * 100) : 0
                                const color = STATUS_COLORS[s._id] ?? '#64748b'
                                return (
                                    <div key={s._id} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] capitalize" style={{ color: tk.textFaint }}>
                                                {s._id.replace('_', ' ')}
                                            </span>
                                            <span className="text-[11px] font-semibold tabular-nums" style={{ color: tk.textSecondary }}>
                                                {s.count} <span style={{ color: tk.textGhost }}>({pct}%)</span>
                                            </span>
                                        </div>
                                        <Bar value={pct} color={color} height={3} tk={tk} />
                                    </div>
                                )
                            })}
                        </div>
                    </Card>

                    {/* Priority heatmap */}
                    <Card tk={tk} className="p-4 space-y-4">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                            Priority Heatmap
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {['critical', 'high', 'medium', 'low'].map(level => {
                                const item  = ticketByPriority.find(p => p._id === level)
                                const count = item?.count ?? 0
                                const pct   = ticketTotal ? Math.round((count / ticketTotal) * 100) : 0
                                const cfg   = PRIORITY_CFG[level]
                                return (
                                    <div
                                        key={level}
                                        className="rounded-lg p-3 space-y-2"
                                        style={{ background: cfg.bg(isDark), border: `1px solid ${cfg.bar}33` }}
                                    >
                                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cfg.bar }}>
                                            {level}
                                        </p>
                                        <p className="text-xl font-bold tabular-nums" style={{ color: tk.textPrimary }}>{count}</p>
                                        <Bar value={pct} color={cfg.bar} height={2} tk={tk} />
                                    </div>
                                )
                            })}
                        </div>
                    </Card>

                    {/* My queue */}
                    <Card tk={tk} className="p-4 space-y-4 flex flex-col">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                            My Queue
                        </span>
                        <div className="flex-1 space-y-1">
                            {[
                                { label: 'Assigned to me', value: ticketMine,       vc: tk.textSecondary },
                                { label: 'Open',           value: ticketOpen,       vc: '#ef4444'        },
                                { label: 'In progress',    value: ticketInProgress, vc: '#38bdf8'        },
                            ].map((r, i) => (
                                <div key={r.label} style={{ borderTop: i > 0 ? `1px solid ${tk.border}` : 'none' }}>
                                    <KVRow label={r.label} value={r.value} valueColor={r.vc} tk={tk} />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/tickets')}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: tk.bgAction, border: `1px solid ${tk.borderAction}`, color: tk.textAction }}
                            onMouseEnter={e => { e.currentTarget.style.background = tk.bgActionHover }}
                            onMouseLeave={e => { e.currentTarget.style.background = tk.bgAction }}
                        >
                            View all tickets
                            <ArrowUpRight size={13} />
                        </button>
                    </Card>
                </div>
            )}
        </section>
    )
}

// ─── Incidents Section ────────────────────────────────────────────────────────

// FIX: IncidentRow — severity can be integer or string from the API.
// SEVERITY_CFG now has string aliases, so both resolve correctly.
// severityColor falls back to '#64748b' only when severity is truly unknown.
function IncidentRow({ item, isDark, tk }) {
    const statusColor   = STATUS_COLORS[item.status] ?? '#64748b'
    const sevKey        = typeof item.severity === 'string'
        ? SEVERITY_STRING_TO_INT[item.severity] ?? item.severity
        : item.severity
    const severityColor = SEVERITY_CFG[sevKey]?.bar ?? '#64748b'

    return (
        <div
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150"
            style={{ border: `1px solid ${tk.border}` }}
            onMouseEnter={e => { e.currentTarget.style.background = tk.bgCardHover }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: severityColor }} />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: tk.textSecondary }}>{item.title}</p>
                <p className="text-[10px] truncate" style={{ color: tk.textFaint }}>Agent: {item.agent_name}</p>
                <p className="text-[10px]" style={{ color: tk.textFaint }}>
                    {item.timestamp} ·{' '}
                    <span className="capitalize" style={{ color: statusColor }}>
                        {item.status?.replace('_', ' ')}
                    </span>
                </p>
            </div>
            <SeverityPill severity={item.severity} isDark={isDark} />
        </div>
    )
}

function IncidentsSection({ incidentStats, loading, error, navigate, isDark, tk }) {
    if (!incidentStats && !loading && !error) return null

    const totalInc   = incidentStats?.byStatus?.reduce((a, b) => a + b.count, 0) ?? 0
    const openInc    = incidentStats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const critInc    = incidentStats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const highInc    = incidentStats?.bySeverity?.find(s => s._id === 3)?.count ?? 0
    const mediumInc  = incidentStats?.bySeverity?.find(s => s._id === 2)?.count ?? 0
    const oldestOpen = incidentStats?.oldest_open || []

    return (
        <section className="space-y-3">
            <SectionTitle label="Incidents" meta={`${openInc} open`} tk={tk} />

            {error && <Card tk={tk} className="p-4"><p className="text-xs" style={{ color: tk.textDanger }}>{error}</p></Card>}
            {loading && <Card tk={tk}><Skeleton tk={tk} /></Card>}

            {incidentStats && (
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Live feed */}
                    <Card tk={tk} className="p-4 space-y-3 lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                                Live Feed
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: tk.textGhost }}>
                                {/* FIX: was className="bg-red-500" — Tailwind class cannot be themed.
                                    Now uses tk.dotLive (#ef4444) via inline style. */}
                                <span
                                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                                    style={{ background: tk.dotLive }}
                                />
                                High/Crit: {highInc + critInc}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            {oldestOpen.map(item => <IncidentRow key={item.id} item={item} isDark={isDark} tk={tk} />)}
                        </div>
                    </Card>

                    {/* Escalation overview */}
                    <Card tk={tk} className="p-4 flex flex-col gap-4">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                            Escalation Overview
                        </span>
                        <div className="flex-1 space-y-1">
                            {[
                                { label: 'Total incidents', value: totalInc,  vc: tk.textSecondary },
                                { label: 'Open',            value: openInc,   vc: '#ef4444'        },
                                { label: 'Critical',        value: critInc,   vc: '#f97316'        },
                                { label: 'High',            value: highInc,   vc: '#f97316'        },
                                { label: 'Medium',          value: mediumInc, vc: '#f59e0b'        },
                            ].map((r, i) => (
                                <div key={r.label} style={{ borderTop: i > 0 ? `1px solid ${tk.border}` : 'none' }}>
                                    <KVRow label={r.label} value={r.value} valueColor={r.vc} tk={tk} />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/incidents')}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: tk.bgDanger, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger }}
                            onMouseEnter={e => { e.currentTarget.style.background = tk.bgDangerHover }}
                            onMouseLeave={e => { e.currentTarget.style.background = tk.bgDanger }}
                        >
                            Open incident queue
                            <ArrowUpRight size={13} />
                        </button>
                    </Card>
                </div>
            )}
        </section>
    )
}

// ─── Vulnerabilities Section ──────────────────────────────────────────────────

// FIX: "Exposure Hotspots" mini-cards used `${accent}0d` (5% opacity) for bg and
// `${accent}22` (13%) for border — both near-invisible in light mode on white bgCard.
// Replaced with theme-aware helper that increases opacity in light mode.
function accentCard(accent, isDark) {
    return {
        background: isDark ? `${accent}0f` : `${accent}14`,  // 6% dark → 8% light
        border:     `1px solid ${isDark ? `${accent}28` : `${accent}38'}` }`,  // 16% dark → 22% light
    }
}

function VulnerabilitiesSection({ vulnStats, loading, error, navigate, isDark, tk }) {
    if (!vulnStats && !loading && !error) return null

    const totalVuln  = vulnStats?.byStatus?.reduce((a, b) => a + b.count, 0) ?? 0
    const openVuln   = vulnStats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const critVuln   = vulnStats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const highVuln   = vulnStats?.bySeverity?.find(s => s._id === 3)?.count ?? 0
    const mediumVuln = vulnStats?.bySeverity?.find(s => s._id === 2)?.count ?? 0
    const topAssets  = vulnStats?.top_assets || []

    return (
        <section className="space-y-3">
            <SectionTitle label="Vulnerabilities" meta={`${openVuln} open`} tk={tk} />

            {error && <Card tk={tk} className="p-4"><p className="text-xs" style={{ color: tk.textDanger }}>{error}</p></Card>}
            {loading && <Card tk={tk}><Skeleton tk={tk} /></Card>}

            {vulnStats && (
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Severity distribution */}
                    <Card tk={tk} className="p-4 space-y-4">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                            Severity Distribution
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(SEVERITY_LABELS).map(([level, label]) => {
                                const sev   = Number(level)
                                const count = vulnStats?.bySeverity?.find(s => s._id === sev)?.count ?? 0
                                const pct   = totalVuln ? Math.round((count / totalVuln) * 100) : 0
                                const cfg   = SEVERITY_CFG[sev]
                                return (
                                    <div
                                        key={level}
                                        className="rounded-lg p-2.5 space-y-1.5"
                                        // FIX: border opacity increased from 22 → 33 hex for visibility in light mode
                                        style={{ background: cfg.bg(isDark), border: `1px solid ${cfg.bar}33` }}
                                    >
                                        <p className="text-[10px] font-semibold" style={{ color: cfg.text(isDark) }}>{label}</p>
                                        <p className="text-lg font-bold tabular-nums" style={{ color: tk.textPrimary }}>{count}</p>
                                        <Bar value={pct} color={cfg.bar} height={2} tk={tk} />
                                    </div>
                                )
                            })}
                        </div>
                    </Card>

                    {/* Exposure hotspots */}
                    <Card tk={tk} className="p-4 lg:col-span-2 space-y-4">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                            Exposure Hotspots
                        </span>
                        <div className="grid gap-3 sm:grid-cols-4">
                            {[
                                { label: 'Open',     value: openVuln,   sub: `Resolved: ${totalVuln - openVuln}`, accent: '#dc2626' },
                                { label: 'Critical', value: critVuln,   sub: 'Immediate fix',                    accent: '#dc2626' },
                                { label: 'High',     value: highVuln,   sub: 'High risk',                        accent: '#ea580c' },
                                { label: 'Medium',   value: mediumVuln, sub: 'Monitor',                          accent: '#d97706' },
                            ].map(item => (
                                <div
                                    key={item.label}
                                    className="rounded-xl p-4 space-y-1"
                                    // FIX: replaced `${accent}0d` / `${accent}22` hardcoded opacities
                                    // with theme-aware accentCard() helper
                                    style={accentCard(item.accent, isDark)}
                                >
                                    <p className="text-[10px] font-medium" style={{ color: item.accent }}>{item.label}</p>
                                    <p className="text-2xl font-bold tabular-nums" style={{ color: tk.textPrimary }}>{item.value}</p>
                                    <p className="text-[10px]" style={{ color: tk.textFaint }}>{item.sub}</p>
                                </div>
                            ))}

                            {/* Most affected assets */}
                            <div
                                className="sm:col-span-4 rounded-xl p-4 space-y-3"
                                style={{ background: tk.bgSubtle, border: `1px solid ${tk.border}` }}
                            >
                                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                                    Most Affected Assets
                                </p>
                                <div className="space-y-2">
                                    {topAssets.map((asset, i) => {
                                        const maxCount = topAssets[0]?.count || 1
                                        const pct      = Math.round((asset.count / maxCount) * 100)
                                        return (
                                            <div key={i} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-mono" style={{ color: tk.textMuted }}>
                                                        {asset.host}
                                                    </span>
                                                    <span className="text-[11px] font-semibold tabular-nums" style={{ color: tk.textFaint }}>
                                                        {asset.count} issues
                                                    </span>
                                                </div>
                                                <Bar
                                                    value={pct}
                                                    color={i === 0 ? '#dc2626' : i === 1 ? '#ea580c' : '#d97706'}
                                                    height={2}
                                                    tk={tk}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </section>
    )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
    const navigate = useNavigate()
    const { isAdmin } = useAuth()
    const { can }     = usePermissions()

    const isDark = useTheme()
    const tk     = tokens(isDark)

    const [incidentStats, setIncidentStats] = useState(null)
    const [vulnStats,     setVulnStats]     = useState(null)
    const [ticketStats,   setTicketStats]   = useState(null)
    const [errorInc,      setErrorInc]      = useState('')
    const [errorVuln,     setErrorVuln]     = useState('')
    const [errorTickets,  setErrorTickets]  = useState('')

    const hasInc     = isAdmin || can('VIEW_INCIDENTS')
    const hasVuln    = isAdmin || can('VIEW_VULNERABILITIES')
    const hasTickets = isAdmin || can('VIEW_TICKETS')

    useEffect(() => {
        if (!hasInc) return
        api.get('/incidents/stats')
            .then(r => setIncidentStats(r.data))
            .catch(() => setErrorInc('Failed to load incident statistics.'))
    }, [hasInc])

    useEffect(() => {
        if (!hasVuln) return
        api.get('/vulnerabilities/stats')
            .then(r => setVulnStats(r.data))
            .catch(() => setErrorVuln('Failed to load vulnerability statistics.'))
    }, [hasVuln])

    useEffect(() => {
        if (!hasTickets) return
        api.get('/tickets/stats')
            .then(r => setTicketStats(r.data))
            .catch(() => setErrorTickets('Failed to load ticket statistics.'))
    }, [hasTickets])

    const loadingInc     = hasInc     && !incidentStats && !errorInc
    const loadingVuln    = hasVuln    && !vulnStats     && !errorVuln
    const loadingTickets = hasTickets && !ticketStats   && !errorTickets

    const openInc  = incidentStats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const critInc  = incidentStats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const highInc  = incidentStats?.bySeverity?.find(s => s._id === 3)?.count ?? 0
    const openVuln = vulnStats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const critVuln = vulnStats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const highVuln = vulnStats?.bySeverity?.find(s => s._id === 3)?.count ?? 0

    const ticketByStatus   = ticketStats?.by_status   ?? []
    const ticketByPriority = ticketStats?.by_priority ?? []
    const ticketTotal      = ticketStats?.total        ?? 0
    const ticketOpen       = ticketByStatus.find(s => s._id === 'open')?.count        ?? 0
    const ticketInProgress = ticketByStatus.find(s => s._id === 'in_progress')?.count ?? 0
    const ticketCritical   = ticketByPriority.find(s => s._id === 'critical')?.count  ?? 0

    const criticalIssues = critInc + critVuln + ticketCritical
    const activeThreats  = openInc + openVuln + mockPotentialIncidents.length
    const ticketPressure = ticketTotal > 0 ? Math.round(((ticketOpen + ticketInProgress) / ticketTotal) * 100) : 0
    const postureScore   = clamp(100 - (critInc + critVuln) * 6 - (highInc + highVuln) * 3 - ticketCritical * 2, 35, 100)
    const socStatus      = criticalIssues > 0 ? 'Elevated' : ticketPressure > 65 ? 'Guarded' : 'Normal'
    const pressureHigh   = ticketPressure > 65

    const quickActions = [
        { label: 'Create incident',       icon: Plus,        onClick: () => navigate('/incidents') },
        { label: 'Create ticket',         icon: Ticket,      onClick: () => navigate('/tickets') },
        { label: 'View critical vulns',   icon: ShieldAlert, onClick: () => navigate('/vulnerabilities') },
        { label: 'Open active incidents', icon: Siren,       onClick: () => navigate('/incidents') },
        { label: 'Launch scan',           icon: PlayCircle,  onClick: () => navigate('/vulnerabilities/sync') },
        { label: 'Export reports',        icon: FileDown,    onClick: () => navigate('/vulnerabilities') },
    ]

    return (
        <>
            <style>{BASE_STYLES}</style>

            <div className="dash-fadein space-y-6" style={{ color: tk.textSecondary }}>

                {/* ── Page header ── */}
                <div
                    className="flex flex-wrap items-end justify-between gap-4 pb-5"
                    style={{ borderBottom: `1px solid ${tk.border}` }}
                >
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight" style={{ color: tk.textPrimary }}>
                            SOC Overview
                        </h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: tk.textFaint }}>
                            Security Operations Center · Unified monitoring
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]" style={{ color: tk.textGhost }}>
                        {/* FIX: emerald-500 Tailwind class left as-is — it renders correctly in both
                            themes because it's a pure green and not semantically inverted.
                            Kept identical to original. */}
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live · {new Date().toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </div>
                </div>

                {/* ── Hero metrics ── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <PostureCard
                        score={postureScore} socStatus={socStatus}
                        criticalIssues={criticalIssues} isDark={isDark} tk={tk}
                    />
                    <HeroCard
                        label="Active Threats" value={activeThreats}
                        sub={`${openInc} open incidents · ${openVuln} open vulnerabilities`}
                        accent="#ef4444" icon={AlertTriangle} tk={tk}
                    />
                    <HeroCard
                        label="Critical Issues" value={criticalIssues}
                        sub={`Incidents: ${critInc} · Vulns: ${critVuln} · Tickets: ${ticketCritical}`}
                        accent="#f97316" icon={Siren} tk={tk}
                    />
                    <HeroCard
                        label="Ticket Pressure" value={`${ticketPressure}%`}
                        sub={`${ticketOpen} open · ${ticketInProgress} in progress`}
                        accent="#028090" icon={Ticket} tk={tk}
                        badge={
                            // FIX: hardcoded rgba colors replaced with tk.bgPressureHigh/Normal
                            // and tk.textPressureHigh/Normal — both properly resolved per theme
                            <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                    background: pressureHigh ? tk.bgPressureHigh   : tk.bgPressureNormal,
                                    color:      pressureHigh ? tk.textPressureHigh : tk.textPressureNormal,
                                }}
                            >
                                {pressureHigh ? 'High load' : 'Nominal'}
                            </span>
                        }
                    />
                </div>

                {/* ── Quick actions ── */}
                <QuickActions actions={quickActions} tk={tk} />

                {/* ── Tickets ── */}
                {hasTickets ? (
                    <TicketsSection
                        ticketStats={ticketStats} loading={loadingTickets}
                        error={errorTickets} navigate={navigate}
                        isDark={isDark} tk={tk}
                    />
                ) : (
                    <Card tk={tk} className="p-4">
                        <p className="text-xs" style={{ color: tk.textFaint }}>You do not have access to ticket analytics.</p>
                    </Card>
                )}

                {/* ── Incidents ── */}
                {hasInc ? (
                    <IncidentsSection
                        incidentStats={incidentStats} loading={loadingInc}
                        error={errorInc} navigate={navigate}
                        isDark={isDark} tk={tk}
                    />
                ) : (
                    <Card tk={tk} className="p-4">
                        <p className="text-xs" style={{ color: tk.textFaint }}>You do not have access to incidents.</p>
                    </Card>
                )}

                {/* ── Vulnerabilities ── */}
                {hasVuln ? (
                    <VulnerabilitiesSection
                        vulnStats={vulnStats} loading={loadingVuln}
                        error={errorVuln} navigate={navigate}
                        isDark={isDark} tk={tk}
                    />
                ) : (
                    <Card tk={tk} className="p-4">
                        <p className="text-xs" style={{ color: tk.textFaint }}>You do not have access to vulnerabilities.</p>
                    </Card>
                )}
            </div>
        </>
    )
}