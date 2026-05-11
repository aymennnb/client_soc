import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/useAuth'
import api from '../api'
import DetailVulnerability from './DetailVulnerability'
import DeleteModal from '../componants/DeleteModal'

// ─── Constants ───────────────────────────────────────────────────────────────
const SEVERITY_LABELS = { 0: 'Info', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

const SEVERITY_BADGES = {
    Info:     'bg-slate-700/60 text-slate-300 border border-slate-600/40',
    Low:      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    Medium:   'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    High:     'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    Critical: 'bg-red-500/15 text-red-300 border border-red-500/30',
}

const SEVERITY_DOT = {
    Info:     'bg-slate-400',
    Low:      'bg-emerald-400',
    Medium:   'bg-amber-400',
    High:     'bg-orange-400',
    Critical: 'bg-red-500',
}

const STATUS_BADGES = {
    open:        'bg-red-500/15 text-red-300 border border-red-500/30',
    resolved:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    in_progress: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    ignored:     'bg-slate-700/60 text-slate-400 border border-slate-600/40',
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

const fmt = (dateStr) => {
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) }
    catch { return '—' }
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }) {
    return (
        <div
            className="relative overflow-hidden rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-1"
            style={{ boxShadow: `0 0 0 1px ${accent}18, inset 0 1px 0 ${accent}10` }}
        >
            {/* Glow top-right corner */}
            <div
                className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-20"
                style={{ background: accent }}
            />
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</span>
                <span className="text-lg" style={{ color: accent }}>{icon}</span>
            </div>
            <span className="text-3xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {value ?? '—'}
            </span>
            {sub && <span className="text-xs text-slate-500">{sub}</span>}
        </div>
    )
}

// ─── Severity Bar ─────────────────────────────────────────────────────────────
function SeverityBar({ bySeverity }) {
    const total = bySeverity.reduce((a, b) => a + b.count, 0)
    const colors = { 0: '#64748b', 1: '#34d399', 2: '#fbbf24', 3: '#fb923c', 4: '#f87171' }
    const sorted = [...bySeverity].sort((a, b) => b._id - a._id)

    return (
        <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">By Severity</span>
            <div className="flex h-3 w-full overflow-hidden rounded-full gap-0.5">
                {sorted.map(s => {
                    const pct = total > 0 ? (s.count / total) * 100 : 0
                    return (
                        <div
                            key={s._id}
                            title={`${SEVERITY_LABELS[s._id]}: ${s.count}`}
                            className="h-full transition-all"
                            style={{ width: `${pct}%`, background: colors[s._id] ?? '#475569', borderRadius: 2 }}
                        />
                    )
                })}
            </div>
            <div className="flex flex-wrap gap-3">
                {sorted.map(s => (
                    <div key={s._id} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: colors[s._id] ?? '#475569' }} />
                        <span className="text-xs text-slate-400">{SEVERITY_LABELS[s._id] ?? s._id}</span>
                        <span className="text-xs font-semibold text-slate-200">{s.count}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Oldest Open Panel ────────────────────────────────────────────────────────
function OldestOpenPanel({ items }) {
    if (!items?.length) return null
    return (
        <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Oldest Open</span>
            <div className="flex flex-col gap-2">
                {items.map(v => {
                    const label = SEVERITY_LABELS[v.severity] ?? String(v.severity)
                    return (
                        <div key={v._id} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2 border border-[#1c2b2f]">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[label] ?? 'bg-slate-400'}`} />
                            <span className="flex-1 truncate text-xs text-slate-300">{v.title}</span>
                            <span className="shrink-0 text-xs text-slate-500 font-mono">{v.host}</span>
                            <span className="shrink-0 text-xs text-slate-600">{fmt(v.first_seen)}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Filter Input ─────────────────────────────────────────────────────────────
function FilterInput({ label, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</label>
            {children}
        </div>
    )
}

const inputCls = "w-full rounded-lg border border-[#1c2b2f] bg-[#0a1215] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 transition focus:border-[#00A897] focus:outline-none focus:ring-1 focus:ring-[#00A897]/40"

// ─── Main Component ───────────────────────────────────────────────────────────
function Vulnerabilities() {
    const navigate = useNavigate()

    // ── Keycloak Authentication & Permissions ──
    const { isAdmin } = useAuth()
    const { can, loading: permissionsLoading } = usePermissions()

    const [vulnerabilities, setVulnerabilities] = useState([])
    const [stats,           setStats]           = useState(null)
    const [hosts,           setHosts]           = useState([])
    const [loading,         setLoading]         = useState(true)
    const [error,           setError]           = useState('')

    // Filters — all server-side now
    const [filterStatus,         setFilterStatus]         = useState('')
    const [filterSeverity,       setFilterSeverity]       = useState('')
    const [filterHost,           setFilterHost]           = useState('')
    const [filterTitle,          setFilterTitle]          = useState('')
    const [filterDuration,       setFilterDuration]       = useState('')
    const [filterFirstSeenFrom,  setFilterFirstSeenFrom]  = useState('')
    const [filterFirstSeenTo,    setFilterFirstSeenTo]    = useState('')
    const [filterLastSeenFrom,   setFilterLastSeenFrom]   = useState('')
    const [filterLastSeenTo,     setFilterLastSeenTo]     = useState('')

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize,    setPageSize]    = useState(25)

    const [selectedVuln,  setSelectedVuln]  = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState(null)

    // ── Stats ──
    useEffect(() => {
        api.get('/vulnerabilities/stats').then(r => setStats(r.data)).catch(() => {})
    }, [])

    // ── Fetch (all filters server-side) ──
    const fetchVulnerabilities = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const params = {}
            if (filterStatus)           params.status   = filterStatus
            if (filterSeverity)         params.severity = filterSeverity
            if (filterHost)             params.host     = filterHost
            if (filterTitle)            params.title    = filterTitle
            if (filterDuration)         params.min_duration_days = filterDuration
            if (filterFirstSeenFrom)    params.first_seen_from = filterFirstSeenFrom
            if (filterFirstSeenTo)      params.first_seen_to   = filterFirstSeenTo
            if (filterLastSeenFrom)     params.last_seen_from  = filterLastSeenFrom
            if (filterLastSeenTo)       params.last_seen_to    = filterLastSeenTo

            const res  = await api.get('/vulnerabilities', { params })
            const list = res.data.vulnerabilities || []
            setVulnerabilities(list)
            setCurrentPage(1)

            if (!filterHost) {
                setHosts([...new Set(list.map(v => v.host).filter(Boolean))])
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load vulnerabilities.')
        } finally {
            setLoading(false)
        }
    }, [filterStatus, filterSeverity, filterHost, filterTitle, filterDuration, filterFirstSeenFrom, filterFirstSeenTo, filterLastSeenFrom, filterLastSeenTo])

    useEffect(() => { fetchVulnerabilities() }, [fetchVulnerabilities])

    // ── Pagination ──
    const totalPages     = Math.max(1, Math.ceil(vulnerabilities.length / pageSize))
    const startIndex     = (currentPage - 1) * pageSize
    const paginatedVulns = vulnerabilities.slice(startIndex, startIndex + pageSize)

    const resetFilters = () => {
        setFilterTitle('')
        setFilterDuration('')
        setFilterStatus('')
        setFilterSeverity('')
        setFilterHost('')
        setFilterFirstSeenFrom('')
        setFilterFirstSeenTo('')
        setFilterLastSeenFrom('')
        setFilterLastSeenTo('')
        setCurrentPage(1)
    }

    const hasActiveFilters = filterTitle || filterDuration || filterStatus ||
        filterSeverity || filterHost || filterFirstSeenFrom || filterFirstSeenTo ||
        filterLastSeenFrom || filterLastSeenTo

    const handleDelete = async (id) => {
        try {
            await api.delete(`/vulnerabilities/${id}`)
            fetchVulnerabilities()
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.')
        }
    }

    const handleViewDetails = async (id) => {
        setDetailLoading(true)
        setSelectedVuln(null)
        try {
            const res = await api.get(`/vulnerabilities/${id}`)
            setSelectedVuln(res.data)
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to load details.')
        } finally {
            setDetailLoading(false)
        }
    }

    const totalOpen     = stats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const totalResolved = stats?.byStatus?.find(s => s._id === 'resolved')?.count ?? 0

    // Show loading state while permissions are being fetched
    if (permissionsLoading) {
        return (
            <div className="space-y-6 text-slate-100">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-xl border border-[#1c2b2f] bg-black/40 h-24 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 text-slate-100">

            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Vulnerability Management</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(isAdmin || can('CREATE_VULNERABILITY')) && (
                        <button
                            onClick={() => navigate('/vulnerabilities/add')}
                            className="flex items-center gap-2 rounded-lg bg-[#00A897] px-4 py-2 text-xs font-bold text-black transition hover:bg-[#00c4b1]"
                        >
                            <span>＋</span> Add Vulnerability
                        </button>
                    )}
                    {(isAdmin || can('SYNC_VULNERABILITIES')) && (
                        <button
                            onClick={() => navigate('/vulnerabilities/sync')}
                            className="rounded-lg border border-[#275B66] px-4 py-2 text-xs font-semibold text-[#00A897] transition hover:bg-[#275B66] hover:text-white"
                        >
                            ⟳ Nessus Sync
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats ── */}
            {stats && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard
                        label="Open"
                        value={totalOpen}
                        accent="#f87171"
                    />
                    <StatCard
                        label="Resolved"
                        value={totalResolved}
                        accent="#34d399"
                    />
                    <StatCard
                        label="Total Scanned"
                        value={(stats.byStatus ?? []).reduce((a, b) => a + b.count, 0)}
                        accent="#00A897"
                    />
                </div>
            )}

            {/* ── Filters ── */}
            <div className="rounded-xl border border-[#1c2b2f] bg-black/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Filters</span>
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-1 rounded-md border border-[#275B66] px-2.5 py-1 text-[11px] font-semibold text-[#00A897] transition hover:bg-[#275B66] hover:text-white"
                        >
                            ✕ Reset filters
                        </button>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    <FilterInput label="Title">
                        <input
                            className={inputCls}
                            placeholder="Search title…"
                            value={filterTitle}
                            onChange={e => { setFilterTitle(e.target.value); setCurrentPage(1) }}
                        />
                    </FilterInput>

                    <FilterInput label="Min Duration (days)">
                        <input
                            type="number"
                            min={0}
                            className={inputCls}
                            placeholder="e.g. 30"
                            value={filterDuration}
                            onChange={e => { setFilterDuration(e.target.value); setCurrentPage(1) }}
                        />
                    </FilterInput>

                    <FilterInput label="Severity">
                        <select
                            className={inputCls}
                            value={filterSeverity}
                            onChange={e => { setFilterSeverity(e.target.value); setCurrentPage(1) }}
                        >
                            <option value="">All severities</option>
                            <option value="4">Critical</option>
                            <option value="3">High</option>
                            <option value="2">Medium</option>
                            <option value="1">Low</option>
                            <option value="0">Info</option>
                        </select>
                    </FilterInput>

                    <FilterInput label="Status">
                        <select
                            className={inputCls}
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}
                        >
                            <option value="">All statuses</option>
                            <option value="open">Open</option>
                            <option value="resolved">Resolved</option>
                            <option value="in_progress">In Progress</option>
                            <option value="ignored">Ignored</option>
                        </select>
                    </FilterInput>

                    <FilterInput label="Host">
                        <select
                            className={inputCls}
                            value={filterHost}
                            onChange={e => { setFilterHost(e.target.value); setCurrentPage(1) }}
                        >
                            <option value="">All hosts</option>
                            {hosts.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </FilterInput>

                    <FilterInput label="First seen — from / to">
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className={inputCls}
                                value={filterFirstSeenFrom}
                                onChange={e => { setFilterFirstSeenFrom(e.target.value); setCurrentPage(1) }}
                            />
                            <input
                                type="date"
                                className={inputCls}
                                value={filterFirstSeenTo}
                                onChange={e => { setFilterFirstSeenTo(e.target.value); setCurrentPage(1) }}
                            />
                        </div>
                    </FilterInput>

                    <FilterInput label="Last seen — from / to">
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className={inputCls}
                                value={filterLastSeenFrom}
                                onChange={e => { setFilterLastSeenFrom(e.target.value); setCurrentPage(1) }}
                            />
                            <input
                                type="date"
                                className={inputCls}
                                value={filterLastSeenTo}
                                onChange={e => { setFilterLastSeenTo(e.target.value); setCurrentPage(1) }}
                            />
                        </div>
                    </FilterInput>
                </div>
            </div>

            {/* ── Table header row (count + page size) ── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                    {loading ? 'Loading…' : (
                        vulnerabilities.length === 0
                            ? 'No results'
                            : `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, vulnerabilities.length)} of ${vulnerabilities.length} vulnerabilities`
                    )}
                </p>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">Rows:</label>
                    <select
                        className="rounded-lg border border-[#1c2b2f] bg-[#0a1215] px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#00A897]/40"
                        value={pageSize}
                        onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                    >
                        {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {/* ── Loading skeleton ── */}
            {loading && (
                <div className="rounded-xl border border-[#1c2b2f] overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4 border-b border-[#1c2b2f] px-4 py-3 animate-pulse">
                            <div className="h-3 w-1/3 rounded bg-white/5" />
                            <div className="h-3 w-16 rounded bg-white/5" />
                            <div className="h-3 w-24 rounded bg-white/5" />
                        </div>
                    ))}
                </div>
            )}

            {/* ── Empty ── */}
            {!loading && !error && vulnerabilities.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-[#1c2b2f] bg-black/40 py-16 text-center">
                    <p className="text-sm text-slate-500">No vulnerabilities match your filters.</p>
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="mt-1 text-xs text-[#00A897] hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* ── Table ── */}
            {!loading && vulnerabilities.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-[#1c2b2f]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead>
                                <tr className="bg-[#080f12] text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                    <th className="px-4 py-3 text-left">Title</th>
                                    <th className="px-4 py-3 text-left">Severity</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Host</th>
                                    <th className="px-4 py-3 text-left">Port</th>
                                    <th className="px-4 py-3 text-right">Duration</th>
                                    <th className="px-4 py-3 text-left">First Seen</th>
                                    <th className="px-4 py-3 text-left">Last Seen</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#0e1a1e]">
                                {paginatedVulns.map((vuln) => {
                                    const sevLabel = SEVERITY_LABELS[vuln.severity] ?? String(vuln.severity)
                                    const statusKey = vuln.status?.toLowerCase() ?? ''
                                    return (
                                        <tr
                                            key={vuln._id}
                                            className="bg-black/40 transition-colors hover:bg-[#0e1e24] group"
                                        >
                                            {/* Title */}
                                            <td className="px-4 py-3 max-w-[260px]">
                                                <span
                                                    className="block truncate text-slate-200 font-medium group-hover:text-white transition-colors"
                                                    title={vuln.title}
                                                >
                                                    {vuln.title}
                                                </span>
                                            </td>

                                            {/* Severity */}
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEVERITY_BADGES[sevLabel] ?? 'bg-slate-700/60 text-slate-300 border border-slate-600/40'}`}>
                                                    {sevLabel}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_BADGES[statusKey] ?? 'bg-slate-700/60 text-slate-400 border border-slate-600/40'}`}>
                                                    {vuln.status ?? '—'}
                                                </span>
                                            </td>

                                            {/* Host */}
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-slate-400">{vuln.host ?? '—'}</span>
                                            </td>

                                            {/* Port */}
                                            <td className="px-4 py-3">
                                                {vuln.port
                                                    ? <span className="rounded bg-[#0e1e24] px-2 py-0.5 font-mono text-xs text-[#00A897] border border-[#1c2b2f]">{vuln.port}</span>
                                                    : <span className="text-slate-600">—</span>
                                                }
                                            </td>

                                            {/* Duration */}
                                            <td className="px-4 py-3 text-right">
                                                {vuln.duration_days != null
                                                    ? <span className="text-xs text-slate-400">{vuln.duration_days}</span>
                                                    : <span className="text-slate-600">—</span>
                                                }
                                            </td>

                                            {/* First seen */}
                                            <td className="px-4 py-3 text-xs text-slate-500">{fmt(vuln.first_seen)}</td>

                                            {/* Last seen */}
                                            <td className="px-4 py-3 text-xs text-slate-500">{fmt(vuln.last_seen)}</td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Details */}
                                                    {(isAdmin || can('VIEW_VULNERABILITY_DETAILS')) && (
                                                        <button
                                                            onClick={() => handleViewDetails(vuln._id)}
                                                            className="rounded-md border border-[#275B66] px-2.5 py-1 text-[11px] font-semibold text-[#00A897] transition hover:bg-[#275B66] hover:text-white"
                                                        >
                                                            Details
                                                        </button>
                                                    )}
                                                    {/* Edit */}
                                                    {(isAdmin || can('UPDATE_VULNERABILITY')) && (
                                                        <button
                                                            onClick={() => navigate(`/vulnerabilities/edit/${vuln._id}`)}
                                                            className="rounded-md bg-[#00A897]/10 border border-[#00A897]/30 px-2.5 py-1 text-[11px] font-semibold text-[#00A897] transition hover:bg-[#00A897] hover:text-black"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}

                                                    {/* Delete */}
                                                    {(isAdmin || can('DELETE_VULNERABILITY')) && (
                                                        <button
                                                            onClick={() => setDeleteTarget({ id: vuln._id, name: vuln.title })}
                                                            className="rounded-md border border-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-400 transition hover:bg-red-500/20"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Pagination ── */}
            {!loading && vulnerabilities.length > pageSize && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:border-[#275B66] hover:text-[#00A897] transition"
                    >
                        «
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:border-[#275B66] hover:text-[#00A897] transition"
                    >
                        Previous
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 3)
                        if (page > totalPages) return null
                        return (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                    page === currentPage
                                        ? 'border-[#00A897] bg-[#00A897]/10 text-[#00A897]'
                                        : 'border-[#1c2b2f] text-slate-400 hover:border-[#275B66] hover:text-[#00A897]'
                                }`}
                            >
                                {page}
                            </button>
                        )
                    })}

                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:border-[#275B66] hover:text-[#00A897] transition"
                    >
                        Next
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:border-[#275B66] hover:text-[#00A897] transition"
                    >
                        »
                    </button>
                </div>
            )}

            {deleteTarget && (
                <DeleteModal
                    type="vulnerability"
                    name={deleteTarget.name}
                    onConfirm={() => {
                        handleDelete(deleteTarget.id)
                        setDeleteTarget(null)
                    }}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* ── Detail panel ── */}
            {detailLoading && (
                <div className="text-center text-xs text-slate-500 animate-pulse">Loading details…</div>
            )}
            {selectedVuln && (
                <DetailVulnerability
                    selectedVuln={selectedVuln}
                    detailLoading={detailLoading}
                    onClose={() => setSelectedVuln(null)}
                />
            )}
        </div>
    )
}

export default Vulnerabilities