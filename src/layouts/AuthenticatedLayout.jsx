import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useKeycloak } from '../context/KeycloakContext'
import Nav from './Nav'
import {
    Sun, Moon, LogOut, Menu,
    ChevronDown, User, Settings,
    Maximize2, Minimize2, Bell,
} from 'lucide-react'

// ─── Theme helpers ────────────────────────────────────────────────────────────

const getInitialTheme = () => localStorage.getItem('theme') || 'dark'
const applyTheme = (theme) => {
    document.documentElement.classList.toggle('light-mode', theme === 'light')
    localStorage.setItem('theme', theme)
}

// ─── User Dropdown ────────────────────────────────────────────────────────────

function UserMenu({ username, keycloak, theme }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const navigate = useNavigate()
    const initials = username.slice(0, 2).toUpperCase()

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleLogout = () => {
        keycloak.logout({ redirectUri: `${window.location.origin}/login` })
    }

    const isDark = theme === 'dark'

    return (
        <div className="relative" ref={ref}>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all duration-150"
                style={{
                    background: isDark ? 'rgba(19,34,56,0.8)' : '#fff',
                    border: `1px solid ${isDark ? '#1b263b' : '#e2e8f0'}`,
                    color: isDark ? '#94a3b8' : '#475569',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#028090' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#1b263b' : '#e2e8f0' }}
            >
                {/* Avatar */}
                <div
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[9px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #028090, #02c39a)' }}
                >
                    {initials}
                </div>
                <span
                    className="hidden text-xs font-medium sm:block"
                    style={{ color: isDark ? '#cbd5e1' : '#334155' }}
                >
                    {username}
                </span>
                <ChevronDown
                    size={13}
                    style={{
                        color: '#4a7a8a',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl"
                    style={{
                        background: isDark ? '#0d1b2a' : '#fff',
                        border: `1px solid ${isDark ? '#1b263b' : '#e2e8f0'}`,
                        boxShadow: isDark
                            ? '0 16px 48px rgba(0,0,0,0.5)'
                            : '0 16px 48px rgba(0,0,0,0.12)',
                        animation: 'dropdown-in 0.15s ease-out',
                    }}
                >
                    <style>{`
                        @keyframes dropdown-in {
                            from { opacity: 0; transform: translateY(-6px); }
                            to   { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>

                    {/* User info */}
                    <div
                        className="px-4 py-3"
                        style={{ borderBottom: `1px solid ${isDark ? '#1b263b' : '#f1f5f9'}` }}
                    >
                        <div className="flex items-center gap-2.5">
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white shrink-0"
                                style={{ background: 'linear-gradient(135deg, #028090, #02c39a)' }}
                            >
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p
                                    className="text-xs font-semibold truncate"
                                    style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                                >
                                    {username}
                                </p>
                                <p className="text-[10px]" style={{ color: '#4a7a8a' }}>
                                    Analyst
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5 space-y-0.5">
                        {[
                            {
                                icon: User,
                                label: 'Account Settings',
                                action: () => { navigate('/settings'); setOpen(false) },
                                danger: false,
                            },
                            {
                                icon: LogOut,
                                label: 'Sign Out',
                                action: handleLogout,
                                danger: true,
                            },
                        ].map(({ icon: Icon, label, action, danger }) => (
                            <button
                                key={label}
                                onClick={action}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150"
                                style={{ color: danger ? '#f87171' : isDark ? '#94a3b8' : '#475569' }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = danger
                                        ? 'rgba(239,68,68,0.08)'
                                        : isDark ? 'rgba(27,38,59,0.8)' : '#f8fafc'
                                    e.currentTarget.style.color = danger
                                        ? '#ef4444'
                                        : isDark ? '#f1f5f9' : '#0f172a'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.color = danger ? '#f87171' : isDark ? '#94a3b8' : '#475569'
                                }}
                            >
                                <Icon size={14} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ theme, toggleTheme, onMenuToggle, isSidebarOpen }) {
    const { keycloak, userInfo } = useKeycloak()
    const location = useLocation()
    const username = userInfo?.username || 'User'
    const [isFullscreen, setIsFullscreen] = useState(false)
    const isDark = theme === 'dark'

    useEffect(() => {
        const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
        document.addEventListener('fullscreenchange', onChange)
        onChange()
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen()
        } else {
            await document.exitFullscreen()
        }
    }

    // Derive a readable page title from the current route
    const pageTitle = (() => {
        const path = location.pathname.split('/').filter(Boolean)
        if (!path.length) return 'Dashboard'
        return path[0].charAt(0).toUpperCase() + path[0].slice(1)
    })()

    const controlStyle = {
        background: isDark ? 'rgba(19,34,56,0.8)' : '#fff',
        border: `1px solid ${isDark ? '#1b263b' : '#e2e8f0'}`,
        color: isDark ? '#4a7a8a' : '#64748b',
    }

    const controlHover = (e) => {
        e.currentTarget.style.borderColor = '#028090'
        e.currentTarget.style.color = isDark ? '#fff' : '#0f172a'
    }
    const controlLeave = (e) => {
        e.currentTarget.style.borderColor = isDark ? '#1b263b' : '#e2e8f0'
        e.currentTarget.style.color = isDark ? '#4a7a8a' : '#64748b'
    }

    return (
        <header
            className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 px-3 sm:px-5"
            style={{
                background: isDark
                    ? 'linear-gradient(180deg, #0a1520 0%, #0d1b2a 100%)'
                    : '#fff',
                borderBottom: `1px solid ${isDark ? '#1b263b' : '#e2e8f0'}`,
            }}
        >
            {/* Menu toggle */}
            <button
                onClick={onMenuToggle}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150"
                style={controlStyle}
                onMouseEnter={controlHover}
                onMouseLeave={controlLeave}
                title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
                <Menu size={15} />
            </button>

            {/* Page breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
                <span
                    className="text-xs font-semibold hidden sm:block"
                    style={{ color: isDark ? '#4a7a8a' : '#94a3b8' }}
                >
                    EXIA
                </span>
                <span
                    className="hidden sm:block text-xs"
                    style={{ color: isDark ? '#1b263b' : '#cbd5e1' }}
                >
                    /
                </span>
                <span
                    className="text-xs font-semibold truncate"
                    style={{ color: isDark ? '#cbd5e1' : '#334155' }}
                >
                    {pageTitle}
                </span>
            </div>

            <div className="flex-1" />

            {/* Right controls */}
            <div className="flex items-center gap-2">

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="h-8 w-8 flex items-center justify-center rounded-xl transition-all duration-150"
                    style={controlStyle}
                    onMouseEnter={controlHover}
                    onMouseLeave={controlLeave}
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </button>

                {/* Fullscreen */}
                <button
                    onClick={toggleFullscreen}
                    className="h-8 w-8 flex items-center justify-center rounded-xl transition-all duration-150"
                    style={controlStyle}
                    onMouseEnter={controlHover}
                    onMouseLeave={controlLeave}
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                    {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>

                {/* User menu */}
                <UserMenu username={username} keycloak={keycloak} theme={theme} />
            </div>
        </header>
    )
}

// ─── Authenticated Layout ─────────────────────────────────────────────────────

export default function AuthenticatedLayout() {
    const [theme, setTheme] = useState(getInitialTheme)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const isDark = theme === 'dark'

    useEffect(() => { applyTheme(theme) }, [theme])

    const toggleTheme  = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
    const toggleSidebar = () => setSidebarOpen(o => !o)

    return (
        <div
            className="flex min-h-screen"
            style={{
                background: isDark ? '#0d1b2a' : '#f8fafc',
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            }}
        >
            {/* ── Sidebar / Nav ── */}
            <Nav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* ── Main area ── */}
            <div
                className="flex flex-1 flex-col overflow-hidden transition-all duration-250 ease-out"
                style={{ paddingLeft: sidebarOpen ? '240px' : '0', transition: 'padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
                {/* Header */}
                <Header
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onMenuToggle={toggleSidebar}
                    isSidebarOpen={sidebarOpen}
                />

                {/* Page content */}
                <main
                    className="flex-1 overflow-y-auto"
                    style={{ background: isDark ? '#0d1b2a' : '#f8fafc' }}
                >
                    <div className="min-h-full w-full max-w-screen-2xl mx-auto p-4 sm:p-6 md:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}