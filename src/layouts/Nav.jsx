import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import api from '../api'
import { useKeycloak } from '../context/KeycloakContext'

function Sidebar() {
    const { userInfo, isAdmin } = useKeycloak()

    const [permissions, setPermissions] = useState(null)

    useEffect(() => {
        if (!userInfo?.id) {
            setPermissions([])
            return
        }

        // Admin users have all permissions
        if (isAdmin) {
            setPermissions(['ALL'])
            return
        }

        // Fetch user's permissions from backend (Keycloak roles)
        api.get(`/users/${userInfo.id}/permissions`)
            .then(r => {
                // API returns { permissions: ["VIEW_INCIDENTS", ...] }
                setPermissions(r.data.permissions || [])
            })
            .catch(() => setPermissions([]))
    }, [userInfo?.id, isAdmin])

    const can = (permission) => {
        if (!permissions) return false
        if (permissions.includes('ALL')) return true
        return permissions.includes(permission)
    }

    const linkClass = ({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive
                ? 'bg-[#00A897] text-black'
                : 'text-slate-400 hover:bg-[#1c2b2f] hover:text-white lm:text-slate-600 lm:hover:bg-slate-100 lm:hover:text-slate-900'
        }`

    return (
        <aside className="min-h-screen w-56 shrink-0 border-r border-[#1c2b2f] bg-black/80 px-3 py-6 lm:bg-slate-50 lm:border-slate-200">
            <nav className="space-y-1">

                <NavLink to="/dashboard" className={linkClass}>
                    Dashboard
                </NavLink>

                {can('VIEW_VULNERABILITIES') && (
                    <NavLink to="/vulnerabilities" className={linkClass}>
                        Vulnerabilities
                    </NavLink>
                )}

                {can('VIEW_INCIDENTS') && (
                    <NavLink to="/incidents" className={linkClass}>
                        Incidents
                    </NavLink>
                )}

                <NavLink to="/tickets" className={linkClass}>
                    Tickets
                </NavLink>

                {isAdmin && (
                    <NavLink to="/users" className={linkClass}>
                        Users
                    </NavLink>
                )}

            </nav>
        </aside>
    )
}

export default Sidebar