import { useEffect, useState } from 'react'
import { useKeycloak } from '../context/KeycloakContext'
import { Sun, Moon, Shield, KeyRound, Loader2, AlertCircle } from 'lucide-react'

// ─── Theme helpers ────────────────────────────────────────────────────────────

const getInitialTheme = () => localStorage.getItem('theme') || 'dark'
const applyTheme = (theme) => {
    document.documentElement.classList.toggle('light-mode', theme === 'light')
    localStorage.setItem('theme', theme)
}

// ─── Ambient background orbs ──────────────────────────────────────────────────

function AmbientOrbs({ isDark }) {
    if (!isDark) return null
    return (
        <>
            <div
                className="pointer-events-none fixed"
                style={{
                    top: '-20vh', left: '-10vw',
                    width: '60vw', height: '60vw',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(2,128,144,0.07) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
            />
            <div
                className="pointer-events-none fixed"
                style={{
                    bottom: '-15vh', right: '-10vw',
                    width: '50vw', height: '50vw',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(2,195,154,0.05) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
            />
        </>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

function Login() {
    const { keycloak, loading, isAuthenticated, error } = useKeycloak()
    const [theme, setTheme]         = useState(getInitialTheme)
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    useEffect(() => { applyTheme(theme) }, [theme])
    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
    const isDark = theme === 'dark'

    const handleLogin = () => {
        setIsLoggingIn(true)
        keycloak.login({ redirectUri: `${window.location.origin}/` })
            .catch(() => setIsLoggingIn(false))
    }

    // ── Token values ──
    const surface = isDark
        ? { background: 'rgba(13,27,42,0.8)', border: '1px solid #1b263b' }
        : { background: '#fff', border: '1px solid #e2e8f0' }

    const pageBg = isDark ? '#0d1b2a' : '#f8fafc'

    // ── Initial loading screen ──
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center" style={{ background: pageBg }}>
                <style>{`
                    @keyframes spin-once { to { transform: rotate(360deg); } }
                `}</style>
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ background: 'rgba(2,128,144,0.12)', border: '1px solid rgba(2,128,144,0.25)' }}
                    >
                        <Loader2 size={20} className="animate-spin" style={{ color: '#028090' }} />
                    </div>
                    <p className="text-sm" style={{ color: '#4a7a8a' }}>Initializing authentication…</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <style>{`
                @keyframes login-in {
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0)    scale(1);    }
                }
                .login-card { animation: login-in 0.45s cubic-bezier(0.16,1,0.3,1) both; }

                @keyframes pulse-ring {
                    0%   { transform: scale(1);    opacity: 0.4; }
                    100% { transform: scale(1.5);  opacity: 0;   }
                }
                .pulse-ring { animation: pulse-ring 2.2s ease-out infinite; }
            `}</style>

            <div
                className="relative flex min-h-screen flex-col overflow-hidden"
                style={{ background: pageBg, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
            >
                <AmbientOrbs isDark={isDark} />

                {/* ── Top bar ── */}
                <header
                    className="relative z-10 flex h-14 shrink-0 items-center justify-between px-6"
                    style={{
                        background: isDark ? 'rgba(10,21,32,0.9)' : 'rgba(255,255,255,0.9)',
                        borderBottom: `1px solid ${isDark ? '#1b263b' : '#e2e8f0'}`,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div
                            className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ background: 'rgba(2,128,144,0.15)', border: '1px solid rgba(2,128,144,0.3)' }}
                        >
                            <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: '#02c39a', boxShadow: '0 0 6px rgba(2,195,154,0.6)' }}
                            />
                        </div>
                        <img
                            src="/exia_logo.png"
                            alt="EXIA"
                            className="h-5 w-auto"
                            style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none', opacity: 0.9 }}
                        />
                    </div>

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150"
                        style={{
                            background: isDark ? 'rgba(27,38,59,0.8)' : '#fff',
                            border: `1px solid ${isDark ? '#1b263b' : '#e2e8f0'}`,
                            color: isDark ? '#4a7a8a' : '#64748b',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#028090'; e.currentTarget.style.color = isDark ? '#02c39a' : '#028090' }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = isDark ? '#1b263b' : '#e2e8f0'
                            e.currentTarget.style.color = isDark ? '#4a7a8a' : '#64748b'
                        }}
                    >
                        {isDark ? <Sun size={15} /> : <Moon size={15} />}
                    </button>
                </header>

                {/* ── Center content ── */}
                <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
                    <div className="login-card w-full max-w-sm">

                        {/* ── Shield icon hero ── */}
                        <div className="mb-8 flex flex-col items-center gap-4">

                            <div className="text-center">
                                <h1
                                    className="text-2xl font-bold tracking-tight"
                                    style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                                >
                                    Security Operations
                                </h1>
                                <p className="mt-1 text-sm" style={{ color: isDark ? '#4a7a8a' : '#64748b' }}>
                                    Sign in to access your SOC platform
                                </p>
                            </div>
                        </div>

                        {/* ── Login card ── */}
                        <div
                            className="overflow-hidden rounded-2xl"
                            style={{
                                ...surface,
                                boxShadow: isDark
                                    ? '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(27,38,59,0.8)'
                                    : '0 24px 64px rgba(0,0,0,0.08)',
                            }}
                        >
                            {/* Top accent gradient */}
                            <div
                                className="h-px w-full"
                                style={{ background: 'linear-gradient(90deg, transparent, #028090, #02c39a, transparent)' }}
                            />

                            <div className="px-6 py-7 space-y-5">

                                {/* Error banner */}
                                {error && (
                                    <div
                                        className="flex items-start gap-3 rounded-xl px-4 py-3"
                                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                                    >
                                        <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                                        <div>
                                            <p className="text-xs font-semibold" style={{ color: '#f87171' }}>Authentication Error</p>
                                            <p className="mt-0.5 text-[11px]" style={{ color: '#fca5a5' }}>{error}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Status message */}
                                <div
                                    className="rounded-xl px-4 py-3 text-sm text-center"
                                    style={{
                                        background: isDark ? 'rgba(27,38,59,0.4)' : '#f8fafc',
                                        border: `1px solid ${isDark ? '#1b263b' : '#f1f5f9'}`,
                                        color: isDark ? '#94a3b8' : '#64748b',
                                    }}
                                >
                                    {isAuthenticated
                                        ? 'You are signed in — redirecting…'
                                        : 'Your session will be authenticated via Keycloak SSO'}
                                </div>

                                {/* Sign in button */}
                                <button
                                    onClick={handleLogin}
                                    disabled={isLoggingIn || isAuthenticated}
                                    className="relative w-full overflow-hidden rounded-xl py-3 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                                    style={{
                                        background: isLoggingIn || isAuthenticated
                                            ? 'rgba(2,128,144,0.4)'
                                            : 'linear-gradient(135deg, #028090 0%, #02c39a 100%)',
                                        color: '#0d1b2a',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isLoggingIn && !isAuthenticated)
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #029aad 0%, #03d9ab 100%)'
                                    }}
                                    onMouseLeave={e => {
                                        if (!isLoggingIn && !isAuthenticated)
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #028090 0%, #02c39a 100%)'
                                    }}
                                >
                                    {/* Shimmer overlay on hover */}
                                    <span className="relative z-10 flex items-center justify-center gap-2.5">
                                        {isLoggingIn ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin" />
                                                Redirecting to Keycloak…
                                            </>
                                        ) : isAuthenticated ? (
                                            'Already Signed In'
                                        ) : (
                                            <>
                                                <KeyRound size={15} />
                                                Sign in with Keycloak
                                            </>
                                        )}
                                    </span>
                                </button>

                                {/* Provider info */}
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-px flex-1" style={{ background: isDark ? '#1b263b' : '#f1f5f9' }} />
                                    <span className="text-[10px] font-medium" style={{ color: isDark ? '#2d4a5a' : '#cbd5e1' }}>
                                        secured by keycloak
                                    </span>
                                    <div className="h-px flex-1" style={{ background: isDark ? '#1b263b' : '#f1f5f9' }} />
                                </div>
                            </div>
                        </div>

                        {/* ── Footer meta ── */}
                        <p className="mt-6 text-center text-[10px]" style={{ color: isDark ? '#1b263b' : '#cbd5e1' }}>
                            EXIA SOC Platform · All rights reserved
                        </p>
                    </div>
                </main>
            </div>
        </>
    )
}

export default Login