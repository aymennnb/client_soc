import { useEffect, useState } from 'react'
import { useKeycloak } from '../context/KeycloakContext'

const getInitialTheme = () => localStorage.getItem('theme') || 'dark'
const applyTheme = (theme) => {
    document.documentElement.classList.toggle('light-mode', theme === 'light')
    localStorage.setItem('theme', theme)
}

function SunIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1"  x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1"  y1="12" x2="3"  y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64"  y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
    )
}

function MoonIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
    )
}

function ShieldIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    )
}

function Login() {
    const { keycloak, loading, isAuthenticated, error } = useKeycloak()
    const [theme, setTheme] = useState(getInitialTheme)
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    useEffect(() => { applyTheme(theme) }, [theme])
    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

    const isDark = theme === 'dark'

    // Gérer le clic sur le bouton de connexion
    const handleLogin = () => {
        console.log('[Login] User clicked login button')
        setIsLoggingIn(true)

        keycloak.login({
            redirectUri: `${window.location.origin}/`,
        }).catch((err) => {
            console.error('[Login] Login failed:', err)
            setIsLoggingIn(false)
        })
    }

    // Écran de chargement initial
    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0b0f12]' : 'bg-slate-50'}`}>
                <div className="text-center space-y-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00A897] border-t-transparent mx-auto"/>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Initializing authentication...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0b0f12] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

            {/* Top bar */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-[#1c2b2f] bg-black' : 'border-slate-200 bg-white'}`}>
                <img src="/exia_logo.png" alt="EXIA Technologie Logo" className="h-6 w-auto object-contain"/>
                <button
                    onClick={toggleTheme}
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                        isDark
                            ? 'border-[#1c2b2f] text-slate-400 hover:border-[#275B66] hover:text-[#00A897]'
                            : 'border-slate-200 text-slate-500 hover:border-[#275B66] hover:text-[#00A897]'
                    }`}>
                    {isDark ? <SunIcon /> : <MoonIcon />}
                </button>
            </div>

            {/* Center */}
            <div className="flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm space-y-8">

                    <div className="text-center space-y-2">
                        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Sign in
                        </h1>
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            Security Operations Center
                        </p>
                    </div>

                    <div className={`rounded-xl border p-6 space-y-5 ${
                        isDark ? 'border-[#1c2b2f] bg-black/60' : 'border-slate-200 bg-white shadow-sm'
                    }`}>

                        {/* Afficher les erreurs */}
                        {error && (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                <p className="font-semibold">Authentication Error</p>
                                <p className="text-xs mt-1">{error}</p>
                            </div>
                        )}

                        {/* Message d'info */}
                        <p className={`text-sm text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {isAuthenticated
                                ? 'You are already signed in. Redirecting...'
                                : 'Click below to sign in securely'}
                        </p>

                        {/* Bouton de connexion */}
                        <button
                            onClick={handleLogin}
                            disabled={isLoggingIn || isAuthenticated}
                            className={`w-full rounded-lg py-2.5 text-sm font-bold transition ${
                                isLoggingIn || isAuthenticated
                                    ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                                    : 'bg-[#00A897] text-black hover:bg-[#00c4b1]'
                            }`}
                        >
                            {isLoggingIn ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                                    Redirecting to Keycloak...
                                </span>
                            ) : isAuthenticated ? (
                                'Already Signed In'
                            ) : (
                                'Sign in with Keycloak'
                            )}
                        </button>
                    </div>

                    <p className={`text-center text-[11px] ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>
                        SOC App · Powered by Keycloak
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login