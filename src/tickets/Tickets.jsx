import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth }        from '../hooks/useAuth'
import { usePermissions } from '../hooks/useAuth'
import api         from '../api'
import DeleteModal from '../componants/DeleteModal'
import UserSearchSelect from '../componants/UserSearchSelect'
import {
    Plus, SlidersHorizontal, X, ChevronLeft, ChevronRight,StickyNote,
    Ticket, Users, AlertCircle, CheckCircle2, Clock,UserCog, Trash2
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
        bgDanger:        d ? 'rgba(239,68,68,0.08)'       : 'rgba(220,38,38,0.06)',
        bgDangerHover:   d ? 'rgba(239,68,68,0.14)'       : 'rgba(220,38,38,0.1)',
        bgSkeleton:      d ? 'rgba(27,38,59,0.8)'         : 'rgba(203,213,225,0.6)',
        bgBtnDefault:    d ? 'rgba(27,38,59,0.4)'         : 'rgba(241,245,249,0.9)',
        bgFilterActive:  d ? 'rgba(2,195,154,0.12)'       : 'rgba(2,128,144,0.09)',
        bgErrorMsg:      d ? 'rgba(239,68,68,0.08)'       : 'rgba(220,38,38,0.06)',
        bgAction:        d ? 'rgba(2,128,144,0.1)'        : 'rgba(2,128,144,0.07)',
        bgActionHover:   d ? 'rgba(2,128,144,0.18)'       : 'rgba(2,128,144,0.13)',
        bgModalHeader:   d ? 'rgba(10,18,28,0.98)'        : 'rgba(255,255,255,0.99)',
        bgModalFooter:   d ? 'rgba(6,14,22,0.4)'          : 'rgba(248,250,252,0.8)',
        bgInfoBanner:    d ? 'rgba(56,189,248,0.06)'      : 'rgba(14,165,233,0.06)',

        border:          d ? '#1b263b'                    : '#e2e8f0',
        borderSubtle:    d ? 'rgba(27,38,59,0.6)'         : 'rgba(226,232,240,0.8)',
        borderInput:     d ? '#1b263b'                    : '#cbd5e1',
        borderAction:    d ? 'rgba(2,128,144,0.25)'       : 'rgba(2,128,144,0.3)',
        borderDanger:    d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderError:     d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderInfo:      d ? 'rgba(56,189,248,0.15)'      : 'rgba(14,165,233,0.2)',
        borderModal:     d ? '#1b263b'                    : '#e2e8f0',

        textPrimary:     d ? '#f1f5f9' : '#0f172a',
        textSecondary:   d ? '#e2e8f0' : '#1e293b',
        textMuted:       d ? '#94a3b8' : '#475569',
        textFaint:       d ? '#4a7a8a' : '#64748b',
        textGhost:       d ? '#2d4a5a' : '#94a3b8',
        textAction:      d ? '#028090' : '#0369a1',
        textDanger:      d ? '#f87171' : '#dc2626',
        textInput:       d ? '#cbd5e1' : '#1e293b',
        textInfo:        d ? '#38bdf8' : '#0c4a6e',

        shadowModal:     d ? '0 25px 60px rgba(0,0,0,0.5)' : '0 25px 60px rgba(0,0,0,0.15)',
    }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    open:        { label: 'Open',        bg: (d) => d ? 'rgba(239,68,68,0.10)'   : 'rgba(220,38,38,0.09)',   text: (d) => d ? '#f87171' : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.25)'   : 'rgba(220,38,38,0.28)'   },
    in_progress: { label: 'In Progress', bg: (d) => d ? 'rgba(56,189,248,0.10)'  : 'rgba(14,165,233,0.09)',  text: (d) => d ? '#38bdf8' : '#0c4a6e', border: (d) => d ? 'rgba(56,189,248,0.25)'  : 'rgba(14,165,233,0.28)'  },
    resolved:    { label: 'Resolved',    bg: (d) => d ? 'rgba(34,197,94,0.10)'   : 'rgba(22,163,74,0.09)',   text: (d) => d ? '#4ade80' : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.25)'   : 'rgba(22,163,74,0.28)'   },
    closed:      { label: 'Closed',      bg: (d) => d ? 'rgba(100,116,139,0.10)' : 'rgba(100,116,139,0.09)', text: (d) => d ? '#94a3b8' : '#334155', border: (d) => d ? 'rgba(100,116,139,0.25)' : 'rgba(100,116,139,0.28)' },
}

const PRIORITY_CONFIG = {
    low:      { label: 'Low',      bg: (d) => d ? 'rgba(100,116,139,0.10)' : 'rgba(100,116,139,0.09)', text: (d) => d ? '#94a3b8' : '#334155', border: (d) => d ? 'rgba(100,116,139,0.25)' : 'rgba(100,116,139,0.28)' },
    medium:   { label: 'Medium',   bg: (d) => d ? 'rgba(56,189,248,0.10)'  : 'rgba(14,165,233,0.09)',  text: (d) => d ? '#38bdf8' : '#0c4a6e', border: (d) => d ? 'rgba(56,189,248,0.25)'  : 'rgba(14,165,233,0.28)'  },
    high:     { label: 'High',     bg: (d) => d ? 'rgba(249,115,22,0.10)'  : 'rgba(234,88,12,0.09)',   text: (d) => d ? '#fb923c' : '#7c2d12', border: (d) => d ? 'rgba(249,115,22,0.25)'  : 'rgba(234,88,12,0.28)'   },
    critical: { label: 'Critical', bg: (d) => d ? 'rgba(239,68,68,0.10)'   : 'rgba(220,38,38,0.09)',   text: (d) => d ? '#f87171' : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.25)'   : 'rgba(220,38,38,0.28)'   },
}

const SEVERITY_COLORS = {
    4: '#f87171', 3: '#fb923c', 2: '#fbbf24', 1: '#4ade80', 0: '#94a3b8',
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

const fmt = (dateStr) => {
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return '—' }
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Card({ children, className = '', style = {}, tk }) {
    return (
        <div className={`rounded-xl ${className}`}
            style={{ background: tk.bgCard, border: `1px solid ${tk.border}`, ...style }}>
            {children}
        </div>
    )
}

function Badge({ cfg, label, isDark }) {
    const bg     = typeof cfg?.bg     === 'function' ? cfg.bg(isDark)     : (cfg?.bg     ?? 'rgba(100,116,139,0.12)')
    const text   = typeof cfg?.text   === 'function' ? cfg.text(isDark)   : (cfg?.text   ?? '#94a3b8')
    const border = typeof cfg?.border === 'function' ? cfg.border(isDark) : (cfg?.border ?? 'rgba(100,116,139,0.25)')
    const displayLabel = label ?? cfg?.label
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: bg, color: text, border: `1px solid ${border}` }}>
            {displayLabel}
        </span>
    )
}

function StatCard({ label, value, accent, tk }) {
    return (
        <Card tk={tk} className="relative overflow-hidden p-5 flex flex-col gap-2">
            <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-10"/>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textFaint }}>{label}</span>
            </div>
            <span className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{value ?? '—'}</span>
        </Card>
    )
}

function Skeleton({ rows = 4, tk }) {
    return (
        <div className="space-y-px">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 animate-pulse"
                    style={{ borderBottom: `1px solid ${tk.borderSubtle}` }}>
                    <div className="h-3 w-1/4 rounded-md" style={{ background: tk.bgSkeleton }} />
                    <div className="h-3 w-1/5 rounded-md" style={{ background: tk.bgSkeleton }} />
                    <div className="h-3 w-16 rounded-md"  style={{ background: tk.bgSkeleton }} />
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
            <button onClick={() => onPage(1)} disabled={currentPage === 1} className={base} style={{ ...inactive, ...(currentPage === 1 ? dis : {}) }}
                onMouseEnter={e => currentPage !== 1 && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== 1 && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronLeft size={12} className="inline" /><ChevronLeft size={12} className="inline -ml-1.5" />
            </button>
            <button onClick={() => onPage(currentPage - 1)} disabled={currentPage === 1} className={base} style={{ ...inactive, ...(currentPage === 1 ? dis : {}) }}
                onMouseEnter={e => currentPage !== 1 && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== 1 && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronLeft size={12} className="inline" /> Prev
            </button>
            {pages.map(p => (
                <button key={p} onClick={() => onPage(p)} className={base} style={p === currentPage ? active : inactive}
                    onMouseEnter={e => p !== currentPage && Object.assign(e.currentTarget.style, hov)}
                    onMouseLeave={e => p !== currentPage && Object.assign(e.currentTarget.style, inactive)}>
                    {p}
                </button>
            ))}
            <button onClick={() => onPage(currentPage + 1)} disabled={currentPage === totalPages} className={base} style={{ ...inactive, ...(currentPage === totalPages ? dis : {}) }}
                onMouseEnter={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, inactive)}>
                Next <ChevronRight size={12} className="inline" />
            </button>
            <button onClick={() => onPage(totalPages)} disabled={currentPage === totalPages} className={base} style={{ ...inactive, ...(currentPage === totalPages ? dis : {}) }}
                onMouseEnter={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronRight size={12} className="inline" /><ChevronRight size={12} className="inline -ml-1.5" />
            </button>
        </div>
    )
}

// ─── User Cell ────────────────────────────────────────────────────────────────

function UserCell({ user, tk }) {
    if (!user) return <span className="text-xs" style={{ color: tk.textGhost }}>—</span>
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return (
        <div>
            <p className="text-sm font-medium" style={{ color: tk.textSecondary }}>{full || user.username || user.id}</p>
            {user.email && <p className="text-[11px] mt-0.5" style={{ color: tk.textFaint }}>{user.email}</p>}
        </div>
    )
}

// ─── Incident Cell ────────────────────────────────────────────────────────────

function IncidentCell({ incident, tk }) {
    if (!incident) return <span className="text-xs" style={{ color: tk.textGhost }}>—</span>
    return (
        <div>
            <p className="text-sm font-medium truncate max-w-[200px]" title={incident.title} style={{ color: tk.textSecondary }}>
                {incident.title}
            </p>
            <p className="text-[11px] mt-0.5 font-semibold"
                style={{ color: SEVERITY_COLORS[incident.severity] ?? tk.textMuted }}>
                Severity {incident.severity}
            </p>
        </div>
    )
}

// ─── Notes Modal ──────────────────────────────────────────────────────────────

const NotesModal = ({ notes, onClose, tk }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-md mx-4 overflow-hidden rounded-xl"
            style={{ background: tk.bgModalHeader, border: `1px solid ${tk.borderModal}`, boxShadow: tk.shadowModal }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${tk.borderModal}` }}>
                <h2 className="text-sm font-semibold" style={{ color: tk.textPrimary }}>Notes</h2>
                <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                    style={{ color: tk.textFaint }}
                    onMouseEnter={e => { e.currentTarget.style.background = tk.bgSubtle; e.currentTarget.style.color = tk.textMuted }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tk.textFaint }}>
                    <X size={14} />
                </button>
            </div>
            <div className="px-6 py-5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: tk.textMuted }}>{notes || 'No notes.'}</p>
            </div>
            <div className="flex justify-end px-6 py-4" style={{ borderTop: `1px solid ${tk.borderModal}`, background: tk.bgModalFooter }}>
                <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                    style={{ background: 'transparent', border: `1px solid ${tk.borderAction}`, color: tk.textAction }}
                    onMouseEnter={e => { e.currentTarget.style.background = tk.bgAction }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    Close
                </button>
            </div>
        </div>
    </div>
)

// ─── Reassign Modal ───────────────────────────────────────────────────────────

const ReassignTicketModal = ({ ticket, users, onClose, onReassigned, tk, isDark }) => {
    const [selectedUser, setSelectedUser] = useState(ticket.assigned_to)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(null)

    const handleReassign = async () => {
        if (!selectedUser)                       { setError('Please select a user.'); return }
        if (selectedUser === ticket.assigned_to) { setError('Please select a different user.'); return }
        setLoading(true); setError(null)
        try {
            const { data } = await api.put(`/tickets/${ticket._id}`, { assigned_to: selectedUser })
            onReassigned(data.ticket); onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reassign ticket.')
        } finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="w-full max-w-md mx-4 overflow-hidden rounded-xl"
                style={{ background: tk.bgModalHeader, border: `1px solid ${tk.borderModal}`, boxShadow: tk.shadowModal }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${tk.borderModal}` }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
                            <Users size={13} style={{ color: '#38bdf8' }} />
                        </div>
                        <h2 className="text-sm font-semibold" style={{ color: tk.textPrimary }}>Reassign Ticket</h2>
                    </div>
                    <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                        style={{ color: tk.textFaint }}
                        onMouseEnter={e => { e.currentTarget.style.background = tk.bgSubtle; e.currentTarget.style.color = tk.textMuted }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tk.textFaint }}>
                        <X size={14} />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="rounded-lg px-4 py-2.5 text-sm"
                            style={{ background: tk.bgErrorMsg, border: `1px solid ${tk.borderError}`, color: tk.textDanger }}>
                            {error}
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: tk.textFaint, marginBottom: '6px' }}>
                            Assign to *
                        </label>
                        <UserSearchSelect users={users} value={selectedUser}
                            onChange={e => setSelectedUser(e.target.value)} name="assigned_to" className="" />
                    </div>
                    <div className="rounded-lg px-3 py-2.5 text-xs"
                        style={{ background: tk.bgInfoBanner, border: `1px solid ${tk.borderInfo}`, color: tk.textInfo }}>
                        Currently assigned: {ticket.assigned_user?.firstName || ticket.assigned_user?.username || '—'}
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4"
                    style={{ borderTop: `1px solid ${tk.borderModal}`, background: tk.bgModalFooter }}>
                    <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                        style={{ background: 'transparent', border: `1px solid ${tk.borderAction}`, color: tk.textAction }}
                        onMouseEnter={e => { e.currentTarget.style.background = tk.bgAction }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        Cancel
                    </button>
                    <button onClick={handleReassign} disabled={loading}
                        className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                        style={{ background: '#02c39a', color: '#0d1b2a', opacity: loading ? 0.6 : 1 }}
                        onMouseEnter={e => !loading && (e.currentTarget.style.background = '#02e0b1')}
                        onMouseLeave={e => !loading && (e.currentTarget.style.background = '#02c39a')}>
                        {loading ? 'Reassigning…' : 'Reassign'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Create Ticket Modal ──────────────────────────────────────────────────────

const CreateTicketModal = ({ incidentId, users, onClose, onCreated, tk }) => {
    const [form, setForm] = useState({
        name: '', incident_id: incidentId || '', assigned_to: '', priority: 'medium', notes: '',
    })
    const [incidents, setIncidents] = useState([])
    const [loading,   setLoading]   = useState(false)
    const [error,     setError]     = useState(null)

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

    const labelStyle = {
        display: 'block', fontSize: '10px', fontWeight: '600',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: tk.textFaint, marginBottom: '6px',
    }

    useEffect(() => {
        if (!incidentId) {
            api.get('/incidents')
                .then(r => setIncidents(r.data.incidents || []))
                .catch(err => console.error('[CreateTicketModal] load incidents', err))
        }
    }, [incidentId])

    const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const submit = async () => {
        if (!form.name.trim()) { setError('Ticket name is required.'); return }
        if (!form.incident_id) { setError('Please select an incident.'); return }
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
            <div className="w-full max-w-lg mx-4 overflow-hidden rounded-xl"
                style={{ background: tk.bgModalHeader, border: `1px solid ${tk.borderModal}`, boxShadow: tk.shadowModal }}>

                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${tk.borderModal}` }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ background: tk.bgAction, border: `1px solid ${tk.borderAction}` }}>
                            <Ticket size={13} style={{ color: '#02c39a' }} />
                        </div>
                        <h2 className="text-sm font-semibold" style={{ color: tk.textPrimary }}>Create Ticket</h2>
                    </div>
                    <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                        style={{ color: tk.textFaint }}
                        onMouseEnter={e => { e.currentTarget.style.background = tk.bgSubtle; e.currentTarget.style.color = tk.textMuted }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tk.textFaint }}>
                        <X size={14} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="rounded-lg px-4 py-2.5 text-sm"
                            style={{ background: tk.bgErrorMsg, border: `1px solid ${tk.borderError}`, color: tk.textDanger }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={labelStyle}>Ticket Name *</label>
                        <input name="name" value={form.name} onChange={handle} className="tkt-input"
                            placeholder="Give this ticket a descriptive name…" style={inputStyle} />
                    </div>

                    {incidentId ? (
                        <input type="hidden" name="incident_id" value={incidentId} />
                    ) : (
                        <div>
                            <label style={labelStyle}>Incident *</label>
                            <select name="incident_id" value={form.incident_id} onChange={handle} className="tkt-input" style={inputStyle}>
                                <option value="">Select an incident…</option>
                                {incidents.map(inc => (
                                    <option key={inc._id} value={inc._id}>[{inc.severity}] {inc.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label style={labelStyle}>Assign to *</label>
                        <UserSearchSelect users={users} value={form.assigned_to} onChange={handle} name="assigned_to" className="" />
                    </div>

                    <div>
                        <label style={labelStyle}>Priority</label>
                        <select name="priority" value={form.priority} onChange={handle} className="tkt-input" style={inputStyle}>
                            {Object.entries(PRIORITY_CONFIG).map(([v, { label }]) => (
                                <option key={v} value={v}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Notes</label>
                        <textarea name="notes" value={form.notes} onChange={handle} rows={3}
                            placeholder="Optional notes…" style={{ ...inputStyle, resize: 'none' }} className="tkt-input" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-6 py-4"
                    style={{ borderTop: `1px solid ${tk.borderModal}`, background: tk.bgModalFooter }}>
                    <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                        style={{ background: 'transparent', border: `1px solid ${tk.borderAction}`, color: tk.textAction }}
                        onMouseEnter={e => { e.currentTarget.style.background = tk.bgAction }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        Cancel
                    </button>
                    <button onClick={submit} disabled={loading}
                        className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Tickets() {
    const { isAdmin }                          = useAuth()
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

    const labelStyle = {
        display: 'block', fontSize: '10px', fontWeight: '600',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: tk.textFaint, marginBottom: '6px',
    }

    const canViewAll = isAdmin || can('VIEW_TICKETS')
    const canCreate  = isAdmin || can('CREATE_TICKET')
    const canUpdate  = isAdmin || can('UPDATE_TICKET')
    const canDelete  = isAdmin || can('DELETE_TICKET')

    const [allTickets,  setAllTickets]  = useState([])
    const [myTickets,   setMyTickets]   = useState([])
    const [stats,       setStats]       = useState(null)
    const [users,       setUsers]       = useState([])
    const [loading,     setLoading]     = useState(true)
    const [error,       setError]       = useState(null)

    const [activeTab,      setActiveTab]      = useState('mine')
    const [showModal,      setShowModal]      = useState(false)
    const [showNotesModal, setShowNotesModal] = useState(false)
    const [selectedNotes,  setSelectedNotes]  = useState(null)
    const [reassignTarget, setReassignTarget] = useState(null)
    const [deleteTarget,   setDeleteTarget]   = useState(null)
    const [showFilters,    setShowFilters]    = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize,    setPageSize]    = useState(25)

    const [filterStatus,     setFilterStatus]     = useState('')
    const [filterPriority,   setFilterPriority]   = useState('')
    const [filterAssignedTo, setFilterAssignedTo] = useState('')
    const [filterCreatedBy,  setFilterCreatedBy]  = useState('')

    useEffect(() => {
        if (!permissionsLoading) setActiveTab(canViewAll ? 'all' : 'mine')
    }, [permissionsLoading, canViewAll])

    const fetchData = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const [mineRes, statsRes] = await Promise.all([
                api.get('/tickets/mine'),
                api.get('/tickets/stats'),
            ])
            setMyTickets(mineRes.data.tickets || [])
            setStats(statsRes.data)

            if (canViewAll) {
                const [allRes, usersRes] = await Promise.allSettled([
                    api.get('/tickets'),
                    api.get('/users'),
                ])
                if (allRes.status === 'fulfilled')
                    setAllTickets(allRes.value.data.tickets || [])
                if (usersRes.status === 'fulfilled')
                    setUsers(usersRes.value.data || [])
            }

        } catch (err) {
            if (err.response?.status !== 403)
                setError(err.response?.data?.message || 'Failed to load tickets.')
        } finally {
            setLoading(false)
        }
    }, [canViewAll])

    useEffect(() => { if (!permissionsLoading) fetchData() }, [fetchData, permissionsLoading])

    const filteredAll = useMemo(() => allTickets.filter(t => {
        if (filterStatus     && t.status      !== filterStatus)     return false
        if (filterPriority   && t.priority    !== filterPriority)   return false
        if (filterAssignedTo && t.assigned_to !== filterAssignedTo) return false
        if (filterCreatedBy  && t.created_by  !== filterCreatedBy)  return false
        return true
    }), [allTickets, filterStatus, filterPriority, filterAssignedTo, filterCreatedBy])

    const filteredMine = useMemo(() => myTickets.filter(t => {
        if (filterStatus   && t.status   !== filterStatus)   return false
        if (filterPriority && t.priority !== filterPriority) return false
        return true
    }), [myTickets, filterStatus, filterPriority])

    const displayed     = activeTab === 'mine' ? filteredMine : filteredAll
    const totalPages    = Math.max(1, Math.ceil(displayed.length / pageSize))
    const startIndex    = (currentPage - 1) * pageSize
    const paginatedRows = displayed.slice(startIndex, startIndex + pageSize)
    const hasActiveFilters = filterStatus || filterPriority || filterAssignedTo || filterCreatedBy

    const resetFilters = () => {
        setFilterStatus(''); setFilterPriority('')
        setFilterAssignedTo(''); setFilterCreatedBy('')
        setCurrentPage(1)
    }

    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            await api.put(`/tickets/${ticketId}`, { status: newStatus })
            const update = list => list.map(t => t._id === ticketId ? { ...t, status: newStatus } : t)
            setAllTickets(update); setMyTickets(update)
        } catch (err) { alert(err.response?.data?.message || 'Failed to update ticket status.') }
    }

    const handleReassigned = (updatedTicket) => {
        const update = list => list.map(t => t._id === updatedTicket._id ? updatedTicket : t)
        setAllTickets(update); setMyTickets(update); setReassignTarget(null); fetchData()
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await api.delete(`/tickets/${deleteTarget.id}`)
            setAllTickets(prev => prev.filter(t => t._id !== deleteTarget.id))
            setMyTickets(prev  => prev.filter(t => t._id !== deleteTarget.id))
            setDeleteTarget(null); fetchData()
        } catch (err) { alert(err.response?.data?.message || 'Failed to delete ticket.') }
    }

    const handleCreated = (newTicket) => {
        if (canViewAll) setAllTickets(prev => [newTicket, ...prev])
        setMyTickets(prev => [newTicket, ...prev]); fetchData()
    }

    // ── Derived stats ──
    const ticketByStatus   = stats?.by_status   ?? []
    const ticketByPriority = stats?.by_priority ?? []
    const totalCount       = stats?.total        ?? 0
    const openCount        = ticketByStatus.find(s => s._id === 'open')?.count      ?? 0
    const criticalCount    = ticketByPriority.find(s => s._id === 'critical')?.count ?? 0
    const mineCount        = stats?.my_tickets   ?? 0
    const highCount        = ticketByPriority.find(s => s._id === 'high')?.count ?? 0
    const mediumCount      = ticketByPriority.find(s => s._id === 'medium')?.count ?? 0

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
                @keyframes tkt-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
                .tkt-page { animation: tkt-fadein 0.35s ease-out both; }
                .tkt-input:focus { border-color: rgba(2,195,154,0.5) !important; box-shadow: 0 0 0 3px rgba(2,195,154,0.08) !important; }
                .tkt-row:hover { background: var(--tkt-row-hover) !important; }
                .tkt-status-select { background: ${tk.bgInput}; border: 1px solid ${tk.borderInput}; color: ${tk.textInput}; border-radius: 8px; padding: 4px 8px; font-size: 12px; outline: none; transition: border-color 0.15s; }
                .tkt-status-select:focus { border-color: rgba(2,195,154,0.5); }
            `}</style>
            <style>{`:root { --tkt-row-hover: ${tk.bgCardHover}; }`}</style>

            <div className="tkt-page space-y-6" style={{ color: tk.textSecondary }}>

                {/* ── Header ── */}
                <div className="flex flex-wrap items-end justify-between gap-4"
                    style={{ borderBottom: `1px solid ${tk.border}`, paddingBottom: '20px' }}>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight" style={{ color: tk.textPrimary }}>Ticket Management</h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: tk.textFaint }}>Track and manage security incident tickets</p>
                    </div>
                    {canCreate && (
                        <button onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: '#02c39a', color: '#0d1b2a' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#02e0b1')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#02c39a')}>
                            <Plus size={13} /> New Ticket
                        </button>
                    )}
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="rounded-xl px-4 py-3 text-sm"
                        style={{ background: tk.bgErrorMsg, border: `1px solid ${tk.borderError}`, color: tk.textDanger }}>
                        {error}
                    </div>
                )}

                {/* ── Stats ── */}
                {stats && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                        <StatCard tk={tk} label="Total"          value={totalCount}    accent="#02c39a"/>
                        <StatCard tk={tk} label="Open"           value={openCount}     accent="#fbbf24"/>
                        <StatCard tk={tk} label="Critical"       value={criticalCount} accent="#f87171"/>
                        <StatCard tk={tk} label="High"           value={highCount}     accent="#fb923c"/>
                        <StatCard tk={tk} label="Medium"         value={mediumCount}   accent="#fbbf24"/>
                        <StatCard tk={tk} label="Assigned to Me" value={mineCount}     accent="#38bdf8"/>
                    </div>
                )}

                {/* ── Filters ── */}
                <Card tk={tk} className="overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
                        onClick={() => setShowFilters(f => !f)}
                        style={{ borderBottom: showFilters ? `1px solid ${tk.border}` : 'none' }}>
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={13} style={{ color: tk.textFaint }} />
                            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: tk.textFaint }}>Filters</span>
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
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                                <div>
                                    <label style={labelStyle}>Status</label>
                                    <select className="tkt-input" style={inputStyle} value={filterStatus}
                                        onChange={v => { setFilterStatus(v.target.value); setCurrentPage(1) }}>
                                        <option value="">All statuses</option>
                                        {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
                                            <option key={v} value={v}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Priority</label>
                                    <select className="tkt-input" style={inputStyle} value={filterPriority}
                                        onChange={v => { setFilterPriority(v.target.value); setCurrentPage(1) }}>
                                        <option value="">All priorities</option>
                                        {Object.entries(PRIORITY_CONFIG).map(([v, { label }]) => (
                                            <option key={v} value={v}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                {canViewAll && (
                                    <>
                                        <div>
                                            <label style={labelStyle}>Assigned to</label>
                                            <UserSearchSelect users={users} value={filterAssignedTo}
                                                onChange={e => { setFilterAssignedTo(e.target.value); setCurrentPage(1) }}
                                                name="filterAssignedTo" className="" placeholder="All users…" />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Created by</label>
                                            <UserSearchSelect users={users} value={filterCreatedBy}
                                                onChange={e => { setFilterCreatedBy(e.target.value); setCurrentPage(1) }}
                                                name="filterCreatedBy" className="" placeholder="All users…" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </Card>

                {/* ── Count + page size ── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: tk.textFaint }}>
                        {loading ? 'Loading…' : (
                            displayed.length === 0 ? 'No tickets found' :
                            `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, displayed.length)} of ${displayed.length} ticket${displayed.length !== 1 ? 's' : ''}`
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: tk.textFaint }}>Rows:</span>
                        <select className="rounded-lg px-2 py-1 text-xs"
                            style={{ background: tk.bgInput, border: `1px solid ${tk.border}`, color: tk.textMuted, outline: 'none' }}
                            value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}>
                            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                {/* ── Tabs + Table ── */}
                <Card tk={tk} className="overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex" style={{ borderBottom: `1px solid ${tk.border}` }}>
                        {canViewAll && (
                            <button onClick={() => { setActiveTab('all'); setCurrentPage(1) }}
                                className="px-6 py-3 text-sm font-medium transition-all duration-150 relative"
                                style={{
                                    color: activeTab === 'all' ? '#02c39a' : tk.textFaint,
                                    borderBottom: activeTab === 'all' ? '2px solid #02c39a' : '2px solid transparent',
                                    background: 'transparent',
                                }}>
                                All Tickets
                                <span className="ml-2 rounded-full px-2 py-0.5 text-[10px]"
                                    style={{ background: activeTab === 'all' ? 'rgba(2,195,154,0.12)' : tk.bgSubtle, color: activeTab === 'all' ? '#02c39a' : tk.textFaint }}>
                                    {allTickets.length}
                                </span>
                            </button>
                        )}
                        <button onClick={() => { setActiveTab('mine'); setCurrentPage(1) }}
                            className="px-6 py-3 text-sm font-medium transition-all duration-150"
                            style={{
                                color: activeTab === 'mine' ? '#02c39a' : tk.textFaint,
                                borderBottom: activeTab === 'mine' ? '2px solid #02c39a' : '2px solid transparent',
                                background: 'transparent',
                            }}>
                            My Tickets
                            <span className="ml-2 rounded-full px-2 py-0.5 text-[10px]"
                                style={{ background: activeTab === 'mine' ? 'rgba(2,195,154,0.12)' : tk.bgSubtle, color: activeTab === 'mine' ? '#02c39a' : tk.textFaint }}>
                                {myTickets.length}
                            </span>
                        </button>
                    </div>

                    {/* Loading skeleton */}
                    {loading && <Skeleton rows={4} tk={tk} />}

                    {/* Empty */}
                    {!loading && !error && displayed.length === 0 && (
                        <div className="flex flex-col items-center gap-4 py-16 text-center">
                            <div>
                                <p className="text-sm font-medium" style={{ color: tk.textMuted }}>No tickets found</p>
                                <p className="mt-1 text-[11px]" style={{ color: tk.textFaint }}>
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'No tickets match the current view'}
                                </p>
                            </div>
                            {hasActiveFilters && (
                                <button onClick={resetFilters} className="text-xs transition-opacity hover:opacity-70" style={{ color: '#02c39a' }}>
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Table */}
                    {!loading && paginatedRows.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1120px]" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: tk.bgThead, borderBottom: `1px solid ${tk.border}` }}>
                                        {[
                                            { label: 'Name' },
                                            { label: 'Incident' },
                                            { label: 'Assigned to' },
                                            canViewAll ? { label: 'Created by' } : null,
                                            { label: 'Priority' },
                                            { label: 'Status' },
                                            { label: 'Created at' },
                                            { label: 'Actions', center: true },
                                        ].filter(Boolean).map(({ label, center }) => (
                                            <th key={label}
                                                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                                                style={{ color: tk.textFaint, textAlign: center ? 'center' : 'left' }}>
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.map(ticket => (
                                        <tr key={ticket._id} className="tkt-row"
                                            style={{ background: 'transparent', borderBottom: `1px solid ${tk.borderSubtle}`, transition: 'background 0.15s' }}>

                                            {/* Name */}
                                            <td className="px-4 py-3 max-w-[180px]">
                                                <span className="block truncate text-sm font-medium" title={ticket.name}
                                                    style={{ color: tk.textSecondary }}>
                                                    {ticket.name || '—'}
                                                </span>
                                            </td>

                                            {/* Incident */}
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <IncidentCell incident={ticket.incident} tk={tk} />
                                            </td>

                                            {/* Assigned to */}
                                            <td className="px-4 py-3">
                                                <UserCell user={ticket.assigned_user} tk={tk} />
                                            </td>

                                            {/* Created by */}
                                            {canViewAll && (
                                                <td className="px-4 py-3">
                                                    <UserCell user={ticket.created_by_user} tk={tk} />
                                                </td>
                                            )}

                                            {/* Priority */}
                                            <td className="px-4 py-3">
                                                <Badge cfg={PRIORITY_CONFIG[ticket.priority]} isDark={isDark} />
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                {canUpdate ? (
                                                    <select value={ticket.status}
                                                        onChange={e => handleStatusChange(ticket._id, e.target.value)}
                                                        className="tkt-status-select">
                                                        {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
                                                            <option key={v} value={v}>{label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <Badge cfg={STATUS_CONFIG[ticket.status]} isDark={isDark} />
                                                )}
                                            </td>

                                            {/* Created at */}
                                            <td className="px-4 py-3">
                                                <span className="text-xs" style={{ color: tk.textFaint }}>{fmt(ticket.created_at)}</span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                    {ticket.notes && (
                                                        <button onClick={() => { setSelectedNotes(ticket.notes); setShowNotesModal(true) }}
                                                            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-150"
                                                            style={{ background: tk.bgBtnDefault, border: `1px solid ${tk.border}`, color: tk.textMuted }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = tk.bgSubtle; e.currentTarget.style.color = tk.textSecondary }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = tk.bgBtnDefault; e.currentTarget.style.color = tk.textMuted }}>
                                                            <StickyNote size={13} />
                                                        </button>
                                                    )}
                                                    {canUpdate && (
                                                        <button
                                                            title="Reassign"
                                                            onClick={() => setReassignTarget(ticket)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150"
                                                            style={{ background: tk.bgBtnDefault, border: `1px solid ${tk.border}`, color: tk.textMuted }}
                                                            onMouseEnter={e => Object.assign(e.currentTarget.style, { background: tk.bgAction, border: `1px solid ${tk.borderAction}`, color: '#02c39a' })}
                                                            onMouseLeave={e => Object.assign(e.currentTarget.style, { background: tk.bgBtnDefault, border: `1px solid ${tk.border}`, color: tk.textMuted })}
                                                        >
                                                            <UserCog size={13} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            title="Delete"
                                                            onClick={() => setDeleteTarget({ id: ticket._id, name: ticket.name || ticket.incident?.title || 'Ticket' })}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150"
                                                            style={{ background: tk.bgDanger, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger }}
                                                            onMouseEnter={e => Object.assign(e.currentTarget.style, { background: tk.bgDangerHover, border: `1px solid rgba(239,68,68,0.35)`, color: '#fca5a5' })}
                                                            onMouseLeave={e => Object.assign(e.currentTarget.style, { background: tk.bgDanger, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger })}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* ── Pagination ── */}
                {!loading && displayed.length > pageSize && (
                    <PaginationBar currentPage={currentPage} totalPages={totalPages} onPage={setCurrentPage} tk={tk} />
                )}

                {/* ── Modals ── */}
                {showModal && (
                    <CreateTicketModal users={users} onClose={() => setShowModal(false)} onCreated={handleCreated} tk={tk} />
                )}

                {reassignTarget && (
                    <ReassignTicketModal
                        ticket={reassignTarget} users={users}
                        onClose={() => setReassignTarget(null)} onReassigned={handleReassigned}
                        tk={tk} isDark={isDark}
                    />
                )}

                {showNotesModal && (
                    <NotesModal notes={selectedNotes} onClose={() => { setShowNotesModal(false); setSelectedNotes(null) }} tk={tk} />
                )}

                {deleteTarget && (
                    <DeleteModal type="ticket" name={deleteTarget.name}
                        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
                )}
            </div>
        </>
    )
}