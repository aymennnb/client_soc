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
import NessusSync from './vulnerabilities/NessusSync.jsx'

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token')
    return token ? children : <Navigate to="/login" />
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
                <Route path="/"                           element={<Navigate to="/users" />} />
                <Route path="/users"                      element={<Users />} />
                <Route path="/users/create"               element={<CreateUser />} />
                <Route path="/users/edit/:id"             element={<EditUser />} />
                <Route path="/users/:id/permissions"      element={<UserPermissions />} />
                <Route path="/vulnerabilities"            element={<Vulnerabilities />} />
                <Route path="/vulnerabilities/add"        element={<AddVulnerability />} />
                <Route path="/vulnerabilities/sync"       element={<NessusSync />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />

        </Routes>
    )
}

export default AppRoutes