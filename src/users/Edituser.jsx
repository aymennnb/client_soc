import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

function EditUser() {
    const navigate = useNavigate()
    const { id }   = useParams()

    const [form, setForm] = useState({
        username:  '',
        role:      'user',
        is_active: true
    })
    const [loading, setLoading] = useState(true)
    const [saving,  setSaving]  = useState(false)
    const [error,   setError]   = useState('')

    // Charger les données actuelles de l'utilisateur
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/users/${id}`)
                const user = response.data
                setForm({
                    username:  user.username,
                    role:      user.role,
                    is_active: user.is_active
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
        setError('')
        setSaving(true)

        try {
            await api.put(`/users/${id}`, form)
            navigate('/users')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <p>Loading...</p>

    return (
        <div>
            <h2>Edit User</h2>

            <button onClick={() => navigate('/users')}>← Back</button>

            <br /><br />

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username</label><br />
                    <input
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                <br />
                <div>
                    <label>Role</label><br />
                    <select name="role" value={form.role} onChange={handleChange}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                    </select>
                </div>
                <br />
                <div>
                    <label>
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={form.is_active}
                            onChange={handleChange}
                        />
                        {' '}Active
                    </label>
                </div>
                <br />
                <button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    )
}

export default EditUser