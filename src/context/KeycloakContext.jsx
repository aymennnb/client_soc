import { createContext, useContext, useEffect, useState } from 'react'
import keycloak from '../auth/keycloak'

const KeycloakContext = createContext(null)

const extractUserInfo = (kc) => {
    const token   = kc.tokenParsed
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT

    const realmRoles  = token?.realm_access?.roles    || []
    const clientRoles = token?.resource_access?.[clientId]?.roles || []
    const roles       = [...new Set([...realmRoles, ...clientRoles])]

    return {
        id:        token?.sub,
        username:  token?.preferred_username,
        email:     token?.email,
        firstName: token?.given_name,
        lastName:  token?.family_name,
        roles,
    }
}

// Flag global pour éviter l'initialisation multiple
let keycloakInitialized = false

export function KeycloakProvider({ children }) {
    const [loading,  setLoading]  = useState(true)
    const [token,    setToken]    = useState(null)
    const [userInfo, setUserInfo] = useState(null)
    const [error,    setError]    = useState(null)

    useEffect(() => {
        // Vérifier si Keycloak est déjà initialisé
        if (keycloakInitialized) {
            console.log('[Keycloak] Already initialized, skipping init')

            // Récupérer l'état existant
            if (keycloak.authenticated) {
                setToken(keycloak.token)
                setUserInfo(extractUserInfo(keycloak))
            }

            setLoading(false)
            return
        }

        const initKeycloak = async () => {
            try {
                console.log('[Keycloak] Initializing for the first time...')

                // Configuration pour authentification MANUELLE
                const authenticated = await keycloak.init({
                    onLoad:                     'check-sso',
                    silentCheckSsoRedirectUri:  `${window.location.origin}/silent-check-sso.html`,
                    redirectUri:                `${window.location.origin}/`,
                    pkceMethod:                 'S256',
                    checkLoginIframe:           false,
                    enableLogging:              false, // Désactiver les logs verbeux
                })

                // Marquer comme initialisé
                keycloakInitialized = true

                console.log('[Keycloak] Init successful, authenticated:', authenticated)

                if (authenticated) {
                    console.log('[Keycloak] User is already authenticated (SSO session active)')
                    setToken(keycloak.token)
                    setUserInfo(extractUserInfo(keycloak))

                    // Garder le token à jour
                    keycloak.onTokenExpired = () => {
                        console.log('[Keycloak] Token expired, refreshing...')
                        keycloak.updateToken(60)
                            .then(() => {
                                setToken(keycloak.token)
                                setUserInfo(extractUserInfo(keycloak))
                                console.log('[Keycloak] Token refreshed')
                            })
                            .catch((err) => {
                                console.error('[Keycloak] Token refresh failed:', err)
                                setToken(null)
                                setUserInfo(null)
                            })
                    }
                } else {
                    console.log('[Keycloak] User not authenticated - waiting for manual login')
                }
            } catch (err) {
                console.error('[Keycloak] Init error:', err)
                setError(err.message)
                keycloakInitialized = false // Réinitialiser le flag en cas d'erreur
            } finally {
                setLoading(false)
            }
        }

        initKeycloak()
    }, [])

    const hasRole = (role) => userInfo?.roles?.includes(role) ?? false
    const isAdmin = hasRole('admin')

    const value = {
        keycloak,
        token,
        userInfo,
        isAdmin,
        hasRole,
        loading,
        isAuthenticated: !!token,
        error,
    }

    return (
        <KeycloakContext.Provider value={value}>
            {children}
        </KeycloakContext.Provider>
    )
}

export const useKeycloak = () => {
    const ctx = useContext(KeycloakContext)
    if (!ctx) throw new Error('useKeycloak must be used inside <KeycloakProvider>')
    return ctx
}