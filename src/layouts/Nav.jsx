import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useKeycloak } from '../context/KeycloakContext'
import api from '../api'
import {
    LayoutDashboard,
    ShieldAlert,
    Siren,
    Users,
    Settings,
    X,
    Ticket,
    ChevronRight,
    Logs,
    RefreshCw,
    Radar
} from 'lucide-react'

// ─── useTheme ─────────────────────────────────────────────────────────────────
//
//  Reads data-theme attribute written by AuthenticatedLayout.
//  Same hook used across all pages — single source of truth.
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
        const mq = window.matchMedia('(prefers-color-scheme: light)')
        const mqh = (e) => { if (!document.documentElement.getAttribute('data-theme')) setIsDark(!e.matches) }
        mq.addEventListener('change', mqh)
        return () => { mo.disconnect(); mq.removeEventListener('change', mqh) }
    }, [])
    return isDark
}

// ─── Design tokens ────────────────────────────────────────────────────────────
//
//  Dark values are IDENTICAL to the original hardcoded colors — zero visual change.
//  Light values are adapted for a clean white sidebar.
//
const tokens = (isDark) => {
    const d = isDark
    return {
        // Sidebar panel
        bgSidebar:       d ? 'linear-gradient(180deg, #0a1520 0%, #0d1b2a 100%)'
                           : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderSidebar:   d ? '#1b263b'                          : '#e2e8f0',

        // Mobile backdrop
        bgBackdrop:      d ? 'rgba(6,14,22,0.7)'                : 'rgba(15,23,42,0.4)',

        // Brand header
        bgLogoBox:       d ? 'rgba(2,128,144,0.15)'             : 'rgba(2,128,144,0.1)',
        borderLogoBox:   d ? 'rgba(2,128,144,0.3)'              : 'rgba(2,128,144,0.25)',
        // Logo image filter: dark = white invert, light = teal tint
        logoFilter:      d ? 'brightness(0) invert(1)'          : 'brightness(0) saturate(100%) invert(35%) sepia(60%) saturate(500%) hue-rotate(155deg)',
        logoOpacity:     d ? '0.9'                              : '0.85',

        // Nav item — inactive
        colorNavIdle:    d ? 'rgba(148,163,184,0.9)'            : '#64748b',
        colorNavIcon:    d ? '#4a7a8a'                          : '#94a3b8',

        // Nav item — active
        bgNavActive:     d ? 'rgba(2,128,144,0.12)'             : 'rgba(2,128,144,0.09)',
        borderNavActive: d ? 'rgba(2,128,144,0.25)'             : 'rgba(2,128,144,0.22)',
        colorNavActive:  d ? '#02c39a'                          : '#028090',

        // Section divider label
        colorDivider:    d ? '#2d4a5a'                          : '#94a3b8',

        // Close button (mobile)
        colorClose:      d ? '#4a7a8a'                          : '#94a3b8',
        colorCloseHover: d ? '#ffffff'                          : '#0f172a',

        // Divider line (footer border)
        borderFooter:    d ? '#1b263b'                          : '#e2e8f0',
    }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
                      { id: 'dashboard',       label: 'Dashboard',           to: '/dashboard',                    icon: LayoutDashboard, permission: null,                           adminOnly: false },
                      { id: 'vulnerabilities', label: 'Vulnerabilities',     to: '/vulnerabilities',              icon: ShieldAlert,     permission: 'VIEW_VULNERABILITIES',       adminOnly: false },
                      { id: 'nessus-sync',     label: 'Nessus Sync',         to: '/vulnerabilities/sync',         icon: RefreshCw,       permission: 'SYNC_VULNERABILITIES',       adminOnly: false },
                      { id: 'launch-scan',     label: 'Launch Scan',         to: '/vulnerabilities/launch',  icon: Radar,           permission: 'LAUNCH_VULNERABILITY_SCAN',                           adminOnly: false },
                      { id: 'incidents',       label: 'Incidents',           to: '/incidents',                    icon: Siren,           permission: 'VIEW_INCIDENTS',             adminOnly: false },
                      { id: 'tickets',         label: 'Tickets',             to: '/tickets',                      icon: Ticket,          permission: null,                       adminOnly: false },
                      { id: 'users',           label: 'Users',               to: '/users',                        icon: Users,           permission: null,                         adminOnly: true  },
                      { id: 'logs',            label: "Journaux d'activité", to: '/jornaux',                         icon: Logs,            permission: null,                         adminOnly: true  },
                  ]

// ─── Permission hook ──────────────────────────────────────────────────────────

function usePermissions() {
    const { userInfo, isAdmin } = useKeycloak()
    const [permissions, setPermissions] = useState(null)

    useEffect(() => {
        if (!userInfo?.id) { setPermissions([]); return }
        if (isAdmin) { setPermissions(['ALL']); return }
        api.get(`/users/${userInfo.id}/permissions`)
            .then(r => setPermissions(r.data.permissions || []))
            .catch(() => setPermissions([]))
    }, [userInfo?.id, isAdmin])

    const can = (permission) => {
        if (!permissions) return false
        if (permissions.includes('ALL')) return true
        return permissions.includes(permission)
    }

    return { can, permissions }
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ item, onNavigate, tk }) {
    const location = useLocation()
    const Icon     = item.icon
    const isActive =
        item.id === 'vulnerabilities'
            ? location.pathname === '/vulnerabilities'
            : location.pathname === item.to || location.pathname.startsWith(item.to + '/')

    return (
        <NavLink
            to={item.to}
            end={item.id === 'vulnerabilities'}
            onClick={() => { if (window.innerWidth < 1024) onNavigate() }}
            className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 no-underline"
            style={() => {
                const active = isActive
                return {
                    background: active ? tk.bgNavActive     : 'transparent',
                    border:     active ? `1px solid ${tk.borderNavActive}` : '1px solid transparent',
                    color:      active ? tk.colorNavActive  : tk.colorNavIdle,
                }
            }}
        >
            {/* Active left accent bar — gradient always teal, theme-invariant */}
            <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full transition-all duration-300"
                style={{
                    height:     isActive ? '60%' : '0%',
                    background: 'linear-gradient(180deg, #02c39a, #028090)',
                    opacity:    isActive ? 1 : 0,
                }}
            />

            <Icon
                size={16}
                style={{ color: isActive ? tk.colorNavActive : tk.colorNavIcon }}
                className="shrink-0 transition-colors duration-200"
            />

            <span className="flex-1 truncate">{item.label}</span>

            {isActive && (
                <ChevronRight
                    size={12}
                    className="shrink-0 opacity-60"
                    style={{ color: tk.colorNavActive }}
                />
            )}
        </NavLink>
    )
}

// ─── Nav Section Divider ──────────────────────────────────────────────────────

function NavDivider({ label, tk }) {
    return (
        <div className="px-3 pt-4 pb-1">
            <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: tk.colorDivider }}
            >
                {label}
            </span>
        </div>
    )
}

// ─── Nav Component ────────────────────────────────────────────────────────────

export default function Nav({ open, onClose }) {
    const { isAdmin } = useKeycloak()
    const { can }     = usePermissions()
    const location    = useLocation()
    const isDark      = useTheme()
    const tk          = tokens(isDark)

    const visibleItems = NAV_ITEMS.filter(item => {
        if (item.adminOnly) return isAdmin
        if (item.permission) return can(item.permission)
        return true
    })

    const mainItems  = visibleItems.filter(i => i.id !== 'users' && i.id !== 'logs')
    const adminItems = visibleItems.filter(i => i.adminOnly)

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (window.innerWidth < 1024) onClose()
    }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            {/* ── Mobile backdrop ── */}
            {open && (
                <div
                    className="fixed inset-0 z-20 lg:hidden"
                    style={{ background: tk.bgBackdrop, backdropFilter: 'blur(2px)' }}
                    onClick={onClose}
                />
            )}

            {/* ── Sidebar panel ── */}
            <aside
                className="fixed top-0 left-0 z-30 flex h-full w-60 flex-col"
                style={{
                    background:   tk.bgSidebar,
                    borderRight:  `1px solid ${tk.borderSidebar}`,
                    transform:    open ? 'translateX(0)' : 'translateX(-100%)',
                    transition:   'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange:   'transform',
                }}
            >
                {/* ── Logo / Brand header ── */}
                <div
                    className="flex h-14 shrink-0 items-center justify-between px-4"
                    style={{ borderBottom: `1px solid ${tk.borderSidebar}` }}
                >
                    <div className="flex items-center gap-2.5">
                        {/* Accent dot + logo box */}
                        <div
                            className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{
                                background: tk.bgLogoBox,
                                border:     `1px solid ${tk.borderLogoBox}`,
                            }}
                        >
                            {/* Pulse dot — always teal, theme-invariant */}
                            <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: '#02c39a', boxShadow: '0 0 6px rgba(2,195,154,0.5)' }}
                            />
                        </div>
                        <img
                            src="/exia_logo.png"
                            alt="EXIA"
                            className="h-5 w-auto"
                        />
                    </div>

                    <button
                        onClick={onClose}
                        className="lg:hidden flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150"
                        style={{ color: tk.colorClose }}
                        aria-label="Close sidebar"
                        onMouseEnter={e => { e.currentTarget.style.color = tk.colorCloseHover }}
                        onMouseLeave={e => { e.currentTarget.style.color = tk.colorClose }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* ── Main navigation ── */}
                <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                    <NavDivider label="Navigation" tk={tk} />
                    {mainItems.map(item => (
                        <NavItem key={item.id} item={item} onNavigate={onClose} tk={tk} />
                    ))}

                    {adminItems.length > 0 && (
                        <>
                            <NavDivider label="Administration" tk={tk} />
                            {adminItems.map(item => (
                                <NavItem key={item.id} item={item} onNavigate={onClose} tk={tk} />
                            ))}
                        </>
                    )}
                </nav>

                {/* ── Footer: Settings ── */}
                <div
                    className="shrink-0 px-2 py-3"
                    style={{ borderTop: `1px solid ${tk.borderFooter}` }}
                >
                    <NavItem
                        item={{ id: 'settings', label: 'Settings', to: '/settings', icon: Settings, adminOnly: false, permission: null }}
                        onNavigate={onClose}
                        tk={tk}
                    />
                </div>
            </aside>
        </>
    )
}