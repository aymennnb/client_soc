import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { usePermissions } from './hooks/useAuth'
import api from './api'
import {
    Activity, AlertTriangle, CheckCircle2, ShieldCheck, Siren,
    ShieldAlert, Ticket, ArrowUpRight, Plus, FileDown, PlayCircle,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_LABELS = { 0: 'Info', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

const SEVERITY_CONFIG = {
    0: { bar: '#64748b', bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
    1: { bar: '#22c55e', bg: 'rgba(34,197,94,0.12)',  text: '#4ade80' },
    2: { bar: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
    3: { bar: '#f97316', bg: 'rgba(249,115,22,0.12)', text: '#fb923c' },
    4: { bar: '#ef4444', bg: 'rgba(239,68,68,0.12)',  text: '#f87171' },
}

const PRIORITY_COLORS = {
    critical: { bar: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    high:     { bar: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    medium:   { bar: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    low:      { bar: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
}

const STATUS_COLORS = {
    open:        '#ef4444',
    in_progress: '#38bdf8',
    resolved:    '#22c55e',
    closed:      '#94a3b8',
}

const mockPotentialIncidents = [
    { id: 'pi-1', title: 'Suspicious outbound traffic spike', source: 'Netflow',  severity: 'high',     time: '2m ago' },
    { id: 'pi-2', title: 'Multiple failed logins on VPN',    source: 'Auth',      severity: 'medium',   time: '8m ago' },
    { id: 'pi-3', title: 'New executable from unknown hash', source: 'EDR',       severity: 'critical', time: '15m ago' },
    { id: 'pi-4', title: 'DNS anomaly to parked domains',    source: 'DNS',       severity: 'low',      time: '34m ago' },
]

const mockIncidentsFeed = [
    { id: 'inc-1', title: 'Phishing campaign targeting HR',    severity: 4, status: 'in_progress', time: '12m ago' },
    { id: 'inc-2', title: 'Endpoint malware containment',      severity: 3, status: 'open',        time: '30m ago' },
    { id: 'inc-3', title: 'Suspicious PowerShell activity',    severity: 2, status: 'open',        time: '1h ago' },
    { id: 'inc-4', title: 'Wazuh rule triggered on server-12', severity: 1, status: 'resolved',    time: '3h ago' },
]

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

// ─── Reusable primitives ──────────────────────────────────────────────────────

/** Dark-glass card matching NessusSync panels */
function Card({ children, className = '', style = {} }) {
    return (
        <div
            className={`rounded-xl ${className}`}
            style={{
                background: 'rgba(13,27,42,0.7)',
                border: '1px solid #1b263b',
                ...style,
            }}
        >
            {children}
        </div>
    )
}

/** Thin horizontal rule between card sections */
function Divider() {
    return <div style={{ borderTop: '1px solid #1b263b' }} />
}

/** Slim progress bar */
function Bar({ value = 0, color = '#02c39a', height = 4 }) {
    return (
        <div
            className="w-full overflow-hidden rounded-full"
            style={{ height, background: 'rgba(27,38,59,0.8)' }}
        >
            <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${clamp(value, 0, 100)}%`, background: color }}
            />
        </div>
    )
}

/** Status badge */
function StatusBadge({ status }) {
    const map = {
        ok:       { bg: 'rgba(2,195,154,0.12)', text: '#02c39a', dot: '#02c39a', label: 'Operational' },
        degraded: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', dot: '#f59e0b', label: 'Elevated'    },
        critical: { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', dot: '#ef4444', label: 'Critical'    },
    }
    const c = map[status] ?? map.ok
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ background: c.bg, color: c.text }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} />
            {c.label}
        </span>
    )
}

/** Skeleton pulse row */
function Skeleton({ rows = 3 }) {
    return (
        <div className="space-y-2 p-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-7 rounded-lg animate-pulse" style={{ background: 'rgba(27,38,59,0.5)' }} />
            ))}
        </div>
    )
}

/** Page section heading */
function SectionTitle({ label, meta }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-3.5 w-0.5 rounded-full" style={{ background: '#02c39a' }} />
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#4a7a8a' }}>
                    {label}
                </span>
            </div>
            {meta && <span className="text-[10px]" style={{ color: '#2d4a5a' }}>{meta}</span>}
        </div>
    )
}

/** Inline KV row used inside cards */
function KVRow({ label, value, valueColor = '#cbd5e1' }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-[11px]" style={{ color: '#4a7a8a' }}>{label}</span>
            <span className="text-[11px] font-semibold" style={{ color: valueColor }}>{value}</span>
        </div>
    )
}

// ─── Hero Metric Cards (top row) ──────────────────────────────────────────────

function HeroCard({ label, value, sub, accent, icon: Icon, badge }) {
    return (
        <Card className="relative overflow-hidden p-5 flex flex-col gap-4">
            {/* Faint accent glow top-right */}
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
                <p className="text-2xl font-bold tabular-nums" style={{ color: '#f1f5f9' }}>{value}</p>
                <p className="mt-0.5 text-[11px] font-medium" style={{ color: '#4a7a8a' }}>{label}</p>
            </div>
            {sub && (
                <p className="text-[10px] leading-relaxed" style={{ color: '#2d4a5a' }}>{sub}</p>
            )}
        </Card>
    )
}

// ─── Posture Score Card ───────────────────────────────────────────────────────

function PostureCard({ score, socStatus, criticalIssues }) {
    const color = score >= 70 ? '#02c39a' : score >= 50 ? '#f59e0b' : '#ef4444'
    const statusKey = criticalIssues > 0 ? 'critical' : score < 60 ? 'degraded' : 'ok'

    return (
        <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>
                    Security Posture
                </span>
                <StatusBadge status={statusKey} />
            </div>

            {/* Arc-style score */}
            <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                    <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#1b263b" strokeWidth="4" />
                        <circle
                            cx="28" cy="28" r="22" fill="none"
                            stroke={color} strokeWidth="4"
                            strokeLinecap="round"
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
                            <span className="text-[10px]" style={{ color: '#4a7a8a' }}>Score</span>
                            <span className="text-[10px] font-semibold" style={{ color }}>{score}/100</span>
                        </div>
                        <Bar value={score} color={color} height={3} />
                    </div>
                    <p className="text-[10px]" style={{ color: '#2d4a5a' }}>
                        {criticalIssues} critical issue{criticalIssues !== 1 ? 's' : ''} requiring attention
                    </p>
                </div>
            </div>

            <Divider />
            <KVRow label="SOC Status" value={socStatus} valueColor={color} />
        </Card>
    )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions({ actions }) {
    return (
        <Card className="p-4">
            <div className="mb-3">
                <SectionTitle label="Quick Actions" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {actions.map(action => {
                    const Icon = action.icon
                    return (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                            style={{ background: 'rgba(27,38,59,0.4)', border: '1px solid #1b263b' }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(2,128,144,0.1)'
                                e.currentTarget.style.borderColor = 'rgba(2,128,144,0.3)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(27,38,59,0.4)'
                                e.currentTarget.style.borderColor = '#1b263b'
                            }}
                        >
                            <span className="flex items-center gap-2.5">
                                <Icon size={14} style={{ color: '#028090' }} />
                                <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                                    {action.label}
                                </span>
                            </span>
                            <ArrowUpRight size={12} style={{ color: '#2d4a5a' }} />
                        </button>
                    )
                })}
            </div>
        </Card>
    )
}

// ─── Tickets Section ──────────────────────────────────────────────────────────

function TicketsSection({ ticketStats, loading, error, navigate }) {
    if (!ticketStats && !loading && !error) return null

    const ticketTotal      = ticketStats?.total ?? 0
    const ticketMine       = ticketStats?.my_tickets ?? 0
    const ticketByStatus   = ticketStats?.by_status ?? []
    const ticketByPriority = ticketStats?.by_priority ?? []
    const ticketOpen       = ticketByStatus.find(s => s._id === 'open')?.count ?? 0
    const ticketInProgress = ticketByStatus.find(s => s._id === 'in_progress')?.count ?? 0

    return (
        <section className="space-y-3">
            <SectionTitle label="Tickets" meta={`${ticketTotal} total`} />

            {error && (
                <Card className="p-4">
                    <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
                </Card>
            )}

            {loading && <Card><Skeleton rows={4} /></Card>}

            {ticketStats && (
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Workflow breakdown */}
                    <Card className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>Workflow</span>
                            <span
                                className="rounded-full px-2 py-0.5 text-[10px]"
                                style={{ background: 'rgba(2,128,144,0.12)', color: '#028090' }}
                            >
                                Mine: {ticketMine}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {ticketByStatus.map(s => {
                                const pct = ticketTotal ? Math.round((s.count / ticketTotal) * 100) : 0
                                const color = STATUS_COLORS[s._id] ?? '#64748b'
                                return (
                                    <div key={s._id} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] capitalize" style={{ color: '#4a7a8a' }}>
                                                {s._id.replace('_', ' ')}
                                            </span>
                                            <span className="text-[11px] font-semibold tabular-nums" style={{ color: '#cbd5e1' }}>
                                                {s.count} <span style={{ color: '#2d4a5a' }}>({pct}%)</span>
                                            </span>
                                        </div>
                                        <Bar value={pct} color={color} height={3} />
                                    </div>
                                )
                            })}
                        </div>
                    </Card>

                    {/* Priority heatmap */}
                    <Card className="p-4 space-y-4">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>
                            Priority Heatmap
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {['critical', 'high', 'medium', 'low'].map(level => {
                                const item  = ticketByPriority.find(p => p._id === level)
                                const count = item?.count ?? 0
                                const pct   = ticketTotal ? Math.round((count / ticketTotal) * 100) : 0
                                const cfg   = PRIORITY_COLORS[level]
                                return (
                                    <div
                                        key={level}
                                        className="rounded-lg p-3 space-y-2"
                                        style={{ background: cfg.bg, border: `1px solid ${cfg.bar}22` }}
                                    >
                                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cfg.bar }}>
                                            {level}
                                        </p>
                                        <p className="text-xl font-bold tabular-nums" style={{ color: '#f1f5f9' }}>{count}</p>
                                        <Bar value={pct} color={cfg.bar} height={2} />
                                    </div>
                                )
                            })}
                        </div>
                    </Card>

                    {/* My queue */}
                    <Card className="p-4 space-y-4 flex flex-col">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>
                            My Queue
                        </span>
                        <div className="flex-1 space-y-1 divide-y" style={{ '--tw-divide-opacity': 1 }}>
                            {[
                                { label: 'Assigned to me', value: ticketMine,       vc: '#cbd5e1' },
                                { label: 'Open',           value: ticketOpen,       vc: '#f87171' },
                                { label: 'In progress',    value: ticketInProgress, vc: '#38bdf8' },
                            ].map(r => (
                                <div key={r.label} style={{ borderColor: '#1b263b' }}>
                                    <KVRow label={r.label} value={r.value} valueColor={r.vc} />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/tickets')}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: 'rgba(2,128,144,0.1)', border: '1px solid rgba(2,128,144,0.25)', color: '#028090' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(2,128,144,0.18)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(2,128,144,0.1)' }}
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

const SEVERITY_PILL_STYLE = (sev) => ({
    background: SEVERITY_CONFIG[sev]?.bg  ?? 'rgba(100,116,139,0.12)',
    color:      SEVERITY_CONFIG[sev]?.text ?? '#94a3b8',
})

function IncidentRow({ item }) {
    const statusColor = STATUS_COLORS[item.status] ?? '#64748b'
    const severityColor = SEVERITY_CONFIG[item.severity]?.bar ?? '#64748b'
    const severityLabel = SEVERITY_LABELS[item.severity] ?? 'Unknown'

    return (
        <div
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150"
            style={{ border: '1px solid #1b263b' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(2,128,144,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
            {/* Severity dot */}
            <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: severityColor }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#cbd5e1' }}>
                    {item.title}
                </p>

                <p className="text-[10px] truncate" style={{ color: '#4a7a8a' }}>
                    Agent: {item.agent_name}
                </p>

                <p className="text-[10px]" style={{ color: '#4a7a8a' }}>
                    {item.timestamp} ·{' '}
                    <span className="capitalize" style={{ color: statusColor }}>
                        {item.status?.replace('_', ' ')}
                    </span>
                </p>
            </div>

            {/* Severity badge */}
            <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={SEVERITY_PILL_STYLE(item.severity)}
            >
                {severityLabel}
            </span>
        </div>
    )
}

function IncidentsSection({ incidentStats, loading, error, navigate }) {
    if (!incidentStats && !loading && !error) return null

    const totalInc = incidentStats?.byStatus?.reduce((a, b) => a + b.count, 0) ?? 0
    const openInc  = incidentStats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const critInc  = incidentStats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const highInc  = incidentStats?.bySeverity?.find(s => s._id === 3)?.count ?? 0
    const mediumInc  = incidentStats?.bySeverity?.find(s => s._id === 3)?.count ?? 0
    const oldestOpen = incidentStats?.oldest_open || []

    return (
        <section className="space-y-3">
            <SectionTitle label="Incidents" meta={`${openInc} open`} />

            {error && <Card className="p-4"><p className="text-xs" style={{ color: '#f87171' }}>{error}</p></Card>}
            {loading && <Card><Skeleton rows={4} /></Card>}

            {incidentStats && (
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Live feed */}
                    <Card className="p-4 space-y-3 lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>
                                Live Feed
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#2d4a5a' }}>
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                High/Crit: {highInc + critInc}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            {oldestOpen.map(item => <IncidentRow key={item.id} item={item} />)}
                        </div>
                    </Card>

                    {/* Escalation overview */}
                    <Card className="p-4 flex flex-col gap-4">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>
                            Escalation Overview
                        </span>
                        <div className="flex-1 space-y-1 divide-y" style={{ '--tw-divide-opacity': 1 }}>
                            {[
                                { label: 'Total incidents',   value: totalInc,          vc: '#cbd5e1' },
                                { label: 'Open',              value: openInc,            vc: '#f87171' },
                                { label: 'Critical',   value: critInc, vc: '#f97316' },
                                { label: 'High',   value: highInc, vc: '#f97316' },
                                { label: 'Medium',   value: mediumInc, vc: '#f59e0b' }
                            ].map(r => (
                                <div key={r.label} style={{ borderColor: '#1b263b' }}>
                                    <KVRow label={r.label} value={r.value} valueColor={r.vc} />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/incidents')}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
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

function VulnerabilitiesSection({ vulnStats, loading, error, navigate }) {
    if (!vulnStats && !loading && !error) return null

    const totalVuln = vulnStats?.byStatus?.reduce((a, b) => a + b.count, 0) ?? 0
    const openVuln  = vulnStats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const critVuln  = vulnStats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const highVuln  = vulnStats?.bySeverity?.find(s => s._id === 3)?.count ?? 0
    const MediumVuln  = vulnStats?.bySeverity?.find(s => s._id === 2)?.count ?? 0

    const topAssets = vulnStats?.top_assets || []

    return (
        <section className="space-y-3">
            <SectionTitle label="Vulnerabilities" meta={`${openVuln} open`} />

            {error && <Card className="p-4"><p className="text-xs" style={{ color: '#f87171' }}>{error}</p></Card>}
            {loading && <Card><Skeleton rows={4} /></Card>}

            {vulnStats && (
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Severity grid */}
                    <Card className="p-4 space-y-4">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>
                            Severity Distribution
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(SEVERITY_LABELS).map(([level, label]) => {
                                const sev   = Number(level)
                                const count = vulnStats?.bySeverity?.find(s => s._id === sev)?.count ?? 0
                                const pct   = totalVuln ? Math.round((count / totalVuln) * 100) : 0
                                const cfg   = SEVERITY_CONFIG[sev]
                                return (
                                    <div
                                        key={level}
                                        className="rounded-lg p-2.5 space-y-1.5"
                                        style={{ background: cfg.bg, border: `1px solid ${cfg.bar}22` }}
                                    >
                                        <p className="text-[10px] font-semibold" style={{ color: cfg.text }}>{label}</p>
                                        <p className="text-lg font-bold tabular-nums" style={{ color: '#f1f5f9' }}>{count}</p>
                                        <Bar value={pct} color={cfg.bar} height={2} />
                                    </div>
                                )
                            })}
                        </div>
                    </Card>

                    {/* Exposure */}
                    <Card className="p-4 lg:col-span-2 space-y-4">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>
                            Exposure Hotspots
                        </span>
                        <div className="grid gap-3 sm:grid-cols-4">
                            {[
                               { label: 'Open vulnerabilities', value: openVuln, sub: `Resolved: ${totalVuln - openVuln}`, accent: '#ef4444' },
                               { label: 'Critical', value: critVuln, sub: 'Immediate fix', accent: '#ef4444' },
                               { label: 'High', value: highVuln, sub: 'High risk', accent: '#f97316' },
                               { label: 'Medium', value: MediumVuln, sub: 'Monitor', accent: '#f59e0b' }
                             ].map(item => (
                                <div
                                    key={item.label}
                                    className="rounded-xl p-4 space-y-1"
                                    style={{ background: `${item.accent}0d`, border: `1px solid ${item.accent}22` }}
                                >
                                    <p className="text-[10px] font-medium" style={{ color: item.accent }}>{item.label}</p>
                                    <p className="text-2xl font-bold tabular-nums" style={{ color: '#f1f5f9' }}>{item.value}</p>
                                    <p className="text-[10px]" style={{ color: '#4a7a8a' }}>{item.sub}</p>
                                </div>
                            ))}

                            {/* Most affected assets */}
                            <div
                                className="sm:col-span-4 rounded-xl p-4 space-y-3"
                                style={{ background: 'rgba(27,38,59,0.4)', border: '1px solid #1b263b' }}
                            >
                                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>
                                    Most Affected Assets
                                </p>
                                <div className="space-y-2">
                                    {topAssets.map((asset, i) => {
                                        const maxCount = topAssets[0]?.count || 1
                                        const pct = Math.round((asset.count / maxCount) * 100)
                                        return (
                                            <div key={i} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-mono" style={{ color: '#94a3b8' }}>{asset.host}</span>
                                                    <span className="text-[11px] font-semibold tabular-nums" style={{ color: '#64748b' }}>
                                                        {asset.count} issues
                                                     </span>
                                                </div>
                                                <Bar value={pct} color={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#f59e0b'} height={2} />
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

    // ── Derived values ──
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
    const ticketOpen       = ticketByStatus.find(s => s._id === 'open')?.count      ?? 0
    const ticketInProgress = ticketByStatus.find(s => s._id === 'in_progress')?.count ?? 0
    const ticketCritical   = ticketByPriority.find(s => s._id === 'critical')?.count  ?? 0

    const criticalIssues = critInc + critVuln + ticketCritical
    const activeThreats  = openInc + openVuln + mockPotentialIncidents.length
    const ticketPressure = ticketTotal > 0 ? Math.round(((ticketOpen + ticketInProgress) / ticketTotal) * 100) : 0
    const postureScore   = clamp(100 - (critInc + critVuln) * 6 - (highInc + highVuln) * 3 - ticketCritical * 2, 35, 100)
    const socStatus      = criticalIssues > 0 ? 'Elevated' : ticketPressure > 65 ? 'Guarded' : 'Normal'

    const quickActions = [
        { label: 'Create incident',       icon: Plus,        onClick: () => navigate('/incidents/add') },
        { label: 'Create ticket',         icon: Ticket,      onClick: () => navigate('/tickets') },
        { label: 'View critical vulns',   icon: ShieldAlert, onClick: () => navigate('/vulnerabilities') },
        { label: 'Open active incidents', icon: Siren,       onClick: () => navigate('/incidents') },
        { label: 'Launch scan',           icon: PlayCircle,  onClick: () => navigate('/vulnerabilities/sync') },
        { label: 'Export reports',        icon: FileDown,    onClick: () => navigate('/dashboard') },
    ]

    return (
        <>
            {/* ── Global styles ── */}
            <style>{`
                @keyframes fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
                .dash-fadein { animation: fadein 0.4s ease-out both; }
            `}</style>

            <div className="dash-fadein space-y-6" style={{ color: '#e2e8f0' }}>

                {/* ── Page header ── */}
                <div
                    className="flex flex-wrap items-end justify-between gap-4 pb-5"
                    style={{ borderBottom: '1px solid #1b263b' }}
                >
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight" style={{ color: '#f1f5f9' }}>
                            SOC Overview
                        </h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: '#4a7a8a' }}>
                            Security Operations Center · Unified monitoring
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]" style={{ color: '#2d4a5a' }}>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live · {new Date().toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </div>
                </div>

                {/* ── Hero metrics row ── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Posture card spans 1 col */}
                    <PostureCard
                        score={postureScore}
                        socStatus={socStatus}
                        criticalIssues={criticalIssues}
                    />

                    <HeroCard
                        label="Active Threats"
                        value={activeThreats}
                        sub={`${openInc} open incidents · ${openVuln} open vulnerabilities`}
                        accent="#ef4444"
                        icon={AlertTriangle}
                    />

                    <HeroCard
                        label="Critical Issues"
                        value={criticalIssues}
                        sub={`Incidents: ${critInc} · Vulns: ${critVuln} · Tickets: ${ticketCritical}`}
                        accent="#f97316"
                        icon={Siren}
                    />

                    <HeroCard
                        label="Ticket Pressure"
                        value={`${ticketPressure}%`}
                        sub={`${ticketOpen} open · ${ticketInProgress} in progress`}
                        accent="#028090"
                        icon={Ticket}
                        badge={
                            <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                    background: ticketPressure > 65 ? 'rgba(245,158,11,0.12)' : 'rgba(2,195,154,0.1)',
                                    color: ticketPressure > 65 ? '#fbbf24' : '#02c39a',
                                }}
                            >
                                {ticketPressure > 65 ? 'High load' : 'Nominal'}
                            </span>
                        }
                    />
                </div>

                {/* ── Quick actions ── */}
                <QuickActions actions={quickActions} />

                {/* ── Tickets ── */}
                {hasTickets ? (
                    <TicketsSection
                        ticketStats={ticketStats}
                        loading={loadingTickets}
                        error={errorTickets}
                        navigate={navigate}
                    />
                ) : (
                    <Card className="p-4">
                        <p className="text-xs" style={{ color: '#4a7a8a' }}>You do not have access to ticket analytics.</p>
                    </Card>
                )}

                {/* ── Incidents ── */}
                {hasInc ? (
                    <IncidentsSection
                        incidentStats={incidentStats}
                        loading={loadingInc}
                        error={errorInc}
                        navigate={navigate}
                    />
                ) : (
                    <Card className="p-4">
                        <p className="text-xs" style={{ color: '#4a7a8a' }}>You do not have access to incidents.</p>
                    </Card>
                )}

                {/* ── Vulnerabilities ── */}
                {hasVuln ? (
                    <VulnerabilitiesSection
                        vulnStats={vulnStats}
                        loading={loadingVuln}
                        error={errorVuln}
                        navigate={navigate}
                    />
                ) : (
                    <Card className="p-4">
                        <p className="text-xs" style={{ color: '#4a7a8a' }}>You do not have access to vulnerabilities.</p>
                    </Card>
                )}
            </div>
        </>
    )
}