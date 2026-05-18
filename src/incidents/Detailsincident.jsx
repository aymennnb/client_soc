import { useEffect } from 'react'
import { X, Siren } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_ACCENT = {
    4: { color: '#f87171', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)',   bar: '#ef4444', dot: '#ef4444' },
    3: { color: '#fb923c', bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.25)',  bar: '#f97316', dot: '#f97316' },
    2: { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)',  bar: '#f59e0b', dot: '#f59e0b' },
    1: { color: '#4ade80', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)',   bar: '#22c55e', dot: '#22c55e' },
    0: { color: '#94a3b8', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.25)', bar: '#64748b', dot: '#64748b' },
}

const SEVERITY_LABELS = { 0: 'Info', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

const STATUS_CONFIG = {
    open:        { color: '#f87171', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)'   },
    in_progress: { color: '#38bdf8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.25)'  },
    resolved:    { color: '#4ade80', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)'   },
    closed:      { color: '#94a3b8', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.25)' },
}

const SOURCE_CONFIG = {
    wazuh:  { color: '#02c39a', bg: 'rgba(2,195,154,0.08)',  border: 'rgba(2,195,154,0.2)'  },
    manual: { color: '#94a3b8', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' },
}

const fmt = (dateStr) => {
    try {
        return new Date(dateStr).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    } catch { return '—' }
}

// ─── Design primitives ────────────────────────────────────────────────────────

function InlineBadge({ label, cfg }) {
    if (!cfg) return <span style={{ color: '#2d4a5a', fontSize: '13px' }}>—</span>
    return (
        <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
            {label}
        </span>
    )
}

function SectionLabel({ children }) {
    return (
        <div className="flex items-center gap-2 pt-5 pb-2">
            <div className="h-px flex-1" style={{ background: '#1b263b' }} />
            <span
                className="text-[10px] font-semibold uppercase tracking-widest shrink-0"
                style={{ color: '#2d4a5a' }}
            >
                {children}
            </span>
            <div className="h-px flex-1" style={{ background: '#1b263b' }} />
        </div>
    )
}

function Row({ label, children }) {
    return (
        <div
            className="flex items-start gap-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(27,38,59,0.6)' }}
        >
            <span
                className="shrink-0 text-[10px] font-semibold uppercase tracking-widest pt-0.5"
                style={{ color: '#4a7a8a', width: '130px' }}
            >
                {label}
            </span>
            <span className="text-sm flex-1 min-w-0" style={{ color: '#cbd5e1' }}>
                {children}
            </span>
        </div>
    )
}

function MonoBadge({ children }) {
    if (!children) return <span style={{ color: '#2d4a5a' }}>—</span>
    return (
        <span
            className="inline-flex items-center rounded-lg px-2 py-0.5 font-mono text-xs"
            style={{ background: 'rgba(6,14,22,0.8)', border: '1px solid #1b263b', color: '#94a3b8' }}
        >
            {children}
        </span>
    )
}

function PreBlock({ text }) {
    if (!text) return <span style={{ color: '#2d4a5a' }}>—</span>
    return (
        <pre
            className="whitespace-pre-wrap break-words text-xs font-mono leading-relaxed max-h-48 overflow-y-auto rounded-xl px-3 py-2.5"
            style={{
                background: 'rgba(6,14,22,0.8)',
                border: '1px solid #1b263b',
                color: '#94a3b8',
            }}
        >
            {text}
        </pre>
    )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(4,10,18,0.82)', backdropFilter: 'blur(6px)' }}
        >
            <div
                className="w-full max-w-2xl rounded-2xl overflow-hidden"
                style={{
                    background: 'rgba(8,16,26,0.98)',
                    border: '1px solid #1b263b',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                }}
            >
                {/* Accent bar skeleton */}
                <div className="h-0.5 w-full animate-pulse" style={{ background: 'rgba(27,38,59,0.8)' }} />

                <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #1b263b' }}>
                    <div className="h-2.5 w-24 rounded animate-pulse mb-3" style={{ background: 'rgba(27,38,59,0.7)' }} />
                    <div className="h-5 w-2/3 rounded-lg animate-pulse mb-3" style={{ background: 'rgba(27,38,59,0.7)' }} />
                    <div className="flex gap-2">
                        <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: 'rgba(27,38,59,0.7)' }} />
                        <div className="h-5 w-20 rounded-full animate-pulse" style={{ background: 'rgba(27,38,59,0.7)' }} />
                    </div>
                </div>

                <div className="px-6 py-5 space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex gap-4 py-2.5" style={{ borderBottom: '1px solid rgba(27,38,59,0.4)' }}>
                            <div className="h-3 w-24 rounded animate-pulse shrink-0" style={{ background: 'rgba(27,38,59,0.7)' }} />
                            <div
                                className="h-3 rounded animate-pulse flex-1"
                                style={{ background: 'rgba(27,38,59,0.5)', maxWidth: `${45 + (i % 4) * 12}%` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

function DetailIncident({ selectedIncident, detailLoading, onClose }) {

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    if (detailLoading) return <DetailSkeleton />
    if (!selectedIncident) return null

    const sevNum    = selectedIncident.severity ?? 0
    const sevLabel  = SEVERITY_LABELS[sevNum] ?? String(sevNum)
    const accent    = SEVERITY_ACCENT[sevNum]  ?? SEVERITY_ACCENT[0]
    const statusKey = selectedIncident.status?.toLowerCase() ?? 'open'
    const statusCfg = STATUS_CONFIG[statusKey]
    const sourceCfg = SOURCE_CONFIG[selectedIncident.source]

    const statusLabel = selectedIncident.status
        ? selectedIncident.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
        : '—'

    return (
        <>
            <style>{`
                @keyframes detail-backdrop-in { from { opacity:0; } to { opacity:1; } }
                @keyframes detail-modal-in    { from { opacity:0; transform:scale(0.97) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
                .detail-backdrop { animation: detail-backdrop-in 0.2s ease-out both; }
                .detail-modal    { animation: detail-modal-in    0.25s cubic-bezier(0.16,1,0.3,1) both; }
                .detail-row:last-child { border-bottom: none !important; }
            `}</style>

            {/* ── Backdrop ── */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* ── Modal panel ── */}
                <div
                    className="detail-modal relative w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(8,16,26,0.98)',
                        border: '1px solid #1b263b',
                        boxShadow: `0 0 0 1px ${accent.bar}18, 0 32px 80px rgba(0,0,0,0.7)`,
                        maxHeight: '90vh',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Dynamic severity accent bar */}
                    <div
                        className="shrink-0 h-0.5 w-full"
                        style={{
                            background: `linear-gradient(90deg, transparent 0%, ${accent.bar}80 20%, ${accent.bar} 50%, ${accent.bar}80 80%, transparent 100%)`,
                        }}
                    />

                    {/* ── Header ── */}
                    <div
                        className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 shrink-0"
                        style={{ borderBottom: '1px solid #1b263b' }}
                    >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Severity icon */}
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
                                style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
                            >
                                <Siren size={15} style={{ color: accent.color }} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-3 w-0.5 rounded-full" style={{ background: '#02c39a' }} />
                                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#4a7a8a' }}>
                                        Incident Details
                                    </p>
                                </div>
                                <h3
                                    className="text-sm font-semibold leading-snug"
                                    style={{ color: '#f1f5f9' }}
                                    title={selectedIncident.title}
                                >
                                    {selectedIncident.title}
                                </h3>

                                {/* Badges row */}
                                <div className="flex flex-wrap gap-2 mt-2.5">
                                    {/* Severity */}
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                        style={{ background: accent.bg, color: accent.color, border: `1px solid ${accent.border}` }}
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent.dot }} />
                                        {sevLabel}
                                    </span>

                                    {/* Status */}
                                    {statusCfg && (
                                        <span
                                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                            style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}
                                        >
                                            {statusLabel}
                                        </span>
                                    )}

                                    {/* Source */}
                                    {selectedIncident.source && (
                                        <span
                                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                            style={{
                                                background: sourceCfg?.bg     ?? 'rgba(100,116,139,0.08)',
                                                color:      sourceCfg?.color  ?? '#94a3b8',
                                                border:     `1px solid ${sourceCfg?.border ?? 'rgba(100,116,139,0.2)'}`,
                                            }}
                                        >
                                            {selectedIncident.source}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            title="Close (Esc)"
                            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150"
                            style={{ background: 'rgba(27,38,59,0.4)', border: '1px solid #1b263b', color: '#4a7a8a' }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background  = 'rgba(239,68,68,0.1)'
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
                                e.currentTarget.style.color       = '#f87171'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background  = 'rgba(27,38,59,0.4)'
                                e.currentTarget.style.borderColor = '#1b263b'
                                e.currentTarget.style.color       = '#4a7a8a'
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* ── Scrollable body ── */}
                    <div className="overflow-y-auto flex-1 px-6 py-4">

                        {/* ── Identification ── */}
                        <SectionLabel>Identification</SectionLabel>
                        <div>
                            <Row label="Incident ID">
                                <MonoBadge>{selectedIncident._id}</MonoBadge>
                            </Row>
                            <Row label="Agent">
                                {selectedIncident.agent_name
                                    ? <MonoBadge>{selectedIncident.agent_name}</MonoBadge>
                                    : <span style={{ color: '#2d4a5a' }}>—</span>
                                }
                            </Row>
                            <Row label="Source">
                                <InlineBadge label={selectedIncident.source ?? '—'} cfg={sourceCfg} />
                            </Row>
                        </div>

                        {/* ── Rule ── */}
                        <SectionLabel>Rule</SectionLabel>
                        <div>
                            <Row label="Rule ID">
                                {selectedIncident.rule_id
                                    ? (
                                        <span
                                            className="inline-flex items-center rounded-lg px-2 py-0.5 font-mono text-xs"
                                            style={{ background: 'rgba(2,195,154,0.06)', border: '1px solid rgba(2,195,154,0.15)', color: '#02c39a' }}
                                        >
                                            #{selectedIncident.rule_id}
                                        </span>
                                    )
                                    : <span style={{ color: '#2d4a5a' }}>—</span>
                                }
                            </Row>
                            <Row label="Rule Level">
                                {selectedIncident.rule_level != null
                                    ? (
                                        <span
                                            className="inline-flex items-center rounded-lg px-2 py-0.5 font-mono text-xs font-bold"
                                            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#fb923c' }}
                                        >
                                            {selectedIncident.rule_level}
                                        </span>
                                    )
                                    : <span style={{ color: '#2d4a5a' }}>—</span>
                                }
                            </Row>
                        </div>

                        {/* ── Timeline ── */}
                        <SectionLabel>Timeline</SectionLabel>
                        <div>
                            <Row label="Alert Timestamp">
                                <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                                    {fmt(selectedIncident.timestamp)}
                                </span>
                            </Row>
                            <Row label="Created At">
                                <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                                    {fmt(selectedIncident.createdAt)}
                                </span>
                            </Row>
                            <Row label="Last Updated">
                                <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                                    {fmt(selectedIncident.updatedAt)}
                                </span>
                            </Row>
                        </div>

                        {/* ── Description ── */}
                        <SectionLabel>Description</SectionLabel>
                        <div className="pb-2">
                            <PreBlock text={selectedIncident.description} />
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div
                        className="flex items-center justify-between px-6 py-3 shrink-0"
                        style={{ borderTop: '1px solid #1b263b', background: 'rgba(6,14,22,0.4)' }}
                    >
                        <span className="text-[10px]" style={{ color: '#2d4a5a' }}>

                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}

export default DetailIncident