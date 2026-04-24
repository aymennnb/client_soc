import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Nav.jsx'

function AuthenticatedLayout() {
    const navigate = useNavigate()

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    return (
        <div>
            {/* Barre du haut */}
            <div style={{ borderBottom: '1px solid #ccc', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>SOC App</strong>
                <button onClick={handleLogout}>Logout</button>
            </div>
            <div style={{ display: 'flex' }}>
                {/* Sidebar */}
                <Sidebar/>
                {/* Contenu principal */}
                <main style={{ flex: 1, padding: '16px' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AuthenticatedLayout