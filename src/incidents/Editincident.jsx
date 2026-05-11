import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import {
    SEVERITY_LABELS, SEVERITY_BADGES, SEVERITY_DOTS,
    STATUS_LABELS, fmt,
} from './incidentConstants'

const inputCls = "w-full rounded-lg border border-[#1c2b2f] bg-[#0a1215] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition focus:border-[#00A897] focus:outline-none focus:ring-1 focus:ring-[#00A897]/40"
const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5"

function EditIncident() {
    const navigate = useNavigate()
    const { id }   = useParams()

    const [original, setOriginal] = useState(null)
    const [form,     setForm]     = useState({
        title:       '',
        description: '',
        severity:    '2',
        status:      'open',
    })
    const [loading, setLoading] = useState(true)
    const [saving,  setSaving]  = useState(false)
    const [error,   setError]   = useState('')

    const onClose = () => navigate('/incidents')

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    useEffect(() => {
        api.get(`/incidents/${id}`)
            .then(res => {
                const inc = res.data
                setOriginal(inc)
                setForm({
                    title:       inc.title       ?? '',
                    description: inc.description ?? '',
                    severity:    String(inc.severity ?? 2),
                    status:      inc.status      ?? 'open',
                })
            })
            .catch(err => setError(err.response?.data?.message || 'Failed to load incident.'))
            .finally(() => setLoading(false))
    }, [id])

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSaving(true)
        try {
            await api.put(`/incidents/${id}`, {
                title:       form.title,
                description: form.description,
                severity:    Number(form.severity),
                status:      form.status,
            })
            navigate('/incidents')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update incident.')
        } finally {
            setSaving(false)
        }
    }

    const sevNum = Number(form.severity)

    // ── Backdrop wrapper (always rendered so Escape works) ──
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-xl rounded-2xl border border-[#1c2b2f] bg-[#0b0f12] flex flex-col max-h-[90vh]"
                style={{ boxShadow: '0 0 0 1px #1c2b2f, 0 25px 60px rgba(0,0,0,0.7)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Top accent bar */}
                <div className="h-1 w-full rounded-t-2xl shrink-0 bg-[#00A897]" />

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#1c2b2f] shrink-0">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Incident</p>
                        <h2 className="text-base font-bold text-white mt-0.5">Edit Incident</h2>
                        {original && (
                            <p className="text-[10px] text-slate-600 font-mono mt-0.5 truncate max-w-xs" title={original._id}>
                                {original._id}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#1c2b2f] text-slate-500 transition hover:border-[#275B66] hover:text-white"
                        title="Close (Esc)"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* ── Read-only metadata pills ── */}
                {original && (
                    <div className="flex flex-wrap gap-2 px-6 pt-3 shrink-0">
                        <span className="rounded-full border border-[#1c2b2f] bg-black/40 px-2.5 py-1 text-[10px] text-slate-500">
                            Source: <span className={`font-semibold ${original.source === 'wazuh' ? 'text-[#00A897]' : 'text-slate-300'}`}>{original.source}</span>
                        </span>
                        {original.agent_name && (
                            <span className="rounded-full border border-[#1c2b2f] bg-black/40 px-2.5 py-1 text-[10px] text-slate-500">
                                Agent: <span className="font-mono text-slate-300">{original.agent_name}</span>
                            </span>
                        )}
                        {original.rule_id && (
                            <span className="rounded-full border border-[#1c2b2f] bg-black/40 px-2.5 py-1 text-[10px] text-slate-500">
                                Rule: <span className="font-mono text-[#00A897]">#{original.rule_id}</span>
                                {original.rule_level && <span className="text-slate-600"> (lv {original.rule_level})</span>}
                            </span>
                        )}
                        <span className="rounded-full border border-[#1c2b2f] bg-black/40 px-2.5 py-1 text-[10px] text-slate-500">
                            {fmt(original.timestamp)}
                        </span>
                    </div>
                )}

                {/* ── Scrollable body ── */}
                <div className="overflow-y-auto flex-1 px-6 py-5">

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    {!loading && (
                        <form id="edit-incident-form" onSubmit={handleSubmit} className="space-y-5">

                            <div>
                                <label className={labelCls}>Title</label>
                                <input name="title" className={inputCls} value={form.title} onChange={handleChange} required />
                            </div>

                            <div>
                                <label className={labelCls}>Description</label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    className={inputCls + ' resize-none'}
                                    value={form.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Severity */}
                                <div>
                                    <label className={labelCls}>Severity</label>
                                    <select name="severity" value={form.severity} onChange={handleChange} className={inputCls}>
                                        {Object.entries(SEVERITY_LABELS).reverse().map(([num, label]) => (
                                            <option key={num} value={num}>{label}</option>
                                        ))}
                                    </select>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] text-slate-700">Preview:</span>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEVERITY_BADGES[sevNum]}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOTS[sevNum]}`} />
                                            {SEVERITY_LABELS[sevNum]}
                                        </span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className={labelCls}>Status</label>
                                    <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1c2b2f] shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-[#1c2b2f] px-4 py-2 text-sm text-slate-400 transition hover:border-[#275B66] hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-incident-form"
                        disabled={saving || loading}
                        className="rounded-lg bg-[#00A897] px-5 py-2 text-sm font-bold text-black transition hover:bg-[#00c4b1] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                                Saving…
                            </span>
                        ) : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditIncident