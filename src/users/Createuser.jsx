import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function CreateUser() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        username: '',
        password: '',
        role: 'user'
    })
    const [error, setError]   = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

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
        <div>
            <h2>Add User</h2>

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
                    <label>Password</label><br />
                    <input
                        type="password"
                        name="password"
                        value={form.password}
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
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create User'}
                </button>
            </form>
        </div>
    )
}

export default CreateUser