import { Routes, Route, Navigate } from 'react-router-dom'
import { useKeycloak } from './context/KeycloakContext'

import GuestLayout          from './layouts/GuestLayout.jsx'
import AuthenticatedLayout  from './layouts/AuthenticatedLayout.jsx'
import Login                from './auth/Login.jsx'

import Users                from './users/Users.jsx'
import CreateUser           from './users/CreateUser.jsx'
import EditUser             from './users/EditUser.jsx'
import Settings             from './users/Settings.jsx'
import UserPermissions      from './users/UserPermissions.jsx'

import Vulnerabilities      from './vulnerabilities/Vulnerabilities.jsx'
import AddVulnerability     from './vulnerabilities/AddVulnerability.jsx'
import EditVulnerability    from './vulnerabilities/EditVulnerability.jsx'
import NessusSync           from './vulnerabilities/NessusSync.jsx'

import Incidents            from './incidents/Incidents.jsx'
import AddIncident          from './incidents/Addincident.jsx'
import EditIncident         from './incidents/Editincident.jsx'

import Dashboard            from './Dashboard.jsx'

function AdminRoute({ children }) {
    const { isAdmin, loading } = useKeycloak()
    if (loading) return null
    if (!isAdmin) return <Navigate to="/dashboard" replace />
    return children
}

function AppRoutes() {
    const { loading, isAuthenticated } = useKeycloak()

    // Écran de chargement initial
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0b0f12]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A897]"></div>
            </div>
        )
    }

    return (
        <Routes>
            {/* ── Guest Layout (Login) ── */}
            <Route element={<GuestLayout />}>
                <Route path="/login" element={<Login />} />
            </Route>

            {/* ── Protected Layout (Authenticated users only) ── */}
            {isAuthenticated ? (
                <Route element={<AuthenticatedLayout />}>
                    {/* Dashboard & Settings */}
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/settings" element={<Settings />} />

                    {/* Vulnerabilities */}
                    <Route path="/vulnerabilities" element={<Vulnerabilities />} />
                    <Route path="/vulnerabilities/add" element={<AddVulnerability />} />
                    <Route path="/vulnerabilities/edit/:id" element={<EditVulnerability />} />
                    <Route path="/vulnerabilities/sync" element={<NessusSync />} />

                    {/* Incidents */}
                    <Route path="/incidents" element={<Incidents />} />
                    <Route path="/incidents/add" element={<AddIncident />} />
                    <Route path="/incidents/edit/:id" element={<EditIncident />} />

                    {/* Users — Admin only */}
                    <Route path="/users" element={
                        <AdminRoute><Users /></AdminRoute>
                    } />
                    <Route path="/users/create" element={
                        <AdminRoute><CreateUser /></AdminRoute>
                    } />
                    <Route path="/users/edit/:id" element={
                        <AdminRoute><EditUser /></AdminRoute>
                    } />
                    <Route path="/users/:id/permissions" element={
                        <AdminRoute><UserPermissions /></AdminRoute>
                    } />
                </Route>
            ) : null}

            {/* ── Fallback: All unmatched routes go to login ── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

export default AppRoutes