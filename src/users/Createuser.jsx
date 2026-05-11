import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const inputCls = "w-full rounded-lg border border-[#1c2b2f] bg-[#0a1215] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition focus:border-[#00A897] focus:outline-none focus:ring-1 focus:ring-[#00A897]/40"
const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5"

function CreateUser() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'user'
    })
    const [error,   setError]   = useState('')
    const [loading, setLoading] = useState(false)
    const [showPwd, setShowPwd] = useState(false)

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await api.post('/users', form)
            navigate('/users')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 text-slate-100">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/users')}
                    className="flex items-center gap-1.5 rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 transition hover:border-[#275B66] hover:text-[#00A897]"
                >
                    ← Back
                </button>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Add User</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Create a new Keycloak user account</p>
                </div>
            </div>

            {/* Form card */}
            <div className="max-w-lg rounded-xl border border-[#1c2b2f] bg-black/60 p-6 space-y-5">

                {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className={labelCls}>Username *</label>
                        <input
                            name="username"
                            className={inputCls}
                            placeholder="john.doe"
                            value={form.username}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>First Name</label>
                            <input
                                name="firstName"
                                className={inputCls}
                                placeholder="John"
                                value={form.firstName}
                                onChange={handleChange}
                                autoComplete="given-name"
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Last Name</label>
                            <input
                                name="lastName"
                                className={inputCls}
                                placeholder="Doe"
                                value={form.lastName}
                                onChange={handleChange}
                                autoComplete="family-name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Email</label>
                        <input
                            type="email"
                            name="email"
                            className={inputCls}
                            placeholder="john.doe@example.com"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Password *</label>
                        <div className="relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                name="password"
                                className={inputCls + ' pr-10'}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                            >
                                {showPwd ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Role</label>
                        <select name="role" value={form.role} onChange={handleChange} className={inputCls}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-[#00A897] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#00c4b1] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating…' : 'Create User'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/users')}
                            className="rounded-lg border border-[#1c2b2f] px-5 py-2.5 text-sm text-slate-400 transition hover:border-[#275B66] hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateUser