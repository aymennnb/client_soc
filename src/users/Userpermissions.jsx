import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

function UserPermissions() {
    const navigate = useNavigate()
    const { id }   = useParams()

    const [username, setUsername]       = useState('')
    const [allPermissions, setAllPermissions] = useState([])
    const [assignedIds, setAssignedIds] = useState([])
    const [loading, setLoading]         = useState(true)
    const [saving, setSaving]           = useState(false)
    const [error, setError]             = useState('')
    const [successMsg, setSuccessMsg]   = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, assignedRes, allPermsRes] = await Promise.all([
                    api.get(`/users/${id}`),
                    api.get(`/users/${id}/permissions`),
                    api.get('/permissions')
                ])

                setUsername(userRes.data.username)
                setAssignedIds(assignedRes.data.permissions.map(p => p.permission_id))
                setAllPermissions(allPermsRes.data.permissions)
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load data.')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    const handleToggle = async (permission_id) => {
        setSaving(true)
        setError('')
        setSuccessMsg('')

        const isAssigned = assignedIds.includes(permission_id)

        try {
            if (isAssigned) {
                await api.delete(`/users/${id}/permissions/${permission_id}`)
                setAssignedIds(prev => prev.filter(pid => pid !== permission_id))
                setSuccessMsg('Permission removed.')
            } else {
                await api.post(`/users/${id}/permissions`, { permission_id })
                setAssignedIds(prev => [...prev, permission_id])
                setSuccessMsg('Permission assigned.')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <p>Loading...</p>

    return (
        <div>
            <h2>Permissions — {username}</h2>

            <button onClick={() => navigate('/users')}>← Back</button>

            <br /><br />

            {error      && <p style={{ color: 'red' }}>{error}</p>}
            {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

            {allPermissions.length === 0 ? (
                <p>No permissions found in database.</p>
            ) : (
                <table border="1" cellPadding="6">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Permission</th>
                            <th>Assigned</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allPermissions.map(perm => (
                            <tr key={perm.permission_id}>
                                <td>{perm.permission_id}</td>
                                <td>{perm.permission_name}</td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={assignedIds.includes(perm.permission_id)}
                                        onChange={() => handleToggle(perm.permission_id)}
                                        disabled={saving}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default UserPermissions