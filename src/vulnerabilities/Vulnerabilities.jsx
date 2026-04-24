import { useState, useEffect, useCallback } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import api from '../api'
import DetailVulnerability from './DetailVulnerability'

const SEVERITY_LABELS = { 0: 'Info', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

const getUserIdFromToken = () => {
    try {
        const token = localStorage.getItem('token')
        if (!token) return null
        return JSON.parse(atob(token.split('.')[1])).id
    } catch { return null }
}

function Vulnerabilities() {
    const navigate = useNavigate()

    const [permissions, setPermissions] = useState([])
    const can = (perm) => permissions.includes(perm)

    const [vulnerabilities, setVulnerabilities] = useState([])
    const [stats,           setStats]           = useState(null)
    const [hosts,           setHosts]           = useState([])
    const [loading,         setLoading]         = useState(true)
    const [error,           setError]           = useState('')

    const [filterStatus,   setFilterStatus]   = useState('')
    const [filterSeverity, setFilterSeverity] = useState('')
    const [filterHost,     setFilterHost]     = useState('')

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize,    setPageSize]    = useState(10)

    const [selectedVuln,  setSelectedVuln]  = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)

    useEffect(() => {
        const loadPermissions = async () => {
            const userId = getUserIdFromToken()
            if (!userId) return
            try {
                const res = await api.get(`/users/${userId}/permissions`)
                setPermissions(res.data.permissions.map(p => p.permission_name))
            } catch {}
        }
        loadPermissions()
    }, [])

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await api.get('/vulnerabilities/stats')
                setStats(res.data)
            } catch {}
        }
        loadStats()
    }, [])

    const fetchVulnerabilities = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const params = {}
            if (filterStatus)   params.status   = filterStatus
            if (filterSeverity) params.severity  = filterSeverity
            if (filterHost)     params.host      = filterHost

            const res = await api.get('/vulnerabilities', { params })
            const list = res.data.vulnerabilities || []
            setVulnerabilities(list)
            setCurrentPage(1)

            if (!filterHost) {
                const uniqueHosts = [...new Set(list.map(v => v.host).filter(Boolean))]
                setHosts(uniqueHosts)
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load vulnerabilities.')
        } finally {
            setLoading(false)
        }
    }, [filterStatus, filterSeverity, filterHost])

    useEffect(() => {
        fetchVulnerabilities()
    }, [fetchVulnerabilities])

    const handleDelete = async (id) => {
        if (!confirm('Delete this vulnerability?')) return
        try {
            await api.delete(`/vulnerabilities/${id}`)
            if (paginatedVulns.length === 1 && currentPage > 1) {
                setCurrentPage(p => p - 1)
            }
            fetchVulnerabilities()
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.')
        }
    }

    const handleViewDetails = async (id) => {
        setDetailLoading(true)
        setSelectedVuln(null)
        try {
            const res = await api.get(`/vulnerabilities/${id}`)
            setSelectedVuln(res.data)
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to load details.')
        } finally {
            setDetailLoading(false)
        }
    }

    const totalPages     = Math.max(1, Math.ceil(vulnerabilities.length / pageSize))
    const startIndex     = (currentPage - 1) * pageSize
    const paginatedVulns = vulnerabilities.slice(startIndex, startIndex + pageSize)

    return (
        <div>
            <h2>Vulnerabilities</h2>

            {stats && (
                <div>
                    <h3>Statistics</h3>

                    <p><strong>By severity (open)</strong></p>
                    <table border="1" cellPadding="4">
                        <thead>
                            <tr><th>Severity</th><th>Count</th></tr>
                        </thead>
                        <tbody>
                            {stats.bySeverity.map(s => (
                                <tr key={s._id}>
                                    <td>{SEVERITY_LABELS[s._id] ?? s._id}</td>
                                    <td>{s.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <br />

                    <p><strong>By status</strong></p>
                    <table border="1" cellPadding="4">
                        <thead>
                            <tr><th>Status</th><th>Count</th></tr>
                        </thead>
                        <tbody>
                            {stats.byStatus.map(s => (
                                <tr key={s._id}>
                                    <td>{s._id}</td>
                                    <td>{s.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {stats.oldest_open?.length > 0 && (
                        <>
                            <br />
                            <p><strong>Oldest open</strong></p>
                            <table border="1" cellPadding="4">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Severity</th>
                                        <th>Host</th>
                                        <th>First seen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.oldest_open.map(v => (
                                        <tr key={v._id}>
                                            <td>{v.title}</td>
                                            <td>{SEVERITY_LABELS[v.severity] ?? v.severity}</td>
                                            <td>{v.host}</td>
                                            <td>{new Date(v.first_seen).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    <hr />
                </div>
            )}

            {can('CREATE_VULNERABILITY') && (
                <button onClick={() => navigate('/vulnerabilities/add')}>
                    Add Vulnerability
                </button>
            )}

            {can('SYNC_VULNERABILITIES') && (
                <>
                    {' '}
                    <button onClick={() => navigate('/vulnerabilities/sync')}>
                        Nessus Sync
                    </button>
                </>
            )}

            <br /><br />

            <div>
                <label>Status: </label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All</option>
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                    <option value="ignored">Ignored</option>
                </select>

                {'  '}

                <label>Severity: </label>
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                    <option value="">All</option>
                    <option value="0">Info</option>
                    <option value="1">Low</option>
                    <option value="2">Medium</option>
                    <option value="3">High</option>
                    <option value="4">Critical</option>
                </select>

                {'  '}

                <label>Host: </label>
                <select value={filterHost} onChange={e => setFilterHost(e.target.value)}>
                    <option value="">All hosts</option>
                    {hosts.length === 0
                        ? <option disabled>No hosts available</option>
                        : hosts.map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))
                    }
                </select>

                {'  '}

                <button onClick={fetchVulnerabilities}>Refresh</button>
            </div>

            <br />

            {loading && <p>Loading...</p>}
            {error   && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && vulnerabilities.length === 0 && (
                <p>No vulnerabilities found.</p>
            )}

            {!loading && vulnerabilities.length > 0 && (
                <>
                    <p>
                        Showing {startIndex + 1}–{Math.min(startIndex + pageSize, vulnerabilities.length)} of {vulnerabilities.length}
                    </p>

                    <table border="1" cellPadding="6">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Severity</th>
                                <th>Host</th>
                                <th>Port</th>
                                <th>Status</th>
                                <th>Duration</th>
                                <th>First seen</th>
                                <th>Last seen</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedVulns.map(vuln => (
                                <tr key={vuln._id}>
                                    <td>{vuln.title}</td>
                                    <td>{SEVERITY_LABELS[vuln.severity] ?? vuln.severity}</td>
                                    <td>{vuln.host}</td>
                                    <td>{vuln.port || '—'}</td>
                                    <td>{vuln.status}</td>
                                    <td>{vuln.duration_days ?? '—'}</td>
                                    <td>{new Date(vuln.first_seen).toLocaleDateString()}</td>
                                    <td>{new Date(vuln.last_seen).toLocaleDateString()}</td>
                                    <td>
                                        {can('VIEW_VULNERABILITY_DETAILS') && (
                                            <>
                                                <button onClick={() => handleViewDetails(vuln._id)}>
                                                    Details
                                                </button>
                                                {' '}
                                            </>
                                        )}
                                        {can('UPDATE_VULNERABILITY') && (
                                            <>
                                                <button onClick={() => navigate(`/vulnerabilities/edit/${vuln._id}`)}>
                                                    Edit
                                                </button>
                                                {' '}
                                            </>
                                        )}
                                        {can('DELETE_VULNERABILITY') && (
                                            <button onClick={() => handleDelete(vuln._id)}>
                                                Delete
                                            </button>
                                        )}
                                        {!can('VIEW_VULNERABILITY_DETAILS') &&
                                         !can('UPDATE_VULNERABILITY') &&
                                         !can('DELETE_VULNERABILITY') && '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ marginTop: '8px' }}>
                        <label>Rows per page: </label>
                        <select
                            value={pageSize}
                            onChange={e => {
                                setPageSize(Number(e.target.value))
                                setCurrentPage(1)
                            }}
                        >
                            {PAGE_SIZE_OPTIONS.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        {'  '}
                        <button
                            onClick={() => setCurrentPage(p => p - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        {'  '}
                        <span>Page {currentPage} / {totalPages}</span>
                        {'  '}
                        <button
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}


            {detailLoading && <p>Loading details...</p>}

            {selectedVuln && (
                    <DetailVulnerability
                        selectedVuln={selectedVuln}
                        detailLoading={detailLoading}
                        onClose={() => setSelectedVuln(null)}
                    />
            )}
        </div>
    )
}

export default Vulnerabilities