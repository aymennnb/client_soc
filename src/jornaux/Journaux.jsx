'use strict'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../api'

import {
    Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
    ShieldAlert, Activity, CheckCircle2, XCircle, AlertTriangle,
    User, Ticket, Bug, FileWarning, RefreshCcw, Lock, Trash2,
    Plus, Pencil, LogIn, LogOut, UserCheck, UserX, ClipboardList,
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

        border:          d ? '#1b263b'                    : '#e2e8f0',
        borderSubtle:    d ? 'rgba(27,38,59,0.6)'         : 'rgba(226,232,240,0.9)',
        borderInput:     d ? '#1b263b'                    : '#cbd5e1',
        borderAction:    d ? 'rgba(2,128,144,0.25)'       : 'rgba(2,128,144,0.3)',
        borderDanger:    d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderFilterChip:d ? 'rgba(2,128,144,0.2)'        : 'rgba(2,128,144,0.25)',

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

// ─── Action config ────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
    // Incidents
    CREATE_INCIDENT:   { bg: (d) => d ? 'rgba(34,197,94,0.10)'   : 'rgba(22,163,74,0.09)',   text: (d) => d ? '#4ade80'  : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.28)'   : 'rgba(22,163,74,0.28)',   icon: Plus       },
    UPDATE_INCIDENT:   { bg: (d) => d ? 'rgba(56,189,248,0.10)'  : 'rgba(14,165,233,0.09)',  text: (d) => d ? '#38bdf8'  : '#0c4a6e', border: (d) => d ? 'rgba(56,189,248,0.28)'  : 'rgba(14,165,233,0.28)',  icon: Pencil     },
    DELETE_INCIDENT:   { bg: (d) => d ? 'rgba(239,68,68,0.10)'   : 'rgba(220,38,38,0.09)',   text: (d) => d ? '#f87171'  : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.28)'   : 'rgba(220,38,38,0.28)',   icon: Trash2     },
    SYNC_INCIDENTS:    { bg: (d) => d ? 'rgba(168,85,247,0.10)'  : 'rgba(147,51,234,0.09)',  text: (d) => d ? '#c084fc'  : '#581c87', border: (d) => d ? 'rgba(168,85,247,0.28)'  : 'rgba(147,51,234,0.28)',  icon: RefreshCcw },
    // Vulnerabilities
    CREATE_VULNERABILITY: { bg: (d) => d ? 'rgba(34,197,94,0.10)'  : 'rgba(22,163,74,0.09)',  text: (d) => d ? '#4ade80'  : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.28)'   : 'rgba(22,163,74,0.28)',   icon: Plus       },
    UPDATE_VULNERABILITY: { bg: (d) => d ? 'rgba(56,189,248,0.10)' : 'rgba(14,165,233,0.09)', text: (d) => d ? '#38bdf8'  : '#0c4a6e', border: (d) => d ? 'rgba(56,189,248,0.28)'  : 'rgba(14,165,233,0.28)',  icon: Pencil     },
    DELETE_VULNERABILITY: { bg: (d) => d ? 'rgba(239,68,68,0.10)'  : 'rgba(220,38,38,0.09)',  text: (d) => d ? '#f87171'  : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.28)'   : 'rgba(220,38,38,0.28)',   icon: Trash2     },
    SYNC_VULNERABILITIES: { bg: (d) => d ? 'rgba(168,85,247,0.10)' : 'rgba(147,51,234,0.09)', text: (d) => d ? '#c084fc'  : '#581c87', border: (d) => d ? 'rgba(168,85,247,0.28)'  : 'rgba(147,51,234,0.28)',  icon: RefreshCcw },
    // Tickets
    CREATE_TICKET:        { bg: (d) => d ? 'rgba(34,197,94,0.10)'  : 'rgba(22,163,74,0.09)',  text: (d) => d ? '#4ade80'  : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.28)'   : 'rgba(22,163,74,0.28)',   icon: Plus       },
    UPDATE_TICKET:        { bg: (d) => d ? 'rgba(56,189,248,0.10)' : 'rgba(14,165,233,0.09)', text: (d) => d ? '#38bdf8'  : '#0c4a6e', border: (d) => d ? 'rgba(56,189,248,0.28)'  : 'rgba(14,165,233,0.28)',  icon: Pencil     },
    DELETE_TICKET:        { bg: (d) => d ? 'rgba(239,68,68,0.10)'  : 'rgba(220,38,38,0.09)',  text: (d) => d ? '#f87171'  : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.28)'   : 'rgba(220,38,38,0.28)',   icon: Trash2     },
    ASSIGN_TICKET:        { bg: (d) => d ? 'rgba(245,158,11,0.10)' : 'rgba(217,119,6,0.09)',  text: (d) => d ? '#fbbf24'  : '#78350f', border: (d) => d ? 'rgba(245,158,11,0.28)'  : 'rgba(217,119,6,0.28)',   icon: UserCheck  },
    CHANGE_TICKET_STATUS: { bg: (d) => d ? 'rgba(249,115,22,0.10)' : 'rgba(234,88,12,0.09)',  text: (d) => d ? '#fb923c'  : '#7c2d12', border: (d) => d ? 'rgba(249,115,22,0.28)'  : 'rgba(234,88,12,0.28)',   icon: ClipboardList },
    // Users
    CREATE_USER:      { bg: (d) => d ? 'rgba(34,197,94,0.10)'   : 'rgba(22,163,74,0.09)',   text: (d) => d ? '#4ade80'  : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.28)'   : 'rgba(22,163,74,0.28)',   icon: Plus       },
    UPDATE_USER:      { bg: (d) => d ? 'rgba(56,189,248,0.10)'  : 'rgba(14,165,233,0.09)',  text: (d) => d ? '#38bdf8'  : '#0c4a6e', border: (d) => d ? 'rgba(56,189,248,0.28)'  : 'rgba(14,165,233,0.28)',  icon: Pencil     },
    DELETE_USER:      { bg: (d) => d ? 'rgba(239,68,68,0.10)'   : 'rgba(220,38,38,0.09)',   text: (d) => d ? '#f87171'  : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.28)'   : 'rgba(220,38,38,0.28)',   icon: Trash2     },
    ACTIVATE_USER:    { bg: (d) => d ? 'rgba(34,197,94,0.10)'   : 'rgba(22,163,74,0.09)',   text: (d) => d ? '#4ade80'  : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.28)'   : 'rgba(22,163,74,0.28)',   icon: UserCheck  },
    DEACTIVATE_USER:  { bg: (d) => d ? 'rgba(239,68,68,0.10)'   : 'rgba(220,38,38,0.09)',   text: (d) => d ? '#f87171'  : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.28)'   : 'rgba(220,38,38,0.28)',   icon: UserX      },
    ASSIGN_ROLE:      { bg: (d) => d ? 'rgba(245,158,11,0.10)'  : 'rgba(217,119,6,0.09)',   text: (d) => d ? '#fbbf24'  : '#78350f', border: (d) => d ? 'rgba(245,158,11,0.28)'  : 'rgba(217,119,6,0.28)',   icon: Lock       },
    LOGIN_SUCCESS: { bg: (d) => d ? 'rgba(34,197,94,0.10)'  : 'rgba(22,163,74,0.09)',  text: (d) => d ? '#4ade80' : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.28)'  : 'rgba(22,163,74,0.28)',  icon: LogIn  },
    LOGIN_FAILED:  { bg: (d) => d ? 'rgba(239,68,68,0.10)'  : 'rgba(220,38,38,0.09)',  text: (d) => d ? '#f87171' : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.28)'  : 'rgba(220,38,38,0.28)',  icon: AlertTriangle },
    LOGOUT:        { bg: (d) => d ? 'rgba(100,116,139,0.10)': 'rgba(100,116,139,0.09)',text: (d) => d ? '#94a3b8' : '#334155', border: (d) => d ? 'rgba(100,116,139,0.28)': 'rgba(100,116,139,0.28)', icon: LogOut },
    ASSIGN_PERMISSION:   { bg: (d) => d ? 'rgba(34,197,94,0.10)'  : 'rgba(22,163,74,0.09)',  text: (d) => d ? '#4ade80' : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.28)'  : 'rgba(22,163,74,0.28)',  icon: Lock },
    UNASSIGN_PERMISSION: { bg: (d) => d ? 'rgba(239,68,68,0.10)'  : 'rgba(220,38,38,0.09)',  text: (d) => d ? '#f87171' : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.28)'  : 'rgba(220,38,38,0.28)',  icon: Lock },
}

const ACTION_FALLBACK = { bg: (d) => d ? 'rgba(100,116,139,0.10)' : 'rgba(100,116,139,0.09)', text: (d) => d ? '#94a3b8' : '#334155', border: (d) => d ? 'rgba(100,116,139,0.25)' : 'rgba(100,116,139,0.28)', icon: Activity }

const TARGET_TYPE_CONFIG = {
    Incident:      { bg: (d) => d ? 'rgba(249,115,22,0.10)'  : 'rgba(234,88,12,0.09)',  text: (d) => d ? '#fb923c' : '#7c2d12', border: (d) => d ? 'rgba(249,115,22,0.25)'  : 'rgba(234,88,12,0.28)',  icon: ShieldAlert  },
    Vulnerability: { bg: (d) => d ? 'rgba(239,68,68,0.10)'   : 'rgba(220,38,38,0.09)',  text: (d) => d ? '#f87171' : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.25)'   : 'rgba(220,38,38,0.28)',  icon: Bug          },
    Ticket:        { bg: (d) => d ? 'rgba(56,189,248,0.10)'  : 'rgba(14,165,233,0.09)', text: (d) => d ? '#38bdf8' : '#0c4a6e', border: (d) => d ? 'rgba(56,189,248,0.25)'  : 'rgba(14,165,233,0.28)', icon: Ticket       },
    User:          { bg: (d) => d ? 'rgba(168,85,247,0.10)'  : 'rgba(147,51,234,0.09)', text: (d) => d ? '#c084fc' : '#581c87', border: (d) => d ? 'rgba(168,85,247,0.25)'  : 'rgba(147,51,234,0.28)', icon: User         },
    Authentication: { bg: (d) => d ? 'rgba(245,158,11,0.10)' : 'rgba(217,119,6,0.09)', text: (d) => d ? '#fbbf24' : '#78350f', border: (d) => d ? 'rgba(245,158,11,0.25)' : 'rgba(217,119,6,0.28)', icon: Lock },
}

const TARGET_FALLBACK = { bg: (d) => d ? 'rgba(100,116,139,0.10)' : 'rgba(100,116,139,0.09)', text: (d) => d ? '#94a3b8' : '#334155', border: (d) => d ? 'rgba(100,116,139,0.25)' : 'rgba(100,116,139,0.28)', icon: FileWarning }

const STATUS_CONFIG = {
    success: { bg: (d) => d ? 'rgba(34,197,94,0.10)'  : 'rgba(22,163,74,0.09)',  text: (d) => d ? '#4ade80'  : '#14532d', border: (d) => d ? 'rgba(34,197,94,0.25)'  : 'rgba(22,163,74,0.28)'  },
    failure: { bg: (d) => d ? 'rgba(239,68,68,0.10)'  : 'rgba(220,38,38,0.09)',  text: (d) => d ? '#f87171'  : '#7f1d1d', border: (d) => d ? 'rgba(239,68,68,0.25)'  : 'rgba(220,38,38,0.28)'  },
}

const STATUS_FALLBACK = { bg: (d) => d ? 'rgba(100,116,139,0.10)' : 'rgba(100,116,139,0.09)', text: (d) => d ? '#94a3b8' : '#334155', border: (d) => d ? 'rgba(100,116,139,0.25)' : 'rgba(100,116,139,0.28)' }

// ─── All known actions & target types for filter dropdowns ───────────────────

const ALL_ACTIONS = [...Object.keys(ACTION_CONFIG)]

const ALL_TARGET_TYPES = ['Incident', 'Vulnerability', 'Ticket', 'User', 'Authentication']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const fmt = (dateStr) => {
    try {
        return new Date(dateStr).toLocaleString('en-GB', {
            day:    '2-digit', month: 'short', year: 'numeric',
            hour:   '2-digit', minute: '2-digit', second: '2-digit',
        })
    } catch { return '—' }
}

const truncateId = (id) => {
    if (!id) return '—'
    if (id.length <= 16) return id
    return `${id.slice(0, 8)}…${id.slice(-4)}`
}

const formatActionLabel = (action) =>
    action?.replace(/_/g, ' ') ?? '—'

const formatMetadata = (metadata) => {
    if (!metadata || typeof metadata !== 'object') return null
    const entries = Object.entries(metadata)
    if (entries.length === 0) return null
    return entries
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

function Badge({ label, config, isDark, iconEl }) {
    const bg     = typeof config?.bg     === 'function' ? config.bg(isDark)     : (config?.bg     ?? 'rgba(100,116,139,0.12)')
    const text   = typeof config?.text   === 'function' ? config.text(isDark)   : (config?.text   ?? '#94a3b8')
    const border = typeof config?.border === 'function' ? config.border(isDark) : (config?.border ?? 'rgba(100,116,139,0.25)')
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
            style={{ background: bg, color: text, border: `1px solid ${border}` }}>
            {iconEl}
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

function StatTile({ label, value, tone, icon: Icon, sub, tk }) {
    return (
        <Card tk={tk} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textFaint }}>{label}</p>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: tone ?? tk.textPrimary }}>{value ?? '—'}</p>
            {sub && <p className="text-[10px]" style={{ color: tk.textGhost }}>{sub}</p>}
        </Card>
    )
}

function Skeleton({ rows = 8, tk }) {
    return (
        <div className="space-y-px">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 animate-pulse"
                    style={{ borderBottom: `1px solid ${tk.border}` }}>
                    <div className="h-3 w-24  rounded-md" style={{ background: tk.bgSkeleton }} />
                    <div className="h-3 w-36  rounded-md" style={{ background: tk.bgSkeleton }} />
                    <div className="h-3 w-20  rounded-md" style={{ background: tk.bgSkeleton }} />
                    <div className="h-3 w-16  rounded-md" style={{ background: tk.bgSkeleton }} />
                    <div className="h-3 w-28  rounded-md" style={{ background: tk.bgSkeleton }} />
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

// ─── Metadata cell ────────────────────────────────────────────────────────────

function MetadataCell({ metadata, tk }) {
    const [expanded, setExpanded] = useState(false)

    if (!metadata || typeof metadata !== 'object') {
        return <span style={{ color: tk.textGhost }}>—</span>
    }

    const entries = Object.entries(metadata)
    if (entries.length === 0) return <span style={{ color: tk.textGhost }}>—</span>

    const preview = entries.slice(0, 2)
    const hasMore = entries.length > 2

    const renderValue = (v) => {
        if (Array.isArray(v)) return v.join(', ')
        if (v === null || v === undefined) return '—'
        return String(v)
    }

    return (
        <div className="space-y-0.5 text-[11px]">
            {(expanded ? entries : preview).map(([k, v]) => (
                <div key={k} className="flex items-start gap-1.5">
                    <span className="shrink-0 font-mono font-medium" style={{ color: tk.textFaint }}>{k}:</span>
                    <span className="break-all" style={{ color: tk.textMuted }}>{renderValue(v)}</span>
                </div>
            ))}
            {hasMore && (
                <button
                    onClick={() => setExpanded(x => !x)}
                    className="text-[10px] font-semibold transition-opacity hover:opacity-80"
                    style={{ color: '#02c39a' }}>
                    {expanded ? '▲ less' : `▼ +${entries.length - 2} more`}
                </button>
            )}
        </div>
    )
}

// ─── Mobile Log Card ──────────────────────────────────────────────────────────

function LogCard({ log, isDark, tk }) {
    const actionCfg     = ACTION_CONFIG[log.action]   ?? ACTION_FALLBACK
    const targetCfg     = TARGET_TYPE_CONFIG[log.target_type] ?? TARGET_FALLBACK
    const statusCfg     = STATUS_CONFIG[log.status]   ?? STATUS_FALLBACK
    const ActionIcon    = actionCfg.icon
    const TargetIcon    = targetCfg.icon

    return (
        <Card tk={tk} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-1.5">
                    <Badge
                        label={formatActionLabel(log.action)}
                        config={actionCfg}
                        isDark={isDark}
                        iconEl={<ActionIcon size={10} />}
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge label={log.target_type ?? '—'} config={targetCfg} isDark={isDark} iconEl={<TargetIcon size={10} />} />
                        <Badge label={log.status ?? '—'} config={statusCfg} isDark={isDark} />
                    </div>
                </div>
            </div>
            <div className="space-y-1 text-[11px]" style={{ borderTop: `1px solid ${tk.border}`, paddingTop: '10px' }}>
                <div className="flex items-center gap-1.5">
                    <User size={10} style={{ color: tk.textFaint }} />
                    <span style={{ color: tk.textMuted }}>{log.username ?? '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span style={{ color: tk.textFaint }}>ID:</span>
                    <span className="font-mono" style={{ color: tk.textMuted }}>{truncateId(log.target_id)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span style={{ color: tk.textFaint }}>IP:</span>
                    <span className="font-mono" style={{ color: tk.textMuted }}>{log.ip_address ?? '—'}</span>
                </div>
                <div style={{ color: tk.textFaint }}>{fmt(log.created_at)}</div>
            </div>
            <div style={{ borderTop: `1px solid ${tk.border}`, paddingTop: '10px' }}>
                <MetadataCell metadata={log.metadata} tk={tk} />
            </div>
        </Card>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Journals() {
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

    const [journals,    setJournals]    = useState([])
    const [loading,     setLoading]     = useState(true)
    const [error,       setError]       = useState('')

    const [filterSearch,     setFilterSearch]     = useState('')
    const [filterAction,     setFilterAction]     = useState('')
    const [filterTargetType, setFilterTargetType] = useState('')
    const [filterStatus,     setFilterStatus]     = useState('')
    const [filterUsername,   setFilterUsername]   = useState('')
    const [filterDateFrom,   setFilterDateFrom]   = useState('')
    const [filterDateTo,     setFilterDateTo]     = useState('')
    const [showFilters,      setShowFilters]      = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize,    setPageSize]    = useState(25)

    const fetchJournals = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res      = await api.get('/journals')
            const list     = res.data.journals || res.data || []
            setJournals(list)
            setCurrentPage(1)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load activity logs.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchJournals() }, [fetchJournals])

    // ─── Frontend filtering ───────────────────────────────────────────────────

    const filteredJournals = useMemo(() => journals.filter(log => {
        if (filterAction     && log.action      !== filterAction)      return false
        if (filterTargetType && log.target_type !== filterTargetType)  return false
        if (filterStatus     && log.status      !== filterStatus)       return false
        if (filterUsername   && !(log.username ?? '').toLowerCase().includes(filterUsername.toLowerCase())) return false
        if (filterSearch) {
            const q = filterSearch.toLowerCase()
            const metaStr = JSON.stringify(log.metadata ?? '').toLowerCase()
            if (
                !(log.action      ?? '').toLowerCase().includes(q) &&
                !(log.username    ?? '').toLowerCase().includes(q) &&
                !(log.target_type ?? '').toLowerCase().includes(q) &&
                !(log.target_id   ?? '').toLowerCase().includes(q) &&
                !(log.ip_address  ?? '').toLowerCase().includes(q) &&
                !metaStr.includes(q)
            ) return false
        }
        if (filterDateFrom) {
            if (new Date(log.created_at) < new Date(filterDateFrom)) return false
        }
        if (filterDateTo) {
            const to = new Date(filterDateTo)
            to.setHours(23, 59, 59, 999)
            if (new Date(log.created_at) > to) return false
        }
        return true
    }), [journals, filterAction, filterTargetType, filterStatus, filterUsername, filterSearch, filterDateFrom, filterDateTo])

    // ─── Stats ───────────────────────────────────────────────────────────────

    const stats = useMemo(() => ({
        total:           journals.length,
        success:         journals.filter(l => l.status === 'success').length,
        failure:         journals.filter(l => l.status === 'failure').length,
        incidents:       journals.filter(l => l.target_type === 'Incident').length,
        vulnerabilities: journals.filter(l => l.target_type === 'Vulnerability').length,
        tickets:         journals.filter(l => l.target_type === 'Ticket').length,
        users:           journals.filter(l => l.target_type === 'User').length,
    }), [journals])

    // ─── Pagination ───────────────────────────────────────────────────────────

    const totalPages     = Math.max(1, Math.ceil(filteredJournals.length / pageSize))
    const startIndex     = (currentPage - 1) * pageSize
    const paginatedLogs  = filteredJournals.slice(startIndex, startIndex + pageSize)

    // ─── Unique usernames for filter dropdown ─────────────────────────────────

    const allUsernames = useMemo(() =>
        [...new Set(journals.map(l => l.username).filter(Boolean))].sort(),
    [journals])

    // ─── Active filters ───────────────────────────────────────────────────────

    const hasActiveFilters = filterSearch || filterAction || filterTargetType ||
        filterStatus || filterUsername || filterDateFrom || filterDateTo

    const resetFilters = () => {
        setFilterSearch(''); setFilterAction(''); setFilterTargetType('')
        setFilterStatus(''); setFilterUsername('')
        setFilterDateFrom(''); setFilterDateTo('')
        setCurrentPage(1)
    }

    const activeFilterChips = [
        filterSearch     && { label: `Search: ${filterSearch}`,         clear: () => setFilterSearch('')     },
        filterAction     && { label: `Action: ${formatActionLabel(filterAction)}`, clear: () => setFilterAction('')     },
        filterTargetType && { label: `Type: ${filterTargetType}`,        clear: () => setFilterTargetType('') },
        filterStatus     && { label: `Status: ${filterStatus}`,          clear: () => setFilterStatus('')     },
        filterUsername   && { label: `User: ${filterUsername}`,          clear: () => setFilterUsername('')   },
        filterDateFrom   && { label: `From: ${filterDateFrom}`,          clear: () => setFilterDateFrom('')   },
        filterDateTo     && { label: `To: ${filterDateTo}`,              clear: () => setFilterDateTo('')     },
    ].filter(Boolean)

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <style>{`
                @keyframes journal-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
                .journal-page { animation: journal-fadein 0.35s ease-out both; }
                .journal-input:focus { border-color: rgba(2,195,154,0.5) !important; box-shadow: 0 0 0 3px rgba(2,195,154,0.08); }
                .journal-row:hover { background: var(--journal-row-hover) !important; }
            `}</style>
            <style>{`:root { --journal-row-hover: ${tk.bgCardHover}; }`}</style>

            <div className="journal-page space-y-6" style={{ color: tk.textSecondary }}>

                {/* ── Header ── */}
                <div className="flex flex-wrap items-start justify-between gap-4"
                    style={{ borderBottom: `1px solid ${tk.border}`, paddingBottom: '20px' }}>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight" style={{ color: tk.textPrimary }}>
                            Activity Logs
                        </h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: tk.textFaint }}>
                            Audit trail of all actions performed across the platform
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={fetchJournals}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: 'transparent', border: `1px solid ${tk.borderAction}`, color: tk.textAction }}
                            onMouseEnter={e => { e.currentTarget.style.background = tk.bgAction; e.currentTarget.style.color = '#02c39a' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tk.textAction }}>
                            <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                    <StatTile tk={tk} label="Total"           value={stats.total}           tone={tk.textSecondary} icon={Activity}    />
                    <StatTile tk={tk} label="Success"         value={stats.success}          tone="#4ade80"          icon={CheckCircle2} />
                    <StatTile tk={tk} label="Failed"          value={stats.failure}          tone="#f87171"          icon={XCircle}      />
                    <StatTile tk={tk} label="Incidents"       value={stats.incidents}        tone="#fb923c"          icon={ShieldAlert}  />
                    <StatTile tk={tk} label="Vulnerabilities" value={stats.vulnerabilities}  tone="#ef4444"          icon={Bug}          />
                    <StatTile tk={tk} label="Tickets"         value={stats.tickets}          tone="#38bdf8"          icon={ClipboardList}/>
                    <StatTile tk={tk} label="Users"           value={stats.users}            tone="#c084fc"          icon={User}         />
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
                                {/* Global search */}
                                <label className="flex items-center gap-2 rounded-lg px-3 py-2"
                                    style={{ background: tk.bgInputSearch, border: `1px solid ${tk.borderInput}` }}>
                                    <Search size={13} style={{ color: tk.textFaint, flexShrink: 0 }} />
                                    <input
                                        className="journal-input w-full bg-transparent text-sm focus:outline-none"
                                        style={{ color: tk.textInput }}
                                        placeholder="Search action, user, ID, metadata…"
                                        value={filterSearch}
                                        onChange={e => { setFilterSearch(e.target.value); setCurrentPage(1) }}
                                    />
                                </label>

                                {/* Action */}
                                <select className="journal-input" style={inputCls} value={filterAction}
                                    onChange={e => { setFilterAction(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All actions</option>
                                    {ALL_ACTIONS.map(a => (
                                        <option key={a} value={a}>{formatActionLabel(a)}</option>
                                    ))}
                                </select>

                                {/* Target type */}
                                <select className="journal-input" style={inputCls} value={filterTargetType}
                                    onChange={e => { setFilterTargetType(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All types</option>
                                    {ALL_TARGET_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>

                                {/* Status */}
                                <select className="journal-input" style={inputCls} value={filterStatus}
                                    onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All statuses</option>
                                    <option value="success">Success</option>
                                    <option value="failure">Failure</option>
                                </select>

                                {/* Username */}
                                <select className="journal-input" style={inputCls} value={filterUsername}
                                    onChange={e => { setFilterUsername(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All users</option>
                                    {allUsernames.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>

                                {/* Date range */}
                                <div className="flex items-center gap-2">
                                    <input type="date" className="journal-input" style={inputCls}
                                        value={filterDateFrom}
                                        onChange={e => { setFilterDateFrom(e.target.value); setCurrentPage(1) }} />
                                    <input type="date" className="journal-input" style={inputCls}
                                        value={filterDateTo}
                                        onChange={e => { setFilterDateTo(e.target.value); setCurrentPage(1) }} />
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
                            filteredJournals.length === 0 ? 'No results' :
                            `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, filteredJournals.length)} of ${filteredJournals.length} logs`
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
                        style={{ background: tk.bgErrorMsg, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger }}>
                        {error}
                    </div>
                )}

                {/* ── Loading ── */}
                {loading && <Card tk={tk}><Skeleton rows={8} tk={tk} /></Card>}

                {/* ── Empty state ── */}
                {!loading && !error && filteredJournals.length === 0 && (
                    <Card tk={tk} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div>
                                <p className="text-sm font-medium" style={{ color: tk.textMuted }}>No logs found</p>
                                <p className="mt-1 text-[11px]" style={{ color: tk.textFaint }}>
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'No activity has been recorded yet'}
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

                {/* ── Desktop table ── */}
                {!loading && filteredJournals.length > 0 && (
                    <>
                        <Card tk={tk} className="hidden md:block overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px]" style={{ borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: tk.bgThead, borderBottom: `1px solid ${tk.border}` }}>
                                            {['Date', 'User', 'Action', 'Type', 'Target ID', 'IP Address', 'Status', 'Metadata'].map((h, i) => (
                                                <th key={h}
                                                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                                                    style={{ color: tk.textFaint, textAlign: 'left', whiteSpace: 'nowrap' }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedLogs.map(log => {
                                            const actionCfg  = ACTION_CONFIG[log.action]         ?? ACTION_FALLBACK
                                            const targetCfg  = TARGET_TYPE_CONFIG[log.target_type] ?? TARGET_FALLBACK
                                            const statusCfg  = STATUS_CONFIG[log.status]          ?? STATUS_FALLBACK
                                            const ActionIcon = actionCfg.icon
                                            const TargetIcon = targetCfg.icon

                                            return (
                                                <tr key={log._id} className="journal-row"
                                                    style={{ background: 'transparent', borderBottom: `1px solid ${tk.borderSubtle}`, transition: 'background 0.15s' }}>

                                                    {/* Date */}
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="text-[11px] tabular-nums" style={{ color: tk.textFaint }}>
                                                            {fmt(log.created_at)}
                                                        </span>
                                                    </td>

                                                    {/* User */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-medium" style={{ color: tk.textMuted }}>
                                                                {log.username ?? '—'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Action */}
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            label={formatActionLabel(log.action)}
                                                            config={actionCfg}
                                                            isDark={isDark}
                                                        />
                                                    </td>

                                                    {/* Target type */}
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            label={log.target_type ?? '—'}
                                                            config={targetCfg}
                                                            isDark={isDark}
                                                        />
                                                    </td>

                                                    {/* Target ID */}
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className="font-mono text-[11px]"
                                                            style={{ color: tk.textFaint }}
                                                            title={log.target_id ?? ''}>
                                                            {truncateId(log.target_id)}
                                                        </span>
                                                    </td>

                                                    {/* IP */}
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-[11px]" style={{ color: tk.textFaint }}>
                                                            {log.ip_address ?? '—'}
                                                        </span>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            label={log.status ?? '—'}
                                                            config={statusCfg}
                                                            isDark={isDark}
                                                        />
                                                    </td>

                                                    {/* Metadata */}
                                                    <td className="px-4 py-3 max-w-[260px]">
                                                        <MetadataCell metadata={log.metadata} tk={tk} />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* ── Mobile cards ── */}
                        <div className="grid gap-3 md:hidden">
                            {paginatedLogs.map(log => (
                                <LogCard key={log._id} log={log} isDark={isDark} tk={tk} />
                            ))}
                        </div>
                    </>
                )}

                {/* ── Pagination ── */}
                {!loading && filteredJournals.length > pageSize && (
                    <PaginationBar currentPage={currentPage} totalPages={totalPages} onPage={setCurrentPage} tk={tk} />
                )}
            </div>
        </>
    )
}

export default Journals