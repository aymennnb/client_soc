import { useState, useEffect } from 'react'
import api from '../api'
import { SEVERITY_LABELS } from './incidentConstants'
import { X, Siren, Loader2, AlertCircle } from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────

const SEVERITY_ACCENT = {
    4: { color: '#f87171', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)',   bar: '#ef4444' },
    3: { color: '#fb923c', bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.25)',  bar: '#f97316' },
    2: { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)',  bar: '#f59e0b' },
    1: { color: '#4ade80', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)',   bar: '#22c55e' },
    0: { color: '#94a3b8', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.25)', bar: '#64748b' },
}

const baseInput = {
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

const focusHandlers = {
    onFocus: (e) => {
        e.currentTarget.style.borderColor = 'rgba(2,195,154,0.5)'
        e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(2,195,154,0.08)'
    },
    onBlur: (e) => {
        e.currentTarget.style.borderColor = '#1b263b'
        e.currentTarget.style.boxShadow   = 'none'
    },
}

function Field({ label, required, hint, children }) {
    return (
        <div className="space-y-1.5">
            <label style={{
                display: 'block', fontSize: '10px', fontWeight: '600',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#4a7a8a', marginBottom: '6px',
            }}>
                {label}
                {required && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
            </label>
            {children}
            {hint && <p className="text-[10px] mt-1.5" style={{ color: '#2d4a5a' }}>{hint}</p>}
        </div>
    )
}

function StyledInput({ style: extraStyle, ...props }) {
    return (
        <input
            {...props}
            className="placeholder-[#2d4a5a]"
            style={{ ...baseInput, ...extraStyle }}
            {...focusHandlers}
        />
    )
}

function StyledTextarea({ rows = 4, style: extraStyle, ...props }) {
    return (
        <textarea
            rows={rows}
            {...props}
            className="placeholder-[#2d4a5a] resize-none"
            style={{ ...baseInput, ...extraStyle }}
            {...focusHandlers}
        />
    )
}

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
                            background: isSelected ? accent.bg    : 'rgba(27,38,59,0.4)',
                            border:     isSelected ? `1px solid ${accent.border}` : '1px solid #1b263b',
                            color:      isSelected ? accent.color : '#4a7a8a',
                        }}
                        onMouseEnter={e => {
                            if (!isSelected) {
                                e.currentTarget.style.background   = accent.bg
                                e.currentTarget.style.borderColor  = accent.border
                                e.currentTarget.style.color        = accent.color
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isSelected) {
                                e.currentTarget.style.background   = 'rgba(27,38,59,0.4)'
                                e.currentTarget.style.borderColor  = '#1b263b'
                                e.currentTarget.style.color        = '#4a7a8a'
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

function SectionDivider({ label }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: '#1b263b' }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2d4a5a' }}>
                {label}
            </span>
            <div className="flex-1 h-px" style={{ background: '#1b263b' }} />
        </div>
    )
}

function AddIncident({ onClose, onSaved }) {
    const [form, setForm] = useState({
        title: '', description: '', severity: '2',
        agent_name: '', rule_id: '', rule_level: '',
    })
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState('')

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose?.() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(''); setLoading(true)
        try {
            await api.post('/incidents', {
                title:       form.title,
                description: form.description,
                severity:    Number(form.severity),
                agent_name:  form.agent_name  || undefined,
                rule_id:     form.rule_id     || undefined,
                rule_level:  form.rule_level  ? Number(form.rule_level) : undefined,
            })
            onSaved?.()
            onClose?.()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create incident.')
        } finally {
            setLoading(false)
        }
    }

    const accent = SEVERITY_ACCENT[Number(form.severity)] ?? SEVERITY_ACCENT[2]

    return (
        <>
            <style>{`
                @keyframes add-modal-in { from { opacity:0; transform:scale(0.97) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
                .add-modal { animation: add-modal-in 0.28s cubic-bezier(0.16,1,0.3,1) both; }
                .step-slide-enter { animation: step-in 0.2s ease-out both; }
                @keyframes step-in { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
            `}</style>

            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div
                    className="add-modal relative w-full max-w-xl flex flex-col rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(8,16,26,0.98)',
                        border: '1px solid #1b263b',
                        boxShadow: '0 0 0 1px rgba(2,195,154,0.04), 0 32px 80px rgba(0,0,0,0.7)',
                        maxHeight: '90vh',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div
                        className="shrink-0 h-0.5 w-full transition-all duration-500"
                        style={{
                            background: `linear-gradient(90deg, transparent 0%, ${accent.bar}80 20%, ${accent.bar} 50%, ${accent.bar}80 80%, transparent 100%)`,
                        }}
                    />

                    <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 shrink-0"
                         style={{ borderBottom: '1px solid #1b263b' }}>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300"
                                 style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
                                <Siren size={15} style={{ color: accent.color }} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-0.5 rounded-full" style={{ background: '#02c39a' }} />
                                    <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Add Incident</h2>
                                </div>
                                <p className="mt-0.5 pl-3.5 text-[11px]" style={{ color: '#4a7a8a' }}>
                                    Create a manual security incident
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            title="Close (Esc)"
                            className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150"
                            style={{ background: 'rgba(27,38,59,0.4)', border: '1px solid #1b263b', color: '#4a7a8a' }}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        <form id="add-incident-form" onSubmit={handleSubmit}>
                            <div className="px-6 py-6 space-y-5">

                                {error && (
                                    <div
                                        className="flex items-start gap-3 rounded-xl px-4 py-3"
                                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                                    >
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                                        <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
                                    </div>
                                )}

                                <div className="step-slide-enter space-y-5">
                                    <Field label="Title" required>
                                        <StyledInput
                                            name="title"
                                            placeholder="e.g. Brute force attack on SSH"
                                            value={form.title}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Field>

                                    <Field label="Description" required>
                                        <StyledTextarea
                                            name="description"
                                            rows={4}
                                            placeholder="Describe what happened, affected systems, and initial findings…"
                                            value={form.description}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Field>

                                    <Field label="Severity" required hint="0 = Info · 1 = Low · 2 = Medium · 3 = High · 4 = Critical">
                                        <SeverityPicker
                                            value={form.severity}
                                            onChange={val => setForm(f => ({ ...f, severity: val }))}
                                        />
                                    </Field>

                                    <div
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300"
                                        style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
                                    >
                                        <span className="h-2 w-2 rounded-full" style={{ background: accent.color }} />
                                        <span className="text-xs font-semibold" style={{ color: accent.color }}>
                                            {SEVERITY_LABELS[Number(form.severity)]}
                                        </span>
                                        <span className="text-[11px]" style={{ color: '#4a7a8a' }}>
                                            severity selected
                                        </span>
                                    </div>
                                </div>

                                <SectionDivider label="Optional Context" />

                                <div className="step-slide-enter space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Agent Name">
                                            <StyledInput
                                                name="agent_name"
                                                placeholder="ubuntu-2204"
                                                value={form.agent_name}
                                                onChange={handleChange}
                                            />
                                        </Field>

                                        <Field label="Rule ID">
                                            <StyledInput
                                                name="rule_id"
                                                placeholder="5902"
                                                value={form.rule_id}
                                                onChange={handleChange}
                                            />
                                        </Field>

                                        <Field label="Rule Level" hint="Wazuh rule level (0–15)">
                                            <StyledInput
                                                type="number"
                                                name="rule_level"
                                                min={0}
                                                max={15}
                                                placeholder="8"
                                                value={form.rule_level}
                                                onChange={handleChange}
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div
                        className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
                        style={{ borderTop: '1px solid #1b263b', background: 'rgba(6,14,22,0.4)' }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: 'transparent', border: '1px solid rgba(2,128,144,0.3)', color: '#028090' }}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            form="add-incident-form"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: '#02c39a', color: '#0d1b2a' }}
                        >
                            {loading ? (
                                <><Loader2 size={13} className="animate-spin" /> Creating…</>
                            ) : (
                                <><Siren size={13} /> Create Incident</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AddIncident