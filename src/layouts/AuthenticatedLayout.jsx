import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Nav.jsx'
import { useKeycloak } from '../context/KeycloakContext'

const getInitialTheme = () => localStorage.getItem('theme') || 'dark'
const applyTheme = (theme) => {
    document.documentElement.classList.toggle('light-mode', theme === 'light')
    localStorage.setItem('theme', theme)
}

function SunIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
    )
}
function SettingsIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
    )
}

function AuthenticatedLayout() {
    const navigate = useNavigate()
    const { keycloak, userInfo } = useKeycloak()

    const [theme, setTheme] = useState(getInitialTheme)

    useEffect(() => { applyTheme(theme) }, [theme])

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

    const handleLogout = () => {
        keycloak.logout({
            redirectUri: `${window.location.origin}/login`
        })
    }

    const username = userInfo?.username || 'User'
    const initials = username.slice(0, 2).toUpperCase()

    return (
        <div className="min-h-screen bg-[#0b0f12] text-slate-100 lm:bg-white lm:text-slate-900">
            <header className="flex items-center justify-between border-b border-[#1c2b2f] bg-black px-6 py-3 lm:bg-white lm:border-slate-200">

                <div className="flex items-center gap-3">
                    <img src="/exia_logo.png" alt="EXIA Technologie Logo" className="h-6 w-auto object-contain"/>
                </div>

                <div className="flex items-center gap-3">

                    <button onClick={toggleTheme}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1c2b2f] text-slate-400 transition hover:border-[#275B66] hover:text-[#00A897] lm:border-slate-200">
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>

                    <button onClick={() => navigate('/settings')} title="Account settings"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1c2b2f] text-slate-400 transition hover:border-[#275B66] hover:text-[#00A897] lm:border-slate-200">
                        <SettingsIcon />
                    </button>

                    <div className="h-6 w-px bg-[#1c2b2f] lm:bg-slate-200"/>

                    <button onClick={handleLogout}
                        className="rounded-lg border border-[#275B66] px-2 py-1.5 text-xs font-semibold text-[#00A897] transition hover:bg-[#275B66] hover:text-white">
                        <svg width="12" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </button>
                </div>
            </header>

            <div className="flex">
                <Sidebar />
                <main className="flex-1 p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AuthenticatedLayout