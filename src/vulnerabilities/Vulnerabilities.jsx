import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/useAuth'
import api from '../api'
import DetailVulnerability from './DetailVulnerability.jsx'
import EditVulnerability from './EditVulnerability.jsx'
import DeleteModal from '../componants/DeleteModal'
import AddVulnerability from './AddVulnerability.jsx'
import * as XLSX from 'xlsx'

import {
    Plus, RefreshCcw, Search, SlidersHorizontal, X,
    Eye, Pencil, Trash2, ShieldAlert, ChevronLeft, ChevronRight,
    Download,Play
} from 'lucide-react'

// ─── useTheme ─────────────────────────────────────────────────────────────────

function useTheme() {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme')
        if (saved === 'dark')  return true
        if (saved === 'light') return false
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
        bgInputSearch:   d ? 'rgba(10,18,21,0.8)'         : '#ffffff',
        bgAction:        d ? 'rgba(2,128,144,0.1)'        : 'rgba(2,128,144,0.07)',
        bgActionHover:   d ? 'rgba(2,128,144,0.18)'       : 'rgba(2,128,144,0.13)',
        bgDanger:        d ? 'rgba(239,68,68,0.08)'       : 'rgba(220,38,38,0.06)',
        bgDangerHover:   d ? 'rgba(239,68,68,0.14)'       : 'rgba(220,38,38,0.1)',
        bgSkeleton:      d ? 'rgba(27,38,59,0.8)'         : 'rgba(203,213,225,0.6)',
        bgRowSep:        d ? 'rgba(27,38,59,0.6)'         : 'rgba(226,232,240,0.8)',
        bgBtnDefault:    d ? 'rgba(27,38,59,0.4)'         : 'rgba(241,245,249,0.9)',
        bgErrorMsg:      d ? 'rgba(239,68,68,0.08)'       : 'rgba(220,38,38,0.06)',
        bgFilterActive:  d ? 'rgba(2,195,154,0.12)'       : 'rgba(2,128,144,0.09)',
        bgFilterChip:    d ? 'rgba(2,128,144,0.08)'       : 'rgba(2,128,144,0.07)',
        bgScannerBadge:  d ? 'rgba(27,38,59,0.6)'         : 'rgba(241,245,249,0.95)',
        bgLoadingModal:  d ? 'rgba(6,14,22,0.7)'          : 'rgba(15,23,42,0.45)',
        bgLoadingCard:   d ? 'rgba(13,27,42,0.95)'        : 'rgba(255,255,255,0.97)',

        border:          d ? '#1b263b'                    : '#e2e8f0',
        borderSubtle:    d ? 'rgba(27,38,59,0.6)'         : 'rgba(226,232,240,0.9)',
        borderInput:     d ? '#1b263b'                    : '#cbd5e1',
        borderAction:    d ? 'rgba(2,128,144,0.25)'       : 'rgba(2,128,144,0.3)',
        borderDanger:    d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderError:     d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderFilterChip:d ? 'rgba(2,128,144,0.2)'        : 'rgba(2,128,144,0.25)',
        borderScannerBadge: d ? '#1b263b'                 : '#e2e8f0',

        textPrimary:     d ? '#f1f5f9' : '#0f172a',
        textSecondary:   d ? '#e2e8f0' : '#1e293b',
        textMuted:       d ? '#94a3b8' : '#475569',
        textFaint:       d ? '#4a7a8a' : '#64748b',
        textGhost:       d ? '#2d4a5a' : '#94a3b8',
        textAction:      d ? '#028090' : '#0369a1',
        textDanger:      d ? '#f87171' : '#dc2626',
        textInput:       d ? '#cbd5e1' : '#1e293b',
        textPlaceholder: d ? '#2d4a5a' : '#94a3b8',
        textFilterChip:  d ? '#028090' : '#0369a1',

        shadowLoadingCard: d ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
    }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_LABELS = { 0: 'Info', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

const SEVERITY_CONFIG = {
    Info: {
        bg:     (d) => d ? 'rgba(100,116,139,0.12)' : 'rgba(100,116,139,0.10)',
        text:   (d) => d ? '#94a3b8'               : '#334155',
        border: (d) => d ? 'rgba(100,116,139,0.25)' : 'rgba(100,116,139,0.3)',
    },
    Low: {
        bg:     (d) => d ? 'rgba(34,197,94,0.10)'  : 'rgba(22,163,74,0.09)',
        text:   (d) => d ? '#4ade80'               : '#14532d',
        border: (d) => d ? 'rgba(34,197,94,0.25)'  : 'rgba(22,163,74,0.28)',
    },
    Medium: {
        bg:     (d) => d ? 'rgba(245,158,11,0.10)' : 'rgba(217,119,6,0.09)',
        text:   (d) => d ? '#fbbf24'               : '#78350f',
        border: (d) => d ? 'rgba(245,158,11,0.25)' : 'rgba(217,119,6,0.28)',
    },
    High: {
        bg:     (d) => d ? 'rgba(249,115,22,0.10)' : 'rgba(234,88,12,0.09)',
        text:   (d) => d ? '#fb923c'               : '#7c2d12',
        border: (d) => d ? 'rgba(249,115,22,0.25)' : 'rgba(234,88,12,0.28)',
    },
    Critical: {
        bg:     (d) => d ? 'rgba(239,68,68,0.10)'  : 'rgba(220,38,38,0.09)',
        text:   (d) => d ? '#f87171'               : '#7f1d1d',
        border: (d) => d ? 'rgba(239,68,68,0.25)'  : 'rgba(220,38,38,0.28)',
    },
}

const STATUS_CONFIG = {
    open: {
        bg:     (d) => d ? 'rgba(239,68,68,0.10)'   : 'rgba(220,38,38,0.09)',
        text:   (d) => d ? '#f87171'               : '#7f1d1d',
        border: (d) => d ? 'rgba(239,68,68,0.25)'   : 'rgba(220,38,38,0.28)',
    },
    resolved: {
        bg:     (d) => d ? 'rgba(34,197,94,0.10)'  : 'rgba(22,163,74,0.09)',
        text:   (d) => d ? '#4ade80'               : '#14532d',
        border: (d) => d ? 'rgba(34,197,94,0.25)'  : 'rgba(22,163,74,0.28)',
    },
    in_progress: {
        bg:     (d) => d ? 'rgba(56,189,248,0.10)' : 'rgba(14,165,233,0.09)',
        text:   (d) => d ? '#38bdf8'               : '#0c4a6e',
        border: (d) => d ? 'rgba(56,189,248,0.25)' : 'rgba(14,165,233,0.28)',
    },
    ignored: {
        bg:     (d) => d ? 'rgba(100,116,139,0.10)' : 'rgba(100,116,139,0.09)',
        text:   (d) => d ? '#94a3b8'               : '#334155',
        border: (d) => d ? 'rgba(100,116,139,0.25)' : 'rgba(100,116,139,0.28)',
    },
}

// ─── ① Duration helpers ───────────────────────────────────────────────────────

const DURATION_OPTIONS = [
    { value: '',      label: 'All durations'  },
    { value: 'lt1',   label: '< 1 day'        },
    { value: '1to7',  label: '1 – 7 days'     },
    { value: '7to30', label: '7 – 30 days'    },
    { value: 'gt30',  label: '> 30 days'      },
]

const getDurationDays = (vuln) => {
    if (vuln.duration_days != null) return Number(vuln.duration_days)
    if (vuln.first_seen) {
        const last = vuln.last_seen ? new Date(vuln.last_seen) : new Date()
        return Math.floor((last - new Date(vuln.first_seen)) / 86400000)
    }
    return null
}

const formatDuration = (days) => {
    if (days == null) return '—'
    if (days < 1)     return '< 1d'
    return `${days}d`
}

const matchesDurationFilter = (vuln, filter) => {
    if (!filter) return true
    const d = getDurationDays(vuln)
    if (d == null) return false
    if (filter === 'lt1')   return d < 1
    if (filter === '1to7')  return d >= 1  && d <= 7
    if (filter === '7to30') return d > 7   && d <= 30
    if (filter === 'gt30')  return d > 30
    return true
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

// ─── ② Export Excel ───────────────────────────────────────────────────────────

const exportToExcel = (vulns) => {
    const rows = vulns.map(v => ({
        'Vulnerability': v.title ?? '—',
        'IP Address':    getAsset(v),
        'Severity':      SEVERITY_LABELS[v.severity] ?? String(v.severity ?? '—'),
        'Status':        v.status ?? '—',
        'Duration':      formatDuration(getDurationDays(v)),
        'CVSS':          getCvss(v) ?? '—',
        'Source':        getSource(v),
        'First Seen':    fmt(v.first_seen),
        'Last Seen':     fmt(v.last_seen),
    }))

    const ws = XLSX.utils.json_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
        { wch: 50 }, { wch: 18 }, { wch: 12 }, { wch: 14 },
        { wch: 12 }, { wch: 8  }, { wch: 22 }, { wch: 16 }, { wch: 16 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vulnerabilities')

    const now = new Date()

    const date = now.toISOString().split('T')[0]

    const time =
        String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0') + '-' +
        String(now.getSeconds()).padStart(2, '0')

    XLSX.writeFile(wb, `vulnerabilities_${date}_${time}.xlsx`)
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

function Badge({ label, config, isDark }) {
    const bg     = typeof config?.bg     === 'function' ? config.bg(isDark)     : (config?.bg     ?? 'rgba(100,116,139,0.12)')
    const text   = typeof config?.text   === 'function' ? config.text(isDark)   : (config?.text   ?? '#94a3b8')
    const border = typeof config?.border === 'function' ? config.border(isDark) : (config?.border ?? 'rgba(100,116,139,0.25)')
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: bg, color: text, border: `1px solid ${border}` }}>
            {label}
        </span>
    )
}

function FilterChip({ label, onRemove, tk }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: tk.bgFilterChip, border: `1px solid ${tk.borderFilterChip}`, color: tk.textFilterChip }}>
            {label}
            <button onClick={onRemove} className="ml-0.5 transition-opacity hover:opacity-70">
                <X size={11} />
            </button>
        </span>
    )
}

function ActionBtn({ title, onClick, children, variant = 'default', tk }) {
    const base = 'flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150'
    const variants = {
        default: {
            style: { background: tk.bgBtnDefault, border: `1px solid ${tk.border}`,        color: tk.textMuted  },
            hover: { background: tk.bgAction,     border: `1px solid ${tk.borderAction}`,  color: '#02c39a'     },
        },
        danger: {
            style: { background: tk.bgDanger,      border: `1px solid ${tk.borderDanger}`, color: tk.textDanger },
            hover: { background: tk.bgDangerHover,  border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5'  },
        },
    }
    const v = variants[variant] ?? variants.default
    return (
        <button title={title} onClick={onClick} className={base} style={v.style}
            onMouseEnter={e => Object.assign(e.currentTarget.style, v.hover)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, v.style)}>
            {children}
        </button>
    )
}

function StatTile({ label, value, tone, sub, tk }) {
    return (
        <Card tk={tk} className="p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textFaint }}>{label}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: tone ?? tk.textPrimary }}>{value ?? '—'}</p>
            {sub && <p className="text-[10px]" style={{ color: tk.textGhost }}>{sub}</p>}
        </Card>
    )
}

function Skeleton({ rows = 5, tk }) {
    return (
        <div className="space-y-px">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 animate-pulse"
                    style={{ borderBottom: `1px solid ${tk.border}` }}>
                    <div className="h-3 w-1/3 rounded-md" style={{ background: tk.bgSkeleton }} />
                    <div className="h-3 w-16 rounded-md"  style={{ background: tk.bgSkeleton }} />
                    <div className="h-3 w-24 rounded-md"  style={{ background: tk.bgSkeleton }} />
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

    const btnBase  = 'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150'
    const inactive = { background: 'transparent',          border: `1px solid ${tk.border}`,        color: tk.textFaint }
    const active   = { background: 'rgba(2,195,154,0.10)', border: '1px solid rgba(2,195,154,0.3)', color: '#02c39a'   }
    const disabled = { opacity: 0.3, cursor: 'not-allowed' }
    const hov      = { border: '1px solid rgba(2,128,144,0.35)', color: '#02c39a' }

    return (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button onClick={() => onPage(1)} disabled={currentPage === 1} className={btnBase}
                style={{ ...inactive, ...(currentPage === 1 ? disabled : {}) }}
                onMouseEnter={e => currentPage !== 1 && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== 1 && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronLeft size={12} className="inline" /><ChevronLeft size={12} className="inline -ml-1.5" />
            </button>
            <button onClick={() => onPage(currentPage - 1)} disabled={currentPage === 1} className={btnBase}
                style={{ ...inactive, ...(currentPage === 1 ? disabled : {}) }}
                onMouseEnter={e => currentPage !== 1 && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== 1 && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronLeft size={12} className="inline" /> Prev
            </button>
            {pages.map(p => (
                <button key={p} onClick={() => onPage(p)} className={btnBase}
                    style={p === currentPage ? active : inactive}
                    onMouseEnter={e => p !== currentPage && Object.assign(e.currentTarget.style, hov)}
                    onMouseLeave={e => p !== currentPage && Object.assign(e.currentTarget.style, inactive)}>
                    {p}
                </button>
            ))}
            <button onClick={() => onPage(currentPage + 1)} disabled={currentPage === totalPages} className={btnBase}
                style={{ ...inactive, ...(currentPage === totalPages ? disabled : {}) }}
                onMouseEnter={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, inactive)}>
                Next <ChevronRight size={12} className="inline" />
            </button>
            <button onClick={() => onPage(totalPages)} disabled={currentPage === totalPages} className={btnBase}
                style={{ ...inactive, ...(currentPage === totalPages ? disabled : {}) }}
                onMouseEnter={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, hov)}
                onMouseLeave={e => currentPage !== totalPages && Object.assign(e.currentTarget.style, inactive)}>
                <ChevronRight size={12} className="inline" /><ChevronRight size={12} className="inline -ml-1.5" />
            </button>
        </div>
    )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function VulnerabilityCard({ vuln, onDetails, onEdit, onDelete, canView, canEdit, canDelete, isDark, tk }) {
    const sevLabel  = SEVERITY_LABELS[vuln.severity] ?? String(vuln.severity)
    const statusKey = vuln.status?.toLowerCase() ?? 'open'
    const cvss      = getCvss(vuln)
    const days      = getDurationDays(vuln)

    return (
        <Card tk={tk} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: tk.textSecondary }}>{vuln.title}</p>
                    <p className="mt-0.5 text-[11px]" style={{ color: tk.textFaint }}>
                        {getAsset(vuln)} · {getSource(vuln)}
                    </p>
                </div>
                <Badge label={sevLabel} config={SEVERITY_CONFIG[sevLabel]} isDark={isDark} />
            </div>
            <div className="flex items-center justify-between"
                style={{ borderTop: `1px solid ${tk.border}`, paddingTop: '10px' }}>
                <div className="flex items-center gap-3">
                    <span className="text-[11px]" style={{ color: tk.textFaint }}>
                        CVSS: <span style={{ color: tk.textMuted }}>{cvss ?? '—'}</span>
                    </span>
                    <span className="text-[11px]" style={{ color: tk.textFaint }}>
                        {formatDuration(days)}
                    </span>
                    <span className="text-[11px]" style={{ color: tk.textFaint }}>{fmt(vuln.first_seen)}</span>
                </div>
                <Badge label={vuln.status ?? 'open'} config={STATUS_CONFIG[statusKey]} isDark={isDark} />
            </div>
            <div className="flex items-center gap-2">
                {canView   && <ActionBtn tk={tk} title="Details" onClick={() => onDetails(vuln._id)}><Eye size={14} /></ActionBtn>}
                {canEdit   && <ActionBtn tk={tk} title="Edit"    onClick={() => onEdit(vuln._id)}><Pencil size={14} /></ActionBtn>}
                {canDelete && <ActionBtn tk={tk} title="Delete"  variant="danger" onClick={() => onDelete(vuln)}><Trash2 size={14} /></ActionBtn>}
            </div>
        </Card>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Vulnerabilities() {
    const navigate = useNavigate()
    const { isAdmin } = useAuth()
    const { can, loading: permissionsLoading } = usePermissions()

    const isDark = useTheme()
    const tk     = useMemo(() => tokens(isDark), [isDark])

    const inputCls = useMemo(() => ({
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
    const [filterDuration,      setFilterDuration]      = useState('')  // ← backend filter (min_duration_days)
    const [filterDurationRange, setFilterDurationRange] = useState('')  // ← ③ frontend range filter
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
    const [showAddVuln,   setShowAddVuln]   = useState(false)
    const [editingId,     setEditingId]     = useState(null)

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
    }, [filterStatus, filterSeverity, filterHost, filterTitle, filterDuration,
        filterFirstSeenFrom, filterFirstSeenTo, filterLastSeenFrom, filterLastSeenTo, filterSource])

    useEffect(() => { fetchVulnerabilities() }, [fetchVulnerabilities])

    // ③ Frontend filters (source, CVSS range, duration range)
    const filteredVulns = useMemo(() => vulnerabilities.filter(vuln => {
        const source = getSource(vuln)
        const cvss   = getCvss(vuln)
        if (filterSource        && source !== filterSource)                                  return false
        if (filterCvssMin       && (cvss == null || Number(cvss) < Number(filterCvssMin))) return false
        if (filterCvssMax       && (cvss == null || Number(cvss) > Number(filterCvssMax))) return false
        if (filterDurationRange && !matchesDurationFilter(vuln, filterDurationRange))       return false
        return true
    }), [vulnerabilities, filterSource, filterCvssMin, filterCvssMax, filterDurationRange])

    const totalPages     = Math.max(1, Math.ceil(filteredVulns.length / pageSize))
    const startIndex     = (currentPage - 1) * pageSize
    const paginatedVulns = filteredVulns.slice(startIndex, startIndex + pageSize)

    const hasActiveFilters = filterTitle || filterDuration || filterStatus || filterSeverity ||
        filterHost || filterFirstSeenFrom || filterFirstSeenTo ||
        filterLastSeenFrom || filterLastSeenTo || filterSource ||
        filterCvssMin || filterCvssMax || filterDurationRange

    const resetFilters = () => {
        setFilterTitle(''); setFilterDuration(''); setFilterStatus(''); setFilterSeverity('')
        setFilterHost(''); setFilterFirstSeenFrom(''); setFilterFirstSeenTo('')
        setFilterLastSeenFrom(''); setFilterLastSeenTo(''); setFilterSource('')
        setFilterCvssMin(''); setFilterCvssMax(''); setFilterDurationRange('')
        setCurrentPage(1)
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
    const totalMedium   = stats?.bySeverity?.find(s => s._id === 2)?.count ?? 0

    const canViewDetails = isAdmin || can('VIEW_VULNERABILITY_DETAILS')
    const canEdit        = isAdmin || can('UPDATE_VULNERABILITY')
    const canDelete      = isAdmin || can('DELETE_VULNERABILITY')

    const durationRangeLabel = DURATION_OPTIONS.find(o => o.value === filterDurationRange)?.label

    const activeFilterChips = [
        filterTitle          && { label: `Search: ${filterTitle}`,                               clear: () => setFilterTitle('') },
        filterSeverity       && { label: `Severity: ${SEVERITY_LABELS[Number(filterSeverity)]}`, clear: () => setFilterSeverity('') },
        filterStatus         && { label: `Status: ${filterStatus}`,                              clear: () => setFilterStatus('') },
        filterHost           && { label: `Asset: ${filterHost}`,                                 clear: () => setFilterHost('') },
        filterSource         && { label: `Source: ${filterSource}`,                              clear: () => setFilterSource('') },
        filterCvssMin        && { label: `CVSS ≥ ${filterCvssMin}`,                              clear: () => setFilterCvssMin('') },
        filterCvssMax        && { label: `CVSS ≤ ${filterCvssMax}`,                              clear: () => setFilterCvssMax('') },
        filterDurationRange  && { label: `Duration: ${durationRangeLabel}`,                      clear: () => setFilterDurationRange('') },
        filterFirstSeenFrom  && { label: `First seen from: ${filterFirstSeenFrom}`,              clear: () => setFilterFirstSeenFrom('') },
        filterFirstSeenTo    && { label: `First seen to: ${filterFirstSeenTo}`,                  clear: () => setFilterFirstSeenTo('') },
        filterLastSeenFrom   && { label: `Last seen from: ${filterLastSeenFrom}`,                clear: () => setFilterLastSeenFrom('') },
        filterLastSeenTo     && { label: `Last seen to: ${filterLastSeenTo}`,                    clear: () => setFilterLastSeenTo('') },
    ].filter(Boolean)

    if (permissionsLoading) {
        return (
            <div className="space-y-6" style={{ color: tk.textSecondary }}>
                <div className="h-8 w-56 animate-pulse rounded-lg" style={{ background: tk.bgSkeleton }} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-xl"
                            style={{ background: tk.bgCard, border: `1px solid ${tk.border}` }} />
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
                .vuln-row:hover { background: var(--vuln-row-hover) !important; }
            `}</style>
            <style>{`:root { --vuln-row-hover: ${tk.bgCardHover}; }`}</style>

            <div className="vuln-page space-y-6" style={{ color: tk.textSecondary }}>

                {/* ── Header ── */}
                <div className="flex flex-wrap items-start justify-between gap-4"
                    style={{ borderBottom: `1px solid ${tk.border}`, paddingBottom: '20px' }}>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight" style={{ color: tk.textPrimary }}>
                            Vulnerability Management
                        </h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: tk.textFaint }}>
                            Track, triage, and remediate security vulnerabilities
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px]"
                            style={{ background: tk.bgScannerBadge, border: `1px solid ${tk.borderScannerBadge}`, color: tk.textFaint }}>
                            <RefreshCcw size={11} className={syncing ? 'animate-spin' : ''}
                                style={{ color: syncing ? '#02c39a' : tk.textFaint }} />
                            {syncing ? 'Syncing…' : 'Scanner ready'}
                        </span>

                        {/* ① Export button */}
                        <button
                            onClick={() => exportToExcel(filteredVulns)}
                            disabled={filteredVulns.length === 0}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                            style={{
                                background: 'transparent',
                                border:     `1px solid ${tk.borderAction}`,
                                color:      filteredVulns.length === 0 ? tk.textGhost : tk.textAction,
                                opacity:    filteredVulns.length === 0 ? 0.5 : 1,
                                cursor:     filteredVulns.length === 0 ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={e => { if (filteredVulns.length > 0) { e.currentTarget.style.background = tk.bgAction; e.currentTarget.style.color = '#02c39a' } }}
                            onMouseLeave={e => { if (filteredVulns.length > 0) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tk.textAction } }}>
                            <Download size={13} /> Export
                        </button>
                            {(isAdmin || can('LAUNCH_VULNERABILITY_SCAN')) && (
                                <button
                                    onClick={() => navigate('/vulnerabilities/launch')}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                                    style={{
                                        background: 'transparent',
                                        border: `1px solid ${tk.borderAction}`,
                                        color: tk.textAction
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = tk.bgAction
                                        e.currentTarget.style.color = '#02c39a'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'transparent'
                                        e.currentTarget.style.color = tk.textAction
                                    }}>
                                    <Play size={13} /> Launch Scan
                                </button>
                            )}
                        {(isAdmin || can('SYNC_VULNERABILITIES')) && (
                            <button
                                onClick={() => { setSyncing(true); navigate('/vulnerabilities/sync') }}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                                style={{ background: 'transparent', border: `1px solid ${tk.borderAction}`, color: tk.textAction }}
                                onMouseEnter={e => { e.currentTarget.style.background = tk.bgAction; e.currentTarget.style.color = '#02c39a' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tk.textAction }}>
                                <RefreshCcw size={13} /> Nessus Sync
                            </button>
                        )}
                        {(isAdmin || can('CREATE_VULNERABILITY')) && (
                            <button
                                onClick={() => setShowAddVuln(true)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                                style={{ background: '#02c39a', color: '#0d1b2a' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#02e0b1' }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#02c39a' }}>
                                <Plus size={13} /> Add Vulnerability
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <StatTile tk={tk} label="Open"     value={totalOpen}     tone="#f59e0b" />
                    <StatTile tk={tk} label="Resolved" value={totalResolved} tone="#4ade80" />
                    <StatTile tk={tk} label="Critical" value={totalCritical} tone="#ef4444" />
                    <StatTile tk={tk} label="High"     value={totalHigh}     tone="#fb923c" />
                    <StatTile tk={tk} label="Medium"   value={totalMedium}   tone="#f59e0b" />
                    <StatTile tk={tk} label="Total"
                        value={(stats?.byStatus ?? []).reduce((a, b) => a + b.count, 0)}
                        tone={tk.textSecondary}
                    />
                </div>

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
                                    {activeFilterChips.length} active
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <button onClick={e => { e.stopPropagation(); resetFilters() }}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-150"
                                    style={{ background: tk.bgDanger, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger }}
                                    onMouseEnter={e => { e.currentTarget.style.background = tk.bgDangerHover }}
                                    onMouseLeave={e => { e.currentTarget.style.background = tk.bgDanger }}>
                                    <X size={11} /> Reset
                                </button>
                            )}
                            <ChevronRight size={13}
                                style={{ color: tk.textFaint, transform: showFilters ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                    </div>

                    {showFilters && (
                        <div className="p-5 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {/* Search */}
                                <label className="flex items-center gap-2 rounded-lg px-3 py-2"
                                    style={{ background: tk.bgInputSearch, border: `1px solid ${tk.borderInput}` }}>
                                    <Search size={13} style={{ color: tk.textFaint, flexShrink: 0 }} />
                                    <input
                                        className="vuln-input w-full bg-transparent text-sm focus:outline-none"
                                        style={{ color: tk.textInput }}
                                        placeholder="Search title or asset…"
                                        value={filterTitle}
                                        onChange={e => { setFilterTitle(e.target.value); setCurrentPage(1) }}
                                    />
                                </label>

                                <select className="vuln-input" style={inputCls} value={filterSeverity}
                                    onChange={e => { setFilterSeverity(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All severities</option>
                                    <option value="4">Critical</option>
                                    <option value="3">High</option>
                                    <option value="2">Medium</option>
                                    <option value="1">Low</option>
                                    <option value="0">Info</option>
                                </select>

                                <select className="vuln-input" style={inputCls} value={filterStatus}
                                    onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All statuses</option>
                                    <option value="open">Open</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="ignored">Ignored</option>
                                </select>

                                <select className="vuln-input" style={inputCls} value={filterHost}
                                    onChange={e => { setFilterHost(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All assets</option>
                                    {hosts.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>

                                <select className="vuln-input" style={inputCls} value={filterSource}
                                    onChange={e => { setFilterSource(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All sources</option>
                                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>

                                {/* ③ Duration range filter */}
                                <select className="vuln-input" style={inputCls} value={filterDurationRange}
                                    onChange={e => { setFilterDurationRange(e.target.value); setCurrentPage(1) }}>
                                    {DURATION_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>

                                <div className="flex items-center gap-2">
                                    <input type="number" min={0} max={10} className="vuln-input" style={inputCls}
                                        placeholder="CVSS min" value={filterCvssMin}
                                        onChange={e => { setFilterCvssMin(e.target.value); setCurrentPage(1) }} />
                                    <input type="number" min={0} max={10} className="vuln-input" style={inputCls}
                                        placeholder="CVSS max" value={filterCvssMax}
                                        onChange={e => { setFilterCvssMax(e.target.value); setCurrentPage(1) }} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input type="date" className="vuln-input" style={inputCls} value={filterFirstSeenFrom}
                                        onChange={e => { setFilterFirstSeenFrom(e.target.value); setCurrentPage(1) }} />
                                    <input type="date" className="vuln-input" style={inputCls} value={filterFirstSeenTo}
                                        onChange={e => { setFilterFirstSeenTo(e.target.value); setCurrentPage(1) }} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input type="date" className="vuln-input" style={inputCls} value={filterLastSeenFrom}
                                        onChange={e => { setFilterLastSeenFrom(e.target.value); setCurrentPage(1) }} />
                                    <input type="date" className="vuln-input" style={inputCls} value={filterLastSeenTo}
                                        onChange={e => { setFilterLastSeenTo(e.target.value); setCurrentPage(1) }} />
                                </div>
                            </div>

                            {activeFilterChips.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1" style={{ borderTop: `1px solid ${tk.border}` }}>
                                    {activeFilterChips.map(chip => (
                                        <FilterChip key={chip.label} label={chip.label} onRemove={chip.clear} tk={tk} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* ── Count + page size ── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: tk.textFaint }}>
                        {loading ? 'Loading…' : (
                            filteredVulns.length === 0 ? 'No results' :
                            `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, filteredVulns.length)} of ${filteredVulns.length} vulnerabilities`
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: tk.textFaint }}>Rows:</span>
                        <select className="rounded-lg px-2 py-1 text-xs transition-all duration-150"
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

                {/* ── Loading ── */}
                {loading && <Card tk={tk}><Skeleton rows={5} tk={tk} /></Card>}

                {/* ── Empty ── */}
                {!loading && !error && filteredVulns.length === 0 && (
                    <Card tk={tk} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div>
                                <p className="text-sm font-medium" style={{ color: tk.textMuted }}>No vulnerabilities found</p>
                                <p className="mt-1 text-[11px]" style={{ color: tk.textFaint }}>
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'Your environment looks clean'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasActiveFilters && (
                                    <button onClick={resetFilters} className="text-xs transition-opacity hover:opacity-70"
                                        style={{ color: '#02c39a' }}>
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* ── Desktop Table ── */}
                {!loading && filteredVulns.length > 0 && (
                    <>
                        <Card tk={tk} className="hidden md:block overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px]" style={{ borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: tk.bgThead, borderBottom: `1px solid ${tk.border}` }}>
                                            {/* ② 'Duration' est maintenant une colonne dédiée */}
                                            {['Vulnerability', 'Severity', 'CVSS', 'Asset', 'Source', 'Duration', 'Detected', 'Status', 'Actions'].map((h, i) => (
                                                <th key={h}
                                                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                                                    style={{ color: tk.textFaint, textAlign: i === 8 ? 'right' : 'left' }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedVulns.map(vuln => {
                                            const sevLabel  = SEVERITY_LABELS[vuln.severity] ?? String(vuln.severity)
                                            const statusKey = vuln.status?.toLowerCase() ?? 'open'
                                            const cvss      = getCvss(vuln)
                                            const days      = getDurationDays(vuln)
                                            return (
                                                <tr key={vuln._id} className="vuln-row"
                                                    style={{ background: 'transparent', borderBottom: `1px solid ${tk.borderSubtle}`, transition: 'background 0.15s' }}>

                                                    {/* ② Vulnerability — sans duration */}
                                                    <td className="px-4 py-3 max-w-[280px]">
                                                        <p className="truncate text-sm font-medium" style={{ color: tk.textSecondary }}>{vuln.title}</p>
                                                        <p className="text-[11px] mt-0.5" style={{ color: tk.textFaint }}>
                                                            {getAsset(vuln)} · {vuln.port ? `Port ${vuln.port}` : 'No port'}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <Badge label={sevLabel} config={SEVERITY_CONFIG[sevLabel]} isDark={isDark} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-semibold tabular-nums" style={{ color: tk.textMuted }}>
                                                            {cvss ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-mono" style={{ color: tk.textFaint }}>{getAsset(vuln)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs" style={{ color: tk.textFaint }}>{getSource(vuln)}</span>
                                                    </td>

                                                    {/* ② Colonne Duration dédiée */}
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs tabular-nums font-medium" style={{ color: tk.textMuted }}>
                                                            {formatDuration(days)}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <span className="text-xs" style={{ color: tk.textFaint }}>{fmt(vuln.first_seen)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge label={vuln.status ?? 'open'} config={STATUS_CONFIG[statusKey]} isDark={isDark} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {canViewDetails && <ActionBtn tk={tk} title="Details" onClick={() => handleViewDetails(vuln._id)}><Eye size={13} /></ActionBtn>}
                                                            {canEdit        && <ActionBtn tk={tk} title="Edit"    onClick={() => setEditingId(vuln._id)}><Pencil size={13} /></ActionBtn>}
                                                            {canDelete      && <ActionBtn tk={tk} title="Delete"  variant="danger" onClick={() => setDeleteTarget({ id: vuln._id, name: vuln.title })}><Trash2 size={13} /></ActionBtn>}
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
                                    key={vuln._id} vuln={vuln}
                                    onDetails={handleViewDetails}
                                    onEdit={(id) => navigate(`/vulnerabilities/edit/${id}`)}
                                    onDelete={(item) => setDeleteTarget({ id: item._id, name: item.title })}
                                    canView={canViewDetails} canEdit={canEdit} canDelete={canDelete}
                                    isDark={isDark} tk={tk}
                                />
                            ))}
                        </div>
                    </>
                )}

                {showAddVuln && (
                    <AddVulnerability onClose={() => setShowAddVuln(false)} onSaved={() => fetchVulnerabilities()} />
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
                    <PaginationBar currentPage={currentPage} totalPages={totalPages} onPage={setCurrentPage} tk={tk} />
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: tk.bgLoadingModal }}>
                        <div className="flex items-center gap-3 rounded-xl px-6 py-4"
                            style={{ background: tk.bgLoadingCard, border: `1px solid ${tk.border}`, boxShadow: tk.shadowLoadingCard }}>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                                style={{ color: '#02c39a' }} />
                            <span className="text-sm" style={{ color: tk.textMuted }}>Loading details…</span>
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