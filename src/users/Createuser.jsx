import { useState, useEffect, useMemo } from 'react'
import api from '../api'
import { X, UserPlus, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

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
        bgInput:        d ? '#060e16'                    : '#ffffff',
        bgFooter:       d ? 'rgba(6,14,22,0.4)'          : 'rgba(248,250,252,0.8)',
        bgError:        d ? 'rgba(239,68,68,0.08)'       : 'rgba(220,38,38,0.06)',
        bgActionIcon:   d ? 'rgba(2,195,154,0.12)'       : 'rgba(2,195,154,0.10)',

        border:         d ? '#1b263b'                    : '#e2e8f0',
        borderInput:    d ? '#1b263b'                    : '#cbd5e1',
        borderFocus:    'rgba(2,195,154,0.5)',
        borderAction:   d ? 'rgba(2,195,154,0.3)'        : 'rgba(2,195,154,0.35)',
        borderError:    d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderClose:    d ? '#1b263b'                    : '#e2e8f0',
        borderCloseHov: d ? '#028090'                    : '#028090',

        textPrimary:    d ? '#f1f5f9' : '#0f172a',
        textSecondary:  d ? '#cbd5e1' : '#1e293b',
        textMuted:      d ? '#4a7a8a' : '#64748b',
        textGhost:      d ? '#2d4a5a' : '#94a3b8',
        textLabel:      d ? '#4a7a8a' : '#64748b',
        textInput:      d ? '#cbd5e1' : '#1e293b',
        textDanger:     d ? '#f87171' : '#dc2626',
        textClose:      d ? '#4a7a8a' : '#64748b',
        textCloseHov:   d ? '#ffffff' : '#0f172a',
        textAction:     d ? '#028090' : '#0369a1',

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
            {hint && <p className="text-[10px]" style={{ color: tk.textGhost }}>{hint}</p>}
        </div>
    )
}

function StyledInput({ tk, ...props }) {
    const base = {
        background:   tk.bgInput,
        border:       `1px solid ${tk.borderInput}`,
        color:        tk.textInput,
        borderRadius: '12px',
        padding:      '10px 12px',
        fontSize:     '14px',
        width:        '100%',
        outline:      'none',
        transition:   'border-color 0.15s, box-shadow 0.15s',
    }
    return (
        <input {...props}
            className="w-full"
            style={base}
            onFocus={e => Object.assign(e.currentTarget.style, { ...base, borderColor: tk.borderFocus, boxShadow: tk.shadowFocus })}
            onBlur={e  => Object.assign(e.currentTarget.style, base)}
        />
    )
}

function StyledSelect({ children, tk, ...props }) {
    const base = {
        background:   tk.bgInput,
        border:       `1px solid ${tk.borderInput}`,
        color:        tk.textInput,
        borderRadius: '12px',
        padding:      '10px 12px',
        fontSize:     '14px',
        width:        '100%',
        outline:      'none',
        transition:   'border-color 0.15s, box-shadow 0.15s',
        appearance:   'none',
    }
    return (
        <select {...props}
            style={base}
            onFocus={e => Object.assign(e.currentTarget.style, { ...base, borderColor: tk.borderFocus, boxShadow: tk.shadowFocus })}
            onBlur={e  => Object.assign(e.currentTarget.style, base)}>
            {children}
        </select>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CreateUser({ onClose, onSaved }) {
    const isDark = useTheme()
    const tk     = useMemo(() => tokens(isDark), [isDark])

    const [form, setForm] = useState({
        username: '', email: '', firstName: '', lastName: '', password: '', role: 'user',
    })
    const [error,   setError]   = useState('')
    const [loading, setLoading] = useState(false)
    const [showPwd, setShowPwd] = useState(false)

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose?.() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    // ─── FIX: robust submit handler ───────────────────────────────────────────
    //
    //  Problem: some Keycloak-backed backends respond with HTTP 201 but the
    //  body is a plain string like "Server error." or contains a non-standard
    //  shape that makes the calling code enter the catch branch even though
    //  the user was created successfully.
    //
    //  Strategy:
    //  1. In the try branch — always treat any 2xx status as success.
    //  2. In the catch branch — check err.response.status: if it's 2xx the
    //     request actually succeeded (axios parsing edge case), so close normally.
    //  3. Only call setError for genuine 4xx/5xx failures where the user was
    //     NOT created.
    //
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await api.post('/users', form)

            // Any resolved response is a success — close and refresh
            onSaved?.()
            onClose?.()
        } catch (err) {
            const httpStatus = err?.response?.status

            // ── 2xx landing in catch ──────────────────────────────────────────
            // This happens when axios resolves the request but something in the
            // response interceptor or body parsing throws.  The user WAS created.
            if (httpStatus && httpStatus >= 200 && httpStatus < 300) {
                onSaved?.()
                onClose?.()
                return
            }

            // ── Real client / server error ────────────────────────────────────
            // 409 Conflict = user already exists, 400 = validation, 500 = real server error
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error   ||
                err?.message                 ||
                'Failed to create user.'

            // Don't show the raw "Server error." from a 5xx if the HTTP status
            // indicates the record was actually persisted — that's a backend bug
            // but we shouldn't confuse the user.  For genuine 5xx, show the msg.
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <style>{`
                @keyframes create-user-in {
                    from { opacity:0; transform:scale(0.97) translateY(8px); }
                    to   { opacity:1; transform:scale(1)    translateY(0);   }
                }
                .create-user-panel { animation: create-user-in 0.25s cubic-bezier(0.16,1,0.3,1) both; }
            `}</style>

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="create-user-panel relative w-full max-w-xl flex flex-col overflow-hidden rounded-2xl"
                    style={{ background: tk.bgPanel, border: `1px solid ${tk.border}`, boxShadow: tk.shadowPanel, maxHeight: '92vh' }}
                    onClick={e => e.stopPropagation()}>

                    {/* Accent bar */}
                    <div className="h-0.5 w-full shrink-0 transition-all duration-300"
                        style={{ background: 'linear-gradient(90deg, transparent, #02c39a60, #02c39a90, #02c39a60, transparent)' }} />

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 px-6 py-4 shrink-0"
                        style={{ borderBottom: `1px solid ${tk.border}` }}>
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
                                style={{ background: tk.bgActionIcon, border: `1px solid ${tk.borderAction}` }}>
                                <UserPlus size={16} style={{ color: '#02c39a' }} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textGhost }}>
                                    Users
                                </p>
                                <h2 className="text-sm font-semibold mt-0.5" style={{ color: tk.textPrimary }}>
                                    Create User
                                </h2>
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
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        {error && (
                            <div className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5"
                                style={{ background: tk.bgError, border: `1px solid ${tk.borderError}` }}>
                                <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: tk.textDanger }} />
                                <p className="text-sm" style={{ color: tk.textDanger }}>{error}</p>
                            </div>
                        )}

                        <form id="create-user-form" onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="Username" required tk={tk}>
                                    <StyledInput tk={tk} name="username" placeholder="john.doe"
                                        value={form.username} onChange={handleChange} required autoComplete="off" />
                                </Field>
                                <Field label="First Name" tk={tk}>
                                    <StyledInput tk={tk} name="firstName" placeholder="John"
                                        value={form.firstName} onChange={handleChange} autoComplete="given-name" />
                                </Field>
                                <Field label="Last Name" tk={tk}>
                                    <StyledInput tk={tk} name="lastName" placeholder="Doe"
                                        value={form.lastName} onChange={handleChange} autoComplete="family-name" />
                                </Field>
                            </div>

                            <Field label="Email" tk={tk}>
                                <StyledInput tk={tk} type="email" name="email" placeholder="john.doe@example.com"
                                    value={form.email} onChange={handleChange} autoComplete="email" />
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Password" required tk={tk}>
                                    <div className="relative">
                                        <StyledInput tk={tk} type={showPwd ? 'text' : 'password'} name="password"
                                            placeholder="••••••••" value={form.password} onChange={handleChange}
                                            required autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowPwd(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                            style={{ color: tk.textMuted }}
                                            onMouseEnter={e => { e.currentTarget.style.color = tk.textSecondary }}
                                            onMouseLeave={e => { e.currentTarget.style.color = tk.textMuted }}>
                                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </Field>
                                <Field label="Role" tk={tk}>
                                    <StyledSelect tk={tk} name="role" value={form.role} onChange={handleChange}>
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </StyledSelect>
                                </Field>
                            </div>
                        </form>
                    </div>

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
                        <button type="submit" form="create-user-form" disabled={loading}
                            className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: '#02c39a', color: '#0d1b2a' }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#02e0b1' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#02c39a' }}>
                            {loading
                                ? (<><Loader2 size={13} className="animate-spin" /> Creating…</>)
                                : (<><UserPlus size={13} /> Create User</>)
                            }
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CreateUser