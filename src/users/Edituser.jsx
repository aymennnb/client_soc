import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

const inputCls = "w-full rounded-lg border border-[#1c2b2f] bg-[#0a1215] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition focus:border-[#00A897] focus:outline-none focus:ring-1 focus:ring-[#00A897]/40"
const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5"

function EditUser() {
    const navigate = useNavigate()
    const { id }   = useParams()

    const [form, setForm] = useState({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        enabled: true
    })
    const [loading, setLoading] = useState(true)
    const [saving,  setSaving]  = useState(false)
    const [error,   setError]   = useState('')

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get(`/users/${id}`)
                const u = res.data
                setForm({
                    username: u.username || '',
                    firstName: u.firstName || '',
                    lastName: u.lastName || '',
                    email: u.email || '',
                    enabled: u.enabled !== false
                })
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load user.')
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [id])

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setForm({ ...form, [e.target.name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            await api.put(`/users/${id}`, form)
            navigate('/users')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="space-y-4 text-slate-100">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-white/5" />
            <div className="max-w-lg rounded-xl border border-[#1c2b2f] bg-black/60 p-6 space-y-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />)}
            </div>
        </div>
    )

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
                    <h2 className="text-xl font-bold tracking-tight text-white">Edit User</h2>
                    <p className="mt-0.5 text-xs text-slate-500 font-mono">{form.username}</p>
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
                        <label className={labelCls}>Username (read-only)</label>
                        <input
                            type="text"
                            className={inputCls + ' opacity-60 cursor-not-allowed'}
                            value={form.username}
                            disabled
                        />
                        <p className="mt-1 text-[11px] text-slate-600">Usernames cannot be changed in Keycloak</p>
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
                        />
                    </div>

                    {/* Account Status toggle */}
                    <div>
                        <label className={labelCls}>Account Status</label>
                        <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
                            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition w-full ${
                                form.enabled
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                            }`}
                        >
                            <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors ${form.enabled ? 'border-emerald-500 bg-emerald-500' : 'border-red-500 bg-red-500/30'}`}>
                                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </span>
                            <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} className="sr-only" />
                            {form.enabled ? 'Active — account can log in' : 'Blocked — account is disabled'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-[#00A897] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#00c4b1] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
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

export default EditUser