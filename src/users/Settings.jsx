import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../api'

// ─── useTheme (READ-ONLY) ─────────────────────────────────────────────────────
//
//  Settings is the only page that also WRITES the theme (via ThemeSelector).
//  But it must NOT duplicate AuthenticatedLayout's state — that causes two
//  React states competing over data-theme and creates desync on navigation.
//
//  Solution:
//  - useTheme() here is a READ-ONLY observer, identical to every other page.
//  - applyTheme() is a plain function (no React state) that writes data-theme
//    + localStorage, which AuthenticatedLayout's useEffect will detect on its
//    next render via its own useState(getInitialTheme) re-read on toggle.
//  - ThemeSelector calls applyTheme() directly — the MutationObserver in this
//    hook picks up the attribute change and re-renders Settings immediately.
//
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

// ─── applyTheme ───────────────────────────────────────────────────────────────
//
//  Writes the canonical signal consumed by ALL components.
//  'system' resolves to the OS preference and writes the resolved value.
//  AuthenticatedLayout reads localStorage on mount so it stays in sync.
//
const applyTheme = (themeId) => {
    let resolved = themeId
    if (themeId === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    document.documentElement.setAttribute('data-theme', resolved)
    localStorage.setItem('theme', themeId) // store intent (including 'system')
}

// ─── getCurrentThemeId ────────────────────────────────────────────────────────
//
//  Reads the saved intent ('light' | 'dark' | 'system') for the selector UI.
//
const getCurrentThemeId = () => localStorage.getItem('theme') || 'dark'

// ─── Design tokens ────────────────────────────────────────────────────────────
const tokens = (isDark) => {
    const d = isDark
    return {
        // Surfaces
        bgCard:          d ? 'rgba(13,27,42,0.8)'         : 'rgba(255,255,255,0.97)',
        bgSubtle:        d ? 'rgba(27,38,59,0.4)'         : 'rgba(241,245,249,0.8)',
        bgInput:         d ? 'rgba(10,18,21,0.8)'         : '#ffffff',
        bgDisabled:      d ? 'rgba(10,18,21,0.5)'         : 'rgba(241,245,249,0.8)',
        bgAction:        d ? 'rgba(2,128,144,0.1)'        : 'rgba(2,128,144,0.07)',
        bgActionHov:     d ? 'rgba(2,128,144,0.18)'       : 'rgba(2,128,144,0.13)',
        bgThemeActive:   d ? 'rgba(2,195,154,0.12)'       : 'rgba(2,128,144,0.09)',
        bgError:         d ? 'rgba(239,68,68,0.08)'       : 'rgba(220,38,38,0.06)',
        bgSuccess:       d ? 'rgba(34,197,94,0.08)'       : 'rgba(22,163,74,0.06)',

        // Borders
        border:          d ? '#1b263b'                    : '#e2e8f0',
        borderInput:     d ? '#1b263b'                    : '#cbd5e1',
        borderAction:    d ? 'rgba(2,128,144,0.25)'       : 'rgba(2,128,144,0.3)',
        borderTheme:     d ? 'rgba(2,195,154,0.3)'        : 'rgba(2,128,144,0.3)',
        borderError:     d ? 'rgba(239,68,68,0.2)'        : 'rgba(220,38,38,0.22)',
        borderSuccess:   d ? 'rgba(34,197,94,0.2)'        : 'rgba(22,163,74,0.22)',

        // Text
        textPrimary:     d ? '#f1f5f9' : '#0f172a',
        textSecondary:   d ? '#e2e8f0' : '#1e293b',
        textMuted:       d ? '#94a3b8' : '#475569',
        textFaint:       d ? '#4a7a8a' : '#64748b',
        textAction:      d ? '#02c39a' : '#0369a1',
        textDanger:      d ? '#f87171' : '#dc2626',
        textSuccess:     d ? '#4ade80' : '#15803d',
        textInput:       d ? '#cbd5e1' : '#1e293b',
        textDisabled:    d ? '#4a7a8a' : '#94a3b8',
    }
}

// ─── Flash ────────────────────────────────────────────────────────────────────

function Flash({ msg, tk }) {
    if (!msg) return null
    const ok = msg.type === 'success'
    return (
        <div className="rounded-lg px-4 py-3 text-sm"
            style={{
                background: ok ? tk.bgSuccess : tk.bgError,
                border:     `1px solid ${ok ? tk.borderSuccess : tk.borderError}`,
                color:      ok ? tk.textSuccess : tk.textDanger,
            }}>
            {msg.text}
        </div>
    )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({ title, subtitle, children, tk }) {
    return (
        <div className="rounded-xl p-6 space-y-5"
            style={{ background: tk.bgCard, border: `1px solid ${tk.border}` }}>
            <div className="pb-4" style={{ borderBottom: `1px solid ${tk.border}` }}>
                <h3 className="text-sm font-bold" style={{ color: tk.textPrimary }}>{title}</h3>
                {subtitle && (
                    <p className="mt-0.5 text-xs" style={{ color: tk.textFaint }}>{subtitle}</p>
                )}
            </div>
            {children}
        </div>
    )
}

// ─── ReadonlyField ────────────────────────────────────────────────────────────

function ReadonlyField({ label, value, hint, tk }) {
    return (
        <div>
            <label style={{
                display: 'block', fontSize: '10px', fontWeight: '600',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: tk.textFaint, marginBottom: '6px',
            }}>
                {label}
            </label>
            <div className="rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
                style={{
                    background: tk.bgDisabled,
                    border:     `1px solid ${tk.border}`,
                    color:      tk.textDisabled,
                    opacity:    0.75,
                }}>
                {value || '—'}
            </div>
            {hint && (
                <p className="mt-1 text-[11px]" style={{ color: tk.textFaint }}>{hint}</p>
            )}
        </div>
    )
}

// ─── ThemeSelector ────────────────────────────────────────────────────────────

const THEME_OPTIONS = [
    {
        id:    'light',
        label: 'Light',
        icon:  (active, tk) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke={active ? '#02c39a' : tk.textFaint}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
        ),
    },
    {
        id:    'dark',
        label: 'Dark',
        icon:  (active, tk) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke={active ? '#02c39a' : tk.textFaint}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
        ),
    },
    {
        id:    'system',
        label: 'System',
        icon:  (active, tk) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke={active ? '#02c39a' : tk.textFaint}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
            </svg>
        ),
    },
]

function ThemeSelector({ selectedId, onSelect, tk }) {
    return (
        <div className="flex gap-3">
            {THEME_OPTIONS.map(opt => {
                const active = selectedId === opt.id
                return (
                    <button
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        className="flex flex-1 flex-col items-center gap-2.5 rounded-xl py-4 px-2 transition-all duration-150"
                        style={{
                            background: active ? tk.bgThemeActive : tk.bgSubtle,
                            border:     `1.5px solid ${active ? tk.borderTheme : tk.border}`,
                            cursor:     'pointer',
                        }}
                        onMouseEnter={e => {
                            if (!active) {
                                e.currentTarget.style.background = tk.bgAction
                                e.currentTarget.style.borderColor = tk.borderAction
                            }
                        }}
                        onMouseLeave={e => {
                            if (!active) {
                                e.currentTarget.style.background = tk.bgSubtle
                                e.currentTarget.style.borderColor = tk.border
                            }
                        }}
                    >
                        {opt.icon(active, tk)}
                        <span className="text-xs font-semibold"
                            style={{ color: active ? '#02c39a' : tk.textMuted }}>
                            {opt.label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function Settings() {
    const { userId, username, email } = useAuth()

    // READ-ONLY — just observes data-theme for token resolution
    const isDark = useTheme()
    const tk     = useMemo(() => tokens(isDark), [isDark])

    // Separate local state for the theme selector UI
    // Initialized from localStorage intent (not from isDark) so 'system' shows correctly
    const [selectedThemeId, setSelectedThemeId] = useState(getCurrentThemeId)

    const handleThemeSelect = (id) => {
        setSelectedThemeId(id)
        applyTheme(id)
        // Also update AuthenticatedLayout's React state so the header toggle icon stays in sync
        // AuthenticatedLayout reads localStorage on its next toggle, so we just patch the attribute.
        // For immediate header sync, dispatch a storage event that AuthenticatedLayout can listen to.
        window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: id }))
    }

    const labelStyle = {
        display: 'block', fontSize: '10px', fontWeight: '600',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: tk.textFaint, marginBottom: '6px',
    }

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

    // ── Profile state ──
    const [profileLoading, setProfileLoading] = useState(true)
    const [department,     setDepartment]     = useState('')
    const [savingProfile,  setSavingProfile]  = useState(false)
    const [flashProfile,   setFlashProfile]   = useState(null)

    const flash = (setter, type, text) => {
        setter({ type, text })
        setTimeout(() => setter(null), 3500)
    }

    // ── Load profile ──
    useEffect(() => {
        if (!userId) return
        api.get('/users/me')
            .then(res => setDepartment(res.data.department || ''))
            .catch(() => flash(setFlashProfile, 'error', 'Failed to load profile.'))
            .finally(() => setProfileLoading(false))
    }, [userId])

    // ── Save profile ──
    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            await api.put('/users/me', { department: department.trim() || null })
            flash(setFlashProfile, 'success', 'Profile updated successfully.')
        } catch (err) {
            flash(setFlashProfile, 'error', err.response?.data?.message || 'Failed to update profile.')
        } finally {
            setSavingProfile(false)
        }
    }

    return (
        <>
            <style>{`
                @keyframes stt-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
                .stt-page { animation: stt-fadein 0.35s ease-out both; }
                .stt-input:focus { border-color: rgba(2,195,154,0.5) !important; box-shadow: 0 0 0 3px rgba(2,195,154,0.08) !important; }
            `}</style>

            <div className="stt-page space-y-6 max-w-2xl" style={{ color: tk.textSecondary }}>

                {/* ── Page header ── */}
                <div className="pb-5" style={{ borderBottom: `1px solid ${tk.border}` }}>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: tk.textPrimary }}>
                        Account Settings
                    </h2>
                    <p className="mt-1 text-xs" style={{ color: tk.textFaint }}>
                        Manage your profile and preferences
                    </p>
                </div>

                {/* ── Flash ── */}
                <Flash msg={flashProfile} tk={tk} />

                {/* ── Keycloak Account ── */}
                <Card title="Keycloak Account" subtitle="Your authentication details (managed by Keycloak)" tk={tk}>
                    <div className="space-y-4">
                        <ReadonlyField label="Username" value={username} hint="Contact admin to change." tk={tk} />
                        <ReadonlyField label="Email"    value={email}    hint="Contact admin to change." tk={tk} />
                    </div>
                </Card>

                {/* ── Profile ── */}
                <Card title="Profile" subtitle="Additional information about your account" tk={tk}>
                    {profileLoading ? (
                        <div className="space-y-4">
                            {[...Array(1)].map((_, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="h-2.5 w-24 rounded-md animate-pulse" style={{ background: isDark ? 'rgba(27,38,59,0.7)' : 'rgba(203,213,225,0.6)' }} />
                                    <div className="h-10 rounded-lg animate-pulse"         style={{ background: isDark ? 'rgba(27,38,59,0.5)' : 'rgba(203,213,225,0.4)' }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label style={labelStyle}>Department</label>
                                <input
                                    className="stt-input"
                                    style={inputStyle}
                                    placeholder="e.g. Security Operations"
                                    value={department}
                                    onChange={e => setDepartment(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ background: '#02c39a', color: '#0d1b2a' }}
                                    onMouseEnter={e => { if (!savingProfile) e.currentTarget.style.background = '#02e0b1' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#02c39a' }}
                                >
                                    {savingProfile ? 'Saving…' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    )}
                </Card>

                {/* ── Appearance ── */}
                <Card title="Appearance" subtitle="Choose how the interface looks for you" tk={tk}>
                    <div>
                        <label style={labelStyle}>Theme</label>
                        <ThemeSelector
                            selectedId={selectedThemeId}
                            onSelect={handleThemeSelect}
                            tk={tk}
                        />
                        <p className="mt-3 text-[11px]" style={{ color: tk.textFaint }}>
                            {selectedThemeId === 'system'
                                ? 'Automatically follows your OS preference.'
                                : `Manually set to ${selectedThemeId} mode.`}
                        </p>
                    </div>
                </Card>

            </div>
        </>
    )
}

export default Settings