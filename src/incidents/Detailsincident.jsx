import { useEffect } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const SEVERITY_LABELS = { 0: 'Info', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

const SEVERITY_BADGES = {
    0: 'bg-slate-700/60 text-slate-300 border border-slate-600/40',
    1: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    2: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    3: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    4: 'bg-red-500/15 text-red-300 border border-red-500/30',
}

const SEVERITY_DOTS = {
    0: 'bg-slate-400',
    1: 'bg-emerald-400',
    2: 'bg-amber-400',
    3: 'bg-orange-400',
    4: 'bg-red-500',
}

const STATUS_BADGES = {
    open:        'bg-red-500/15 text-red-300 border border-red-500/30',
    resolved:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    in_progress: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    closed:      'bg-slate-700/60 text-slate-400 border border-slate-600/40',
}

const SOURCE_BADGES = {
    wazuh:  'bg-[#00A897]/10 text-[#00A897] border-[#00A897]/30',
    manual: 'bg-slate-700/40 text-slate-400 border-slate-600/30',
}

const fmt = (dateStr) => {
    try {
        return new Date(dateStr).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    } catch { return '—' }
}

// ── Small label + value row ───────────────────────────────────────────────────
function Row({ label, children }) {
    return (
        <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 border-b border-[#0e1a1e] lm:border-slate-100 last:border-0 items-start">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 lm:text-slate-400 pt-0.5 shrink-0">
                {label}
            </span>
            <span className="text-sm text-slate-300 lm:text-slate-700 break-words">{children}</span>
        </div>
    )
}

// ── Pre-formatted text block ──────────────────────────────────────────────────
function PreBlock({ text }) {
    if (!text) return <span className="text-slate-600">—</span>
    return (
        <pre className="whitespace-pre-wrap break-words rounded-lg border border-[#1c2b2f] lm:border-slate-200 bg-black/40 lm:bg-slate-50 px-3 py-2.5 text-xs text-slate-400 lm:text-slate-600 font-mono leading-relaxed max-h-48 overflow-y-auto">
            {text}
        </pre>
    )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function DetailSkeleton() {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
        >
            <div
                className="w-full max-w-2xl rounded-2xl border border-[#1c2b2f] bg-[#0b0f12] lm:bg-white p-6 space-y-4"
                style={{ boxShadow: '0 0 0 1px #1c2b2f, 0 25px 60px rgba(0,0,0,0.7)' }}
            >
                <div className="h-5 w-1/3 animate-pulse rounded bg-white/5 lm:bg-slate-100" />
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="grid grid-cols-[140px_1fr] gap-3 py-2.5 border-b border-[#0e1a1e] lm:border-slate-100">
                        <div className="h-3 animate-pulse rounded bg-white/5 lm:bg-slate-100" />
                        <div className="h-3 animate-pulse rounded bg-white/5 lm:bg-slate-100" style={{ width: `${50 + (i % 4) * 12}%` }} />
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────
function DetailIncident({ selectedIncident, detailLoading, onClose }) {

    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    if (detailLoading) return <DetailSkeleton />
    if (!selectedIncident) return null

    const sevNum   = selectedIncident.severity ?? 0
    const sevLabel = SEVERITY_LABELS[sevNum] ?? String(sevNum)
    const status   = selectedIncident.status?.toLowerCase() ?? ''

    return (
        /* ── Backdrop ── */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}
        >
            {/* ── Modal card ── */}
            <div
                className="relative w-full max-w-2xl rounded-2xl border border-[#1c2b2f] lm:border-slate-200 bg-[#0b0f12] lm:bg-white flex flex-col max-h-[90vh]"
                style={{ boxShadow: '0 0 0 1px #1c2b2f, 0 25px 60px rgba(0,0,0,0.7)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Top accent bar ── */}
                <div
                    className="h-1 w-full rounded-t-2xl shrink-0"
                    style={{ background: 'linear-gradient(90deg, #00A897, #275B66)' }}
                />

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#1c2b2f] lm:border-slate-100 shrink-0">
                    <div className="space-y-2 flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 lm:text-slate-400">
                            Incident Details
                        </p>
                        <h3
                            className="text-base font-bold text-white lm:text-slate-900 leading-snug"
                            title={selectedIncident.title}
                        >
                            {selectedIncident.title}
                        </h3>
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 pt-0.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEVERITY_BADGES[sevNum]}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOTS[sevNum]}`} />
                                {sevLabel}
                            </span>
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_BADGES[status] ?? 'bg-slate-700/60 text-slate-400 border border-slate-600/40'}`}>
                                {selectedIncident.status ?? '—'}
                            </span>
                            {selectedIncident.source && (
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${SOURCE_BADGES[selectedIncident.source] ?? 'bg-slate-700/40 text-slate-400 border-slate-600/30'}`}>
                                    {selectedIncident.source}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#1c2b2f] lm:border-slate-200 text-slate-500 transition hover:border-[#275B66] hover:text-white lm:hover:text-slate-900"
                        title="Close (Esc)"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-0">

                    {/* ── Section : Identification ── */}
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00A897] pb-1 pt-1">
                        Identification
                    </p>
                    <Row label="Agent">
                        {selectedIncident.agent_name
                            ? <span className="rounded border border-[#1c2b2f] lm:border-slate-200 bg-[#0e1e24] lm:bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-300 lm:text-slate-600">
                                {selectedIncident.agent_name}
                              </span>
                            : <span className="text-slate-600">—</span>
                        }
                    </Row>
                    <Row label="Source">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${SOURCE_BADGES[selectedIncident.source] ?? 'bg-slate-700/40 text-slate-400 border-slate-600/30'}`}>
                            {selectedIncident.source ?? '—'}
                        </span>
                    </Row>

                    {/* ── Section : Rule ── */}
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00A897] pb-1 pt-4">
                        Rule
                    </p>
                    <Row label="Rule ID">
                        {selectedIncident.rule_id
                            ? <span className="rounded bg-[#0e1e24] lm:bg-slate-50 px-2 py-0.5 font-mono text-xs text-[#00A897] border border-[#1c2b2f] lm:border-slate-200">
                                #{selectedIncident.rule_id}
                              </span>
                            : <span className="text-slate-600">—</span>
                        }
                    </Row>
                    <Row label="Rule Level">
                        {selectedIncident.rule_level != null
                            ? <span className="font-mono font-bold text-orange-300 lm:text-orange-500">
                                {selectedIncident.rule_level}
                              </span>
                            : <span className="text-slate-600">—</span>
                        }
                    </Row>

                    {/* ── Section : Timeline ── */}
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00A897] pb-1 pt-4">
                        Timeline
                    </p>
                    <Row label="Alert Timestamp">{fmt(selectedIncident.timestamp)}</Row>
                    <Row label="Created At">{fmt(selectedIncident.createdAt)}</Row>
                    <Row label="Last Updated">{fmt(selectedIncident.updatedAt)}</Row>

                    {/* ── Section : Description ── */}
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00A897] pb-1 pt-4">
                        Description
                    </p>
                    <Row label="Description">
                        <PreBlock text={selectedIncident.description} />
                    </Row>
                </div>
            </div>
        </div>
    )
}

export default DetailIncident