import { useState, useEffect } from 'react'
import api from '../api'
import {
    SEVERITY_LABELS, SEVERITY_BADGES, SEVERITY_DOTS,
    STATUS_LABELS, fmt,
} from './incidentConstants'
import { X, Siren, Loader2, AlertCircle, Save } from 'lucide-react'

// ─── useTheme ─────────────────────────────────────────────────────────────────
function useTheme() {
    const [isDark, setIsDark] = useState(() => {
        const attr = document.documentElement.getAttribute('data-theme')
        if (attr) return attr !== 'light'
        return !window.matchMedia('(prefers-color-scheme: light)').matches
    })
    useEffect(() => {
        const mo = new MutationObserver(() => {
            const attr = document.documentElement.getAttribute('data-theme')
            setIsDark(attr ? attr !== 'light' : !window.matchMedia('(prefers-color-scheme: light)').matches)
        })
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
        const mq = window.matchMedia('(prefers-color-scheme: light)')
        const mqh = (e) => { if (!document.documentElement.getAttribute('data-theme')) setIsDark(!e.matches) }
        mq.addEventListener('change', mqh)
        return () => { mo.disconnect(); mq.removeEventListener('change', mqh) }
    }, [])
    return isDark
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const tokens = (isDark) => {
    const d = isDark
    return {
        // Panel
        bgPanel:         d ? 'linear-gradient(160deg, #0d1b2a 0%, #0a1520 100%)'
                           : 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
        borderPanel:     d ? '#1b263b'                          : '#e2e8f0',
        shadowPanel:     d ? '0 32px 80px rgba(0,0,0,0.6)'     : '0 32px 80px rgba(0,0,0,0.12)',
        bgBackdrop:      d ? 'rgba(6,14,22,0.75)'               : 'rgba(15,23,42,0.45)',

        // Header / footer / dividers
        borderDivider:   d ? '#1b263b'                          : '#e2e8f0',
        bgFooter:        d ? 'rgba(6,14,22,0.4)'                : 'rgba(248,250,252,0.9)',

        // Inputs
        bgInput:         d ? 'rgba(6,14,22,0.8)'                : '#ffffff',
        borderInput:     d ? '#1b263b'                          : '#cbd5e1',
        borderInputFocus:  'rgba(2,195,154,0.5)',
        shadowInputFocus:  '0 0 0 3px rgba(2,195,154,0.08)',
        colorInput:      d ? '#cbd5e1'                          : '#1e293b',
        colorPlaceholder:d ? '#2d4a5a'                          : '#94a3b8',

        // Skeleton
        bgSkeletonLabel: d ? 'rgba(27,38,59,0.7)'               : 'rgba(203,213,225,0.6)',
        bgSkeletonField: d ? 'rgba(27,38,59,0.5)'               : 'rgba(203,213,225,0.4)',

        // Error box
        bgError:         d ? 'rgba(239,68,68,0.08)'             : 'rgba(220,38,38,0.06)',
        borderError:     d ? 'rgba(239,68,68,0.2)'              : 'rgba(220,38,38,0.22)',
        colorError:      d ? '#f87171'                          : '#dc2626',

        // Severity / status picker — unselected state
        bgPickerIdle:    d ? 'rgba(27,38,59,0.4)'               : 'rgba(241,245,249,0.9)',
        borderPickerIdle:d ? '#1b263b'                          : '#e2e8f0',
        colorPickerIdle: d ? '#4a7a8a'                          : '#64748b',

        // Meta pill
        bgMeta:          d ? 'rgba(27,38,59,0.5)'               : 'rgba(241,245,249,0.9)',
        borderMeta:      d ? '#1b263b'                          : '#e2e8f0',
        colorMeta:       d ? '#4a7a8a'                          : '#64748b',
        colorMetaValue:  d ? '#94a3b8'                          : '#475569',

        // Close button
        borderClose:     d ? '#1b263b'                          : '#e2e8f0',
        colorClose:      d ? '#4a7a8a'                          : '#64748b',
        colorCloseHover: d ? '#ffffff'                          : '#0f172a',

        // Cancel button
        borderCancel:    d ? 'rgba(2,128,144,0.3)'              : 'rgba(2,128,144,0.35)',
        bgCancelHover:   d ? 'rgba(2,128,144,0.1)'              : 'rgba(2,128,144,0.07)',
        colorCancel:     d ? '#028090'                          : '#0369a1',

        // Field label / hint
        colorLabel:      d ? '#4a7a8a'                          : '#64748b',
        colorHint:       d ? '#2d4a5a'                          : '#94a3b8',
        colorRequired:   d ? '#f87171'                          : '#dc2626',

        // Text hierarchy
        textPrimary:     d ? '#f1f5f9'                          : '#0f172a',
        textSubtitle:    d ? '#2d4a5a'                          : '#94a3b8',
    }
}

// ─── Severity accent palettes — bar color invariant, bg/border/text theme-aware
const SEVERITY_ACCENT = {
    4: {
        bar:    '#ef4444',
        color:  (d) => d ? '#f87171' : '#7f1d1d',
        bg:     (d) => d ? 'rgba(239,68,68,0.10)'    : 'rgba(220,38,38,0.09)',
        border: (d) => d ? 'rgba(239,68,68,0.25)'    : 'rgba(220,38,38,0.28)',
    },
    3: {
        bar:    '#f97316',
        color:  (d) => d ? '#fb923c' : '#7c2d12',
        bg:     (d) => d ? 'rgba(249,115,22,0.10)'   : 'rgba(234,88,12,0.09)',
        border: (d) => d ? 'rgba(249,115,22,0.25)'   : 'rgba(234,88,12,0.28)',
    },
    2: {
        bar:    '#f59e0b',
        color:  (d) => d ? '#fbbf24' : '#78350f',
        bg:     (d) => d ? 'rgba(245,158,11,0.10)'   : 'rgba(217,119,6,0.09)',
        border: (d) => d ? 'rgba(245,158,11,0.25)'   : 'rgba(217,119,6,0.28)',
    },
    1: {
        bar:    '#22c55e',
        color:  (d) => d ? '#4ade80' : '#14532d',
        bg:     (d) => d ? 'rgba(34,197,94,0.10)'    : 'rgba(22,163,74,0.09)',
        border: (d) => d ? 'rgba(34,197,94,0.25)'    : 'rgba(22,163,74,0.28)',
    },
    0: {
        bar:    '#64748b',
        color:  (d) => d ? '#94a3b8' : '#334155',
        bg:     (d) => d ? 'rgba(100,116,139,0.10)'  : 'rgba(100,116,139,0.09)',
        border: (d) => d ? 'rgba(100,116,139,0.25)'  : 'rgba(100,116,139,0.28)',
    },
}

const STATUS_CONFIG = {
    open:        {
        label: 'Open',
        color:  (d) => d ? '#f87171' : '#7f1d1d',
        bg:     (d) => d ? 'rgba(239,68,68,0.08)'   : 'rgba(220,38,38,0.08)',
        border: (d) => d ? 'rgba(239,68,68,0.2)'    : 'rgba(220,38,38,0.25)',
    },
    in_progress: {
        label: 'In Progress',
        color:  (d) => d ? '#38bdf8' : '#0c4a6e',
        bg:     (d) => d ? 'rgba(56,189,248,0.08)'  : 'rgba(14,165,233,0.08)',
        border: (d) => d ? 'rgba(56,189,248,0.2)'   : 'rgba(14,165,233,0.25)',
    },
    resolved:    {
        label: 'Resolved',
        color:  (d) => d ? '#4ade80' : '#14532d',
        bg:     (d) => d ? 'rgba(34,197,94,0.08)'   : 'rgba(22,163,74,0.08)',
        border: (d) => d ? 'rgba(34,197,94,0.2)'    : 'rgba(22,163,74,0.25)',
    },
}

// ─── Form primitives ──────────────────────────────────────────────────────────

function Field({ label, required, hint, children, tk }) {
    return (
        <div className="space-y-1.5">
            <label style={{
                display: 'block', fontSize: '10px', fontWeight: '600',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: tk.colorLabel, marginBottom: '6px',
            }}>
                {label}
                {required && <span style={{ color: tk.colorRequired, marginLeft: '3px' }}>*</span>}
            </label>
            {children}
            {hint && <p className="text-[10px]" style={{ color: tk.colorHint }}>{hint}</p>}
        </div>
    )
}

function StyledInput({ tk, style: extraStyle, ...props }) {
    const base = {
        background:   tk.bgInput,
        border:       `1px solid ${tk.borderInput}`,
        color:        tk.colorInput,
        borderRadius: '10px',
        padding:      '10px 14px',
        fontSize:     '13px',
        width:        '100%',
        outline:      'none',
        transition:   'border-color 0.15s, box-shadow 0.15s',
    }
    return (
        <input
            {...props}
            style={{ ...base, ...extraStyle }}
            placeholder={props.placeholder}
            onFocus={e => {
                e.currentTarget.style.borderColor = tk.borderInputFocus
                e.currentTarget.style.boxShadow   = tk.shadowInputFocus
            }}
            onBlur={e => {
                e.currentTarget.style.borderColor = tk.borderInput
                e.currentTarget.style.boxShadow   = 'none'
            }}
        />
    )
}

function StyledTextarea({ tk, rows = 4, style: extraStyle, ...props }) {
    const base = {
        background:   tk.bgInput,
        border:       `1px solid ${tk.borderInput}`,
        color:        tk.colorInput,
        borderRadius: '10px',
        padding:      '10px 14px',
        fontSize:     '13px',
        width:        '100%',
        outline:      'none',
        transition:   'border-color 0.15s, box-shadow 0.15s',
        resize:       'none',
    }
    return (
        <textarea
            rows={rows}
            {...props}
            style={{ ...base, ...extraStyle }}
            onFocus={e => {
                e.currentTarget.style.borderColor = tk.borderInputFocus
                e.currentTarget.style.boxShadow   = tk.shadowInputFocus
            }}
            onBlur={e => {
                e.currentTarget.style.borderColor = tk.borderInput
                e.currentTarget.style.boxShadow   = 'none'
            }}
        />
    )
}

// ─── Severity picker ──────────────────────────────────────────────────────────

function SeverityPicker({ value, onChange, isDark, tk }) {
    return (
        <div className="flex flex-wrap gap-2">
            {Object.entries(SEVERITY_LABELS).reverse().map(([num, label]) => {
                const isSelected = String(value) === String(num)
                const accent     = SEVERITY_ACCENT[Number(num)]
                return (
                    <button
                        key={num}
                        type="button"
                        onClick={() => onChange(num)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                        style={{
                            background: isSelected ? accent.bg(isDark)     : tk.bgPickerIdle,
                            border:     isSelected ? `1px solid ${accent.border(isDark)}` : `1px solid ${tk.borderPickerIdle}`,
                            color:      isSelected ? accent.color(isDark)  : tk.colorPickerIdle,
                        }}
                        onMouseEnter={e => {
                            if (!isSelected) {
                                e.currentTarget.style.background  = accent.bg(isDark)
                                e.currentTarget.style.borderColor = accent.border(isDark)
                                e.currentTarget.style.color       = accent.color(isDark)
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isSelected) {
                                e.currentTarget.style.background  = tk.bgPickerIdle
                                e.currentTarget.style.borderColor = tk.borderPickerIdle
                                e.currentTarget.style.color       = tk.colorPickerIdle
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

function MetaPill({ label, value, valueStyle, tk }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px]"
            style={{ background: tk.bgMeta, border: `1px solid ${tk.borderMeta}`, color: tk.colorMeta }}
        >
            {label}:&nbsp;
            <span className="font-semibold" style={valueStyle ?? { color: tk.colorMetaValue }}>
                {value}
            </span>
        </span>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonForm({ tk }) {
    return (
        <div className="space-y-5 px-6 py-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-2.5 w-24 rounded-md animate-pulse" style={{ background: tk.bgSkeletonLabel }} />
                    <div className="h-10 w-full rounded-xl animate-pulse"  style={{ background: tk.bgSkeletonField }} />
                </div>
            ))}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

function EditIncident({ incidentId, onClose, onSaved }) {
    const isDark = useTheme()
    const tk     = tokens(isDark)

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

            {/* ── Backdrop ── */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* ── Panel ── */}
                <div
                    className="edit-inc-panel relative w-full max-w-2xl flex flex-col overflow-hidden rounded-2xl"
                    style={{
                        background: tk.bgPanel,
                        border:     `1px solid ${tk.borderPanel}`,
                        boxShadow:  tk.shadowPanel,
                        maxHeight:  '92vh',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Severity accent bar — color is semantically invariant */}
                    <div
                        className="h-0.5 w-full shrink-0 transition-all duration-300"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${accent.bar}60, ${accent.bar}90, ${accent.bar}60, transparent)`,
                        }}
                    />

                    {/* ── Header ── */}
                    <div
                        className="flex items-start justify-between gap-4 px-6 py-4 shrink-0"
                        style={{ borderBottom: `1px solid ${tk.borderDivider}` }}
                    >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
                                style={{ background: accent.bg(isDark), border: `1px solid ${accent.border(isDark)}` }}
                            >
                                <Siren size={16} style={{ color: accent.color(isDark) }} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-widest"
                                    style={{ color: tk.textSubtitle }}>
                                    Incident
                                </p>
                                <h2 className="text-sm font-semibold mt-0.5" style={{ color: tk.textPrimary }}>
                                    Edit Incident
                                </h2>

                                {original && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <MetaPill
                                            tk={tk}
                                            label="Severity"
                                            value={SEVERITY_LABELS[original.severity] ?? original.severity}
                                            valueStyle={{ color: accent.color(isDark) }}
                                        />
                                        {original.source && (
                                            <MetaPill tk={tk} label="Source" value={original.source} />
                                        )}
                                        <MetaPill tk={tk} label="Created" value={fmt(original.timestamp)} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            title="Close (Esc)"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150"
                            style={{ border: `1px solid ${tk.borderClose}`, color: tk.colorClose }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#028090'; e.currentTarget.style.color = tk.colorCloseHover }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = tk.borderClose; e.currentTarget.style.color = tk.colorClose }}
                        >
                            <X size={13} />
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        {loading && <SkeletonForm tk={tk} />}

                        {error && !loading && (
                            <div
                                className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5"
                                style={{ background: tk.bgError, border: `1px solid ${tk.borderError}` }}
                            >
                                <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: tk.colorError }} />
                                <p className="text-sm" style={{ color: tk.colorError }}>{error}</p>
                            </div>
                        )}

                        {!loading && (
                            <form id="edit-incident-form" onSubmit={handleSubmit} className="space-y-5">
                                <Field tk={tk} label="Title" required>
                                    <StyledInput
                                        tk={tk}
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="Incident title…"
                                        required
                                    />
                                </Field>

                                <Field tk={tk} label="Description">
                                    <StyledTextarea
                                        tk={tk}
                                        name="description"
                                        rows={4}
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="Describe what happened, affected systems, and initial findings…"
                                    />
                                </Field>

                                <Field tk={tk} label="Severity" required hint="0 = Info · 1 = Low · 2 = Medium · 3 = High · 4 = Critical">
                                    <SeverityPicker
                                        value={form.severity}
                                        onChange={val => setForm(f => ({ ...f, severity: val }))}
                                        isDark={isDark}
                                        tk={tk}
                                    />
                                </Field>

                                <Field tk={tk} label="Status">
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
                                                        background: isSelected ? cfg.bg(isDark)     : tk.bgPickerIdle,
                                                        border:     isSelected ? `1px solid ${cfg.border(isDark)}` : `1px solid ${tk.borderPickerIdle}`,
                                                        color:      isSelected ? cfg.color(isDark)  : tk.colorPickerIdle,
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.background  = cfg.bg(isDark)
                                                            e.currentTarget.style.borderColor = cfg.border(isDark)
                                                            e.currentTarget.style.color       = cfg.color(isDark)
                                                        }
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.background  = tk.bgPickerIdle
                                                            e.currentTarget.style.borderColor = tk.borderPickerIdle
                                                            e.currentTarget.style.color       = tk.colorPickerIdle
                                                        }
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

                    {/* ── Footer ── */}
                    <div
                        className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
                        style={{ borderTop: `1px solid ${tk.borderDivider}`, background: tk.bgFooter }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: 'transparent', border: `1px solid ${tk.borderCancel}`, color: tk.colorCancel }}
                            onMouseEnter={e => { e.currentTarget.style.background = tk.bgCancelHover }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            form="edit-incident-form"
                            disabled={saving || loading}
                            className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: '#02c39a', color: '#0d1b2a' }}
                            onMouseEnter={e => { if (!saving && !loading) e.currentTarget.style.background = '#02e0b1' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#02c39a' }}
                        >
                            {saving ? (
                                <><Loader2 size={13} className="animate-spin" />Saving…</>
                            ) : (
                                <><Save size={13} />Save Changes</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default EditIncident