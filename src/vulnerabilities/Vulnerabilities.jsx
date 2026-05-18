import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/useAuth'
import api from '../api'
import DetailVulnerability from './DetailVulnerability'
import EditVulnerability from './EditVulnerability'
import DeleteModal from '../componants/DeleteModal'
import AddVulnerability from './AddVulnerability'

import {
    Plus, RefreshCcw, Search, SlidersHorizontal, X,
    Eye, Pencil, Trash2, ShieldAlert, ChevronLeft, ChevronRight,
    ArrowUpRight,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_LABELS = { 0: 'Info', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

const SEVERITY_CONFIG = {
    Info:     { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
    Low:      { bg: 'rgba(34,197,94,0.10)',   text: '#4ade80', border: 'rgba(34,197,94,0.25)'   },
    Medium:   { bg: 'rgba(245,158,11,0.10)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)'  },
    High:     { bg: 'rgba(249,115,22,0.10)',  text: '#fb923c', border: 'rgba(249,115,22,0.25)'  },
    Critical: { bg: 'rgba(239,68,68,0.10)',   text: '#f87171', border: 'rgba(239,68,68,0.25)'   },
}

const STATUS_CONFIG = {
    open:        { bg: 'rgba(239,68,68,0.10)',   text: '#f87171', border: 'rgba(239,68,68,0.25)'   },
    resolved:    { bg: 'rgba(34,197,94,0.10)',   text: '#4ade80', border: 'rgba(34,197,94,0.25)'   },
    in_progress: { bg: 'rgba(56,189,248,0.10)',  text: '#38bdf8', border: 'rgba(56,189,248,0.25)'  },
    ignored:     { bg: 'rgba(100,116,139,0.10)', text: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

const fmt = (dateStr) => {
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return '—' }
}

const getCvss = (vuln) => {
    const candidates = [vuln.cvss_base_score, vuln.cvss3_base_score, vuln.cvss_score, vuln.cvss, vuln.cvss_v3, vuln.cvss_v2, vuln.cvss_base, vuln.base_score]
    const value = candidates.find(v => v !== null && v !== undefined && v !== '')
    if (value === undefined) return null
    const num = Number(value)
    return Number.isNaN(num) ? value : num
}

const getSource = (vuln) => (
    vuln.source ?? vuln.detection_source ?? vuln.scanner ?? vuln.plugin_family ?? vuln.plugin_name ?? vuln.product ?? vuln.vendor ?? '—'
)

const getAsset = (vuln) => vuln.host ?? vuln.asset ?? '—'

// ─── Design primitives ────────────────────────────────────────────────────────

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

function Badge({ label, config }) {
    const cfg = config ?? { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', border: 'rgba(100,116,139,0.25)' }
    return (
        <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
        >
            {label}
        </span>
    )
}

function FilterChip({ label, onRemove }) {
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: 'rgba(2,128,144,0.08)', border: '1px solid rgba(2,128,144,0.2)', color: '#028090' }}
        >
            {label}
            <button onClick={onRemove} className="ml-0.5 transition-opacity hover:opacity-70">
                <X size={11} />
            </button>
        </span>
    )
}

function ActionBtn({ title, onClick, children, variant = 'default' }) {
    const base = 'flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150'
    const variants = {
        default: { style: { background: 'rgba(27,38,59,0.4)', border: '1px solid #1b263b', color: '#94a3b8' }, hover: { background: 'rgba(2,128,144,0.12)', border: '1px solid rgba(2,128,144,0.3)', color: '#02c39a' } },
        danger:  { style: { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }, hover: { background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' } },
    }
    const v = variants[variant] ?? variants.default
    return (
        <button
            title={title}
            onClick={onClick}
            className={base}
            style={v.style}
            onMouseEnter={e => Object.assign(e.currentTarget.style, v.hover)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, v.style)}
        >
            {children}
        </button>
    )
}

function StatTile({ label, value, tone, sub }) {
    return (
        <Card className="p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#4a7a8a' }}>{label}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: tone ?? '#f1f5f9' }}>{value ?? '—'}</p>
            {sub && <p className="text-[10px]" style={{ color: '#2d4a5a' }}>{sub}</p>}
        </Card>
    )
}

function Skeleton({ rows = 5 }) {
    return (
        <div className="space-y-px">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 animate-pulse" style={{ borderBottom: '1px solid #1b263b' }}>
                    <div className="h-3 w-1/3 rounded-md" style={{ background: 'rgba(27,38,59,0.8)' }} />
                    <div className="h-3 w-16 rounded-md" style={{ background: 'rgba(27,38,59,0.8)' }} />
                    <div className="h-3 w-24 rounded-md" style={{ background: 'rgba(27,38,59,0.8)' }} />
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

    const btnBase = 'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150'
    const inactive = { background: 'transparent', border: '1px solid #1b263b', color: '#4a7a8a' }
    const active   = { background: 'rgba(2,195,154,0.10)', border: '1px solid rgba(2,195,154,0.3)', color: '#02c39a' }
    const disabled = { opacity: 0.3, cursor: 'not-allowed' }

    return (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button onClick={() => onPage(1)} disabled={currentPage === 1} className={btnBase} style={{ ...inactive, ...(currentPage === 1 ? disabled : {}) }}
                onMouseEnter={e => currentPage !== 1 && Object.assign(e.currentTarget.style, { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' })}
                onMouseLeave={e => currentPage !== 1 && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronLeft size={12} className="inline" />
                <ChevronLeft size={12} className="inline -ml-1.5" />
            </button>
            <button onClick={() => onPage(currentPage - 1)} disabled={currentPage === 1} className={btnBase} style={{ ...inactive, ...(currentPage === 1 ? disabled : {}) }}
                onMouseEnter={e => currentPage !== 1 && Object.assign(e.currentTarget.style, { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' })}
                onMouseLeave={e => currentPage !== 1 && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronLeft size={12} className="inline" /> Prev
            </button>
            {pages.map(p => (
                <button key={p} onClick={() => onPage(p)} className={btnBase} style={p === currentPage ? active : inactive}
                    onMouseEnter={e => p !== currentPage && Object.assign(e.currentTarget.style, { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' })}
                    onMouseLeave={e => p !== currentPage && Object.assign(e.currentTarget.style, inactive)}>
                    {p}
                </button>
            ))}
            <button onClick={() => onPage(currentPage + 1)} disabled={currentPage === totalPages} className={btnBase} style={{ ...inactive, ...(currentPage === totalPages ? disabled : {}) }}
                onMouseEnter={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' })}
                onMouseLeave={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, inactive)}>
                Next <ChevronRight size={12} className="inline" />
            </button>
            <button onClick={() => onPage(totalPages)} disabled={currentPage === totalPages} className={btnBase} style={{ ...inactive, ...(currentPage === totalPages ? disabled : {}) }}
                onMouseEnter={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' })}
                onMouseLeave={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronRight size={12} className="inline" />
                <ChevronRight size={12} className="inline -ml-1.5" />
            </button>
        </div>
    )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function VulnerabilityCard({ vuln, onDetails, onEdit, onDelete, canView, canEdit, canDelete }) {
    const sevLabel = SEVERITY_LABELS[vuln.severity] ?? String(vuln.severity)
    const statusKey = vuln.status?.toLowerCase() ?? 'open'
    const cvss = getCvss(vuln)

    return (
        <Card className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#e2e8f0' }}>{vuln.title}</p>
                    <p className="mt-0.5 text-[11px]" style={{ color: '#4a7a8a' }}>
                        {getAsset(vuln)} · {getSource(vuln)}
                    </p>
                </div>
                <Badge label={sevLabel} config={SEVERITY_CONFIG[sevLabel]} />
            </div>
            <div className="flex items-center justify-between" style={{ borderTop: '1px solid #1b263b', paddingTop: '10px' }}>
                <div className="flex items-center gap-3">
                    <span className="text-[11px]" style={{ color: '#4a7a8a' }}>CVSS: <span style={{ color: '#94a3b8' }}>{cvss ?? '—'}</span></span>
                    <span className="text-[11px]" style={{ color: '#4a7a8a' }}>{fmt(vuln.first_seen)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Badge label={vuln.status ?? 'open'} config={STATUS_CONFIG[statusKey]} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                {canView   && <ActionBtn title="Details" onClick={() => onDetails(vuln._id)}><Eye size={14} /></ActionBtn>}
                {canEdit   && <ActionBtn title="Edit"    onClick={() => onEdit(vuln._id)}><Pencil size={14} /></ActionBtn>}
                {canDelete && <ActionBtn title="Delete"  variant="danger" onClick={() => onDelete(vuln)}><Trash2 size={14} /></ActionBtn>}
            </div>
        </Card>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Vulnerabilities() {
    const navigate = useNavigate()
    const { isAdmin } = useAuth()
    const { can, loading: permissionsLoading } = usePermissions()

    const [vulnerabilities, setVulnerabilities] = useState([])
    const [stats,      setStats]      = useState(null)
    const [hosts,      setHosts]      = useState([])
    const [sources,    setSources]    = useState([])
    const [loading,    setLoading]    = useState(true)
    const [error,      setError]      = useState('')
    const [syncing,    setSyncing]    = useState(false)

    const [filterStatus,        setFilterStatus]        = useState('')
    const [filterSeverity,      setFilterSeverity]      = useState('')
    const [filterHost,          setFilterHost]          = useState('')
    const [filterTitle,         setFilterTitle]         = useState('')
    const [filterDuration,      setFilterDuration]      = useState('')
    const [filterFirstSeenFrom, setFilterFirstSeenFrom] = useState('')
    const [filterFirstSeenTo,   setFilterFirstSeenTo]   = useState('')
    const [filterLastSeenFrom,  setFilterLastSeenFrom]  = useState('')
    const [filterLastSeenTo,    setFilterLastSeenTo]    = useState('')
    const [filterSource,        setFilterSource]        = useState('')
    const [filterCvssMin,       setFilterCvssMin]       = useState('')
    const [filterCvssMax,       setFilterCvssMax]       = useState('')
    const [showFilters,         setShowFilters]         = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize,    setPageSize]    = useState(5)

    const [selectedVuln,  setSelectedVuln]  = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [deleteTarget,  setDeleteTarget]  = useState(null)

    const [showAddVuln, setShowAddVuln] = useState(false)

    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        api.get('/vulnerabilities/stats').then(r => setStats(r.data)).catch(() => {})
    }, [])

    const fetchVulnerabilities = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const params = {}
            if (filterStatus)        params.status            = filterStatus
            if (filterSeverity)      params.severity          = filterSeverity
            if (filterHost)          params.host              = filterHost
            if (filterTitle)         params.title             = filterTitle
            if (filterDuration)      params.min_duration_days = filterDuration
            if (filterFirstSeenFrom) params.first_seen_from   = filterFirstSeenFrom
            if (filterFirstSeenTo)   params.first_seen_to     = filterFirstSeenTo
            if (filterLastSeenFrom)  params.last_seen_from    = filterLastSeenFrom
            if (filterLastSeenTo)    params.last_seen_to      = filterLastSeenTo

            const res  = await api.get('/vulnerabilities', { params })
            const list = res.data.vulnerabilities || []
            setVulnerabilities(list)
            setCurrentPage(1)
            if (!filterHost)   setHosts([...new Set(list.map(v => v.host).filter(Boolean))])
            if (!filterSource) setSources([...new Set(list.map(v => getSource(v)).filter(s => s && s !== '—'))])
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load vulnerabilities.')
        } finally {
            setLoading(false)
        }
    }, [filterStatus, filterSeverity, filterHost, filterTitle, filterDuration, filterFirstSeenFrom, filterFirstSeenTo, filterLastSeenFrom, filterLastSeenTo, filterSource])

    useEffect(() => { fetchVulnerabilities() }, [fetchVulnerabilities])

    const filteredVulns = useMemo(() => vulnerabilities.filter(vuln => {
        const source = getSource(vuln)
        const cvss   = getCvss(vuln)
        if (filterSource  && source !== filterSource)                              return false
        if (filterCvssMin && (cvss == null || Number(cvss) < Number(filterCvssMin))) return false
        if (filterCvssMax && (cvss == null || Number(cvss) > Number(filterCvssMax))) return false
        return true
    }), [vulnerabilities, filterSource, filterCvssMin, filterCvssMax])

    const totalPages    = Math.max(1, Math.ceil(filteredVulns.length / pageSize))
    const startIndex    = (currentPage - 1) * pageSize
    const paginatedVulns = filteredVulns.slice(startIndex, startIndex + pageSize)

    const hasActiveFilters = filterTitle || filterDuration || filterStatus || filterSeverity ||
        filterHost || filterFirstSeenFrom || filterFirstSeenTo ||
        filterLastSeenFrom || filterLastSeenTo || filterSource || filterCvssMin || filterCvssMax

    const resetFilters = () => {
        setFilterTitle(''); setFilterDuration(''); setFilterStatus(''); setFilterSeverity('')
        setFilterHost(''); setFilterFirstSeenFrom(''); setFilterFirstSeenTo('')
        setFilterLastSeenFrom(''); setFilterLastSeenTo(''); setFilterSource('')
        setFilterCvssMin(''); setFilterCvssMax(''); setCurrentPage(1)
    }

    const handleDelete = async (id) => {
        try { await api.delete(`/vulnerabilities/${id}`); fetchVulnerabilities() }
        catch (err) { alert(err.response?.data?.message || 'Delete failed.') }
    }

    const handleViewDetails = async (id) => {
        setDetailLoading(true); setSelectedVuln(null)
        try { const res = await api.get(`/vulnerabilities/${id}`); setSelectedVuln(res.data) }
        catch (err) { alert(err.response?.data?.message || 'Failed to load details.') }
        finally { setDetailLoading(false) }
    }

    const totalOpen     = stats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const totalResolved = stats?.byStatus?.find(s => s._id === 'resolved')?.count ?? 0
    const totalCritical = stats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const totalHigh     = stats?.bySeverity?.find(s => s._id === 3)?.count ?? 0
    const totalMedium     = stats?.bySeverity?.find(s => s._id === 2)?.count ?? 0

    const canViewDetails = isAdmin || can('VIEW_VULNERABILITY_DETAILS')
    const canEdit        = isAdmin || can('UPDATE_VULNERABILITY')
    const canDelete      = isAdmin || can('DELETE_VULNERABILITY')

    const activeFilterChips = [
        filterTitle      && { label: `Search: ${filterTitle}`,                         clear: () => setFilterTitle('') },
        filterSeverity   && { label: `Severity: ${SEVERITY_LABELS[Number(filterSeverity)]}`, clear: () => setFilterSeverity('') },
        filterStatus     && { label: `Status: ${filterStatus}`,                        clear: () => setFilterStatus('') },
        filterHost       && { label: `Asset: ${filterHost}`,                           clear: () => setFilterHost('') },
        filterSource     && { label: `Source: ${filterSource}`,                        clear: () => setFilterSource('') },
        filterCvssMin    && { label: `CVSS ≥ ${filterCvssMin}`,                        clear: () => setFilterCvssMin('') },
        filterCvssMax    && { label: `CVSS ≤ ${filterCvssMax}`,                        clear: () => setFilterCvssMax('') },
        filterFirstSeenFrom && { label: `First seen from: ${filterFirstSeenFrom}`,     clear: () => setFilterFirstSeenFrom('') },
        filterFirstSeenTo   && { label: `First seen to: ${filterFirstSeenTo}`,         clear: () => setFilterFirstSeenTo('') },
        filterLastSeenFrom  && { label: `Last seen from: ${filterLastSeenFrom}`,        clear: () => setFilterLastSeenFrom('') },
        filterLastSeenTo    && { label: `Last seen to: ${filterLastSeenTo}`,            clear: () => setFilterLastSeenTo('') },
    ].filter(Boolean)

    const inputCls = {
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

    if (permissionsLoading) {
        return (
            <div className="space-y-6" style={{ color: '#e2e8f0' }}>
                <div className="h-8 w-56 animate-pulse rounded-lg" style={{ background: 'rgba(27,38,59,0.5)' }} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-xl" style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid #1b263b' }} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <style>{`
                @keyframes vuln-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
                .vuln-page { animation: vuln-fadein 0.35s ease-out both; }
                .vuln-input:focus { border-color: rgba(2,195,154,0.5) !important; box-shadow: 0 0 0 3px rgba(2,195,154,0.08); }
                .vuln-row:hover { background: rgba(2,128,144,0.06) !important; }
            `}</style>

            <div className="vuln-page space-y-6" style={{ color: '#e2e8f0' }}>

                {/* ── Header ── */}
                <div className="flex flex-wrap items-start justify-between gap-4" style={{ borderBottom: '1px solid #1b263b', paddingBottom: '20px' }}>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight" style={{ color: '#f1f5f9' }}>
                            Vulnerability Management
                        </h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: '#4a7a8a' }}>
                            Track, triage, and remediate security vulnerabilities
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px]"
                            style={{ background: 'rgba(27,38,59,0.6)', border: '1px solid #1b263b', color: '#4a7a8a' }}
                        >
                            <RefreshCcw size={11} className={syncing ? 'animate-spin' : ''} style={{ color: syncing ? '#02c39a' : '#4a7a8a' }} />
                            {syncing ? 'Syncing…' : 'Scanner ready'}
                        </span>
                        {(isAdmin || can('SYNC_VULNERABILITIES')) && (
                            <button
                                onClick={() => { setSyncing(true); navigate('/vulnerabilities/sync') }}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                                style={{ background: 'transparent', border: '1px solid rgba(2,128,144,0.35)', color: '#028090' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(2,128,144,0.1)'; e.currentTarget.style.color = '#02c39a' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#028090' }}
                            >
                                <RefreshCcw size={13} /> Nessus Sync
                            </button>
                        )}
                        {(isAdmin || can('CREATE_VULNERABILITY')) && (
                            <button
                                onClick={() => setShowAddVuln(true)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                                style={{ background: '#02c39a', color: '#0d1b2a' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#02e0b1' }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#02c39a' }}
                            >
                                <Plus size={13} /> Add Vulnerability
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">

                    <StatTile
                        label="Open"
                        value={totalOpen}
                        tone="#facc15"
                    />

                    <StatTile
                        label="Resolved"
                        value={totalResolved}
                        tone="#4ade80"
                    />

                    <StatTile
                        label="Critical"
                        value={totalCritical}
                        tone="red"
                    />

                    <StatTile
                        label="High"
                        value={totalHigh}
                        tone="#fb923c"
                    />

                    <StatTile
                        label="Medium"
                        value={totalMedium}
                        tone="#fbbf24"
                    />

                    <StatTile
                        label="Total"
                        value={(stats?.byStatus ?? []).reduce((a, b) => a + b.count, 0)}
                        tone="#e2e8f0"
                    />

                </div>

                {/* ── Filters ── */}
                <Card className="overflow-hidden">
                    <div
                        className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
                        onClick={() => setShowFilters(f => !f)}
                        style={{ borderBottom: showFilters ? '1px solid #1b263b' : 'none' }}
                    >
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={13} style={{ color: '#4a7a8a' }} />
                            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#4a7a8a' }}>
                                Filters
                            </span>
                            {hasActiveFilters && (
                                <span
                                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    style={{ background: 'rgba(2,195,154,0.12)', color: '#02c39a' }}
                                >
                                    {activeFilterChips.length} active
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <button
                                    onClick={e => { e.stopPropagation(); resetFilters() }}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-150"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                                >
                                    <X size={11} /> Reset
                                </button>
                            )}
                            <ChevronRight size={13} style={{ color: '#4a7a8a', transform: showFilters ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                    </div>

                    {showFilters && (
                        <div className="p-5 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {/* Search */}
                                <label className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(10,18,21,0.8)', border: '1px solid #1b263b' }}>
                                    <Search size={13} style={{ color: '#4a7a8a', flexShrink: 0 }} />
                                    <input
                                        className="vuln-input w-full bg-transparent text-sm placeholder-[#2d4a5a] focus:outline-none"
                                        style={{ color: '#cbd5e1' }}
                                        placeholder="Search title or asset…"
                                        value={filterTitle}
                                        onChange={e => { setFilterTitle(e.target.value); setCurrentPage(1) }}
                                    />
                                </label>

                                {/* Severity */}
                                <select className="vuln-input" style={inputCls}
                                    value={filterSeverity} onChange={e => { setFilterSeverity(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All severities</option>
                                    <option value="4">Critical</option>
                                    <option value="3">High</option>
                                    <option value="2">Medium</option>
                                    <option value="1">Low</option>
                                    <option value="0">Info</option>
                                </select>

                                {/* Status */}
                                <select className="vuln-input" style={inputCls}
                                    value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All statuses</option>
                                    <option value="open">Open</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="ignored">Ignored</option>
                                </select>

                                {/* Asset */}
                                <select className="vuln-input" style={inputCls}
                                    value={filterHost} onChange={e => { setFilterHost(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All assets</option>
                                    {hosts.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>

                                {/* Source */}
                                <select className="vuln-input" style={inputCls}
                                    value={filterSource} onChange={e => { setFilterSource(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All sources</option>
                                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>

                                {/* CVSS range */}
                                <div className="flex items-center gap-2">
                                    <input type="number" min={0} max={10} className="vuln-input" style={inputCls}
                                        placeholder="CVSS min" value={filterCvssMin}
                                        onChange={e => { setFilterCvssMin(e.target.value); setCurrentPage(1) }} />
                                    <input type="number" min={0} max={10} className="vuln-input" style={inputCls}
                                        placeholder="CVSS max" value={filterCvssMax}
                                        onChange={e => { setFilterCvssMax(e.target.value); setCurrentPage(1) }} />
                                </div>

                                {/* First seen */}
                                <div className="flex items-center gap-2">
                                    <input type="date" className="vuln-input" style={inputCls} value={filterFirstSeenFrom}
                                        onChange={e => { setFilterFirstSeenFrom(e.target.value); setCurrentPage(1) }} />
                                    <input type="date" className="vuln-input" style={inputCls} value={filterFirstSeenTo}
                                        onChange={e => { setFilterFirstSeenTo(e.target.value); setCurrentPage(1) }} />
                                </div>

                                {/* Last seen */}
                                <div className="flex items-center gap-2">
                                    <input type="date" className="vuln-input" style={inputCls} value={filterLastSeenFrom}
                                        onChange={e => { setFilterLastSeenFrom(e.target.value); setCurrentPage(1) }} />
                                    <input type="date" className="vuln-input" style={inputCls} value={filterLastSeenTo}
                                        onChange={e => { setFilterLastSeenTo(e.target.value); setCurrentPage(1) }} />
                                </div>
                            </div>

                            {activeFilterChips.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1" style={{ borderTop: '1px solid #1b263b' }}>
                                    {activeFilterChips.map(chip => (
                                        <FilterChip key={chip.label} label={chip.label} onRemove={chip.clear} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* ── Count + page size ── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: '#4a7a8a' }}>
                        {loading ? 'Loading…' : (
                            filteredVulns.length === 0 ? 'No results' :
                            `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, filteredVulns.length)} of ${filteredVulns.length} vulnerabilities`
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#4a7a8a' }}>Rows:</span>
                        <select
                            className="rounded-lg px-2 py-1 text-xs transition-all duration-150"
                            style={{ background: 'rgba(10,18,21,0.8)', border: '1px solid #1b263b', color: '#94a3b8', outline: 'none' }}
                            value={pageSize}
                            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
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

                {/* ── Loading ── */}
                {loading && <Card><Skeleton rows={5} /></Card>}

                {/* ── Empty ── */}
                {!loading && !error && filteredVulns.length === 0 && (
                    <Card className="py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(2,128,144,0.1)', border: '1px solid rgba(2,128,144,0.2)' }}>
                                <ShieldAlert size={20} style={{ color: '#028090' }} />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No vulnerabilities found</p>
                                <p className="mt-1 text-[11px]" style={{ color: '#4a7a8a' }}>
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'Your environment looks clean'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasActiveFilters && (
                                    <button onClick={resetFilters} className="text-xs transition-opacity hover:opacity-70" style={{ color: '#02c39a' }}>
                                        Clear filters
                                    </button>
                                )}
                                {(isAdmin || can('CREATE_VULNERABILITY')) && (
                                    <button onClick={() => navigate('/vulnerabilities/add')} className="text-xs transition-opacity hover:opacity-70" style={{ color: '#4a7a8a' }}>
                                        Create new entry
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* ── Desktop Table ── */}
                {!loading && filteredVulns.length > 0 && (
                    <>
                        <Card className="hidden md:block overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px]" style={{ borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(6,14,22,0.8)', borderBottom: '1px solid #1b263b' }}>
                                            {['Vulnerability', 'Severity', 'CVSS', 'Asset', 'Source', 'Detected', 'Status', 'Actions'].map((h, i) => (
                                                <th
                                                    key={h}
                                                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                                                    style={{ color: '#4a7a8a', textAlign: i === 7 ? 'right' : 'left' }}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedVulns.map(vuln => {
                                            const sevLabel = SEVERITY_LABELS[vuln.severity] ?? String(vuln.severity)
                                            const statusKey = vuln.status?.toLowerCase() ?? 'open'
                                            const cvss = getCvss(vuln)
                                            return (
                                                <tr
                                                    key={vuln._id}
                                                    className="vuln-row"
                                                    style={{ background: 'transparent', borderBottom: '1px solid rgba(27,38,59,0.6)', transition: 'background 0.15s' }}
                                                >
                                                    <td className="px-4 py-3 max-w-[300px]">
                                                        <p className="truncate text-sm font-medium" style={{ color: '#e2e8f0' }}>{vuln.title}</p>
                                                        <p className="text-[11px] mt-0.5" style={{ color: '#4a7a8a' }}>
                                                            {getAsset(vuln)} · {vuln.port ? `Port ${vuln.port}` : 'No port'} · {vuln.duration_days ?? '—'}d
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge label={sevLabel} config={SEVERITY_CONFIG[sevLabel]} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-semibold tabular-nums" style={{ color: '#94a3b8' }}>{cvss ?? '—'}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-mono" style={{ color: '#4a7a8a' }}>{getAsset(vuln)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs" style={{ color: '#4a7a8a' }}>{getSource(vuln)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs" style={{ color: '#4a7a8a' }}>{fmt(vuln.first_seen)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge label={vuln.status ?? 'open'} config={STATUS_CONFIG[statusKey]} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {canViewDetails && <ActionBtn title="Details" onClick={() => handleViewDetails(vuln._id)}><Eye size={13} /></ActionBtn>}
                                                            {canEdit        && <ActionBtn title="Edit"    onClick={() => setEditingId(vuln._id)}><Pencil size={13} /></ActionBtn>}
                                                            {canDelete      && <ActionBtn title="Delete"  variant="danger" onClick={() => setDeleteTarget({ id: vuln._id, name: vuln.title })}><Trash2 size={13} /></ActionBtn>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Mobile cards */}
                        <div className="grid gap-3 md:hidden">
                            {paginatedVulns.map(vuln => (
                                <VulnerabilityCard
                                    key={vuln._id}
                                    vuln={vuln}
                                    onDetails={handleViewDetails}
                                    onEdit={(id) => navigate(`/vulnerabilities/edit/${id}`)}
                                    onDelete={(item) => setDeleteTarget({ id: item._id, name: item.title })}
                                    canView={canViewDetails}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                />
                            ))}
                        </div>
                    </>
                )}


                {showAddVuln && (
                    <AddVulnerability
                        onClose={() => setShowAddVuln(false)}
                        onSaved={() => fetchVulnerabilities()}
                    />
                )}


                {editingId && (
                    <EditVulnerability
                        vulnId={editingId}
                        onClose={() => setEditingId(null)}
                        onSaved={() => fetchVulnerabilities()}
                    />
                )}


                {/* ── Pagination ── */}
                {!loading && filteredVulns.length > pageSize && (
                    <PaginationBar currentPage={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
                )}

                {/* ── Modals ── */}
                {deleteTarget && (
                    <DeleteModal
                        type="vulnerability"
                        name={deleteTarget.name}
                        onConfirm={() => { handleDelete(deleteTarget.id); setDeleteTarget(null) }}
                        onCancel={() => setDeleteTarget(null)}
                    />
                )}

                {detailLoading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(6,14,22,0.7)' }}>
                        <div className="flex items-center gap-3 rounded-xl px-6 py-4" style={{ background: 'rgba(13,27,42,0.95)', border: '1px solid #1b263b' }}>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: '#02c39a' }} />
                            <span className="text-sm" style={{ color: '#94a3b8' }}>Loading details…</span>
                        </div>
                    </div>
                )}

                {selectedVuln && (
                    <DetailVulnerability
                        selectedVuln={selectedVuln}
                        detailLoading={detailLoading}
                        onClose={() => setSelectedVuln(null)}
                    />
                )}
            </div>
        </>
    )
}

export default Vulnerabilities