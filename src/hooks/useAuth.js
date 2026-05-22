/**
 * userAuth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CHANGEMENTS :
 *   ✗ SUPPRIMÉ  — import { useKeycloak } from '../context/KeycloakContext'
 *   ✓ REMPLACÉ  — import { useAuth }     from '../context/AuthContext'
 *   ✓ CONSERVÉ  — interface publique identique : useAuth(), usePermissions()
 *
 * Les consumers existants qui importent { useAuth } depuis ce fichier
 * n'ont AUCUNE modification à faire.
 */

import { useAuth as useAuthContext } from '../context/AuthContext'
import { useState, useEffect }       from 'react'
import api                           from '../api'

// ─── useAuth ──────────────────────────────────────────────────────────────────
/**
 * Hook principal — remplace l'ancien qui lisait depuis KeycloakContext.
 * Interface 100 % identique.
 */
export function useAuth() {
    const { userInfo, isAdmin, hasRole, token, isAuthenticated, logout } = useAuthContext()

    return {
        userId:          userInfo?.id,
        username:        userInfo?.username,
        email:           userInfo?.email,
        roles:           userInfo?.roles ?? [],
        isAdmin,
        hasRole,
        token,
        isAuthenticated,
        logout,           // nouveau — expose logout pour les composants qui en ont besoin
    }
}

// ─── usePermissions ───────────────────────────────────────────────────────────
/**
 * Inchangé dans sa logique : charge les permissions depuis le backend.
 * Seul le hook source change (useAuthContext au lieu de useKeycloak).
 */
export function usePermissions() {
    const { userInfo, isAdmin } = useAuthContext()
    const [permissions, setPermissions] = useState([])
    const [loading,     setLoading]     = useState(true)

    useEffect(() => {
        if (isAdmin) {
            setPermissions(['ALL'])
            setLoading(false)
            return
        }

        if (!userInfo?.id) {
            setPermissions([])
            setLoading(false)
            return
        }

        setLoading(true)
        api.get(`/users/${userInfo.id}/permissions`)
            .then(r => {
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
        if (loading)       return false
        if (!permissions)  return false
        if (permissions.includes('ALL')) return true
        return permissions.includes(permission)
    }

    return { can, loading, permissions }
}