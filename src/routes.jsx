import { Routes, Route, Navigate } from 'react-router-dom'
import GuestLayout from './layouts/GuestLayout.jsx'
import AuthenticatedLayout from './layouts/AuthenticatedLayout.jsx'
import Login from './auth/Login.jsx'
import Users from './users/Users.jsx'
import CreateUser from './users/CreateUser.jsx'
import EditUser from './users/EditUser.jsx'
import UserPermissions from './users/UserPermissions.jsx'
import Vulnerabilities from './vulnerabilities/Vulnerabilities.jsx'
import AddVulnerability from './vulnerabilities/AddVulnerability.jsx'
import EditVulnerability from './vulnerabilities/EditVulnerability.jsx'
import NessusSync from './vulnerabilities/NessusSync.jsx'

const getRoleFromToken = () => {
    try {
        const token = localStorage.getItem('token')
        if (!token) return null
        const payload = JSON.parse(atob(token.split('.')[1]))
        return (payload.role || payload.user?.role || '').toLowerCase()
    } catch {
        return null
    }
}

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token')
    return token ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
    const role = getRoleFromToken()
    return role === 'admin' ? children : <Navigate to="/vulnerabilities" />
}

function HomeRedirect() {
    const role = getRoleFromToken()
    return <Navigate to={role === 'admin' ? '/users' : '/vulnerabilities'} />
}

function AppRoutes() {
    return (
        <Routes>

            <Route element={<GuestLayout />}>
                <Route path="/login" element={<Login />} />
            </Route>

            <Route element={
                <PrivateRoute>
                    <AuthenticatedLayout />
                </PrivateRoute>
            }>
                <Route path="/" element={<HomeRedirect />} />
                <Route
                    path="/users"
                    element={
                        <AdminRoute>
                            <Users />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/users/create"
                    element={
                        <AdminRoute>
                            <CreateUser />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/users/edit/:id"
                    element={
                        <AdminRoute>
                            <EditUser />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/users/:id/permissions"
                    element={
                        <AdminRoute>
                            <UserPermissions />
                        </AdminRoute>
                    }
                />
                <Route path="/vulnerabilities" element={<Vulnerabilities />} />
                <Route path="/vulnerabilities/add" element={<AddVulnerability />} />
                <Route path="/vulnerabilities/edit/:id" element={<EditVulnerability />} />
                <Route path="/vulnerabilities/sync" element={<NessusSync />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />

        </Routes>
    )
}

export default AppRoutes
