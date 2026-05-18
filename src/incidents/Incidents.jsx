import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/useAuth'
import api from '../api'
import DetailIncident from './Detailsincident'
import DeleteModal from '../componants/DeleteModal'
import UserSearchSelect from '../componants/UserSearchSelect'
import Editincident from './Editincident'
import Addincident from './Addincident'

import {
    SEVERITY_LABELS, SEVERITY_BADGES,
    STATUS_BADGES, STATUS_LABELS, fmt,
} from './incidentConstants'
import {
    Plus, RefreshCcw, SlidersHorizontal, X,
    ChevronLeft, ChevronRight, Siren, Ticket,
} from 'lucide-react'

// ─── Design primitives ────────────────────────────────────────────────────────

const inputStyle = {
    background: 'rgba(10,18,21,0.8)',
    border: '1px solid #1b263b',
    color: '#cbd5e1',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s',
}

const labelStyle = {
    display: 'block',
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#4a7a8a',
    marginBottom: '6px',
}

function Card({ children, className = '', style = {} }) {
    return (
        <div
            className={`rounded-xl ${className}`}
            style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid #1b263b', ...style }}
        >
            {children}
        </div>
    )
}

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

function StatCard({ label, value, accent, tone, sub }) {
    return (
        <Card className="relative overflow-hidden p-5 flex flex-col gap-2">
            <div
                className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-10"
                style={{ background: accent, filter: 'blur(20px)' }}
            />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#4a7a8a' }}>{label}</span>
            <span className="text-2xl font-bold tabular-nums" style={{ color: tone }}>{value ?? '—'}</span>
            {sub && <span className="text-[10px]" style={{ color: '#2d4a5a' }}>{sub}</span>}
        </Card>
    )
}

function Skeleton({ rows = 4 }) {
    return (
        <div className="space-y-px">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 animate-pulse" style={{ borderBottom: '1px solid rgba(27,38,59,0.6)' }}>
                    <div className="h-3 w-1/3 rounded-md" style={{ background: 'rgba(27,38,59,0.8)' }} />
                    <div className="h-3 w-16 rounded-md" style={{ background: 'rgba(27,38,59,0.8)' }} />
                    <div className="h-3 w-20 rounded-md" style={{ background: 'rgba(27,38,59,0.8)' }} />
                </div>
            ))}
        </div>
    )
}

function PaginationBar({ currentPage, totalPages, onPage }) {
    if (totalPages <= 1) return null
    const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const p = i + Math.max(1, currentPage - 3)
        return p <= totalPages ? p : null
    }).filter(Boolean)

    const base = 'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150'
    const inactive = { background: 'transparent', border: '1px solid #1b263b', color: '#4a7a8a' }
    const active   = { background: 'rgba(2,195,154,0.10)', border: '1px solid rgba(2,195,154,0.3)', color: '#02c39a' }
    const dis      = { opacity: 0.3, cursor: 'not-allowed' }

    return (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button onClick={() => onPage(1)} disabled={currentPage === 1} className={base} style={{ ...inactive, ...(currentPage === 1 ? dis : {}) }}
                onMouseEnter={e => currentPage !== 1 && Object.assign(e.currentTarget.style, { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' })}
                onMouseLeave={e => currentPage !== 1 && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronLeft size={12} className="inline" /><ChevronLeft size={12} className="inline -ml-1.5" />
            </button>
            <button onClick={() => onPage(currentPage - 1)} disabled={currentPage === 1} className={base} style={{ ...inactive, ...(currentPage === 1 ? dis : {}) }}
                onMouseEnter={e => currentPage !== 1 && Object.assign(e.currentTarget.style, { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' })}
                onMouseLeave={e => currentPage !== 1 && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronLeft size={12} className="inline" /> Prev
            </button>
            {pages.map(p => (
                <button key={p} onClick={() => onPage(p)} className={base} style={p === currentPage ? active : inactive}
                    onMouseEnter={e => p !== currentPage && Object.assign(e.currentTarget.style, { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' })}
                    onMouseLeave={e => p !== currentPage && Object.assign(e.currentTarget.style, inactive)}>
                    {p}
                </button>
            ))}
            <button onClick={() => onPage(currentPage + 1)} disabled={currentPage === totalPages} className={base} style={{ ...inactive, ...(currentPage === totalPages ? dis : {}) }}
                onMouseEnter={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' })}
                onMouseLeave={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, inactive)}>
                Next <ChevronRight size={12} className="inline" />
            </button>
            <button onClick={() => onPage(totalPages)} disabled={currentPage === totalPages} className={base} style={{ ...inactive, ...(currentPage === totalPages ? dis : {}) }}
                onMouseEnter={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' })}
                onMouseLeave={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronRight size={12} className="inline" /><ChevronRight size={12} className="inline -ml-1.5" />
            </button>
        </div>
    )
}

// ─── Create Ticket Modal ──────────────────────────────────────────────────────

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }

const CreateTicketModal = ({ incidentId, incidentTitle, users, onClose, onCreated }) => {
    const [form, setForm] = useState({ incident_id: incidentId || '', assigned_to: '', priority: 'medium', notes: '' })
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(null)

    const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const submit = async () => {
        if (!form.assigned_to) { setError('Please assign a user.'); return }
        setLoading(true); setError(null)
        try {
            const { data } = await api.post('/tickets', form)
            onCreated(data.ticket); onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create ticket.')
        } finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="w-full max-w-lg mx-4 overflow-hidden rounded-xl" style={{ background: 'rgba(10,18,28,0.98)', border: '1px solid #1b263b', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>

                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1b263b' }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(2,128,144,0.12)', border: '1px solid rgba(2,128,144,0.25)' }}>
                            <Ticket size={13} style={{ color: '#02c39a' }} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Create Ticket</h2>
                            {incidentTitle && <p className="text-[11px] mt-0.5 truncate max-w-[280px]" style={{ color: '#4a7a8a' }}>{incidentTitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg transition-all" style={{ color: '#4a7a8a' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(27,38,59,0.6)'; e.currentTarget.style.color = '#94a3b8' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a7a8a' }}>
                        <X size={14} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={labelStyle}>Assign to *</label>
                        <UserSearchSelect users={users} value={form.assigned_to} onChange={handle} className="" />
                    </div>

                    <div>
                        <label style={labelStyle}>Priority</label>
                        <select name="priority" value={form.priority} onChange={handle} style={inputStyle} className="inc-input">
                            {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Notes</label>
                        <textarea name="notes" value={form.notes} onChange={handle} rows={3}
                            placeholder="Optional notes…" style={{ ...inputStyle, resize: 'none' }} className="inc-input" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: '1px solid #1b263b', background: 'rgba(6,14,22,0.4)' }}>
                    <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150"
                        style={{ background: 'transparent', border: '1px solid rgba(2,128,144,0.3)', color: '#028090' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(2,128,144,0.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        Cancel
                    </button>
                    <button onClick={submit} disabled={loading} className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150"
                        style={{ background: '#02c39a', color: '#0d1b2a', opacity: loading ? 0.6 : 1 }}
                        onMouseEnter={e => !loading && (e.currentTarget.style.background = '#02e0b1')}
                        onMouseLeave={e => !loading && (e.currentTarget.style.background = '#02c39a')}>
                        {loading ? 'Creating…' : 'Create Ticket'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Severity / Status Badge ──────────────────────────────────────────────────

const SEV_STYLE = {
    4: { bg: 'rgba(239,68,68,0.10)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
    3: { bg: 'rgba(249,115,22,0.10)',  text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
    2: { bg: 'rgba(245,158,11,0.10)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    1: { bg: 'rgba(34,197,94,0.10)',   text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
    0: { bg: 'rgba(100,116,139,0.10)', text: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
}
const STAT_STYLE = {
    open:        { bg: 'rgba(239,68,68,0.10)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
    in_progress: { bg: 'rgba(56,189,248,0.10)',  text: '#38bdf8', border: 'rgba(56,189,248,0.25)' },
    resolved:    { bg: 'rgba(34,197,94,0.10)',   text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
    closed:      { bg: 'rgba(100,116,139,0.10)', text: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
}
const SRC_STYLE = {
    wazuh:  { bg: 'rgba(2,195,154,0.08)',  text: '#02c39a', border: 'rgba(2,195,154,0.2)' },
    manual: { bg: 'rgba(100,116,139,0.10)', text: '#94a3b8', border: 'rgba(100,116,139,0.2)' },
}

function InlineBadge({ label, cfg }) {
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: cfg?.bg, color: cfg?.text, border: `1px solid ${cfg?.border}` }}>
            {label}
        </span>
    )
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

// ─── Main component ───────────────────────────────────────────────────────────

function Incidents() {
    const navigate = useNavigate()
    const { isAdmin } = useAuth()
    const { can, loading: permissionsLoading } = usePermissions()

    const [incidents,        setIncidents]        = useState([])
    const [stats,            setStats]            = useState(null)
    const [loading,          setLoading]          = useState(true)
    const [syncing,          setSyncing]          = useState(false)
    const [error,            setError]            = useState('')
    const [syncMsg,          setSyncMsg]          = useState(null)
    const [selectedIncident, setSelectedIncident] = useState(null)
    const [detailLoading,    setDetailLoading]    = useState(false)
    const [deleteTarget,     setDeleteTarget]     = useState(null)
    const [showTicketModal,  setShowTicketModal]  = useState(false)
    const [ticketIncident,   setTicketIncident]   = useState(null)
    const [users,            setUsers]            = useState([])
    const [showFilters,      setShowFilters]      = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize,    setPageSize]    = useState(5)

    const [filterStatus,   setFilterStatus]   = useState('')
    const [filterSeverity, setFilterSeverity] = useState('')
    const [filterSource,   setFilterSource]   = useState('')
    const [filterAgent,    setFilterAgent]    = useState('')
    const [filterTimeFrom, setFilterTimeFrom] = useState('')
    const [filterTimeTo,   setFilterTimeTo]   = useState('')
    const [filterTitle,    setFilterTitle]    = useState('')


    const [showAddIncident, setShowAddIncident] = useState(false)


    const [editingIncidentId, setEditingIncidentId] = useState(null)

    const fetchStats = () => { api.get('/incidents/stats').then(r => setStats(r.data)).catch(() => {}) }
    useEffect(() => { fetchStats() }, [])

    useEffect(() => {
        api.get('/users').then(r => setUsers(r.data || [])).catch(() => {})
    }, [])

    const fetchIncidents = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const params = {}
            if (filterStatus)   params.status     = filterStatus
            if (filterSeverity !== '') params.severity = filterSeverity
            if (filterSource)   params.source     = filterSource
            if (filterAgent)    params.agent_name = filterAgent
            if (filterTimeFrom) params.time_from  = filterTimeFrom
            if (filterTimeTo)   params.time_to    = filterTimeTo

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

    const filtered = useMemo(() => {
        if (!filterTitle) return incidents
        return incidents.filter(i => i.title?.toLowerCase().includes(filterTitle.toLowerCase()))
    }, [incidents, filterTitle])

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

    const handleViewDetails = async (id) => {
        setDetailLoading(true); setSelectedIncident(null)
        try { const res = await api.get(`/incidents/${id}`); setSelectedIncident(res.data) }
        catch (err) { alert(err.response?.data?.message || 'Failed to load details.') }
        finally { setDetailLoading(false) }
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        try { await api.delete(`/incidents/${deleteTarget.id}`); setDeleteTarget(null); fetchIncidents(); fetchStats() }
        catch (err) { alert(err.response?.data?.message || 'Delete failed.') }
    }

    const handleCreateTicket = (incident) => { setTicketIncident(incident); setShowTicketModal(true) }
    const handleTicketCreated = () => { setShowTicketModal(false); setTicketIncident(null) }

    const totalOpen     = stats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const totalResolved = stats?.byStatus?.find(s => s._id === 'resolved' || s._id === 'closed')?.count ?? 0
    const totalCritical = stats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const totalHigh     = stats?.bySeverity?.find(s => s._id === 3)?.count ?? 0
    const totalMedium     = stats?.bySeverity?.find(s => s._id === 2)?.count ?? 0

    if (permissionsLoading) {
        return (
            <div className="space-y-6" style={{ color: '#e2e8f0' }}>
                <div className="h-8 w-48 animate-pulse rounded-lg" style={{ background: 'rgba(27,38,59,0.5)' }} />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid #1b263b' }} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <style>{`
                @keyframes inc-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
                .inc-page { animation: inc-fadein 0.35s ease-out both; }
                .inc-input:focus { border-color: rgba(2,195,154,0.5) !important; box-shadow: 0 0 0 3px rgba(2,195,154,0.08) !important; }
                .inc-row:hover { background: rgba(2,128,144,0.06) !important; }
            `}</style>

            <div className="inc-page space-y-6" style={{ color: '#e2e8f0' }}>

                {/* ── Header ── */}
                <div className="flex flex-wrap items-end justify-between gap-4" style={{ borderBottom: '1px solid #1b263b', paddingBottom: '20px' }}>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight" style={{ color: '#f1f5f9' }}>Incident Management</h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: '#4a7a8a' }}>Monitor, investigate, and resolve security incidents</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(isAdmin || can('SYNC_INCIDENTS')) && (
                            <button
                                onClick={handleSync} disabled={syncing}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                                style={{ background: 'transparent', border: '1px solid rgba(2,128,144,0.35)', color: '#028090', opacity: syncing ? 0.6 : 1 }}
                                onMouseEnter={e => !syncing && (e.currentTarget.style.background = 'rgba(2,128,144,0.1)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                {syncing
                                    ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />Syncing…</>
                                    : <><RefreshCcw size={13} /> Wazuh Sync</>
                                }
                            </button>
                        )}
                        {(isAdmin || can('CREATE_INCIDENT')) && (
                            <button
                                onClick={() => setShowAddIncident(true)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                                style={{ background: '#02c39a', color: '#0d1b2a' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#02e0b1')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#02c39a')}
                            >
                                <Plus size={13} /> Add Incident
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Sync message ── */}
                {syncMsg && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{
                        background: syncMsg.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${syncMsg.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        color: syncMsg.type === 'success' ? '#4ade80' : '#f87171',
                    }}>
                        {syncMsg.text}
                    </div>
                )}

                {/* ── Stats ── */}
                {stats && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                        <StatCard
                            label="Open"
                            value={totalOpen}
                            tone="#fbbf24"
                        />

                        <StatCard
                            label="Resolved"
                            value={totalResolved}
                            tone="#22c55e"
                        />

                        <StatCard
                            label="Critical"
                            value={totalCritical}
                            tone="red"
                        />

                        <StatCard
                            label="High"
                            value={totalHigh}
                            tone="#fb923c"
                        />

                        <StatCard
                            label="Medium"
                            value={totalMedium}
                            tone="#fbbf24"
                        />

                    </div>
                )}

                {/* ── Filters ── */}
                <Card className="overflow-hidden">
                    <div
                        className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
                        onClick={() => setShowFilters(f => !f)}
                        style={{ borderBottom: showFilters ? '1px solid #1b263b' : 'none' }}
                    >
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={13} style={{ color: '#4a7a8a' }} />
                            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#4a7a8a' }}>Filters</span>
                            {hasActiveFilters && (
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    style={{ background: 'rgba(2,195,154,0.12)', color: '#02c39a' }}>
                                    active
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <button onClick={e => { e.stopPropagation(); resetFilters() }}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}>
                                    <X size={11} /> Reset
                                </button>
                            )}
                            <ChevronRight size={13} style={{ color: '#4a7a8a', transform: showFilters ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                    </div>

                    {showFilters && (
                        <div className="p-5">
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                                <div>
                                    <label style={labelStyle}>Title</label>
                                    <input className="inc-input" style={inputStyle} placeholder="Search title…" value={filterTitle}
                                        onChange={e => { setFilterTitle(e.target.value); setCurrentPage(1) }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Severity</label>
                                    <select className="inc-input" style={inputStyle} value={filterSeverity}
                                        onChange={e => { setFilterSeverity(e.target.value); setCurrentPage(1) }}>
                                        <option value="">All severities</option>
                                        <option value="4">Critical</option>
                                        <option value="3">High</option>
                                        <option value="2">Medium</option>
                                        <option value="1">Low</option>
                                        <option value="0">Info</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Status</label>
                                    <select className="inc-input" style={inputStyle} value={filterStatus}
                                        onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}>
                                        <option value="">All statuses</option>
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Source</label>
                                    <select className="inc-input" style={inputStyle} value={filterSource}
                                        onChange={e => { setFilterSource(e.target.value); setCurrentPage(1) }}>
                                        <option value="">All sources</option>
                                        <option value="wazuh">Wazuh</option>
                                        <option value="manual">Manual</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Agent Name</label>
                                    <input className="inc-input" style={inputStyle} placeholder="Search agent…" value={filterAgent}
                                        onChange={e => { setFilterAgent(e.target.value); setCurrentPage(1) }} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label style={labelStyle}>Time range — from / to</label>
                                    <div className="flex gap-2">
                                        <input type="date" className="inc-input" style={inputStyle} value={filterTimeFrom}
                                            onChange={e => { setFilterTimeFrom(e.target.value); setCurrentPage(1) }} />
                                        <input type="date" className="inc-input" style={inputStyle} value={filterTimeTo}
                                            onChange={e => { setFilterTimeTo(e.target.value); setCurrentPage(1) }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* ── Count + page size ── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: '#4a7a8a' }}>
                        {loading ? 'Loading…' : (
                            filtered.length === 0 ? 'No results' :
                            `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, filtered.length)} of ${filtered.length} incident${filtered.length !== 1 ? 's' : ''}`
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#4a7a8a' }}>Rows:</span>
                        <select
                            className="rounded-lg px-2 py-1 text-xs"
                            style={{ background: 'rgba(10,18,21,0.8)', border: '1px solid #1b263b', color: '#94a3b8', outline: 'none' }}
                            value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                        >
                            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                        {error}
                    </div>
                )}

                {/* ── Loading skeleton ── */}
                {loading && <Card><Skeleton rows={4} /></Card>}

                {/* ── Empty ── */}
                {!loading && !error && filtered.length === 0 && (
                    <Card className="py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <Siren size={20} style={{ color: '#f87171' }} />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No incidents found</p>
                                <p className="mt-1 text-[11px]" style={{ color: '#4a7a8a' }}>
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'No incidents match the current view'}
                                </p>
                            </div>
                            {hasActiveFilters && (
                                <button onClick={resetFilters} className="text-xs transition-opacity hover:opacity-70" style={{ color: '#02c39a' }}>
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </Card>
                )}

                {/* ── Table ── */}
                {!loading && filtered.length > 0 && (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1080px]" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(6,14,22,0.8)', borderBottom: '1px solid #1b263b' }}>
                                        {['Title', 'Severity', 'Status', 'Source', 'Agent', 'Timestamp', 'Actions'].map((h, i) => (
                                            <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                                                style={{ color: '#4a7a8a', textAlign: i === 6 ? 'center' : 'left' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.map(incident => {
                                        const sevNum = incident.severity ?? 0
                                        return (
                                            <tr key={incident._id} className="inc-row"
                                                style={{ background: 'transparent', borderBottom: '1px solid rgba(27,38,59,0.6)', transition: 'background 0.15s' }}>
                                                <td className="px-4 py-3 max-w-[240px]">
                                                    <span className="block truncate text-sm font-medium" title={incident.title}
                                                        style={{ color: '#e2e8f0' }}>
                                                        {incident.title}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <InlineBadge
                                                        label={SEVERITY_LABELS[sevNum] ?? sevNum}
                                                        cfg={SEV_STYLE[sevNum] ?? SEV_STYLE[0]}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <InlineBadge
                                                        label={STATUS_LABELS[incident.status] ?? incident.status}
                                                        cfg={STAT_STYLE[incident.status] ?? STAT_STYLE.open}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <InlineBadge
                                                        label={incident.source}
                                                        cfg={SRC_STYLE[incident.source] ?? SRC_STYLE.manual}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-xs" style={{ color: '#4a7a8a' }}>
                                                        {incident.agent_name ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs" style={{ color: '#4a7a8a' }}>{fmt(incident.timestamp)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {(isAdmin || can('VIEW_INCIDENT_DETAILS')) && (
                                                            <button onClick={() => handleViewDetails(incident._id)}
                                                                className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-150"
                                                                style={{ background: 'rgba(2,128,144,0.08)', border: '1px solid rgba(2,128,144,0.2)', color: '#028090' }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(2,128,144,0.16)'; e.currentTarget.style.color = '#02c39a' }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(2,128,144,0.08)'; e.currentTarget.style.color = '#028090' }}>
                                                                Details
                                                            </button>
                                                        )}
                                                        {(isAdmin || can('CREATE_TICKET')) && (
                                                            <button onClick={() => handleCreateTicket(incident)}
                                                                className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-150"
                                                                style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8' }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.16)' }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.08)' }}>
                                                                Ticket
                                                            </button>
                                                        )}
                                                        {(isAdmin || can('UPDATE_INCIDENT')) && (
                                                            <button onClick={() => setEditingIncidentId(incident._id)}
                                                                className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-150"
                                                                style={{ background: 'rgba(2,195,154,0.08)', border: '1px solid rgba(2,195,154,0.2)', color: '#02c39a' }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(2,195,154,0.16)' }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(2,195,154,0.08)' }}>
                                                                Edit
                                                            </button>
                                                        )}
                                                        {(isAdmin || can('DELETE_INCIDENT')) && (
                                                            <button onClick={() => setDeleteTarget({ id: incident._id, title: incident.title })}
                                                                className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-150"
                                                                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)' }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}>
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
                    </Card>
                )}

                {showAddIncident && (
                    <Addincident
                        onClose={() => setShowAddIncident(false)}
                        onSaved={() => fetchIncidents()}
                    />
                )}

                {editingIncidentId && (
                    <Editincident
                        incidentId={editingIncidentId}
                        onClose={() => setEditingIncidentId(null)}
                        onSaved={() => fetchIncidents()}
                    />
                )}

                {/* ── Pagination ── */}
                {!loading && filtered.length > pageSize && (
                    <PaginationBar currentPage={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
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

                {showTicketModal && ticketIncident && (
                    <CreateTicketModal
                        incidentId={ticketIncident._id}
                        incidentTitle={ticketIncident.title}
                        users={users}
                        onClose={handleTicketCreated}
                        onCreated={handleTicketCreated}
                    />
                )}
            </div>
        </>
    )
}

export default Incidents