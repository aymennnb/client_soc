import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const getCurrentUserId = () => {
    try {
        const token = localStorage.getItem('token')
        if (!token) return null
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.id
    } catch {
        return null
    }
}

function Users() {
    const navigate = useNavigate()
    const currentUserId = getCurrentUserId()

    const [users, setUsers]     = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError]     = useState('')

    const fetchUsers = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await api.get('/users')
            const filtered = response.data.filter(u => u._id !== currentUserId)
            setUsers(filtered)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleDelete = async (id) => {
        if (!confirm('Delete this user?')) return
        try {
            await api.delete(`/users/${id}`)
            fetchUsers()
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.')
        }
    }

    if (loading) return <p>Loading...</p>
    if (error)   return <p style={{ color: 'red' }}>{error}</p>

    return (
        <div>
            <h2>Users</h2>

            <button onClick={() => navigate('/users/create')}>Add User</button>

            <br /><br />

            {users.length === 0 ? (
                <p>No users found.</p>
            ) : (
                <table border="1" cellPadding="6">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.username}</td>
                                <td>{user.role}</td>
                                <td>{user.is_active ? 'Active' : 'Blocked'}</td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button onClick={() => navigate(`/users/edit/${user._id}`)}>
                                        Edit
                                    </button>
                                    {' '}
                                    <button onClick={() => handleDelete(user._id)}>
                                        Delete
                                    </button>
                                    {' '}
                                    <button onClick={() => navigate(`/users/${user._id}/permissions`)}>
                                        Permissions
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default Users