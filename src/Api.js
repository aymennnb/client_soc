import axios from 'axios'
import keycloak from './auth/keycloak'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use(async (config) => {
    if (keycloak.isTokenExpired(10)) {
        try {
            await keycloak.updateToken(10)
        } catch {
            keycloak.login()
            return Promise.reject(new Error('Session expired. Redirecting to login.'))
        }
    }

    if (keycloak.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`
    }

    return config
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                await keycloak.updateToken(30)
                originalRequest.headers.Authorization = `Bearer ${keycloak.token}`
                return api(originalRequest)
            } catch {
                keycloak.login()
                return Promise.reject(error)
            }
        }

        return Promise.reject(error)
    }
)

export default api