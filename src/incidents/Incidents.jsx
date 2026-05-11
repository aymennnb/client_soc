import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/useAuth'
import api from '../api'
import DetailIncident from './Detailsincident'
import DeleteModal from '../componants/DeleteModal'
import {
    SEVERITY_LABELS, SEVERITY_BADGES,
    STATUS_BADGES, STATUS_LABELS, fmt,
} from './incidentConstants'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = "w-full rounded-lg border border-[#1c2b2f] bg-[#0a1215] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 transition focus:border-[#00A897] focus:outline-none focus:ring-1 focus:ring-[#00A897]/40 lm:bg-white lm:text-slate-800 lm:border-slate-200 lm:placeholder-slate-400 lm:focus:border-[#00A897]"
const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-slate-500 lm:text-slate-400 mb-1.5"

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, sub }) {
    return (
        <div
            className="relative overflow-hidden rounded-xl border border-[#1c2b2f] bg-black/60 p-5 flex flex-col gap-1 lm:bg-white lm:border-slate-200"
            style={{ boxShadow: `0 0 0 1px ${accent}18` }}
        >
            <div
                className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-20"
                style={{ background: accent }}
            />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 lm:text-slate-400">{label}</span>
            <span className="text-3xl font-bold text-white lm:text-slate-900 mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {value ?? '—'}
            </span>
            {sub && <span className="text-xs text-slate-500 lm:text-slate-400">{sub}</span>}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
function Incidents() {
    const navigate = useNavigate()

    // ── Keycloak Authentication & Permissions ──
    const { isAdmin } = useAuth()
    const { can, loading: permissionsLoading } = usePermissions()

    const [incidents,     setIncidents]     = useState([])
    const [stats,         setStats]         = useState(null)
    const [loading,       setLoading]       = useState(true)
    const [syncing,       setSyncing]       = useState(false)
    const [error,         setError]         = useState('')
    const [syncMsg,       setSyncMsg]       = useState(null)

    // ── Detail modal ──
    const [selectedIncident,  setSelectedIncident]  = useState(null)
    const [detailLoading,     setDetailLoading]     = useState(false)

    // ── Delete modal ──
    const [deleteTarget, setDeleteTarget] = useState(null) // { id, title }

    // ── Pagination ──
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize,    setPageSize]    = useState(25)

    // ── Filters (server-side) ──
    const [filterStatus,   setFilterStatus]   = useState('')
    const [filterSeverity, setFilterSeverity] = useState('')
    const [filterSource,   setFilterSource]   = useState('')
    const [filterAgent,    setFilterAgent]    = useState('')
    const [filterTimeFrom, setFilterTimeFrom] = useState('')
    const [filterTimeTo,   setFilterTimeTo]   = useState('')

    // ── Filter (client-side — title) ──
    const [filterTitle, setFilterTitle] = useState('')

    // ── Stats ──
    const fetchStats = () => {
        api.get('/incidents/stats').then(r => setStats(r.data)).catch(() => {})
    }
    useEffect(() => { fetchStats() }, [])

    // ── Fetch incidents ──
    const fetchIncidents = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const params = {}
            if (filterStatus)          params.status     = filterStatus
            if (filterSeverity !== '') params.severity   = filterSeverity
            if (filterSource)          params.source     = filterSource
            if (filterAgent)           params.agent_name = filterAgent
            if (filterTimeFrom)        params.time_from  = filterTimeFrom
            if (filterTimeTo)          params.time_to    = filterTimeTo

            const res = await api.get('/incidents', { params })
            setIncidents(res.data.incidents || [])
            setCurrentPage(1)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load incidents.')
        } finally {
            setLoading(false)
        }
    }, [filterStatus, filterSeverity, filterSource, filterAgent, filterTimeFrom, filterTimeTo])

    useEffect(() => { fetchIncidents() }, [fetchIncidents])

    // ── Client-side title filter ──
    const filtered = useMemo(() => {
        if (!filterTitle) return incidents
        return incidents.filter(i =>
            i.title?.toLowerCase().includes(filterTitle.toLowerCase())
        )
    }, [incidents, filterTitle])

    // ── Pagination ──
    const totalPages    = Math.max(1, Math.ceil(filtered.length / pageSize))
    const startIndex    = (currentPage - 1) * pageSize
    const paginatedRows = filtered.slice(startIndex, startIndex + pageSize)

    const hasActiveFilters = filterTitle || filterStatus || filterSeverity !== '' ||
        filterSource || filterAgent || filterTimeFrom || filterTimeTo

    const resetFilters = () => {
        setFilterTitle(''); setFilterStatus(''); setFilterSeverity('')
        setFilterSource(''); setFilterAgent(''); setFilterTimeFrom(''); setFilterTimeTo('')
        setCurrentPage(1)
    }

    // ── Sync ──
    const handleSync = async () => {
        setSyncing(true); setSyncMsg(null)
        try {
            const res = await api.post('/incidents/sync')
            setSyncMsg({ type: 'success', text: res.data.message })
            fetchIncidents(); fetchStats()
        } catch (err) {
            setSyncMsg({ type: 'error', text: err.response?.data?.message || 'Sync failed.' })
        } finally {
            setSyncing(false)
            setTimeout(() => setSyncMsg(null), 4000)
        }
    }

    // ── View Details ──
    const handleViewDetails = async (id) => {
        setDetailLoading(true)
        setSelectedIncident(null)
        try {
            const res = await api.get(`/incidents/${id}`)
            setSelectedIncident(res.data)
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to load details.')
        } finally {
            setDetailLoading(false)
        }
    }

    // ── Delete (via modal) ──
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        try {
            await api.delete(`/incidents/${deleteTarget.id}`)
            setDeleteTarget(null)
            fetchIncidents(); fetchStats()
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.')
        }
    }

    // ── Derived stats ──
    const totalOpen     = stats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const totalResolved = stats?.byStatus?.find(s => s._id === 'resolved' || s._id === 'closed')?.count ?? 0
    const totalCritical = stats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const totalHigh     = stats?.bySeverity?.find(s => s._id === 3)?.count ?? 0

    // Show loading state while permissions are being fetched
    if (permissionsLoading) {
        return (
            <div className="space-y-6 text-slate-100">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-xl border border-[#1c2b2f] bg-black/40 h-24 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 text-slate-100 lm:text-slate-800">

            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-bold tracking-tight text-white lm:text-slate-900">Incident Management</h2>
                <div className="flex flex-wrap gap-2">
                    {(isAdmin || can('SYNC_INCIDENTS')) && (
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center gap-2 rounded-lg border border-[#275B66] px-4 py-2 text-xs font-semibold text-[#00A897] transition hover:bg-[#275B66] hover:text-white disabled:opacity-50 lm:border-[#00A897]/40 lm:hover:bg-[#00A897]/10"
                        >
                            {syncing
                                ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />Syncing…</>
                                : <>⟳ Wazuh Sync</>
                            }
                        </button>
                    )}
                    {(isAdmin || can('CREATE_INCIDENT')) && (
                        <button
                            onClick={() => navigate('/incidents/add')}
                            className="flex items-center gap-2 rounded-lg bg-[#00A897] px-4 py-2 text-xs font-bold text-black transition hover:bg-[#00c4b1]"
                        >
                            ＋ Add Incident
                        </button>
                    )}
                </div>
            </div>

            {/* ── Sync message ── */}
            {syncMsg && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${
                    syncMsg.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-red-500/30 bg-red-500/10 text-red-300'
                }`}>
                    {syncMsg.text}
                </div>
            )}

            {/* ── Stats ── */}
            {stats && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Open"     value={totalOpen}     accent="#f87171" />
                    <StatCard label="Resolved" value={totalResolved} accent="#34d399" />
                    <StatCard label="Critical" value={totalCritical} accent="#f87171" />
                    <StatCard label="High"     value={totalHigh}     accent="#fb923c" />
                </div>
            )}

            {/* ── Filters ── */}
            <div className="rounded-xl border border-[#1c2b2f] bg-black/50 p-5 space-y-4 lm:bg-white lm:border-slate-200">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 lm:text-slate-400">Filters</span>
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-1 rounded-md border border-[#275B66] px-2.5 py-1 text-[11px] font-semibold text-[#00A897] transition hover:bg-[#275B66] hover:text-white lm:border-[#00A897]/30 lm:hover:bg-[#00A897]/10"
                        >
                            ✕ Reset
                        </button>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    <div>
                        <label className={labelCls}>Title</label>
                        <input className={inputCls} placeholder="Search title…" value={filterTitle}
                            onChange={e => { setFilterTitle(e.target.value); setCurrentPage(1) }} />
                    </div>
                    <div>
                        <label className={labelCls}>Severity</label>
                        <select className={inputCls} value={filterSeverity} onChange={e => { setFilterSeverity(e.target.value); setCurrentPage(1) }}>
                            <option value="">All severities</option>
                            <option value="4">Critical</option>
                            <option value="3">High</option>
                            <option value="2">Medium</option>
                            <option value="1">Low</option>
                            <option value="0">Info</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Status</label>
                        <select className={inputCls} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}>
                            <option value="">All statuses</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Source</label>
                        <select className={inputCls} value={filterSource} onChange={e => { setFilterSource(e.target.value); setCurrentPage(1) }}>
                            <option value="">All sources</option>
                            <option value="wazuh">Wazuh</option>
                            <option value="manual">Manual</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Agent Name</label>
                        <input className={inputCls} placeholder="Search agent…" value={filterAgent}
                            onChange={e => { setFilterAgent(e.target.value); setCurrentPage(1) }} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Time range — from / to</label>
                        <div className="flex gap-2">
                            <input type="date" className={inputCls} value={filterTimeFrom}
                                onChange={e => { setFilterTimeFrom(e.target.value); setCurrentPage(1) }} />
                            <input type="date" className={inputCls} value={filterTimeTo}
                                onChange={e => { setFilterTimeTo(e.target.value); setCurrentPage(1) }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Count row + page size ── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500 lm:text-slate-400">
                    {loading ? 'Loading…' : (
                        filtered.length === 0 ? 'No results'
                            : `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, filtered.length)} of ${filtered.length} incident${filtered.length !== 1 ? 's' : ''}`
                    )}
                </p>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 lm:text-slate-400">Rows:</label>
                    <select
                        className="rounded-lg border border-[#1c2b2f] bg-[#0a1215] px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#00A897]/40 lm:bg-white lm:border-slate-200 lm:text-slate-700"
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
                <div className="rounded-xl border border-[#1c2b2f] lm:border-slate-200 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-4 border-b border-[#1c2b2f] lm:border-slate-100 px-4 py-3 animate-pulse">
                            <div className="h-3 w-1/3 rounded bg-white/5 lm:bg-slate-100" />
                            <div className="h-3 w-16 rounded bg-white/5 lm:bg-slate-100" />
                            <div className="h-3 w-20 rounded bg-white/5 lm:bg-slate-100" />
                        </div>
                    ))}
                </div>
            )}

            {/* ── Empty ── */}
            {!loading && !error && filtered.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-[#1c2b2f] lm:border-slate-200 bg-black/40 lm:bg-white py-16 text-center">
                    <p className="text-sm text-slate-500">No incidents match your filters.</p>
                    {hasActiveFilters && (
                        <button onClick={resetFilters} className="text-xs text-[#00A897] hover:underline">
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* ── Table ── */}
            {!loading && filtered.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-[#1c2b2f] lm:border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[960px] text-sm">
                            <thead>
                                <tr className="bg-[#080f12] lm:bg-slate-50 text-[10px] font-semibold uppercase tracking-widest text-slate-500 lm:text-slate-400">
                                    <th className="px-4 py-3 text-left">Title</th>
                                    <th className="px-4 py-3 text-left">Severity</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Source</th>
                                    <th className="px-4 py-3 text-left">Agent</th>
                                    <th className="px-4 py-3 text-left">Timestamp</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#0e1a1e] lm:divide-slate-100">
                                {paginatedRows.map(incident => {
                                    const sevNum = incident.severity ?? 0
                                    return (
                                        <tr
                                            key={incident._id}
                                            className="bg-black/40 lm:bg-white transition-colors hover:bg-[#0e1e24] lm:hover:bg-slate-50 group"
                                        >
                                            <td className="px-4 py-3 max-w-[240px]">
                                                <span
                                                    className="block truncate font-medium text-slate-200 lm:text-slate-800 group-hover:text-white lm:group-hover:text-slate-900 transition-colors"
                                                    title={incident.title}
                                                >
                                                    {incident.title}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEVERITY_BADGES[sevNum] ?? SEVERITY_BADGES[0]}`}>
                                                    {SEVERITY_LABELS[sevNum] ?? sevNum}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGES[incident.status] ?? ''}`}>
                                                    {STATUS_LABELS[incident.status] ?? incident.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                                                    incident.source === 'wazuh'
                                                        ? 'bg-[#00A897]/10 text-[#00A897] border-[#00A897]/30'
                                                        : 'bg-slate-700/40 text-slate-400 border-slate-600/30 lm:bg-slate-100 lm:text-slate-500 lm:border-slate-200'
                                                }`}>
                                                    {incident.source}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-slate-400 lm:text-slate-500">{incident.agent_name ?? '—'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 lm:text-slate-400">{fmt(incident.timestamp)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Details */}
                                                    {(isAdmin || can('VIEW_INCIDENT_DETAILS')) && (
                                                        <button
                                                            onClick={() => handleViewDetails(incident._id)}
                                                            className="rounded-md border border-[#275B66] px-2.5 py-1 text-[11px] font-semibold text-[#00A897] transition hover:bg-[#275B66] hover:text-white lm:border-[#00A897]/30 lm:hover:bg-[#00A897]/10 lm:hover:text-[#00A897]"
                                                        >
                                                            Details
                                                        </button>
                                                    )}
                                                    {/* Edit */}
                                                    {(isAdmin || can('UPDATE_INCIDENT')) && (
                                                        <button
                                                            onClick={() => navigate(`/incidents/edit/${incident._id}`)}
                                                            className="rounded-md bg-[#00A897]/10 border border-[#00A897]/30 px-2.5 py-1 text-[11px] font-semibold text-[#00A897] transition hover:bg-[#00A897] hover:text-black"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {/* Delete */}
                                                    {(isAdmin || can('DELETE_INCIDENT')) && (
                                                        <button
                                                            onClick={() => setDeleteTarget({ id: incident._id, title: incident.title })}
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
            {!loading && filtered.length > pageSize && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                        className="rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:border-[#275B66] hover:text-[#00A897] transition lm:border-slate-200 lm:text-slate-500">«</button>
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                        className="rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:border-[#275B66] hover:text-[#00A897] transition lm:border-slate-200 lm:text-slate-500">Previous</button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 3)
                        if (page > totalPages) return null
                        return (
                            <button key={page} onClick={() => setCurrentPage(page)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                    page === currentPage
                                        ? 'border-[#00A897] bg-[#00A897]/10 text-[#00A897]'
                                        : 'border-[#1c2b2f] text-slate-400 hover:border-[#275B66] hover:text-[#00A897] lm:border-slate-200 lm:text-slate-500'
                                }`}>
                                {page}
                            </button>
                        )
                    })}

                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
                        className="rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:border-[#275B66] hover:text-[#00A897] transition lm:border-slate-200 lm:text-slate-500">Next</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                        className="rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:border-[#275B66] hover:text-[#00A897] transition lm:border-slate-200 lm:text-slate-500">»</button>
                </div>
            )}

            {/* ── Modals ── */}
            {(detailLoading || selectedIncident) && (
                <DetailIncident
                    selectedIncident={selectedIncident}
                    detailLoading={detailLoading}
                    onClose={() => setSelectedIncident(null)}
                />
            )}

            {deleteTarget && (
                <DeleteModal
                    type="incident"
                    name={deleteTarget.title}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    )
}

export default Incidents