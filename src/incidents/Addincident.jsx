import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { SEVERITY_LABELS } from './incidentConstants'

const inputCls  = "w-full rounded-lg border border-[#1c2b2f] bg-[#0a1215] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition focus:border-[#00A897] focus:outline-none focus:ring-1 focus:ring-[#00A897]/40"
const labelCls  = "block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5"

function AddIncident() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        title:       '',
        description: '',
        severity:    '2',
        agent_name:  '',
        rule_id:     '',
        rule_level:  '',
    })
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState('')

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await api.post('/incidents', {
                title:       form.title,
                description: form.description,
                severity:    Number(form.severity),
                agent_name:  form.agent_name || undefined,
                rule_id:     form.rule_id    || undefined,
                rule_level:  form.rule_level ? Number(form.rule_level) : undefined,
            })
            navigate('/incidents')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create incident.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 text-slate-100">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/incidents')}
                    className="flex items-center gap-1.5 rounded-lg border border-[#1c2b2f] px-3 py-1.5 text-xs text-slate-400 transition hover:border-[#275B66] hover:text-[#00A897]"
                >
                    ← Back
                </button>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Add Incident</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Create a manual security incident</p>
                </div>
            </div>

            {/* Form card */}
            <div className="max-w-2xl rounded-xl border border-[#1c2b2f] bg-black/60 p-6 space-y-5">

                {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className={labelCls}>Title *</label>
                        <input
                            name="title"
                            className={inputCls}
                            placeholder="Brute force attack detected"
                            value={form.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Description *</label>
                        <textarea
                            name="description"
                            rows={4}
                            className={inputCls + ' resize-none'}
                            placeholder="Describe the incident…"
                            value={form.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Severity — stored and sent as number */}
                    <div>
                        <label className={labelCls}>Severity *</label>
                        <select name="severity" value={form.severity} onChange={handleChange} className={inputCls}>
                            {Object.entries(SEVERITY_LABELS).reverse().map(([num, label]) => (
                                <option key={num} value={num}>{label}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-[10px] text-slate-600">
                            Stored as number in the database (0 = Info … 4 = Critical)
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelCls}>Agent Name</label>
                            <input
                                name="agent_name"
                                className={inputCls}
                                placeholder="ubuntu-2204"
                                value={form.agent_name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Rule ID</label>
                            <input
                                name="rule_id"
                                className={inputCls}
                                placeholder="5902"
                                value={form.rule_id}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Rule Level</label>
                            <input
                                type="number"
                                name="rule_level"
                                min={0}
                                max={15}
                                className={inputCls}
                                placeholder="8"
                                value={form.rule_level}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-[#00A897] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#00c4b1] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating…' : 'Create Incident'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/incidents')}
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

export default AddIncident