import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function Login() {
    const navigate = useNavigate()

    const [form, setForm] = useState({ username: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await api.post('/auth/login', form)
            localStorage.setItem('token', response.data.token)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: '360px', margin: '80px auto' }}>
            <h2>Login</h2>

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
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    )
}

export default Login