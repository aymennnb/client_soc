import { useKeycloak } from '../context/KeycloakContext'
import { useState, useEffect } from 'react'
import api from '../api'

export function useAuth() {
    const { userInfo, isAdmin, hasRole, token, isAuthenticated } = useKeycloak()

    return {
        userId:          userInfo?.id,
        username:        userInfo?.username,
        email:           userInfo?.email,
        roles:           userInfo?.roles ?? [],
        isAdmin,
        hasRole,
        token,
        isAuthenticated,
    }
}

export function usePermissions() {
    const { userInfo, isAdmin } = useKeycloak()
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Admin users have all permissions
        if (isAdmin) {
            setPermissions(['ALL'])
            setLoading(false)
            return
        }

        // User not authenticated yet
        if (!userInfo?.id) {
            setPermissions([])
            setLoading(false)
            return
        }

        // Fetch user permissions from backend (Keycloak roles)
        setLoading(true)
        api.get(`/users/${userInfo.id}/permissions`)
            .then(r => {
                // API returns { permissions: ["VIEW_INCIDENTS", "VIEW_VULNERABILITIES", ...] }
                const perms = r.data.permissions || []
                console.log('[usePermissions] Loaded permissions:', perms)
                setPermissions(perms)
            })
            .catch(err => {
                console.error('[usePermissions] Failed to fetch permissions:', err)
                setPermissions([])
            })
            .finally(() => setLoading(false))
    }, [userInfo?.id, isAdmin])

    const can = (permission) => {
        // If still loading, assume no access (be safe)
        if (loading) return false
        if (!permissions) return false
        if (permissions.includes('ALL')) return true
        return permissions.includes(permission)
    }

    return { can, loading, permissions }
}
