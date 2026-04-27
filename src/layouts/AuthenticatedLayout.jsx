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
        <div className="min-h-screen bg-[#0b0f12] text-slate-100">
            <header className="flex items-center justify-between border-b border-[#1c2b2f] bg-black px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00A897] text-black font-bold">
                        S
                    </div>
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">SOC Dashboard</p>
                        <h1 className="text-lg font-semibold">SOC App</h1>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="rounded-lg border border-[#275B66] px-4 py-2 text-sm font-semibold text-[#00A897] transition hover:bg-[#275B66] hover:text-white"
                >
                    Logout
                </button>
            </header>
            <div className="flex">
                <Sidebar />
                <main className="flex-1 p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AuthenticatedLayout
