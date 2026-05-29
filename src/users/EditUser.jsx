import { useState, useEffect, useMemo } from 'react'
import api from '../api'
import { X, UserCog, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

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
        bgPanel:        d ? 'linear-gradient(160deg, #0d1b2a 0%, #0a1520 100%)' : 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
        bgInput:        d ? '#060e16'                   : '#ffffff',
        bgInputDisabled:d ? 'rgba(6,14,22,0.5)'         : 'rgba(241,245,249,0.8)',
        bgFooter:       d ? 'rgba(6,14,22,0.4)'         : 'rgba(248,250,252,0.8)',
        bgError:        d ? 'rgba(239,68,68,0.08)'      : 'rgba(220,38,38,0.06)',
        bgSuccess:      d ? 'rgba(34,197,94,0.08)'      : 'rgba(22,163,74,0.07)',
        bgActionIcon:   d ? 'rgba(2,195,154,0.12)'      : 'rgba(2,195,154,0.10)',
        bgSkeleton:     d ? 'rgba(27,38,59,0.8)'        : 'rgba(203,213,225,0.6)',
        bgUsernameBadge:d ? 'rgba(27,38,59,0.6)'        : 'rgba(226,232,240,0.8)',
        bgToggleActive: '#22c55e',
        bgToggleInactive:d ? 'rgba(239,68,68,0.3)'      : 'rgba(239,68,68,0.2)',

        border:         d ? '#1b263b'                   : '#e2e8f0',
        borderInput:    d ? '#1b263b'                   : '#cbd5e1',
        borderFocus:    'rgba(2,195,154,0.5)',
        borderAction:   d ? 'rgba(2,195,154,0.3)'       : 'rgba(2,195,154,0.35)',
        borderError:    d ? 'rgba(239,68,68,0.2)'       : 'rgba(220,38,38,0.22)',
        borderSuccess:  d ? 'rgba(34,197,94,0.2)'       : 'rgba(22,163,74,0.25)',
        borderClose:    d ? '#1b263b'                   : '#e2e8f0',
        borderCloseHov: d ? '#028090'                   : '#028090',
        borderUserBadge:d ? '#1b263b'                   : '#e2e8f0',
        borderToggleActive:  '#22c55e',
        borderToggleInactive:d ? 'rgba(239,68,68,0.5)'  : 'rgba(239,68,68,0.4)',

        textPrimary:    d ? '#f1f5f9' : '#0f172a',
        textSecondary:  d ? '#cbd5e1' : '#1e293b',
        textMuted:      d ? '#4a7a8a' : '#64748b',
        textGhost:      d ? '#2d4a5a' : '#94a3b8',
        textLabel:      d ? '#4a7a8a' : '#64748b',
        textInput:      d ? '#cbd5e1' : '#1e293b',
        textInputDisabled:d ? '#2d4a5a' : '#94a3b8',
        textDanger:     d ? '#f87171' : '#dc2626',
        textSuccess:    d ? '#4ade80' : '#16a34a',
        textClose:      d ? '#4a7a8a' : '#64748b',
        textCloseHov:   d ? '#ffffff' : '#0f172a',
        textAction:     d ? '#028090' : '#0369a1',
        textUserBadge:  d ? '#4a7a8a' : '#64748b',

        shadowPanel:    d ? '0 32px 80px rgba(0,0,0,0.6)' : '0 32px 80px rgba(0,0,0,0.15)',
        shadowFocus:    '0 0 0 3px rgba(2,195,154,0.08)',
    }
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Field({ label, required, hint, children, tk }) {
    return (
        <div className="space-y-1.5">
            <label style={{
                display: 'block', fontSize: '10px', fontWeight: '600',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: tk.textLabel, marginBottom: '6px',
            }}>
                {label}
                {required && <span style={{ color: tk.textDanger, marginLeft: '3px' }}>*</span>}
            </label>
            {children}
            {hint && <p className="text-[10px] mt-1" style={{ color: tk.textGhost }}>{hint}</p>}
        </div>
    )
}

function StyledInput({ disabled, tk, ...props }) {
    const base = {
        background:   disabled ? tk.bgInputDisabled : tk.bgInput,
        border:       `1px solid ${tk.borderInput}`,
        color:        disabled ? tk.textInputDisabled : tk.textInput,
        borderRadius: '12px',
        padding:      '10px 12px',
        fontSize:     '14px',
        width:        '100%',
        outline:      'none',
        transition:   'border-color 0.15s, box-shadow 0.15s',
        cursor:       disabled ? 'not-allowed' : 'auto',
        opacity:      disabled ? 0.6 : 1,
    }
    return (
        <input {...props} disabled={disabled} style={base}
            onFocus={disabled ? undefined : e => Object.assign(e.currentTarget.style, { ...base, borderColor: tk.borderFocus, boxShadow: tk.shadowFocus })}
            onBlur={disabled ? undefined : e => Object.assign(e.currentTarget.style, base)} />
    )
}

function SectionDivider({ label, tk }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: tk.border }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest shrink-0" style={{ color: tk.textGhost }}>
                {label}
            </span>
            <div className="flex-1 h-px" style={{ background: tk.border }} />
        </div>
    )
}

// ─── Status Toggle ────────────────────────────────────────────────────────────

function StatusToggle({ enabled, onChange, tk }) {
    return (
        <button type="button" onClick={() => onChange(!enabled)}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left transition-all duration-150"
            style={{
                background: enabled ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border:     enabled ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = enabled ? 'rgba(34,197,94,0.13)' : 'rgba(239,68,68,0.13)' }}
            onMouseLeave={e => { e.currentTarget.style.background = enabled ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
            {/* Track */}
            <div className="relative shrink-0 h-5 w-9 rounded-full transition-colors duration-200"
                style={{
                    background: enabled ? tk.bgToggleActive : tk.bgToggleInactive,
                    border: `1px solid ${enabled ? tk.borderToggleActive : tk.borderToggleInactive}`,
                }}>
                <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200"
                    style={{ transform: enabled ? 'translateX(16px)' : 'translateX(1px)' }} />
            </div>
            {/* Text */}
            <div>
                <p className="text-xs font-semibold" style={{ color: enabled ? '#4ade80' : '#f87171' }}>
                    {enabled ? 'Active' : 'Blocked'}
                </p>
                <p className="text-[10px] mt-0.5"
                    style={{ color: enabled ? 'rgba(74,222,128,0.6)' : 'rgba(248,113,113,0.6)' }}>
                    {enabled
                        ? 'Account can authenticate and access the platform'
                        : 'Account is disabled — login is prevented'}
                </p>
            </div>
        </button>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBody({ tk }) {
    return (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse">
                    <div className="h-2.5 w-24 rounded" style={{ background: tk.bgSkeleton }} />
                    <div className="h-10 w-full rounded-xl" style={{ background: tk.bgSkeleton }} />
                </div>
            ))}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function EditUser({ userId, onClose, onSaved }) {
    const isDark = useTheme()
    const tk     = useMemo(() => tokens(isDark), [isDark])

    const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', enabled: true })
    const [loading, setLoading] = useState(true)
    const [saving,  setSaving]  = useState(false)
    const [error,   setError]   = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose?.() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get(`/users/${userId}`)
                const u   = res.data
                setForm({ username: u.username || '', firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', enabled: u.enabled !== false })
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load user.')
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [userId])

    const handleChange  = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setError(''); setSuccess(false)
        try {
            await api.put(`/users/${userId}`, form)
            setSuccess(true)
            setTimeout(() => { onSaved?.(); onClose?.() }, 100)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user.')
        } finally {
            setSaving(false)
        }
    }

    const barColor = form.enabled ? '#4ade80' : '#f87171'

    const statusBadge = form.enabled
        ? { bg: isDark ? 'rgba(34,197,94,0.10)'  : 'rgba(22,163,74,0.09)',  text: isDark ? '#4ade80' : '#14532d', border: isDark ? 'rgba(34,197,94,0.25)'  : 'rgba(22,163,74,0.28)',  dot: '#22c55e', label: 'Active'  }
        : { bg: isDark ? 'rgba(239,68,68,0.10)'  : 'rgba(220,38,38,0.09)',  text: isDark ? '#f87171' : '#7f1d1d', border: isDark ? 'rgba(239,68,68,0.25)'  : 'rgba(220,38,38,0.28)',  dot: '#ef4444', label: 'Blocked' }

    return (
        <>
            <style>{`
                @keyframes edit-user-in {
                    from { opacity:0; transform:scale(0.97) translateY(8px); }
                    to   { opacity:1; transform:scale(1)    translateY(0);   }
                }
                .edit-user-panel { animation: edit-user-in 0.25s cubic-bezier(0.16,1,0.3,1) both; }
            `}</style>

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="edit-user-panel relative w-full max-w-xl flex flex-col overflow-hidden rounded-2xl"
                    style={{ background: tk.bgPanel, border: `1px solid ${tk.border}`, boxShadow: tk.shadowPanel, maxHeight: '92vh' }}
                    onClick={e => e.stopPropagation()}>

                    {/* Accent bar */}
                    <div className="h-0.5 w-full shrink-0 transition-all duration-300"
                        style={{ background: `linear-gradient(90deg, transparent, ${barColor}60, ${barColor}90, ${barColor}60, transparent)` }} />

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 px-6 py-4 shrink-0"
                        style={{ borderBottom: `1px solid ${tk.border}` }}>
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
                                style={{ background: tk.bgActionIcon, border: `1px solid ${tk.borderAction}` }}>
                                <UserCog size={16} style={{ color: '#02c39a' }} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                                    Users Management
                                </p>
                                <h2 className="text-sm font-semibold mt-0.5" style={{ color: tk.textPrimary }}>
                                    Edit User
                                </h2>
                                {!loading && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                            style={{ background: statusBadge.bg, color: statusBadge.text, border: `1px solid ${statusBadge.border}` }}>
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusBadge.dot }} />
                                            {statusBadge.label}
                                        </span>
                                        {form.username && (
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-mono"
                                                style={{ background: tk.bgUsernameBadge, color: tk.textUserBadge, border: `1px solid ${tk.borderUserBadge}` }}>
                                                {form.username}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button type="button" onClick={onClose} title="Close (Esc)"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150"
                            style={{ border: `1px solid ${tk.borderClose}`, color: tk.textClose }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = tk.borderCloseHov; e.currentTarget.style.color = tk.textCloseHov }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = tk.borderClose;    e.currentTarget.style.color = tk.textClose }}>
                            <X size={13} />
                        </button>
                    </div>

                    {/* Body */}
                    {loading ? <SkeletonBody tk={tk} /> : (
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {error && (
                                <div className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5"
                                    style={{ background: tk.bgError, border: `1px solid ${tk.borderError}` }}>
                                    <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: tk.textDanger }} />
                                    <p className="text-sm" style={{ color: tk.textDanger }}>{error}</p>
                                </div>
                            )}
                            {success && (
                                <div className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5"
                                    style={{ background: tk.bgSuccess, border: `1px solid ${tk.borderSuccess}` }}>
                                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: tk.textSuccess }} />
                                    <p className="text-sm" style={{ color: tk.textSuccess }}>User updated successfully.</p>
                                </div>
                            )}

                            <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-5">
                                <Field label="Username" hint="Usernames are managed by Keycloak and cannot be modified" tk={tk}>
                                    <StyledInput tk={tk} type="text" value={form.username} disabled />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="First Name" tk={tk}>
                                        <StyledInput tk={tk} name="firstName" placeholder="John"
                                            value={form.firstName} onChange={handleChange} autoComplete="given-name" />
                                    </Field>
                                    <Field label="Last Name" tk={tk}>
                                        <StyledInput tk={tk} name="lastName" placeholder="Doe"
                                            value={form.lastName} onChange={handleChange} autoComplete="family-name" />
                                    </Field>
                                    <Field label="Email" tk={tk}>
                                        <StyledInput tk={tk} type="email" name="email" placeholder="john.doe@example.com"
                                            value={form.email} onChange={handleChange} />
                                    </Field>
                                </div>
                                <Field hint="Toggling this immediately restricts or restores the user's ability to log in" tk={tk}>
                                    <StatusToggle enabled={form.enabled} onChange={val => setForm(f => ({ ...f, enabled: val }))} tk={tk} />
                                </Field>
                            </form>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
                        style={{ borderTop: `1px solid ${tk.border}`, background: tk.bgFooter }}>
                        <button type="button" onClick={onClose}
                            className="rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: 'transparent', border: `1px solid ${tk.borderAction}`, color: tk.textAction }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(2,128,144,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                            Cancel
                        </button>
                        <button type="submit" form="edit-user-form" disabled={saving || loading || success}
                            className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: success ? '#22c55e' : '#02c39a', color: '#0d1b2a' }}
                            onMouseEnter={e => { if (!saving && !success) e.currentTarget.style.background = '#02e0b1' }}
                            onMouseLeave={e => { e.currentTarget.style.background = success ? '#22c55e' : '#02c39a' }}>
                            {saving   ? (<><Loader2 size={13} className="animate-spin" /> Saving…</>)
                            : success ? (<><CheckCircle2 size={13} /> Saved!</>)
                                      : (<><UserCog size={13} /> Save Changes</>)}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default EditUser