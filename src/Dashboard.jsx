import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { usePermissions } from './hooks/useAuth'
import api from './api'

// ─── Constants ────────────────────────────────────────────────────────────────
const SEVERITY_LABELS = { 0: 'Info', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

const SEVERITY_COLORS = {
    0: { bar: '#64748b', dot: 'bg-slate-400',   text: 'text-slate-400' },
    1: { bar: '#34d399', dot: 'bg-emerald-400', text: 'text-emerald-400' },
    2: { bar: '#fbbf24', dot: 'bg-amber-400',   text: 'text-amber-300' },
    3: { bar: '#fb923c', dot: 'bg-orange-400',  text: 'text-orange-300' },
    4: { bar: '#f87171', dot: 'bg-red-500',     text: 'text-red-300' },
}

const STATUS_COLORS = {
    open:        { bar: '#f87171', text: 'text-red-300' },
    resolved:    { bar: '#34d399', text: 'text-emerald-400' },
    in_progress: { bar: '#60a5fa', text: 'text-blue-300' },
}

const STATUS_LABELS = { open: 'Open', resolved: 'Resolved', in_progress: 'In Progress' }

// ─── Date formatter ───────────────────────────────────────────────────────────
const fmt = (dateStr) => {
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
        })
    } catch { return '—' }
}

// ─── Generate mock time-series from aggregate stats ───────────────────────────
const generateTimeSeries = (total, periods, seed = 1) => {
    if (total === 0) return periods.map((p) => ({ label: p, value: 0 }))
    const base = Math.floor(total / periods.length)
    let remaining = total
    const values = periods.map((p, i) => {
        const noise = Math.floor(Math.sin(i * seed + seed) * base * 0.4)
        const val   = i === periods.length - 1 ? Math.max(0, remaining) : Math.max(0, base + noise)
        remaining  -= val
        return { label: p, value: val }
    })
    return values
}

const WEEK_LABELS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    .slice(0, new Date().getMonth() + 1)
const QUARTER_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12']

// ─── Sparkline SVG component ──────────────────────────────────────────────────
function Sparkline({ data, color, height = 40, showArea = true }) {
    if (!data?.length) return null
    const w = 200, h = height
    const max = Math.max(...data.map(d => d.value), 1)
    const pts = data.map((d, i) => ({
        x: (i / (data.length - 1)) * w,
        y: h - (d.value / max) * (h - 6) - 3,
    }))
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const areaD = `${pathD} L${w},${h} L0,${h} Z`

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
            {showArea && (
                <defs>
                    <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
            )}
            {showArea && (
                <path d={areaD} fill={`url(#sg-${color.replace('#','')})`} />
            )}
            <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Last point dot */}
            <circle
                cx={pts[pts.length - 1].x}
                cy={pts[pts.length - 1].y}
                r="3"
                fill={color}
                stroke="#0a1215"
                strokeWidth="1.5"
            />
        </svg>
    )
}

// ─── Bar chart with interval selector ────────────────────────────────────────
function IntervalBarChart({ title, total, color, intervals, seed = 1 }) {
    const [interval, setInterval] = useState('month')

    const periodMap = {
        week:    WEEK_LABELS,
        month:   MONTH_LABELS,
        quarter: QUARTER_LABELS,
    }

    const data  = generateTimeSeries(total, periodMap[interval], seed)
    const max   = Math.max(...data.map(d => d.value), 1)

    return (
        <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</span>
                <div className="flex gap-1">
                    {['week', 'month', 'quarter'].map(k => (
                        <button
                            key={k}
                            onClick={() => setInterval(k)}
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase transition ${
                                interval === k
                                    ? 'bg-[#00A897]/20 text-[#00A897] border border-[#00A897]/40'
                                    : 'text-slate-600 hover:text-slate-400 border border-transparent'
                            }`}
                        >
                            {k}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-1 h-24">
                {data.map((d, i) => {
                    const pct = max > 0 ? (d.value / max) * 100 : 0
                    return (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
                            <div className="relative w-full flex flex-col justify-end" style={{ height: '80px' }}>
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                    <div className="rounded bg-[#0a1215] border border-[#1c2b2f] px-2 py-1 text-[10px] font-semibold text-slate-200 whitespace-nowrap">
                                        {d.value}
                                    </div>
                                </div>
                                <div
                                    className="w-full rounded-sm transition-all duration-500"
                                    style={{
                                        height: `${Math.max(pct, 2)}%`,
                                        background: color,
                                        opacity: 0.7 + (pct / 100) * 0.3,
                                    }}
                                />
                            </div>
                            <span className="text-[9px] text-slate-700 truncate w-full text-center">{d.label}</span>
                        </div>
                    )
                })}
            </div>

            {/* Sparkline overlay */}
            <div className="border-t border-[#1c2b2f] pt-3">
                <Sparkline data={data} color={color} height={32} />
            </div>
        </div>
    )
}

// ─── Horizontal bar ───────────────────────────────────────────────────────────
function HorizBar({ label, count, total, color, textCls }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
                <span className={`font-medium capitalize ${textCls}`}>{label}</span>
                <span className="text-slate-500 font-mono tabular-nums">{count} <span className="text-slate-700">({pct}%)</span></span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
        </div>
    )
}

// ─── Pill distribution bar ────────────────────────────────────────────────────
function DistBar({ data, colorMap, labelMap }) {
    const total = data.reduce((a, b) => a + b.count, 0)
    const sorted = [...data].sort((a, b) => b._id - a._id)
    return (
        <div className="flex flex-col gap-2">
            <div className="flex h-2 w-full overflow-hidden rounded-full gap-px">
                {sorted.map(s => {
                    const pct = total > 0 ? (s.count / total) * 100 : 0
                    return (
                        <div
                            key={s._id}
                            title={`${labelMap[s._id] ?? s._id}: ${s.count}`}
                            className="h-full"
                            style={{ width: `${pct}%`, background: colorMap[s._id]?.bar ?? '#475569' }}
                        />
                    )
                })}
            </div>
            <div className="flex flex-wrap gap-3">
                {sorted.map(s => (
                    <div key={s._id} className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorMap[s._id]?.bar ?? '#475569' }} />
                        <span className="text-xs text-slate-500">{labelMap[s._id] ?? s._id}</span>
                        <span className="text-xs font-semibold text-slate-300 tabular-nums">{s.count}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Stat KPI card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
    return (
        <div
            className="relative overflow-hidden rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-1"
            style={{ boxShadow: `0 0 0 1px ${accent}18` }}
        >
            <div
                className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-15"
                style={{ background: accent }}
            />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
            <span className="text-3xl font-bold text-white tabular-nums">{value ?? '—'}</span>
            {sub && <span className="text-xs text-slate-500">{sub}</span>}
        </div>
    )
}

// ─── Oldest list ──────────────────────────────────────────────────────────────
function OldestList({ items, dateField, subField, colorMap }) {
    if (!items?.length) return <p className="text-xs text-slate-600">No data</p>
    return (
        <div className="flex flex-col divide-y divide-[#0e1a1e]">
            {items.map(item => {
                const sev = item.severity ?? 0
                return (
                    <div key={item._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: colorMap[sev]?.bar ?? '#475569' }}
                        />
                        <span className="flex-1 truncate text-xs text-slate-300" title={item.title}>{item.title}</span>
                        <span className="shrink-0 text-xs text-slate-600 font-mono">{item[subField] ?? '—'}</span>
                        <span className="shrink-0 text-[10px] text-slate-700">{fmt(item[dateField])}</span>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, subtitle, accent = '#00A897', children }) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <div className="h-5 w-0.5 rounded-full" style={{ background: accent }} />
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: accent }}>{title}</h3>
                    {subtitle && <p className="text-[11px] text-slate-600 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ h = 'h-24' }) {
    return <div className={`rounded-xl border border-[#1c2b2f] bg-black/40 ${h} animate-pulse`} />
}

// ─── Locked section placeholder ──────────────────────────────────────────────
function Locked({ label }) {
    return (
        <div className="rounded-xl border border-[#1c2b2f] bg-black/30 px-6 py-10 flex flex-col items-center gap-2 text-center">
            <p className="text-[10px] text-slate-800">Your account does not have access to this section.</p>
        </div>
    )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function Dashboard() {
    // ─── Keycloak Authentication ──────────────────────────────────────────────
    const { isAdmin } = useAuth()
    const { can, loading: permissionsLoading } = usePermissions()

    const [incidentStats, setIncidentStats] = useState(null)
    const [vulnStats,     setVulnStats]     = useState(null)
    const [loadingInc,    setLoadingInc]    = useState(true)
    const [loadingVuln,   setLoadingVuln]   = useState(true)
    const [errorInc,      setErrorInc]      = useState('')
    const [errorVuln,     setErrorVuln]     = useState('')

    // ──────────────────────────────────────────────────────────────────────────────
    // PERMISSION CHECK LOGIC — Keycloak Roles Only
    // ──────────────────────────────────────────────────────────────────────────────
    // Admin users have access to everything
    // Non-admin users need the appropriate Keycloak role/permission
    const hasInc  = isAdmin || can('VIEW_INCIDENTS')
    const hasVuln = isAdmin || can('VIEW_VULNERABILITIES')

    // ── Load incidents stats ──
    useEffect(() => {
        if (!hasInc) { setLoadingInc(false); return }
        api.get('/incidents/stats')
            .then(r => setIncidentStats(r.data))
            .catch(err => {
                console.error('[Dashboard] Failed to load incident stats:', err)
                setErrorInc('Failed to load incident statistics.')
            })
            .finally(() => setLoadingInc(false))
    }, [hasInc])

    // ── Load vulnerability stats ──
    useEffect(() => {
        if (!hasVuln) { setLoadingVuln(false); return }
        api.get('/vulnerabilities/stats')
            .then(r => setVulnStats(r.data))
            .catch(err => {
                console.error('[Dashboard] Failed to load vulnerability stats:', err)
                setErrorVuln('Failed to load vulnerability statistics.')
            })
            .finally(() => setLoadingVuln(false))
    }, [hasVuln])

    // ── Derived ──
    const totalInc      = incidentStats?.byStatus?.reduce((a, b) => a + b.count, 0) ?? 0
    const openInc       = incidentStats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const critInc       = incidentStats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const highInc       = incidentStats?.bySeverity?.find(s => s._id === 3)?.count ?? 0
    const wazuhInc      = incidentStats?.bySource?.find(s => s._id === 'wazuh')?.count ?? 0

    const totalVuln     = vulnStats?.byStatus?.reduce((a, b) => a + b.count, 0) ?? 0
    const openVuln      = vulnStats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const resolvedVuln  = vulnStats?.byStatus?.find(s => s._id === 'resolved')?.count ?? 0
    const critVuln      = vulnStats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const highVuln      = vulnStats?.bySeverity?.find(s => s._id === 3)?.count ?? 0

    return (
        <div className="space-y-10 text-slate-100">

            {/* ── Page header ── */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1c2b2f] pb-5">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Dashboard</h2>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live · {new Date().toLocaleString('en-GB')}
                </div>
            </div>

            {/* ── Global KPI row — only show what user can see ── */}
            {(hasInc || hasVuln) && (
                <div className={`grid gap-4 ${
                    hasInc && hasVuln ? 'sm:grid-cols-2 xl:grid-cols-4' :
                    'sm:grid-cols-2'
                }`}>
                    {hasInc && (
                        <>
                            <StatCard label="Open Incidents"    value={loadingInc ? '…' : openInc}         sub={`${totalInc} total`}                     accent="#f87171" />
                            <StatCard label="Critical + High"   value={loadingInc ? '…' : critInc + highInc} sub={`${critInc} critical · ${highInc} high`} accent="#fb923c" />
                        </>
                    )}
                    {hasVuln && (
                        <>
                            <StatCard label="Open Vulnerabilities" value={loadingVuln ? '…' : openVuln}           sub={`${totalVuln} total`}                       accent="#f87171" />
                            <StatCard label="Critical + High Vuln" value={loadingVuln ? '…' : critVuln + highVuln} sub={`${critVuln} critical · ${highVuln} high`}  accent="#fb923c" />
                        </>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════
                  INCIDENTS SECTION
              ══════════════════════════════════════════════ */}
            <Section title="Incidents" accent="#f87171">
                {!hasInc ? (
                    <Locked label="Incidents — Access Restricted" />
                ) : errorInc ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorInc}</div>
                ) : loadingInc ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Skeleton /><Skeleton /><Skeleton />
                    </div>
                ) : (
                    <>
                        {/* KPI cards */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <StatCard label="Total"      value={totalInc}  sub="All statuses"    accent="#00A897" />
                            <StatCard label="From Wazuh" value={wazuhInc}  sub="Auto-detected"   accent="#60a5fa" />
                            <StatCard label="Open"       value={openInc}   sub="Pending"         accent="#f87171" />
                        </div>


                        {/* Breakdown: severity + status side by side */}
                        <div className="grid gap-4 lg:grid-cols-2">

                            {/* By Severity */}
                            <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-4">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">By Severity (open)</span>
                                {incidentStats?.bySeverity?.length > 0 ? (
                                    <>
                                        <div className="flex flex-col gap-3">
                                            {[...incidentStats.bySeverity].sort((a,b) => b._id - a._id).map(s => (
                                                <HorizBar
                                                    key={s._id}
                                                    label={SEVERITY_LABELS[s._id] ?? s._id}
                                                    count={s.count}
                                                    total={incidentStats.bySeverity.reduce((a,b) => a+b.count,0)}
                                                    color={SEVERITY_COLORS[s._id]?.bar ?? '#475569'}
                                                    textCls={SEVERITY_COLORS[s._id]?.text ?? 'text-slate-400'}
                                                />
                                            ))}
                                        </div>
                                        <DistBar
                                            data={incidentStats.bySeverity}
                                            colorMap={SEVERITY_COLORS}
                                            labelMap={SEVERITY_LABELS}
                                        />
                                    </>
                                ) : <p className="text-xs text-slate-600">No data</p>}
                            </div>

                            {/* By Status */}
                            <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-4">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">By Status</span>
                                {incidentStats?.byStatus?.length > 0 ? (
                                    <>
                                        <div className="flex flex-col gap-3">
                                            {[...incidentStats.byStatus].sort((a,b) => b.count - a.count).map(s => (
                                                <HorizBar
                                                    key={s._id}
                                                    label={STATUS_LABELS[s._id] ?? s._id}
                                                    count={s.count}
                                                    total={incidentStats.byStatus.reduce((a,b) => a+b.count,0)}
                                                    color={STATUS_COLORS[s._id]?.bar ?? '#475569'}
                                                    textCls={STATUS_COLORS[s._id]?.text ?? 'text-slate-400'}
                                                />
                                            ))}
                                        </div>
                                        <DistBar
                                            data={incidentStats.byStatus}
                                            colorMap={STATUS_COLORS}
                                            labelMap={STATUS_LABELS}
                                        />
                                    </>
                                ) : <p className="text-xs text-slate-600">No data</p>}
                            </div>
                        </div>

                        {/* Oldest open */}
                        {incidentStats?.oldest_open?.length > 0 && (
                            <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-3">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Oldest Open Incidents</span>
                                <OldestList
                                    items={incidentStats.oldest_open}
                                    dateField="timestamp"
                                    subField="agent_name"
                                    colorMap={SEVERITY_COLORS}
                                />
                            </div>
                        )}
                    </>
                )}
            </Section>

            {/* Divider */}
            <div className="border-t border-[#1c2b2f]" />

            {/* ══════════════════════════════════════════════
                  VULNERABILITIES SECTION
              ══════════════════════════════════════════════ */}
            <Section title="Vulnerabilities" accent="#00A897">
                {!hasVuln ? (
                    <Locked label="Vulnerabilities — Access Restricted" />
                ) : errorVuln ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorVuln}</div>
                ) : loadingVuln ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Skeleton /><Skeleton /><Skeleton />
                    </div>
                ) : (
                    <>
                        {/* KPI cards */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <StatCard label="Total"    value={totalVuln}    sub="All statuses"       accent="#00A897" />
                            <StatCard label="Open"     value={openVuln}     sub="Unresolved"         accent="#f87171" />
                            <StatCard label="Resolved" value={resolvedVuln} sub="Patched/mitigated"  accent="#34d399" />
                        </div>

                        {/* Breakdown: severity + status */}
                        <div className="grid gap-4 lg:grid-cols-2">

                            {/* By Severity */}
                            <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-4">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">By Severity (open)</span>
                                {vulnStats?.bySeverity?.length > 0 ? (
                                    <>
                                        <div className="flex flex-col gap-3">
                                            {[...vulnStats.bySeverity].sort((a,b) => b._id - a._id).map(s => (
                                                <HorizBar
                                                    key={s._id}
                                                    label={SEVERITY_LABELS[s._id] ?? s._id}
                                                    count={s.count}
                                                    total={vulnStats.bySeverity.reduce((a,b) => a+b.count,0)}
                                                    color={SEVERITY_COLORS[s._id]?.bar ?? '#475569'}
                                                    textCls={SEVERITY_COLORS[s._id]?.text ?? 'text-slate-400'}
                                                />
                                            ))}
                                        </div>
                                        <DistBar
                                            data={vulnStats.bySeverity}
                                            colorMap={SEVERITY_COLORS}
                                            labelMap={SEVERITY_LABELS}
                                        />
                                    </>
                                ) : <p className="text-xs text-slate-600">No data</p>}
                            </div>

                            {/* By Status */}
                            <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-4">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">By Status</span>
                                {vulnStats?.byStatus?.length > 0 ? (
                                    <>
                                        <div className="flex flex-col gap-3">
                                            {[...vulnStats.byStatus].sort((a,b) => b.count - a.count).map(s => (
                                                <HorizBar
                                                    key={s._id}
                                                    label={STATUS_LABELS[s._id] ?? s._id}
                                                    count={s.count}
                                                    total={vulnStats.byStatus.reduce((a,b) => a+b.count,0)}
                                                    color={STATUS_COLORS[s._id]?.bar ?? '#475569'}
                                                    textCls={STATUS_COLORS[s._id]?.text ?? 'text-slate-400'}
                                                />
                                            ))}
                                        </div>
                                        <DistBar
                                            data={vulnStats.byStatus}
                                            colorMap={STATUS_COLORS}
                                            labelMap={STATUS_LABELS}
                                        />
                                    </>
                                ) : <p className="text-xs text-slate-600">No data</p>}
                            </div>
                        </div>

                        {/* Oldest open vulnerabilities */}
                        {vulnStats?.oldest_open?.length > 0 && (
                            <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-3">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Oldest Open Vulnerabilities</span>
                                <OldestList
                                    items={vulnStats.oldest_open}
                                    dateField="first_seen"
                                    subField="host"
                                    colorMap={SEVERITY_COLORS}
                                />
                            </div>
                        )}
                    </>
                )}
            </Section>

        </div>
    )
}

export default Dashboard