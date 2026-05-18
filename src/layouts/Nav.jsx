import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useKeycloak } from '../context/KeycloakContext'
import api from '../api'
import {
    LayoutDashboard, ShieldAlert, Siren, Users,
    Settings, X, Ticket, ChevronRight,Logs
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        permission: null,
        adminOnly: false,
    },
    {
        id: 'vulnerabilities',
        label: 'Vulnerabilities',
        to: '/vulnerabilities',
        icon: ShieldAlert,
        permission: 'VIEW_VULNERABILITIES',
        adminOnly: false,
    },
    {
        id: 'incidents',
        label: 'Incidents',
        to: '/incidents',
        icon: Siren,
        permission: 'VIEW_INCIDENTS',
        adminOnly: false,
    },
    {
        id: 'tickets',
        label: 'Tickets',
        to: '/tickets',
        icon: Ticket,
        permission: 'VIEW_TICKETS',
        adminOnly: false,
    },
    {
        id: 'users',
        label: 'Users',
        to: '/users',
        icon: Users,
        permission: null,
        adminOnly: true,
    },
    {
        id: 'logs',
        label: 'Journaux d\'activité',
        to: '/logs',
        icon: Logs,
        permission: null,
        adminOnly: true,
    },
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

function NavItem({ item, onNavigate }) {
    const location = useLocation()
    const Icon = item.icon
    const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')

    return (
        <NavLink
            to={item.to}
            onClick={() => { if (window.innerWidth < 1024) onNavigate() }}
            className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 no-underline"
            style={({ isActive: routerActive }) => {
                const active = routerActive || isActive
                return {
                    background: active ? 'rgba(2,128,144,0.12)' : 'transparent',
                    border: active ? '1px solid rgba(2,128,144,0.25)' : '1px solid transparent',
                    color: active ? '#02c39a' : 'rgba(148,163,184,0.9)',
                }
            }}
        >
            {/* Active left accent bar */}
            <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full transition-all duration-300"
                style={{
                    height: isActive ? '60%' : '0%',
                    background: 'linear-gradient(180deg, #02c39a, #028090)',
                    opacity: isActive ? 1 : 0,
                }}
            />

            <Icon
                size={16}
                style={{ color: isActive ? '#02c39a' : '#4a7a8a' }}
                className="shrink-0 transition-colors duration-200"
            />

            <span className="flex-1 truncate">{item.label}</span>

            {isActive && (
                <ChevronRight
                    size={12}
                    className="shrink-0 opacity-60"
                    style={{ color: '#028090' }}
                />
            )}
        </NavLink>
    )
}

// ─── Nav Section Divider ──────────────────────────────────────────────────────

function NavDivider({ label }) {
    return (
        <div className="px-3 pt-4 pb-1">
            <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: '#2d4a5a' }}
            >
                {label}
            </span>
        </div>
    )
}

// ─── Nav Component ────────────────────────────────────────────────────────────

export default function Nav({ open, onClose }) {
    const { isAdmin } = useKeycloak()
    const { can } = usePermissions()
    const location = useLocation()

    const visibleItems = NAV_ITEMS.filter(item => {
        if (item.adminOnly) return isAdmin
        if (item.permission) return can(item.permission)
        return true
    })

    const mainItems = visibleItems.filter(i => i.id !== 'users' & i.id !== 'logs')
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
                    style={{ background: 'rgba(6,14,22,0.7)', backdropFilter: 'blur(2px)' }}
                    onClick={onClose}
                />
            )}

            {/* ── Sidebar panel ── */}
            <aside
                className="fixed top-0 left-0 z-30 flex h-full w-60 flex-col"
                style={{
                    background: 'linear-gradient(180deg, #0a1520 0%, #0d1b2a 100%)',
                    borderRight: '1px solid #1b263b',
                    transform: open ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform',
                }}
            >
                {/* ── Logo / Brand header ── */}
                <div
                    className="flex h-14 shrink-0 items-center justify-between px-4"
                    style={{ borderBottom: '1px solid #1b263b' }}
                >
                    <div className="flex items-center gap-2.5">
                        {/* Accent dot + logo */}
                        <div
                            className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{
                                background: 'rgba(2,128,144,0.15)',
                                border: '1px solid rgba(2,128,144,0.3)',
                            }}
                        >
                            <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: '#02c39a', boxShadow: '0 0 6px rgba(2,195,154,0.5)' }}
                            />
                        </div>
                        <img
                            src="/exia_logo.png"
                            alt="EXIA"
                            className="h-5 w-auto"
                            style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
                        />
                    </div>

                    <button
                        onClick={onClose}
                        className="lg:hidden flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150"
                        style={{ color: '#4a7a8a' }}
                        aria-label="Close sidebar"
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#4a7a8a' }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* ── Main navigation ── */}
                <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                    <NavDivider label="Navigation" />
                    {mainItems.map(item => (
                        <NavItem key={item.id} item={item} onNavigate={onClose} />
                    ))}

                    {adminItems.length > 0 && (
                        <>
                            <NavDivider label="Administration" />
                            {adminItems.map(item => (
                                <NavItem key={item.id} item={item} onNavigate={onClose} />
                            ))}
                        </>
                    )}
                </nav>

                {/* ── Footer: Settings ── */}
                <div
                    className="shrink-0 px-2 py-3"
                    style={{ borderTop: '1px solid #1b263b' }}
                >
                    <NavItem
                        item={{ id: 'settings', label: 'Settings', to: '/settings', icon: Settings, adminOnly: false, permission: null }}
                        onNavigate={onClose}
                    />
                </div>
            </aside>
        </>
    )
}