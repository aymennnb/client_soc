import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../api'
import CreateUser from './CreateUser'
import EditUser from './EditUser'
import DeleteModal from '../componants/DeleteModal'

import {
    Plus, Search, SlidersHorizontal, X,
    ChevronLeft, ChevronRight, Pencil, Shield, Trash2
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
        bgCard:          d ? 'rgba(13,27,42,0.7)'         : 'rgba(255,255,255,0.97)',
        bgCardHover:     d ? 'rgba(2,128,144,0.06)'       : 'rgba(2,128,144,0.04)',
        bgSubtle:        d ? 'rgba(27,38,59,0.4)'         : 'rgba(241,245,249,0.8)',
        bgThead:         d ? 'rgba(6,14,22,0.8)'          : 'rgba(248,250,252,0.95)',
        bgInput:         d ? 'rgba(10,18,21,0.8)'         : '#ffffff',
        bgInputSearch:   d ? 'rgba(10,18,21,0.8)'         : '#ffffff',
        bgSkeleton:      d ? 'rgba(27,38,59,0.8)'         : 'rgba(203,213,225,0.6)',
        bgBtnDefault:    d ? 'rgba(27,38,59,0.4)'         : 'rgba(241,245,249,0.9)',
        bgDanger:        d ? 'rgba(239,68,68,0.06)'       : 'rgba(220,38,38,0.05)',
        bgDangerHover:   d ? 'rgba(239,68,68,0.14)'       : 'rgba(220,38,38,0.1)',
        bgErrorMsg:      d ? 'rgba(239,68,68,0.08)'       : 'rgba(220,38,38,0.06)',
        bgFilterActive:  d ? 'rgba(2,195,154,0.12)'       : 'rgba(2,128,144,0.09)',
        bgFilterChip:    d ? 'rgba(2,128,144,0.08)'       : 'rgba(2,128,144,0.07)',
        bgAction:        d ? 'rgba(2,128,144,0.12)'       : 'rgba(2,128,144,0.07)',
        bgActionHover:   d ? 'rgba(2,128,144,0.18)'       : 'rgba(2,128,144,0.13)',
        bgEmpty:         d ? 'rgba(2,128,144,0.1)'        : 'rgba(2,128,144,0.07)',

        border:          d ? '#1b263b'                    : '#e2e8f0',
        borderSubtle:    d ? 'rgba(27,38,59,0.6)'         : 'rgba(226,232,240,0.8)',
        borderInput:     d ? '#1b263b'                    : '#cbd5e1',
        borderAction:    d ? 'rgba(2,128,144,0.3)'        : 'rgba(2,128,144,0.35)',
        borderDanger:    d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderDangerHov: d ? 'rgba(239,68,68,0.35)'       : 'rgba(220,38,38,0.35)',
        borderError:     d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderFilterChip:d ? 'rgba(2,128,144,0.2)'        : 'rgba(2,128,144,0.25)',
        borderEmpty:     d ? 'rgba(2,128,144,0.2)'        : 'rgba(2,128,144,0.25)',

        textPrimary:     d ? '#f1f5f9' : '#0f172a',
        textSecondary:   d ? '#e2e8f0' : '#1e293b',
        textMuted:       d ? '#94a3b8' : '#475569',
        textFaint:       d ? '#4a7a8a' : '#64748b',
        textGhost:       d ? '#2d4a5a' : '#94a3b8',
        textAction:      d ? '#028090' : '#0369a1',
        textDanger:      d ? '#f87171' : '#dc2626',
        textDangerHov:   d ? '#fca5a5' : '#ef4444',
        textInput:       d ? '#cbd5e1' : '#1e293b',
        textFilterChip:  d ? '#028090' : '#0369a1',
        textPlaceholder: d ? '#2d4a5a' : '#94a3b8',
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (timestamp) => {
    try {
        return new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return '—' }
}

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

function Badge({ label, cfg }) {
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
            {label}
        </span>
    )
}

function PaginationBar({ currentPage, totalPages, onPage, tk }) {
    if (totalPages <= 1) return null
    const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const p = i + Math.max(1, currentPage - 3)
        return p <= totalPages ? p : null
    }).filter(Boolean)

    const btnBase  = 'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150'
    const inactive = { background: 'transparent',          border: `1px solid ${tk.border}`,       color: tk.textFaint }
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

// ─── Main Component ───────────────────────────────────────────────────────────

function Users() {
    const { userId } = useAuth()

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

    const [users,         setUsers]         = useState([])
    const [loading,       setLoading]       = useState(true)
    const [error,         setError]         = useState('')
    const [currentPage,   setCurrentPage]   = useState(1)
    const [pageSize,      setPageSize]      = useState(10)
    const [filterUsername,setFilterUsername] = useState('')
    const [filterStatus,  setFilterStatus]  = useState('')
    const [showFilters,   setShowFilters]   = useState(false)
    const [showCreateUser,setShowCreateUser] = useState(false)
    const [editingUserId, setEditingUserId]  = useState(null)
    const [deleteTarget,  setDeleteTarget]  = useState(null)
    const [deleting,      setDeleting]      = useState(false)

    const fetchUsers = async () => {
        setLoading(true); setError('')
        try {
            const res = await api.get('/users')
            setUsers(res.data.filter(u => u.id !== userId))
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { if (!userId) return; fetchUsers() }, [userId])

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            setDeleting(true)
            await api.delete(`/users/${deleteTarget.id}`)
            setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
            setDeleteTarget(null)
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.')
        } finally {
            setDeleting(false)
        }
    }

    const getUserDisplayName = (user) => {
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
        if (user.firstName) return user.firstName
        return '—'
    }

    const filteredUsers = useMemo(() => users.filter(user => {
        const displayName = getUserDisplayName(user)
        return (
            (filterUsername === '' ||
                user.username.toLowerCase().includes(filterUsername.toLowerCase()) ||
                displayName.toLowerCase().includes(filterUsername.toLowerCase()) ||
                (user.email?.toLowerCase().includes(filterUsername.toLowerCase()) ?? false)
            ) &&
            (filterStatus === '' || (filterStatus === 'active' ? user.enabled : !user.enabled))
        )
    }), [users, filterUsername, filterStatus])

    const totalPages    = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
    const startIndex    = (currentPage - 1) * pageSize
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize)
    const hasActiveFilters = filterUsername || filterStatus

    const resetFilters = () => { setFilterUsername(''); setFilterStatus(''); setCurrentPage(1) }

    const activeFilterChips = [
        filterUsername && { label: `Search: ${filterUsername}`, clear: () => setFilterUsername('') },
        filterStatus   && { label: `Status: ${filterStatus}`,   clear: () => setFilterStatus('') },
    ].filter(Boolean)

    // Badge configs — light-aware
    const activeBadge  = { bg: isDark ? 'rgba(34,197,94,0.10)'  : 'rgba(22,163,74,0.09)',   text: isDark ? '#4ade80' : '#14532d', border: isDark ? 'rgba(34,197,94,0.25)'  : 'rgba(22,163,74,0.28)'  }
    const blockedBadge = { bg: isDark ? 'rgba(239,68,68,0.10)'  : 'rgba(220,38,38,0.09)',   text: isDark ? '#f87171' : '#7f1d1d', border: isDark ? 'rgba(239,68,68,0.25)'  : 'rgba(220,38,38,0.28)'  }

    return (
        <>
            <style>{`
                @keyframes users-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
                .users-page { animation: users-fadein 0.35s ease-out both; }
                .users-input:focus { border-color: rgba(2,195,154,0.5) !important; box-shadow: 0 0 0 3px rgba(2,195,154,0.08); }
                .users-row:hover { background: var(--users-row-hover) !important; }
            `}</style>
            <style>{`:root { --users-row-hover: ${tk.bgCardHover}; }`}</style>

            <div className="users-page space-y-6" style={{ color: tk.textSecondary }}>

                {/* ── Header ── */}
                <div className="flex flex-wrap items-start justify-between gap-4"
                    style={{ borderBottom: `1px solid ${tk.border}`, paddingBottom: '20px' }}>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight" style={{ color: tk.textPrimary }}>
                            Users Management
                        </h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: tk.textFaint }}>
                            Manage and control access to the platform
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateUser(true)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                        style={{ background: '#02c39a', color: '#0d1b2a' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#02e0b1' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#02c39a' }}>
                        <Plus size={13} /> Add User
                    </button>
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
                                    style={{ background: tk.bgErrorMsg, border: `1px solid ${tk.borderError}`, color: tk.textDanger }}
                                    onMouseEnter={e => { e.currentTarget.style.background = tk.bgDangerHover }}
                                    onMouseLeave={e => { e.currentTarget.style.background = tk.bgErrorMsg }}>
                                    <X size={11} /> Reset
                                </button>
                            )}
                            <ChevronRight size={13} style={{ color: tk.textFaint, transform: showFilters ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                    </div>

                    {showFilters && (
                        <div className="p-5 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <label className="flex items-center gap-2 rounded-lg px-3 py-2"
                                    style={{ background: tk.bgInputSearch, border: `1px solid ${tk.borderInput}` }}>
                                    <Search size={13} style={{ color: tk.textFaint, flexShrink: 0 }} />
                                    <input
                                        className="users-input w-full bg-transparent text-sm focus:outline-none"
                                        style={{ color: tk.textInput }}
                                        placeholder="Search username, name, email…"
                                        value={filterUsername}
                                        onChange={e => { setFilterUsername(e.target.value); setCurrentPage(1) }}
                                    />
                                </label>

                                <select className="users-input" style={inputCls} value={filterStatus}
                                    onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}>
                                    <option value="">All status</option>
                                    <option value="active">Active</option>
                                    <option value="blocked">Blocked</option>
                                </select>
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

                {/* ── Count + Page size ── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: tk.textFaint }}>
                        {filteredUsers.length === 0 ? 'No results'
                            : `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, filteredUsers.length)} of ${filteredUsers.length}`}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: tk.textFaint }}>Rows:</span>
                        <select value={pageSize}
                            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                            className="rounded-lg px-2 py-1 text-xs transition-all duration-150"
                            style={{ background: tk.bgInput, border: `1px solid ${tk.border}`, color: tk.textMuted, outline: 'none' }}>
                            {PAGE_SIZE_OPTIONS.map(n => <option key={n}>{n}</option>)}
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
                {loading && (
                    <Card tk={tk}>
                        <div className="space-y-px">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex gap-4 px-4 py-3 animate-pulse"
                                    style={{ borderBottom: `1px solid ${tk.border}` }}>
                                    <div className="h-3 w-1/3 rounded-md" style={{ background: tk.bgSkeleton }} />
                                    <div className="h-3 w-16 rounded-md"  style={{ background: tk.bgSkeleton }} />
                                    <div className="h-3 w-24 rounded-md"  style={{ background: tk.bgSkeleton }} />
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* ── Empty state ── */}
                {!loading && users.length === 0 && !error && (
                    <Card tk={tk} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ background: tk.bgEmpty, border: `1px solid ${tk.borderEmpty}` }}>
                                <Plus size={20} style={{ color: tk.textAction }} />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: tk.textMuted }}>No users found</p>
                                <p className="mt-1 text-[11px]" style={{ color: tk.textFaint }}>
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'No users match the current view'}
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* ── Table ── */}
                {!loading && users.length > 0 && (
                    <Card tk={tk} className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: tk.bgThead, borderBottom: `1px solid ${tk.border}` }}>
                                        {['Username', 'Full Name', 'Email', 'Status', 'Created', 'Actions'].map((h, i) => (
                                            <th key={h}
                                                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                                                style={{ color: tk.textFaint, textAlign: i === 5 ? 'center' : 'left' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedUsers.map(user => (
                                        <tr key={user.id} className="users-row"
                                            style={{ background: 'transparent', borderBottom: `1px solid ${tk.borderSubtle}`, transition: 'background 0.15s' }}>
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-sm" style={{ color: tk.textSecondary }}>
                                                    {user.username}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{ color: tk.textMuted }}>
                                                {getUserDisplayName(user)}
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: tk.textMuted }}>
                                                {user.email || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.enabled
                                                    ? <Badge label="Active"  cfg={activeBadge} />
                                                    : <Badge label="Blocked" cfg={blockedBadge} />
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: tk.textFaint }}>
                                                {fmt(user.createdTimestamp)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        title="Edit"
                                                        onClick={() => setEditingUserId(user.id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150"
                                                        style={{ background: tk.bgBtnDefault, border: `1px solid ${tk.border}`, color: tk.textMuted }}
                                                        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: tk.bgAction, border: `1px solid ${tk.borderAction}`, color: '#02c39a' })}
                                                        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: tk.bgBtnDefault, border: `1px solid ${tk.border}`, color: tk.textMuted })}>
                                                        <Pencil size={13} />
                                                    </button>
                                                    <button
                                                        title="Delete"
                                                        onClick={() => setDeleteTarget({ id: user.id, name: user.username })}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150"
                                                        style={{ background: tk.bgDanger, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger }}
                                                        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: tk.bgDangerHover, border: `1px solid ${tk.borderDangerHov}`, color: tk.textDangerHov })}
                                                        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: tk.bgDanger, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger })}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* ── Pagination ── */}
                {filteredUsers.length > pageSize && (
                    <PaginationBar currentPage={currentPage} totalPages={totalPages} onPage={setCurrentPage} tk={tk} />
                )}

                {/* ── Modals ── */}
                {deleteTarget && (
                    <DeleteModal type="user" name={deleteTarget.name}
                        onCancel={() => { if (!deleting) setDeleteTarget(null) }}
                        onConfirm={handleDelete} />
                )}
                {showCreateUser && (
                    <CreateUser onClose={() => setShowCreateUser(false)} onSaved={() => fetchUsers()} />
                )}
                {editingUserId && (
                    <EditUser userId={editingUserId} onClose={() => setEditingUserId(null)} onSaved={() => fetchUsers()} />
                )}
            </div>
        </>
    )
}

export default Users