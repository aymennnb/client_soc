import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../api'

const fmt = (timestamp) => {
    try {
        return new Date(timestamp).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    } catch {
        return '—'
    }
}

const ROLE_BADGES = {
    admin: 'bg-[#00A897]/15 text-[#00A897] border border-[#00A897]/30',
    user: 'bg-slate-700/60 text-slate-300 border border-slate-600/40',
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

const inputCls = "w-full rounded-lg border border-[#1c2b2f] bg-[#0a1215] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-[#00A897] focus:outline-none"

function Users() {
    const navigate = useNavigate()
    const { userId } = useAuth()

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // ── Pagination ──
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // ── Filters ──
    const [filterUsername, setFilterUsername] = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    // ─── Fetch users from Keycloak ──────────────────────
    const fetchUsers = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await api.get('/users')
            // Filter out current user
            const filteredUsers = res.data.filter(u => u.id !== userId)
            setUsers(filteredUsers)
        } catch (err) {
            console.error('[Users] Failed to fetch users:', err)
            setError(err.response?.data?.message || 'Failed to load users.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!userId) return
        fetchUsers()
    }, [userId])

    // ─── Delete ──────────────────────────────────────────
    const handleDelete = async (id, username) => {
        if (!confirm(`Delete user "${username}"?`)) return
        try {
            await api.delete(`/users/${id}`)
            setUsers(users.filter(u => u.id !== id))
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.')
        }
    }

    // ─── Get user display name ───────────────────────────
    const getUserDisplayName = (user) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        if (user.firstName) return user.firstName
        return '—'
    }

    // ─── Filtering ───────────────────────────────────────
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const displayName = getUserDisplayName(user)
            return (
                (filterUsername === '' ||
                    user.username.toLowerCase().includes(filterUsername.toLowerCase()) ||
                    displayName.toLowerCase().includes(filterUsername.toLowerCase()) ||
                    (user.email?.toLowerCase().includes(filterUsername.toLowerCase()) ?? false)
                ) &&
                (filterStatus === '' || (filterStatus === 'active' ? user.enabled : !user.enabled))
            )
        })
    }, [users, filterUsername, filterStatus])

    // ─── Pagination ──────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
    const startIndex = (currentPage - 1) * pageSize
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize)

    const hasActiveFilters = filterUsername || filterStatus

    const resetFilters = () => {
        setFilterUsername('')
        setFilterStatus('')
        setCurrentPage(1)
    }

    // ─── UI ──────────────────────────────────────────────
    return (
        <div className="space-y-6 text-slate-100">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Users Management</h2>

                <button
                    onClick={() => navigate('/users/create')}
                    className="bg-[#00A897] px-4 py-2 rounded-lg text-xs font-bold text-black hover:bg-[#00c4b1]"
                >
                    ＋ Add User
                </button>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-[#1c2b2f] bg-black/50 p-5 space-y-4">

                <div className="flex justify-between">
                    <span className="text-xs text-slate-500 uppercase">Filters</span>

                    {hasActiveFilters && (
                        <button onClick={resetFilters} className="text-xs text-[#00A897]">
                            Reset
                        </button>
                    )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">

                    <input
                        placeholder="Search username, name, or email..."
                        className={inputCls}
                        value={filterUsername}
                        onChange={e => {
                            setFilterUsername(e.target.value)
                            setCurrentPage(1)
                        }}
                    />

                    <select
                        className={inputCls}
                        value={filterStatus}
                        onChange={e => {
                            setFilterStatus(e.target.value)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="">All status</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                    </select>

                </div>
            </div>

            {/* Count + Page size */}
            <div className="flex justify-between items-center text-xs text-slate-500">
                <span>
                    {filteredUsers.length === 0
                        ? 'No results'
                        : `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, filteredUsers.length)} of ${filteredUsers.length}`}
                </span>

                <select
                    value={pageSize}
                    onChange={e => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                    }}
                    className="bg-[#0a1215] border border-[#1c2b2f] px-2 py-1 rounded"
                >
                    {PAGE_SIZE_OPTIONS.map(n => (
                        <option key={n}>{n}</option>
                    ))}
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="text-center py-8 text-slate-500">
                    Loading users...
                </div>
            )}

            {/* Empty state */}
            {!loading && users.length === 0 && !error && (
                <div className="text-center py-8 text-slate-500">
                    No users found
                </div>
            )}

            {/* Table */}
            {!loading && users.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-[#1c2b2f]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead>
                                <tr className="bg-[#080f12] text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                    <th className="px-4 py-3 text-left">Username</th>
                                    <th className="px-4 py-3 text-left">Full Name</th>
                                    <th className="px-4 py-3 text-left">Email</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Created</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#0e1a1e]">
                                {paginatedUsers.map(user => (
                                    <tr key={user.id} className="bg-black/40 transition-colors hover:bg-[#0e1e24] group">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                                                {user.username}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">
                                            {getUserDisplayName(user)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">
                                            {user.email || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.enabled
                                                ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
                                                  </span>
                                                : <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Blocked
                                                  </span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {fmt(user.createdTimestamp)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => navigate(`/users/edit/${user.id}`)}
                                                    className="rounded-md bg-[#00A897]/10 border border-[#00A897]/30 px-2.5 py-1 text-[11px] font-semibold text-[#00A897] transition hover:bg-[#00A897] hover:text-black"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/users/${user.id}/permissions`)}
                                                    className="rounded-md border border-[#275B66] px-2.5 py-1 text-[11px] font-semibold text-[#00A897] transition hover:bg-[#275B66] hover:text-white"
                                                >
                                                    Permissions
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id, user.username)}
                                                    className="rounded-md border border-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-400 transition hover:bg-red-500/20"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {filteredUsers.length > pageSize && (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border border-[#1c2b2f] text-xs text-slate-500 disabled:opacity-50"
                    >
                        Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 rounded border border-[#1c2b2f] text-xs ${
                                currentPage === i + 1
                                    ? 'text-[#00A897] bg-[#00A897]/10 border-[#00A897]/30'
                                    : 'text-slate-500'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border border-[#1c2b2f] text-xs text-slate-500 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}

export default Users