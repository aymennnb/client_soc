import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { ChevronLeft, Shield, Check, X, Save, RefreshCcw } from 'lucide-react'

const ASSIGNABLE_PERMISSIONS = [
    { group: 'Tickets',         perms: ['VIEW_TICKETS', 'CREATE_TICKET', 'UPDATE_TICKET', 'DELETE_TICKET'] },
    { group: 'Vulnerabilities', perms: ['VIEW_VULNERABILITIES', 'VIEW_VULNERABILITY_DETAILS', 'CREATE_VULNERABILITY', 'UPDATE_VULNERABILITY', 'DELETE_VULNERABILITY', 'SYNC_VULNERABILITIES', 'LAUNCH_VULNERABILITY_SCAN'] },
    { group: 'Incidents',       perms: ['VIEW_INCIDENTS', 'CREATE_INCIDENT', 'UPDATE_INCIDENT', 'DELETE_INCIDENT', 'SYNC_INCIDENTS'] },
]

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
        return () => mo.disconnect()
    }, [])
    return isDark
}

function UserPermissions() {
    const { id }    = useParams()
    const navigate  = useNavigate()
    const isDark    = useTheme()

    const tk = useMemo(() => ({
        bgPage:      isDark ? '#0d1b2a'               : '#f8fafc',
        bgCard:      isDark ? 'rgba(13,27,42,0.7)'    : 'rgba(255,255,255,0.97)',
        bgThead:     isDark ? 'rgba(6,14,22,0.8)'     : 'rgba(248,250,252,0.95)',
        bgAction:    isDark ? 'rgba(2,128,144,0.12)'  : 'rgba(2,128,144,0.07)',
        bgActionHov: isDark ? 'rgba(2,128,144,0.18)'  : 'rgba(2,128,144,0.13)',
        bgDanger:    isDark ? 'rgba(239,68,68,0.08)'  : 'rgba(220,38,38,0.06)',
        bgSuccess:   isDark ? 'rgba(34,197,94,0.08)'  : 'rgba(22,163,74,0.06)',
        border:      isDark ? '#1b263b'               : '#e2e8f0',
        borderAction:isDark ? 'rgba(2,128,144,0.3)'   : 'rgba(2,128,144,0.35)',
        borderDanger:isDark ? 'rgba(239,68,68,0.2)'   : 'rgba(220,38,38,0.22)',
        textPrimary: isDark ? '#f1f5f9'               : '#0f172a',
        textMuted:   isDark ? '#94a3b8'               : '#475569',
        textFaint:   isDark ? '#4a7a8a'               : '#64748b',
        textAction:  isDark ? '#028090'               : '#0369a1',
        textDanger:  isDark ? '#f87171'               : '#dc2626',
        bgSkeleton:  isDark ? 'rgba(27,38,59,0.8)'    : 'rgba(203,213,225,0.6)',
    }), [isDark])

    const [user,        setUser]        = useState(null)
    const [current,     setCurrent]     = useState([])   // permissions actuelles
    const [selected,    setSelected]    = useState([])   // état local modifiable
    const [loading,     setLoading]     = useState(true)
    const [saving,      setSaving]      = useState(false)
    const [error,       setError]       = useState('')
    const [successMsg,  setSuccessMsg]  = useState('')

    const fetchData = async () => {
        setLoading(true); setError('')
        try {
            const [userRes, permsRes] = await Promise.all([
                api.get(`/users/${id}`),
                api.get(`/users/${id}/permissions`),
            ])
            setUser(userRes.data)
            setCurrent(permsRes.data.permissions || [])
            setSelected(permsRes.data.permissions || [])
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load user permissions.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [id])

    const toggle = (perm) => {
        setSelected(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        )
    }

    const isDirty = useMemo(() => {
        const a = [...selected].sort().join(',')
        const b = [...current].sort().join(',')
        return a !== b
    }, [selected, current])

    const handleSave = async () => {
        setSaving(true); setError(''); setSuccessMsg('')
        try {
            await api.post(`/users/${id}/permissions/sync`, { permissions: selected })
            setCurrent(selected)
            setSuccessMsg('Permissions saved successfully.')
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save permissions.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="space-y-4 p-6">
            {[1,2,3].map(i => (
                <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: tk.bgSkeleton }} />
            ))}
        </div>
    )

    return (
        <div className="space-y-6" style={{ color: tk.textMuted }}>

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4"
                style={{ borderBottom: `1px solid ${tk.border}`, paddingBottom: '20px' }}>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/users')}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all"
                        style={{ background: 'transparent', border: `1px solid ${tk.border}`, color: tk.textFaint }}
                        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: tk.bgAction, borderColor: 'rgba(2,128,144,0.35)', color: '#02c39a' })}
                        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'transparent', borderColor: tk.border, color: tk.textFaint })}>
                        <ChevronLeft size={14} />
                    </button>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2"
                            style={{ color: tk.textPrimary }}>
                            Permissions — {user?.username ?? id}
                        </h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: tk.textFaint }}>
                            {user?.email ?? ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => { setSelected(current); setError('') }}
                        disabled={!isDirty || saving}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
                        style={{
                            background:  isDirty ? tk.bgDanger    : 'transparent',
                            border:      `1px solid ${isDirty ? tk.borderDanger : tk.border}`,
                            color:       isDirty ? tk.textDanger  : tk.textFaint,
                            opacity:     (!isDirty || saving) ? 0.5 : 1,
                            cursor:      (!isDirty || saving) ? 'not-allowed' : 'pointer',
                        }}>
                        <X size={13} /> Reset
                    </button>
                    <button onClick={handleSave}
                        disabled={!isDirty || saving}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
                        style={{
                            background: isDirty ? '#02c39a' : tk.bgAction,
                            color:      isDirty ? '#0d1b2a' : tk.textFaint,
                            opacity:    (!isDirty || saving) ? 0.5 : 1,
                            cursor:     (!isDirty || saving) ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={e => isDirty && !saving && (e.currentTarget.style.background = '#02e0b1')}
                        onMouseLeave={e => isDirty && !saving && (e.currentTarget.style.background = '#02c39a')}>
                        {saving
                            ? <RefreshCcw size={13} className="animate-spin" />
                            : <Save size={13} />}
                        Save
                    </button>
                </div>
            </div>

            {/* Feedback */}
            {error && (
                <div className="rounded-xl px-4 py-3 text-sm"
                    style={{ background: tk.bgDanger, border: `1px solid ${tk.borderDanger}`, color: tk.textDanger }}>
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="rounded-xl px-4 py-3 text-sm"
                    style={{ background: tk.bgSuccess, border: '1px solid rgba(34,197,94,0.28)', color: '#4ade80' }}>
                    {successMsg}
                </div>
            )}

            {/* Unsaved changes notice */}
            {isDirty && (
                <div className="rounded-xl px-4 py-2 text-xs font-medium"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
                    You have unsaved changes — click Save to apply.
                </div>
            )}

            {/* Permission groups */}
            {ASSIGNABLE_PERMISSIONS.map(({ group, perms }) => (
                <div key={group} className="rounded-xl overflow-hidden"
                    style={{ background: tk.bgCard, border: `1px solid ${tk.border}` }}>
                    <div className="px-5 py-3"
                        style={{ background: tk.bgThead, borderBottom: `1px solid ${tk.border}` }}>
                        <span className="text-[11px] font-semibold uppercase tracking-widest"
                            style={{ color: tk.textFaint }}>
                            {group}
                        </span>
                    </div>
                    <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
                        {perms.map(perm => {
                            const active = selected.includes(perm)
                            return (
                                <div key={perm}
                                    className="flex items-center justify-between px-5 py-3 cursor-pointer transition-colors"
                                    style={{ borderBottom: `1px solid ${tk.border}` }}
                                    onClick={() => toggle(perm)}
                                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(2,128,144,0.05)' : 'rgba(2,128,144,0.03)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <span className="text-sm font-mono" style={{ color: active ? tk.textPrimary : tk.textFaint }}>
                                        {perm}
                                    </span>
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md transition-all"
                                        style={{
                                            background: active ? '#02c39a'     : 'transparent',
                                            border:     active ? 'none'         : `2px solid ${tk.border}`,
                                        }}>
                                        {active && <Check size={13} color="#0d1b2a" strokeWidth={3} />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default UserPermissions