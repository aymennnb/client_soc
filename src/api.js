/**
 * api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CHANGEMENTS :
 *   ✗ SUPPRIMÉ  — import keycloak from './auth/keycloak'
 *   ✗ SUPPRIMÉ  — keycloak.isTokenExpired(), keycloak.updateToken(), keycloak.login()
 *   ✓ NOUVEAU   — lecture du token depuis localStorage (session AuthContext)
 *   ✓ NOUVEAU   — refresh via POST /auth/refresh (backend) sur 401
 *   ✓ CONSERVÉ  — même baseURL, même structure interceptors
 */

import axios from 'axios'

// ─── Clé de session (doit correspondre à STORAGE_KEY dans AuthContext.jsx) ────
const STORAGE_KEY = 'auth_session'

// ─── Helpers session ──────────────────────────────────────────────────────────
const getSession = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

const saveSession = (session) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch { /* quota exceeded */ }
}

const clearSession = () => localStorage.removeItem(STORAGE_KEY)

// ─── Instance Axios ───────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

// ─── Request interceptor ──────────────────────────────────────────────────────
// Injecte le Bearer token depuis la session locale.
// Plus de appel keycloak.isTokenExpired() — le refresh se fait sur 401.
api.interceptors.request.use((config) => {
    const session = getSession()

    if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`
    }

    return config
})

// ─── Response interceptor ─────────────────────────────────────────────────────
// Sur 401 : tente un refresh via le backend, réessaie la requête originale.
// Sur échec du refresh : vide la session et redirige vers /login.
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config

        // Éviter une boucle infinie si /auth/refresh lui-même retourne 401
        const isAuthRoute = originalRequest.url?.includes('/auth/')

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
            originalRequest._retry = true

            const session = getSession()

            if (session?.refreshToken) {
                try {
                    // Appel direct (pas via api pour éviter l'interceptor)
                    const { data } = await axios.post(
                        `${import.meta.env.VITE_API_URL}/auth/refresh`,
                        { refreshToken: session.refreshToken }
                    )

                    // Mettre à jour la session locale
                    saveSession({
                        ...session,
                        token:       data.token,
                        refreshToken: data.refreshToken ?? session.refreshToken,
                        expiresAt:   data.expiresIn
                            ? Date.now() + data.expiresIn * 1000
                            : session.expiresAt,
                    })

                    // Notifier AuthContext du nouveau token (via StorageEvent)
                    // AuthContext écoute 'storage' pour rester en sync
                    window.dispatchEvent(new StorageEvent('storage', {
                        key:      STORAGE_KEY,
                        newValue: localStorage.getItem(STORAGE_KEY),
                    }))

                    // Réessayer la requête originale avec le nouveau token
                    originalRequest.headers.Authorization = `Bearer ${data.token}`
                    return api(originalRequest)

                } catch {
                    // Refresh échoué → session invalide, redirection login
                    clearSession()
                    window.location.replace('/login')
                    return Promise.reject(error)
                }
            } else {
                // Pas de refresh token → logout immédiat
                clearSession()
                window.location.replace('/login')
                return Promise.reject(error)
            }
        }

        return Promise.reject(error)
    }
)

export default api