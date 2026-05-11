import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

const groupPermissions = (perms) => {
    const groups = {}
    perms.forEach(p => {
        const parts = p.permission_name.split('_')
        const group = parts.length > 1 ? parts.slice(0, -1).join('_') : 'OTHER'
        if (!groups[group]) groups[group] = []
        groups[group].push(p)
    })
    return Object.fromEntries(
        Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    )
}

function UserPermissions() {
    const navigate = useNavigate()
    const { id }   = useParams()

    const [username,       setUsername]       = useState('')
    const [allPermissions, setAllPermissions] = useState([])
    const [assignedIds,    setAssignedIds]    = useState([])
    const [loading,  setLoading]  = useState(true)
    const [saving,   setSaving]   = useState(false)
    const [error,    setError]    = useState('')
    const [flash,    setFlash]    = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get user info (Keycloak)
                const userRes = await api.get(`/users/${id}`)
                setUsername(userRes.data.username)

                // 2. Get user permissions (MongoDB)
                const permRes = await api.get(`/users/${id}/permissions`)
                setAssignedIds(permRes.data.permissions.map(p => p.permission_id))

                // 3. Get all available permissions
                const allRes = await api.get('/users/permissions')
                setAllPermissions(allRes.data.permissions)
            } catch (err) {
                const msg = err.response?.data?.message || 'Failed to load data.'
                setError(msg)
                console.error('[UserPermissions]', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    const showFlash = (type, msg) => {
        setFlash({ type, msg })
        setTimeout(() => setFlash(null), 2500)
    }

    const handleToggle = async (permission_id) => {
        setSaving(true)
        setError('')
        const isAssigned = assignedIds.includes(permission_id)
        try {
            if (isAssigned) {
                await api.delete(`/users/${id}/permissions/${permission_id}`)
                setAssignedIds(prev => prev.filter(pid => pid !== permission_id))
                showFlash('success', 'Permission removed.')
            } else {
                await api.post(`/users/${id}/permissions`, { permission_id })
                setAssignedIds(prev => [...prev, permission_id])
                showFlash('success', 'Permission assigned.')
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Operation failed.'
            setError(msg)
            showFlash('error', msg)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="space-y-4 text-slate-100">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
            <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-6 space-y-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
                        <div className="h-5 w-9 animate-pulse rounded-full bg-white/5" />
                    </div>
                ))}
            </div>
        </div>
    )

    const groups = groupPermissions(allPermissions)
    const assignedCount = assignedIds.length
    const totalCount = allPermissions.length

    return (
        <div className="space-y-6 text-slate-100">

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/users')}
                        className="flex items-center gap-1.5 rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 transition hover:border-[#275B66] hover:text-[#00A897]"
                    >
                        ← Back
                    </button>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white">Fine-Grained Permissions</h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Account: <span className="font-mono text-[#00A897]">{username}</span>
                        </p>
                    </div>
                </div>

                {/* Summary pill */}
                <div className="flex items-center gap-2 rounded-lg border border-[#1c2b2f] bg-black/60 px-4 py-2">
                    <span className="text-xs text-slate-500">Assigned:</span>
                    <span className="text-sm font-bold text-[#00A897]">{assignedCount}</span>
                    <span className="text-xs text-slate-600">/ {totalCount}</span>
                </div>
            </div>

            {/* Flash message */}
            {flash && (
                <div className={`rounded-lg border px-4 py-3 text-sm transition-all ${
                    flash.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-red-500/30 bg-red-500/10 text-red-300'
                }`}>
                    {flash.msg}
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {allPermissions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-[#1c2b2f] bg-black/40 py-16 text-center">
                    <p className="text-sm text-slate-500">No permissions defined in the system.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groups).map(([group, perms]) => (
                        <div key={group} className="rounded-xl border border-[#1c2b2f] bg-black/60 overflow-hidden">
                            {/* Group header */}
                            <div className="flex items-center justify-between border-b border-[#1c2b2f] bg-[#080f12] px-4 py-2.5">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                    {group.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] text-slate-600">
                                    {perms.filter(p => assignedIds.includes(p.permission_id)).length}/{perms.length}
                                </span>
                            </div>

                            {/* Permissions list */}
                            <div className="divide-y divide-[#0e1a1e]">
                                {perms.map(perm => {
                                    const isAssigned = assignedIds.includes(perm.permission_id)
                                    return (
                                        <div
                                            key={perm.permission_id}
                                            className={`flex items-center justify-between px-4 py-3 transition-colors ${isAssigned ? 'bg-[#00A897]/5' : 'hover:bg-white/[0.02]'}`}
                                        >
                                            <div className="flex flex-col gap-0.5 flex-1">
                                                <span className={`font-mono text-xs ${isAssigned ? 'text-slate-200' : 'text-slate-500'}`}>
                                                    {perm.permission_name}
                                                </span>
                                                {perm.description && (
                                                    <span className="text-[10px] text-slate-600">{perm.description}</span>
                                                )}
                                            </div>

                                            {/* Toggle */}
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() => handleToggle(perm.permission_id)}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ml-3 ${
                                                    isAssigned
                                                        ? 'border-[#00A897] bg-[#00A897]'
                                                        : 'border-slate-700 bg-slate-800'
                                                }`}
                                                aria-label={`Toggle ${perm.permission_name}`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${isAssigned ? 'translate-x-4' : 'translate-x-0'}`}
                                                />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default UserPermissions