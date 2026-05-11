import { Outlet, Navigate } from 'react-router-dom'
import { useKeycloak } from '../context/KeycloakContext'

function GuestLayout() {
    const { isAuthenticated, loading } = useKeycloak()

    if (loading) return null

    if (isAuthenticated) return <Navigate to="/dashboard" replace />

    return (
        <div>
            <Outlet />
        </div>
    )
}

export default GuestLayout