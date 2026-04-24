import { Outlet, Navigate } from 'react-router-dom'

function GuestLayout() {

    const token = localStorage.getItem('token')
    if (token) {
        return <Navigate to="/" />
    }

    return (
        <div>
            <Outlet />
        </div>
    )
}

export default GuestLayout