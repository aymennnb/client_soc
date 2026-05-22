/**
 * Login.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Remplace l'ancien Login.jsx (redirect Keycloak)
 *
 * CHANGEMENTS :
 *   ✗ SUPPRIMÉ  — keycloak.login({ redirectUri })
 *   ✗ SUPPRIMÉ  — import { useKeycloak } (plus besoin du keycloak object)
 *   ✓ NOUVEAU   — Formulaire username + password
 *   ✓ NOUVEAU   — Appelle auth.login(username, password) → backend
 *   ✓ CONSERVÉ  — dark/light mode identique
 *   ✓ CONSERVÉ  — même charte graphique (couleurs, animations, AmbientOrbs)
 */

import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useAuth }             from '../context/AuthContext'
import {
    Sun, Moon, Eye, EyeOff,
    Loader2, AlertCircle, ShieldCheck,
} from 'lucide-react'

// ─── Theme helpers (identique à l'original) ───────────────────────────────────
const getInitialTheme = () => localStorage.getItem('theme') || 'dark'
const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
}

// ─── Ambient background orbs (inchangé) ──────────────────────────────────────
function AmbientOrbs({ isDark }) {
    if (!isDark) return null
    return (
        <>
            <div className="pointer-events-none fixed" style={{
                top: '-20vh', left: '-10vw',
                width: '60vw', height: '60vw', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(2,128,144,0.07) 0%, transparent 70%)',
                filter: 'blur(40px)',
            }} />
            <div className="pointer-events-none fixed" style={{
                bottom: '-15vh', right: '-10vw',
                width: '50vw', height: '50vw', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(2,195,154,0.05) 0%, transparent 70%)',
                filter: 'blur(40px)',
            }} />
        </>
    )
}

// ─── Input field component ────────────────────────────────────────────────────
function Field({ label, id, type, value, onChange, isDark, placeholder, suffix }) {
    const base = {
        width: '100%', padding: '10px 12px',
        borderRadius: '10px', fontSize: '13px',
        background: isDark ? 'rgba(10,21,32,0.8)' : '#f8fafc',
        border: `1px solid ${isDark ? '#1b263b' : '#e2e8f0'}`,
        color: isDark ? '#e2e8f0' : '#0f172a',
        outline: 'none', transition: 'border-color 0.15s',
        paddingRight: suffix ? '40px' : '12px',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor={id} style={{
                fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em',
                color: isDark ? '#4a7a8a' : '#64748b', textTransform: 'uppercase',
            }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={id}
                    style={base}
                    onFocus={e  => { e.target.style.borderColor = '#028090' }}
                    onBlur={e   => { e.target.style.borderColor = isDark ? '#1b263b' : '#e2e8f0' }}
                />
                {suffix && (
                    <div style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)',
                    }}>
                        {suffix}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Login() {
    const { login, loading: authLoading, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    const [theme,       setTheme]       = useState(getInitialTheme)
    const [username,    setUsername]    = useState('')
    const [password,    setPassword]    = useState('')
    const [showPwd,     setShowPwd]     = useState(false)
    const [submitting,  setSubmitting]  = useState(false)
    const [error,       setError]       = useState(null)

    useEffect(() => { applyTheme(theme) }, [theme])

    // Rediriger si déjà authentifié
    useEffect(() => {
        if (!authLoading && isAuthenticated) navigate('/', { replace: true })
    }, [authLoading, isAuthenticated, navigate])

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
    const isDark      = theme === 'dark'

    // ── Soumission ─────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!username.trim() || !password) return

        setError(null)
        setSubmitting(true)

        const result = await login(username.trim(), password)

        if (result.success) {
            navigate('/', { replace: true })
        } else {
            setError(result.error)
            setSubmitting(false)
        }
    }

    // ── Styles réutilisables ───────────────────────────────────────────────────
    const surface = {
        background: isDark ? 'rgba(13,27,42,0.85)' : '#fff',
        border:     `1px solid ${isDark ? '#1b263b' : '#e2e8f0'}`,
    }

    // ── Écran de chargement initial (session restoration) ─────────────────────
    if (authLoading) {
        return (
            <div style={{
                display: 'flex', minHeight: '100vh',
                alignItems: 'center', justifyContent: 'center',
                background: isDark ? '#0d1b2a' : '#f8fafc',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        display: 'flex', width: '48px', height: '48px',
                        alignItems: 'center', justifyContent: 'center', borderRadius: '14px',
                        background: 'rgba(2,128,144,0.12)', border: '1px solid rgba(2,128,144,0.25)',
                    }}>
                        <Loader2 size={20} style={{ color: '#028090', animation: 'spin 1s linear infinite' }} />
                    </div>
                    <p style={{ fontSize: '13px', color: '#4a7a8a' }}>Restoring session…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <>
            <style>{`
                @keyframes login-in {
                    from { opacity: 0; transform: translateY(14px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                input:-webkit-autofill,
                input:-webkit-autofill:focus {
                    -webkit-box-shadow: 0 0 0 1000px ${isDark ? '#0a1520' : '#f8fafc'} inset !important;
                    -webkit-text-fill-color: ${isDark ? '#e2e8f0' : '#0f172a'} !important;
                }
            `}</style>

            <div style={{
                position: 'relative', display: 'flex', flexDirection: 'column',
                minHeight: '100vh', overflow: 'hidden',
                background: isDark ? '#0d1b2a' : '#f8fafc',
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            }}>
                <AmbientOrbs isDark={isDark} />

                {/* ── Top bar (inchangé) ─────────────────────────────────── */}
                <header style={{
                    position: 'relative', zIndex: 10,
                    display: 'flex', height: '56px', alignItems: 'center',
                    justifyContent: 'space-between', padding: '0 24px',
                    background: isDark ? 'rgba(10,21,32,0.9)' : 'rgba(255,255,255,0.9)',
                    borderBottom: `1px solid ${isDark ? '#1b263b' : '#e2e8f0'}`,
                    backdropFilter: 'blur(8px)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            display: 'flex', width: '28px', height: '28px',
                            alignItems: 'center', justifyContent: 'center', borderRadius: '8px',
                            background: 'rgba(2,128,144,0.15)', border: '1px solid rgba(2,128,144,0.3)',
                        }}>
                            <div style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: '#02c39a', boxShadow: '0 0 6px rgba(2,195,154,0.6)',
                            }} />
                        </div>
                        <img
                            src="/exia_logo.png" alt="EXIA" style={{
                                height: '20px', width: 'auto', opacity: 0.9,
                                filter: isDark ? 'brightness(0) invert(1)' : 'none',
                            }}
                        />
                    </div>

                    <button
                        onClick={toggleTheme}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        style={{
                            display: 'flex', width: '32px', height: '32px',
                            alignItems: 'center', justifyContent: 'center', borderRadius: '10px',
                            background: isDark ? 'rgba(27,38,59,0.8)' : '#fff',
                            border: `1px solid ${isDark ? '#1b263b' : '#e2e8f0'}`,
                            color: isDark ? '#4a7a8a' : '#64748b', cursor: 'pointer',
                            transition: 'border-color 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#028090'; e.currentTarget.style.color = '#028090' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#1b263b' : '#e2e8f0'; e.currentTarget.style.color = isDark ? '#4a7a8a' : '#64748b' }}
                    >
                        {isDark ? <Sun size={15} /> : <Moon size={15} />}
                    </button>
                </header>

                {/* ── Centre ────────────────────────────────────────────────── */}
                <main style={{
                    position: 'relative', zIndex: 10, flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '48px 16px',
                }}>
                    <div style={{ width: '100%', maxWidth: '360px', animation: 'login-in 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>

                        {/* ── Hero ── */}
                        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                            <h1 style={{
                                fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em',
                                color: isDark ? '#f1f5f9' : '#0f172a', margin: 0,
                            }}>
                                Security Operations
                            </h1>
                            <p style={{ marginTop: '6px', fontSize: '13px', color: isDark ? '#4a7a8a' : '#64748b' }}>
                                Sign in to access your SOC platform
                            </p>
                        </div>

                        {/* ── Card ── */}
                        <div style={{
                            ...surface, borderRadius: '18px', overflow: 'hidden',
                            boxShadow: isDark
                                ? '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(27,38,59,0.8)'
                                : '0 24px 64px rgba(0,0,0,0.08)',
                        }}>
                            {/* Accent bar */}
                            <div style={{
                                height: '1px', width: '100%',
                                background: 'linear-gradient(90deg, transparent, #028090, #02c39a, transparent)',
                            }} />

                            <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                                {/* Error */}
                                {error && (
                                    <div style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                                        padding: '12px 14px', borderRadius: '10px',
                                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                    }}>
                                        <AlertCircle size={14} style={{ color: '#f87171', marginTop: '1px', flexShrink: 0 }} />
                                        <div>
                                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#f87171', margin: 0 }}>
                                                Authentication failed
                                            </p>
                                            <p style={{ fontSize: '11px', color: '#fca5a5', margin: '3px 0 0' }}>
                                                {error}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <Field
                                        label="Username"
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        isDark={isDark}
                                        placeholder="your.username"
                                    />

                                    <Field
                                        label="Password"
                                        id="current-password"
                                        type={showPwd ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        isDark={isDark}
                                        placeholder="••••••••"
                                        suffix={
                                            <button
                                                type="button"
                                                onClick={() => setShowPwd(v => !v)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: isDark ? '#4a7a8a' : '#94a3b8', padding: 0,
                                                    display: 'flex', alignItems: 'center',
                                                }}
                                            >
                                                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        }
                                    />

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={submitting || !username.trim() || !password}
                                        style={{
                                            width: '100%', padding: '11px',
                                            borderRadius: '10px', border: 'none',
                                            fontSize: '13px', fontWeight: 700,
                                            cursor: submitting || !username.trim() || !password ? 'not-allowed' : 'pointer',
                                            opacity: submitting || !username.trim() || !password ? 0.6 : 1,
                                            background: 'linear-gradient(135deg, #028090 0%, #02c39a 100%)',
                                            color: '#0d1b2a',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            transition: 'opacity 0.15s, filter 0.15s',
                                            marginTop: '4px',
                                        }}
                                        onMouseEnter={e => { if (!submitting) e.currentTarget.style.filter = 'brightness(1.1)' }}
                                        onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                                Authenticating…
                                            </>
                                        ) : (
                                            'Sign In'
                                        )}
                                    </button>
                                </form>

                                {/* Footer info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '1px', background: isDark ? '#1b263b' : '#f1f5f9' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 500, color: isDark ? '#2d4a5a' : '#cbd5e1' }}>
                                        enterprise sso · secured by keycloak
                                    </span>
                                    <div style={{ flex: 1, height: '1px', background: isDark ? '#1b263b' : '#f1f5f9' }} />
                                </div>
                            </div>
                        </div>

                        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '10px', color: isDark ? '#1b263b' : '#cbd5e1' }}>
                            EXIA SOC Platform · All rights reserved
                        </p>
                    </div>
                </main>
            </div>
        </>
    )
}