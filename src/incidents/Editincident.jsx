import { useState, useEffect } from 'react'
import api from '../api'
import {
    SEVERITY_LABELS, SEVERITY_BADGES, SEVERITY_DOTS,
    STATUS_LABELS, fmt,
} from './incidentConstants'
import { X, Siren, Loader2, AlertCircle, Save } from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────

const SEVERITY_ACCENT = {
    4: { color: '#f87171', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)',   bar: '#ef4444' },
    3: { color: '#fb923c', bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.25)',  bar: '#f97316' },
    2: { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)',  bar: '#f59e0b' },
    1: { color: '#4ade80', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)',   bar: '#22c55e' },
    0: { color: '#94a3b8', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.25)', bar: '#64748b' },
}

const STATUS_CONFIG = {
    open:        { label: 'Open',        color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
    in_progress: { label: 'In Progress', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)'  },
    resolved:    { label: 'Resolved',    color: '#4ade80', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
}

// ─── Form primitives ──────────────────────────────────────────────────────────

function Field({ label, required, hint, children }) {
    return (
        <div className="space-y-1.5">
            <label style={{
                display: 'block', fontSize: '10px', fontWeight: '600',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#4a7a8a', marginBottom: '6px',
            }}>
                {label}
                {required && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
            </label>
            {children}
            {hint && <p className="text-[10px]" style={{ color: '#2d4a5a' }}>{hint}</p>}
        </div>
    )
}

const baseInputStyle = {
    background: 'rgba(6,14,22,0.8)',
    border: '1px solid #1b263b',
    color: '#cbd5e1',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
}

function StyledInput({ style: extraStyle, ...props }) {
    return (
        <input
            {...props}
            className="placeholder-[#2d4a5a]"
            style={{ ...baseInputStyle, ...extraStyle }}
            onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(2,195,154,0.5)'
                e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(2,195,154,0.08)'
            }}
            onBlur={e => {
                e.currentTarget.style.borderColor = '#1b263b'
                e.currentTarget.style.boxShadow   = 'none'
            }}
        />
    )
}

function StyledTextarea({ rows = 4, style: extraStyle, ...props }) {
    return (
        <textarea
            rows={rows}
            {...props}
            className="placeholder-[#2d4a5a] resize-none"
            style={{ ...baseInputStyle, ...extraStyle }}
            onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(2,195,154,0.5)'
                e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(2,195,154,0.08)'
            }}
            onBlur={e => {
                e.currentTarget.style.borderColor = '#1b263b'
                e.currentTarget.style.boxShadow   = 'none'
            }}
        />
    )
}

// ─── Severity picker ──────────────────────────────────────────────────────────

function SeverityPicker({ value, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {Object.entries(SEVERITY_LABELS).reverse().map(([num, label]) => {
                const isSelected = String(value) === String(num)
                const accent = SEVERITY_ACCENT[Number(num)]
                return (
                    <button
                        key={num}
                        type="button"
                        onClick={() => onChange(num)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                        style={{
                            background: isSelected ? accent.bg : 'rgba(27,38,59,0.4)',
                            border:     isSelected ? `1px solid ${accent.border}` : '1px solid #1b263b',
                            color:      isSelected ? accent.color : '#4a7a8a',
                        }}
                        onMouseEnter={e => {
                            if (!isSelected) {
                                e.currentTarget.style.background  = accent.bg
                                e.currentTarget.style.borderColor = accent.border
                                e.currentTarget.style.color       = accent.color
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isSelected) {
                                e.currentTarget.style.background  = 'rgba(27,38,59,0.4)'
                                e.currentTarget.style.borderColor = '#1b263b'
                                e.currentTarget.style.color       = '#4a7a8a'
                            }
                        }}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
    )
}

// ─── Meta pill ────────────────────────────────────────────────────────────────

function MetaPill({ label, value, valueStyle }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px]"
            style={{ background: 'rgba(27,38,59,0.5)', border: '1px solid #1b263b', color: '#4a7a8a' }}
        >
            {label}:&nbsp;
            <span className="font-semibold" style={valueStyle ?? { color: '#94a3b8' }}>{value}</span>
        </span>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonForm() {
    return (
        <div className="space-y-5 px-6 py-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-2.5 w-24 rounded-md animate-pulse" style={{ background: 'rgba(27,38,59,0.7)' }} />
                    <div className="h-10 w-full rounded-xl animate-pulse" style={{ background: 'rgba(27,38,59,0.5)' }} />
                </div>
            ))}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

function EditIncident({ incidentId, onClose, onSaved }) {
    const [original, setOriginal] = useState(null)
    const [form, setForm] = useState({
        title: '', description: '', severity: '2', status: 'open',
    })
    const [loading, setLoading] = useState(true)
    const [saving,  setSaving]  = useState(false)
    const [error,   setError]   = useState('')

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose?.() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    // Load incident
    useEffect(() => {
        if (!incidentId) return
        setLoading(true)
        api.get(`/incidents/${incidentId}`)
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
    }, [incidentId])

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(''); setSaving(true)
        try {
            await api.put(`/incidents/${incidentId}`, {
                title:       form.title,
                description: form.description,
                severity:    Number(form.severity),
                status:      form.status,
            })
            onSaved?.()
            onClose?.()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update incident.')
        } finally {
            setSaving(false)
        }
    }

    const sevNum    = Number(form.severity)
    const accent    = SEVERITY_ACCENT[sevNum] ?? SEVERITY_ACCENT[2]
    const statusCfg = STATUS_CONFIG[form.status] ?? STATUS_CONFIG.open

    if (!incidentId) return null

    return (
        <>
            <style>{`
                @keyframes edit-inc-in {
                    from { opacity:0; transform:scale(0.97) translateY(8px); }
                    to   { opacity:1; transform:scale(1)    translateY(0);   }
                }
                .edit-inc-panel { animation: edit-inc-in 0.25s cubic-bezier(0.16,1,0.3,1) both; }
            `}</style>

            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div
                    className="edit-inc-panel relative w-full max-w-2xl flex flex-col overflow-hidden rounded-2xl"
                    style={{
                        background: 'linear-gradient(160deg, #0d1b2a 0%, #0a1520 100%)',
                        border: '1px solid #1b263b',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                        maxHeight: '92vh',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div
                        className="h-0.5 w-full shrink-0 transition-all duration-300"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${accent.bar}60, ${accent.bar}90, ${accent.bar}60, transparent)`,
                        }}
                    />

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 px-6 py-4 shrink-0"
                         style={{ borderBottom: '1px solid #1b263b' }}>
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
                                 style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
                                <Siren size={16} style={{ color: accent.color }} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>
                                    Incident
                                </p>
                                <h2 className="text-sm font-semibold mt-0.5" style={{ color: '#f1f5f9' }}>
                                    Edit Incident
                                </h2>

                                {original && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <MetaPill label="Severity" value={SEVERITY_LABELS[original.severity] ?? original.severity} valueStyle={{ color: accent.color }} />
                                        {original.source && (
                                            <MetaPill label="Source" value={original.source} valueStyle={{ color: '#94a3b8' }} />
                                        )}
                                        <MetaPill label="Created" value={fmt(original.timestamp)} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            title="Close (Esc)"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150"
                            style={{ border: '1px solid #1b263b', color: '#4a7a8a' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#028090'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1b263b'; e.currentTarget.style.color = '#4a7a8a' }}
                        >
                            <X size={13} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        {loading && <SkeletonForm />}

                        {error && !loading && (
                            <div
                                className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                            >
                                <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                                <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
                            </div>
                        )}

                        {!loading && (
                            <form id="edit-incident-form" onSubmit={handleSubmit} className="space-y-5">
                                <Field label="Title" required>
                                    <StyledInput
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="Incident title…"
                                        required
                                    />
                                </Field>

                                <Field label="Description">
                                    <StyledTextarea
                                        name="description"
                                        rows={4}
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="Describe what happened, affected systems, and initial findings…"
                                    />
                                </Field>

                                <Field label="Severity" required hint="0 = Info · 1 = Low · 2 = Medium · 3 = High · 4 = Critical">
                                    <SeverityPicker
                                        value={form.severity}
                                        onChange={val => setForm(f => ({ ...f, severity: val }))}
                                    />
                                </Field>

                                <Field label="Status">
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(STATUS_CONFIG).map(([val, cfg]) => {
                                            const isSelected = form.status === val
                                            return (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, status: val }))}
                                                    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                                                    style={{
                                                        background: isSelected ? cfg.bg : 'rgba(27,38,59,0.4)',
                                                        border:     isSelected ? `1px solid ${cfg.border}` : '1px solid #1b263b',
                                                        color:      isSelected ? cfg.color : '#4a7a8a',
                                                    }}
                                                >
                                                    {cfg.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </Field>
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
                        style={{ borderTop: '1px solid #1b263b', background: 'rgba(6,14,22,0.4)' }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: 'transparent', border: '1px solid rgba(2,128,144,0.3)', color: '#028090' }}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            form="edit-incident-form"
                            disabled={saving || loading}
                            className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: '#02c39a', color: '#0d1b2a' }}
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Save size={13} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default EditIncident
