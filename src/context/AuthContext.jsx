/**
 * AuthContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Remplace KeycloakContext.jsx
 *
 * CHANGEMENTS :
 *   ✗ SUPPRIMÉ  — import keycloak from '../auth/keycloak'
 *   ✗ SUPPRIMÉ  — keycloak.init(), keycloak.login(), keycloak.logout()
 *   ✗ SUPPRIMÉ  — keycloakInitialized flag
 *   ✓ NOUVEAU   — auth state géré localement (localStorage + mémoire)
 *   ✓ NOUVEAU   — login() appelle POST /auth/login sur le backend
 *   ✓ NOUVEAU   — logout() appelle POST /auth/logout sur le backend
 *   ✓ NOUVEAU   — refreshToken() appelle POST /auth/refresh sur le backend
 *   ✓ CONSERVÉ  — même interface publique : userInfo, isAdmin, hasRole, token, isAuthenticated
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import api from '../api'                 // votre instance axios existante

// ─── Shape du contexte (documenté pour les consumers) ────────────────────────
const AuthContext = createContext(null)

// ─── Helpers localStorage ─────────────────────────────────────────────────────
const STORAGE_KEY = 'auth_session'

const saveSession = (session) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch (_) { /* quota exceeded – ignore */ }
}

const loadSession = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch (_) {
        return null
    }
}

const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY)
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
    const [loading,     setLoading]     = useState(true)
    const [token,       setToken]       = useState(null)
    const [userInfo,    setUserInfo]    = useState(null)
    const [error,       setError]       = useState(null)
    const refreshTimerRef               = useRef(null)

    // ── Restaurer session au démarrage ────────────────────────────────────────
    useEffect(() => {
        const session = loadSession()

        if (session?.token && session?.userInfo) {
            // Vérifier que le token n'est pas expiré côté client (exp claim)
            const isExpired = session.expiresAt
                ? Date.now() > session.expiresAt
                : false

            if (!isExpired) {
                setToken(session.token)
                setUserInfo(session.userInfo)
                scheduleRefresh(session.expiresAt)
            } else {
                // Tenter un refresh silencieux
                silentRefresh(session.refreshToken)
            }
        }

        setLoading(false)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Planifier le refresh automatique ─────────────────────────────────────
    const scheduleRefresh = useCallback((expiresAt) => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        if (!expiresAt) return

        // Rafraîchir 60 secondes avant expiration
        const delay = expiresAt - Date.now() - 60_000
        if (delay <= 0) return

        refreshTimerRef.current = setTimeout(() => {
            const session = loadSession()
            if (session?.refreshToken) silentRefresh(session.refreshToken)
        }, delay)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Refresh silencieux ────────────────────────────────────────────────────
    const silentRefresh = useCallback(async (refreshToken) => {
        if (!refreshToken) {
            _clearAuth()
            return
        }

        try {
            const { data } = await api.post('/auth/refresh', { refreshToken })
            _applySession(data)
        } catch (err) {
            console.warn('[Auth] Silent refresh failed — clearing session')
            _clearAuth()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Appliquer une nouvelle session ────────────────────────────────────────
    const _applySession = useCallback((data) => {
        const { token: accessToken, refreshToken, userInfo: info, expiresIn } = data
        const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null

        setToken(accessToken)
        setUserInfo(info)
        setError(null)

        saveSession({ token: accessToken, refreshToken, userInfo: info, expiresAt })
        scheduleRefresh(expiresAt)
    }, [scheduleRefresh])

    // ── Vider l'auth ──────────────────────────────────────────────────────────
    const _clearAuth = useCallback(() => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        setToken(null)
        setUserInfo(null)
        clearSession()
    }, [])

    // ── LOGIN — appelle le backend, jamais Keycloak directement ──────────────
    const login = useCallback(async (username, password) => {
        setError(null)

        try {
            const { data } = await api.post('/auth/login', { username, password })
            _applySession(data)
            return { success: true }
        } catch (err) {
            const message = err.response?.data?.message || 'Authentication failed.'
            setError(message)
            return { success: false, error: message }
        }
    }, [_applySession])

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        const session = loadSession()

        try {
            if (session?.refreshToken) {
                await api.post('/auth/logout', { refreshToken: session.refreshToken })
            }
        } catch (_) {
            // Continuer même si le backend échoue
        } finally {
            _clearAuth()
        }
    }, [_clearAuth])

    // ── Helpers rôles (même interface qu'avant) ───────────────────────────────
    const hasRole = useCallback((role) => userInfo?.roles?.includes(role) ?? false, [userInfo])
    const isAdmin = hasRole('admin')

    // ── Valeur exposée (interface identique à l'ancien KeycloakContext) ───────
    const value = {
        // Compatibilité avec l'ancien useKeycloak()
        token,
        userInfo,
        isAdmin,
        hasRole,
        loading,
        isAuthenticated: !!token,
        error,
        // Nouvelles actions (remplacent keycloak.login / keycloak.logout)
        login,
        logout,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

// ─── Hook (drop-in replacement de useKeycloak) ────────────────────────────────
export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}

/**
 * Alias pour la compatibilité avec les imports existants de useKeycloak()
 * Permet de migrer fichier par fichier sans tout casser d'un coup.
 *
 * Avant : import { useKeycloak } from '../context/KeycloakContext'
 * Après : import { useKeycloak } from '../context/AuthContext'
 */
export const useKeycloak = useAuth