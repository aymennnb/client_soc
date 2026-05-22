import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/useAuth'
import api from '../api'
import DetailIncident from './Detailsincident'
import DeleteModal from '../componants/DeleteModal'
import Editincident from './Editincident'
import Addincident from './Addincident'

import {
    SEVERITY_LABELS, SEVERITY_BADGES,
    STATUS_BADGES, STATUS_LABELS, fmt,
} from './incidentConstants'
import {
    Plus, RefreshCcw, SlidersHorizontal, X,
    ChevronLeft, ChevronRight, Siren,
    Ticket, Pencil, Trash2
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
        const mq  = window.matchMedia('(prefers-color-scheme: light)')
        const mqh = (e) => { if (!document.documentElement.getAttribute('data-theme')) setIsDark(!e.matches) }
        mq.addEventListener('change', mqh)
        return () => { mo.disconnect(); mq.removeEventListener('change', mqh) }
    }, [])
    return isDark
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const tokens = (isDark) => {
    const d = isDark
    return {
        bgPage:          d ? '#0d1b2a'                    : '#f8fafc',
        bgCard:          d ? 'rgba(13,27,42,0.7)'         : 'rgba(255,255,255,0.97)',
        bgCardHover:     d ? 'rgba(2,128,144,0.06)'       : 'rgba(2,128,144,0.04)',
        bgSubtle:        d ? 'rgba(27,38,59,0.4)'         : 'rgba(241,245,249,0.8)',
        bgThead:         d ? 'rgba(6,14,22,0.8)'          : 'rgba(248,250,252,0.95)',
        bgInput:         d ? 'rgba(10,18,21,0.8)'         : '#ffffff',
        bgAction:        d ? 'rgba(2,128,144,0.1)'        : 'rgba(2,128,144,0.07)',
        bgActionHover:   d ? 'rgba(2,128,144,0.18)'       : 'rgba(2,128,144,0.13)',
        bgDanger:        d ? 'rgba(239,68,68,0.08)'       : 'rgba(220,38,38,0.06)',
        bgDangerHover:   d ? 'rgba(239,68,68,0.14)'       : 'rgba(220,38,38,0.1)',
        bgSkeleton:      d ? 'rgba(27,38,59,0.8)'         : 'rgba(203,213,225,0.6)',
        bgRowSep:        d ? 'rgba(27,38,59,0.6)'         : 'rgba(226,232,240,0.8)',
        bgBtnDefault:    d ? 'rgba(27,38,59,0.4)'         : 'rgba(241,245,249,0.9)',
        bgModal:         d ? 'rgba(10,18,28,0.98)'        : 'rgba(255,255,255,0.99)',
        bgModalFooter:   d ? 'rgba(6,14,22,0.4)'          : 'rgba(248,250,252,0.9)',
        bgFilterActive:  d ? 'rgba(2,195,154,0.12)'       : 'rgba(2,128,144,0.09)',
        bgSuccessMsg:    d ? 'rgba(34,197,94,0.08)'       : 'rgba(22,163,74,0.07)',
        bgErrorMsg:      d ? 'rgba(239,68,68,0.08)'       : 'rgba(220,38,38,0.06)',

        border:          d ? '#1b263b'                    : '#e2e8f0',
        borderSubtle:    d ? 'rgba(27,38,59,0.6)'         : 'rgba(226,232,240,0.9)',
        borderInput:     d ? '#1b263b'                    : '#cbd5e1',
        borderAction:    d ? 'rgba(2,128,144,0.25)'       : 'rgba(2,128,144,0.3)',
        borderDanger:    d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderSuccess:   d ? 'rgba(34,197,94,0.25)'       : 'rgba(22,163,74,0.3)',
        borderError:     d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderModal:     d ? '#1b263b'                    : '#e2e8f0',

        textPrimary:     d ? '#f1f5f9'  : '#0f172a',
        textSecondary:   d ? '#e2e8f0'  : '#1e293b',
        textMuted:       d ? '#94a3b8'  : '#475569',
        textFaint:       d ? '#4a7a8a'  : '#64748b',
        textGhost:       d ? '#2d4a5a'  : '#94a3b8',
        textAction:      d ? '#028090'  : '#0369a1',
        textDanger:      d ? '#f87171'  : '#dc2626',
        textSuccess:     d ? '#4ade80'  : '#16a34a',
        textInput:       d ? '#cbd5e1'  : '#1e293b',
        textPlaceholder: d ? '#2d4a5a'  : '#94a3b8',

        shadowModal:     d ? '0 25px 60px rgba(0,0,0,0.5)' : '0 25px 60px rgba(0,0,0,0.14)',
    }
}

// ─── Badge configs ────────────────────────────────────────────────────────────

const SEV_STYLE = {
    4: { bg: (d) => d ? 'rgba(239,68,68,0.10)'   : 'rgba(220,38,38,0.10)',  text: (d) => d ? '#f87171' : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.25)'   : 'rgba(220,38,38,0.3)'  },
    3: { bg: (d) => d ? 'rgba(249,115,22,0.10)'  : 'rgba(234,88,12,0.10)',  text: (d) => d ? '#fb923c' : '#7c2d12', border: (d) => d ? 'rgba(249,115,22,0.25)'  : 'rgba(234,88,12,0.3)'  },
    2: { bg: (d) => d ? 'rgba(245,158,11,0.10)'  : 'rgba(217,119,6,0.10)',  text: (d) => d ? '#fbbf24' : '#78350f', border: (d) => d ? 'rgba(245,158,11,0.25)'  : 'rgba(217,119,6,0.3)'  },
    1: { bg: (d) => d ? 'rgba(34,197,94,0.10)'   : 'rgba(22,163,74,0.10)',  text: (d) => d ? '#4ade80' : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.25)'   : 'rgba(22,163,74,0.3)'  },
    0: { bg: (d) => d ? 'rgba(100,116,139,0.10)' : 'rgba(100,116,139,0.10)',text: (d) => d ? '#94a3b8' : '#334155', border: (d) => d ? 'rgba(100,116,139,0.25)' : 'rgba(100,116,139,0.3)' },
}

const STAT_STYLE = {
    open:        { bg: (d) => d ? 'rgba(239,68,68,0.10)'   : 'rgba(220,38,38,0.09)',  text: (d) => d ? '#f87171' : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.25)'   : 'rgba(220,38,38,0.28)'  },
    in_progress: { bg: (d) => d ? 'rgba(56,189,248,0.10)'  : 'rgba(14,165,233,0.09)', text: (d) => d ? '#38bdf8' : '#0c4a6e', border: (d) => d ? 'rgba(56,189,248,0.25)'  : 'rgba(14,165,233,0.28)' },
    resolved:    { bg: (d) => d ? 'rgba(34,197,94,0.10)'   : 'rgba(22,163,74,0.09)',  text: (d) => d ? '#4ade80' : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.25)'   : 'rgba(22,163,74,0.28)'  },
    closed:      { bg: (d) => d ? 'rgba(100,116,139,0.10)' : 'rgba(100,116,139,0.09)',text: (d) => d ? '#94a3b8' : '#334155', border: (d) => d ? 'rgba(100,116,139,0.25)' : 'rgba(100,116,139,0.28)'},
}

const SRC_STYLE = {
    wazuh:  { bg: (d) => d ? 'rgba(2,195,154,0.08)'   : 'rgba(5,150,105,0.08)',  text: (d) => d ? '#02c39a' : '#065f46', border: (d) => d ? 'rgba(2,195,154,0.2)'   : 'rgba(5,150,105,0.25)'  },
    manual: { bg: (d) => d ? 'rgba(100,116,139,0.10)' : 'rgba(100,116,139,0.09)',text: (d) => d ? '#94a3b8' : '#334155', border: (d) => d ? 'rgba(100,116,139,0.2)'  : 'rgba(100,116,139,0.28)'},
}

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

// ─── Primitives ───────────────────────────────────────────────────────────────

function Card({ children, className = '', style = {}, tk }) {
    return (
        <div className={`rounded-xl ${className}`}
            style={{ background: tk.bgCard, border: `1px solid ${tk.border}`, ...style }}>
            {children}
        </div>
    )
}

function StatCard({ label, value, tone, tk }) {
    return (
        <Card tk={tk} className="relative overflow-hidden p-5 flex flex-col gap-2">
            <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-10" />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textFaint }}>{label}</span>
            <span className="text-2xl font-bold tabular-nums" style={{ color: tone }}>{value ?? '—'}</span>
        </Card>
    )
}

function Skeleton({ rows = 4, tk }) {
    return (
        <div className="space-y-px">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 animate-pulse"
                    style={{ borderBottom: `1px solid ${tk.borderSubtle}` }}>
                    <div className="h-3 w-1/3 rounded-md" style={{ background: tk.bgSkeleton }} />
                    <div className="h-3 w-16 rounded-md"  style={{ background: tk.bgSkeleton }} />
                    <div className="h-3 w-20 rounded-md"  style={{ background: tk.bgSkeleton }} />
                </div>
            ))}
        </div>
    )
}

function PaginationBar({ currentPage, totalPages, onPage, tk }) {
    if (totalPages <= 1) return null
    const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const p = i + Math.max(1, currentPage - 3)
        return p <= totalPages ? p : null
    }).filter(Boolean)
    const base     = 'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150'
    const inactive = { background: 'transparent',          border: `1px solid ${tk.border}`,       color: tk.textFaint }
    const active   = { background: 'rgba(2,195,154,0.10)', border: '1px solid rgba(2,195,154,0.3)', color: '#02c39a'   }
    const dis      = { opacity: 0.3, cursor: 'not-allowed' }
    const hov      = { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' }
    return (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button onClick={() => onPage(1)} disabled={currentPage === 1} className={base}
                style={{ ...inactive, ...(currentPage === 1 ? dis : {}) }}
                onMouseEnter={e => currentPage !== 1 && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== 1 && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronLeft size={12} className="inline" /><ChevronLeft size={12} className="inline -ml-1.5" />
            </button>
            <button onClick={() => onPage(currentPage - 1)} disabled={currentPage === 1} className={base}
                style={{ ...inactive, ...(currentPage === 1 ? dis : {}) }}
                onMouseEnter={e => currentPage !== 1 && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== 1 && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronLeft size={12} className="inline" /> Prev
            </button>
            {pages.map(p => (
                <button key={p} onClick={() => onPage(p)} className={base}
                    style={p === currentPage ? active : inactive}
                    onMouseEnter={e => p !== currentPage && Object.assign(e.currentTarget.style, hov)}
                    onMouseLeave={e => p !== currentPage && Object.assign(e.currentTarget.style, inactive)}>
                    {p}
                </button>
            ))}
            <button onClick={() => onPage(currentPage + 1)} disabled={currentPage === totalPages} className={base}
                style={{ ...inactive, ...(currentPage === totalPages ? dis : {}) }}
                onMouseEnter={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, inactive)}>
                Next <ChevronRight size={12} className="inline" />
            </button>
            <button onClick={() => onPage(totalPages)} disabled={currentPage === totalPages} className={base}
                style={{ ...inactive, ...(currentPage === totalPages ? dis : {}) }}
                onMouseEnter={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronRight size={12} className="inline" /><ChevronRight size={12} className="inline -ml-1.5" />
            </button>
        </div>
    )
}

function InlineBadge({ label, cfg, isDark }) {
    const bg     = typeof cfg?.bg     === 'function' ? cfg.bg(isDark)     : (cfg?.bg     ?? 'rgba(100,116,139,0.10)')
    const text   = typeof cfg?.text   === 'function' ? cfg.text(isDark)   : (cfg?.text   ?? '#94a3b8')
    const border = typeof cfg?.border === 'function' ? cfg.border(isDark) : (cfg?.border ?? 'rgba(100,116,139,0.25)')
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: bg, color: text, border: `1px solid ${border}` }}>
            {label}
        </span>
    )
}

// ─── Create Ticket Modal ──────────────────────────────────────────────────────
//
// Remplace UserSearchSelect par un select département chargé dynamiquement
// depuis GET /tickets/departments (Keycloak Groups).

const CreateTicketModal = ({ incidentId, incidentTitle, onClose, onCreated, tk, isDark }) => {
    const [form, setForm] = useState({
        incident_id:     incidentId || '',
        name:            '',
        department_id:   '',
        department_name: '',
        priority:        'medium',
        notes:           '',
    })
    const [departments, setDepartments] = useState([])
    const [deptLoading, setDeptLoading] = useState(true)
    const [loading,     setLoading]     = useState(false)
    const [error,       setError]       = useState(null)

    const inputStyle = {
        background:   tk.bgInput,
        border:       `1px solid ${tk.borderInput}`,
        color:        tk.textInput,
        borderRadius: '8px',
        padding:      '8px 12px',
        fontSize:     '13px',
        width:        '100%',
        outline:      'none',
        transition:   'border-color 0.15s',
    }

    const labelStyle = {
        display:       'block',
        fontSize:      '10px',
        fontWeight:    '600',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         tk.textFaint,
        marginBottom:  '6px',
    }

    // Charger les groupes Keycloak comme départements
    useEffect(() => {
        api.get('/tickets/departments')
            .then(r => { setDepartments(r.data.departments || []); setDeptLoading(false) })
            .catch(() => { setError('Failed to load departments.'); setDeptLoading(false) })
    }, [])

    const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleDeptChange = (e) => {
        const id   = e.target.value
        const dept = departments.find(d => d.id === id)
        setForm(f => ({ ...f, department_id: id, department_name: dept?.name || '' }))
    }

    const submit = async () => {
        if (!form.name.trim())   { setError('Please enter a ticket name.'); return }
        if (!form.department_id) { setError('Please select a department.'); return }
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
            <div className="w-full max-w-lg mx-4 overflow-hidden rounded-xl"
                style={{ background: tk.bgModal, border: `1px solid ${tk.borderModal}`, boxShadow: tk.shadowModal }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: `1px solid ${tk.border}` }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ background: tk.bgAction, border: `1px solid ${tk.borderAction}` }}>
                            <Ticket size={13} style={{ color: '#02c39a' }} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold" style={{ color: tk.textPrimary }}>Create Ticket</h2>
                            {incidentTitle && (
                                <p className="text-[11px] mt-0.5 truncate max-w-[280px]" style={{ color: tk.textFaint }}>
                                    {incidentTitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                        style={{ color: tk.textFaint }}
                        onMouseEnter={e => { e.currentTarget.style.background = tk.bgSubtle; e.currentTarget.style.color = tk.textMuted }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tk.textFaint }}>
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="rounded-lg px-4 py-2.5 text-sm"
                            style={{ background: tk.bgErrorMsg, border: `1px solid ${tk.borderError}`, color: tk.textDanger }}>
                            {error}
                        </div>
                    )}

                    {/* Ticket name */}
                    <div>
                        <label style={labelStyle}>Ticket Name *</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handle}
                            placeholder="e.g. Suspicious login attempt…"
                            className="inc-input"
                            style={inputStyle}
                        />
                    </div>

                    {/* Department — chargé dynamiquement depuis Keycloak */}
                    <div>
                        <label style={labelStyle}>Department *</label>
                        <select
                            name="department_id"
                            value={form.department_id}
                            onChange={handleDeptChange}
                            style={{ ...inputStyle, color: deptLoading ? tk.textFaint : tk.textInput }}
                            className="inc-input"
                            disabled={deptLoading}
                        >
                            <option value="">{deptLoading ? 'Loading departments…' : 'Select a department…'}</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label style={labelStyle}>Priority</label>
                        <select name="priority" value={form.priority} onChange={handle}
                            style={inputStyle} className="inc-input">
                            {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={labelStyle}>Notes</label>
                        <textarea name="notes" value={form.notes} onChange={handle} rows={3}
                            placeholder="Optional notes…"
                            style={{ ...inputStyle, resize: 'none' }}
                            className="inc-input" />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4"
                    style={{ borderTop: `1px solid ${tk.border}`, background: tk.bgModalFooter }}>
                    <button onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150"
                        style={{ background: 'transparent', border: `1px solid ${tk.borderAction}`, color: tk.textAction }}
                        onMouseEnter={e => { e.currentTarget.style.background = tk.bgAction }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        Cancel
                    </button>
                    <button onClick={submit} disabled={loading || deptLoading}
                        className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150"
                        style={{ background: '#02c39a', color: '#0d1b2a', opacity: (loading || deptLoading) ? 0.6 : 1 }}
                        onMouseEnter={e => !(loading || deptLoading) && (e.currentTarget.style.background = '#02e0b1')}
                        onMouseLeave={e => !(loading || deptLoading) && (e.currentTarget.style.background = '#02c39a')}>
                        {loading ? 'Creating…' : 'Create Ticket'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

function Incidents() {
    const navigate = useNavigate()
    const { isAdmin } = useAuth()
    const { can, loading: permissionsLoading } = usePermissions()

    const isDark = useTheme()
    const tk     = useMemo(() => tokens(isDark), [isDark])

    const inputStyle = useMemo(() => ({
        background:   tk.bgInput,
        border:       `1px solid ${tk.borderInput}`,
        color:        tk.textInput,
        borderRadius: '8px',
        padding:      '8px 12px',
        fontSize:     '13px',
        width:        '100%',
        outline:      'none',
        transition:   'border-color 0.15s',
    }), [tk])

    const labelStyle = useMemo(() => ({
        display:       'block',
        fontSize:      '10px',
        fontWeight:    '600',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         tk.textFaint,
        marginBottom:  '6px',
    }), [tk])

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

    const [showAddIncident,   setShowAddIncident]   = useState(false)
    const [editingIncidentId, setEditingIncidentId] = useState(null)

    const fetchStats = () => {
        api.get('/incidents/stats').then(r => setStats(r.data)).catch(() => {})
    }
    useEffect(() => { fetchStats() }, [])

    const fetchIncidents = useCallback(async () => {
        setLoading(true); setError('')
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
        try {
            const res = await api.get(`/incidents/${id}`)
            setSelectedIncident(res.data)
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to load details.')
        } finally {
            setDetailLoading(false)
        }
    }

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

    const handleCreateTicket  = (incident) => { setTicketIncident(incident); setShowTicketModal(true) }
    const handleTicketCreated = ()          => { setShowTicketModal(false);   setTicketIncident(null)  }

    const totalOpen     = stats?.byStatus?.find(s => s._id === 'open')?.count ?? 0
    const totalResolved = stats?.byStatus?.find(s => s._id === 'resolved' || s._id === 'closed')?.count ?? 0
    const totalCritical = stats?.bySeverity?.find(s => s._id === 4)?.count ?? 0
    const totalHigh     = stats?.bySeverity?.find(s => s._id === 3)?.count ?? 0
    const totalMedium   = stats?.bySeverity?.find(s => s._id === 2)?.count ?? 0

    if (permissionsLoading) {
        return (
            <div className="space-y-6" style={{ color: tk.textSecondary }}>
                <div className="h-8 w-48 animate-pulse rounded-lg" style={{ background: tk.bgSkeleton }} />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl"
                            style={{ background: tk.bgCard, border: `1px solid ${tk.border}` }} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <style>{`
                @keyframes inc-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
                .inc-page  { animation: inc-fadein 0.35s ease-out both; }
                .inc-input:focus { border-color: rgba(2,195,154,0.5) !important; box-shadow: 0 0 0 3px rgba(2,195,154,0.08) !important; }
                .inc-row:hover { background: var(--inc-row-hover) !important; }
            `}</style>
            <style>{`:root { --inc-row-hover: ${tk.bgCardHover}; }`}</style>

            <div className="inc-page space-y-6" style={{ color: tk.textSecondary }}>

                {/* ── Header ── */}
                <div className="flex flex-wrap items-end justify-between gap-4"
                    style={{ borderBottom: `1px solid ${tk.border}`, paddingBottom: '20px' }}>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight" style={{ color: tk.textPrimary }}>
                            Incident Management
                        </h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: tk.textFaint }}>
                            Monitor, investigate, and resolve security incidents
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(isAdmin || can('SYNC_INCIDENTS')) && (
                            <button onClick={handleSync} disabled={syncing}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                                style={{ background: 'transparent', border: `1px solid ${tk.borderAction}`, color: tk.textAction, opacity: syncing ? 0.6 : 1 }}
                                onMouseEnter={e => !syncing && (e.currentTarget.style.background = tk.bgAction)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                {syncing
                                    ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> Syncing…</>
                                    : <><RefreshCcw size={13} /> Wazuh Sync</>
                                }
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Sync message ── */}
                {syncMsg && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{
                        background: syncMsg.type === 'success' ? tk.bgSuccessMsg : tk.bgErrorMsg,
                        border: `1px solid ${syncMsg.type === 'success' ? tk.borderSuccess : tk.borderError}`,
                        color: syncMsg.type === 'success' ? tk.textSuccess : tk.textDanger,
                    }}>
                        {syncMsg.text}
                    </div>
                )}

                {/* ── Stats ── */}
                {stats && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <StatCard label="Open"     value={totalOpen}     tone="#f59e0b" tk={tk} />
                        <StatCard label="Resolved" value={totalResolved} tone="#22c55e" tk={tk} />
                        <StatCard label="Critical" value={totalCritical} tone="#ef4444" tk={tk} />
                        <StatCard label="High"     value={totalHigh}     tone="#fb923c" tk={tk} />
                        <StatCard label="Medium"   value={totalMedium}   tone="#f59e0b" tk={tk} />
                    </div>
                )}

                {/* ── Filters ── */}
                <Card tk={tk} className="overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
                        onClick={() => setShowFilters(f => !f)}
                        style={{ borderBottom: showFilters ? `1px solid ${tk.border}` : 'none' }}>
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={13} style={{ color: tk.textFaint }} />
                            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: tk.textFaint }}>
                                Filters
                            </span>
                            {hasActiveFilters && (
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    style={{ background: tk.bgFilterActive, color: '#02c39a' }}>
                                    active
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <button onClick={e => { e.stopPropagation(); resetFilters() }}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all"
                                    style={{ background: tk.bgDanger, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger }}
                                    onMouseEnter={e => { e.currentTarget.style.background = tk.bgDangerHover }}
                                    onMouseLeave={e => { e.currentTarget.style.background = tk.bgDanger }}>
                                    <X size={11} /> Reset
                                </button>
                            )}
                            <ChevronRight size={13} style={{ color: tk.textFaint, transform: showFilters ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
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
                    <p className="text-xs" style={{ color: tk.textFaint }}>
                        {loading ? 'Loading…' : (
                            filtered.length === 0 ? 'No results' :
                            `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, filtered.length)} of ${filtered.length} incident${filtered.length !== 1 ? 's' : ''}`
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: tk.textFaint }}>Rows:</span>
                        <select className="rounded-lg px-2 py-1 text-xs"
                            style={{ background: tk.bgInput, border: `1px solid ${tk.border}`, color: tk.textMuted, outline: 'none' }}
                            value={pageSize}
                            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}>
                            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="rounded-xl px-4 py-3 text-sm"
                        style={{ background: tk.bgErrorMsg, border: `1px solid ${tk.borderError}`, color: tk.textDanger }}>
                        {error}
                    </div>
                )}

                {/* ── Loading skeleton ── */}
                {loading && <Card tk={tk}><Skeleton rows={4} tk={tk} /></Card>}

                {/* ── Empty ── */}
                {!loading && !error && filtered.length === 0 && (
                    <Card tk={tk} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ background: tk.bgDanger, border: `1px solid ${tk.borderDanger}` }}>
                                <Siren size={20} style={{ color: tk.textDanger }} />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: tk.textMuted }}>No incidents found</p>
                                <p className="mt-1 text-[11px]" style={{ color: tk.textFaint }}>
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'No incidents match the current view'}
                                </p>
                            </div>
                            {hasActiveFilters && (
                                <button onClick={resetFilters} className="text-xs transition-opacity hover:opacity-70"
                                    style={{ color: '#02c39a' }}>
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </Card>
                )}

                {/* ── Table ── */}
                {!loading && filtered.length > 0 && (
                    <Card tk={tk} className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1080px]" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: tk.bgThead, borderBottom: `1px solid ${tk.border}` }}>
                                        {['Title', 'Severity', 'Status', 'Source', 'Agent', 'Timestamp', 'Actions'].map((h, i) => (
                                            <th key={h}
                                                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                                                style={{ color: tk.textFaint, textAlign: i === 6 ? 'center' : 'left' }}>
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
                                                style={{ background: 'transparent', borderBottom: `1px solid ${tk.borderSubtle}`, transition: 'background 0.15s' }}>

                                                {/* Title */}
                                                <td className="px-4 py-3 max-w-[240px]">
                                                    <span className="block truncate text-sm font-medium" title={incident.title}
                                                        style={{ color: tk.textSecondary }}>
                                                        {incident.title}
                                                    </span>
                                                </td>

                                                {/* Severity */}
                                                <td className="px-4 py-3">
                                                    <InlineBadge
                                                        label={SEVERITY_LABELS[sevNum] ?? sevNum}
                                                        cfg={SEV_STYLE[sevNum] ?? SEV_STYLE[0]}
                                                        isDark={isDark}
                                                    />
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    <InlineBadge
                                                        label={STATUS_LABELS[incident.status] ?? incident.status}
                                                        cfg={STAT_STYLE[incident.status] ?? STAT_STYLE.open}
                                                        isDark={isDark}
                                                    />
                                                </td>

                                                {/* Source */}
                                                <td className="px-4 py-3">
                                                    <InlineBadge
                                                        label={incident.source}
                                                        cfg={SRC_STYLE[incident.source] ?? SRC_STYLE.manual}
                                                        isDark={isDark}
                                                    />
                                                </td>

                                                {/* Agent */}
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-xs" style={{ color: tk.textFaint }}>
                                                        {incident.agent_name ?? '—'}
                                                    </span>
                                                </td>

                                                {/* Timestamp */}
                                                <td className="px-4 py-3">
                                                    <span className="text-xs" style={{ color: tk.textFaint }}>
                                                        {fmt(incident.timestamp)}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {(isAdmin || can('CREATE_TICKET')) && (
                                                            <button title="Create Ticket"
                                                                onClick={() => handleCreateTicket(incident)}
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150"
                                                                style={{ background: tk.bgBtnDefault, border: `1px solid ${tk.border}`, color: tk.textMuted }}
                                                                onMouseEnter={e => Object.assign(e.currentTarget.style, { background: tk.bgAction, border: `1px solid ${tk.borderAction}`, color: '#02c39a' })}
                                                                onMouseLeave={e => Object.assign(e.currentTarget.style, { background: tk.bgBtnDefault, border: `1px solid ${tk.border}`, color: tk.textMuted })}>
                                                                <Ticket size={13} />
                                                            </button>
                                                        )}
                                                        {(isAdmin || can('UPDATE_INCIDENT')) && (
                                                            <button title="Edit"
                                                                onClick={() => setEditingIncidentId(incident._id)}
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150"
                                                                style={{ background: tk.bgBtnDefault, border: `1px solid ${tk.border}`, color: tk.textMuted }}
                                                                onMouseEnter={e => Object.assign(e.currentTarget.style, { background: tk.bgAction, border: `1px solid ${tk.borderAction}`, color: '#02c39a' })}
                                                                onMouseLeave={e => Object.assign(e.currentTarget.style, { background: tk.bgBtnDefault, border: `1px solid ${tk.border}`, color: tk.textMuted })}>
                                                                <Pencil size={13} />
                                                            </button>
                                                        )}
                                                        {(isAdmin || can('DELETE_INCIDENT')) && (
                                                            <button title="Delete"
                                                                onClick={() => setDeleteTarget({ id: incident._id, title: incident.title })}
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150"
                                                                style={{ background: tk.bgDanger, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger }}
                                                                onMouseEnter={e => Object.assign(e.currentTarget.style, { background: tk.bgDangerHover, border: `1px solid rgba(239,68,68,0.35)`, color: isDark ? '#fca5a5' : '#b91c1c' })}
                                                                onMouseLeave={e => Object.assign(e.currentTarget.style, { background: tk.bgDanger, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger })}>
                                                                <Trash2 size={13} />
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

                {/* ── Pagination ── */}
                {!loading && filtered.length > pageSize && (
                    <PaginationBar currentPage={currentPage} totalPages={totalPages} onPage={setCurrentPage} tk={tk} />
                )}

                {/* ── Sub-components ── */}
                {showAddIncident && (
                    <Addincident onClose={() => setShowAddIncident(false)} onSaved={() => fetchIncidents()} />
                )}

                {editingIncidentId && (
                    <Editincident
                        incidentId={editingIncidentId}
                        onClose={() => setEditingIncidentId(null)}
                        onSaved={() => fetchIncidents()}
                    />
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
                        onClose={handleTicketCreated}
                        onCreated={handleTicketCreated}
                        tk={tk}
                        isDark={isDark}
                    />
                )}
            </div>
        </>
    )
}

export default Incidents