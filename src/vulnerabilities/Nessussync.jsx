import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import {
    X, FolderOpen, CheckCircle2, AlertTriangle,
    ChevronRight, ChevronLeft, RefreshCcw, Loader2,
    FileSearch, Server, AlertCircle, Download,
    SkipForward, ShieldCheck, Clock,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
    { id: 1, label: 'Select Folder', icon: FolderOpen,   short: 'Folder' },
    { id: 2, label: 'Select Scan',   icon: FileSearch,   short: 'Scan'   },
    { id: 3, label: 'Results',       icon: CheckCircle2, short: 'Done'   },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (ts) => {
    if (!ts) return '—'
    try { return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return '—' }
}

const fmtDateTime = (ts) => {
    if (!ts) return '—'
    try { return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return '—' }
}

// ─── Step Progress Bar ────────────────────────────────────────────────────────

function StepBar({ current }) {
    return (
        <div className="flex items-center w-full gap-0">
            {STEPS.map((step, idx) => {
                const done    = current > step.id
                const active  = current === step.id
                const Icon    = step.icon
                const isLast  = idx === STEPS.length - 1

                return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-2 min-w-[120px]">
                            {/* Node */}
                            <div
                                className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500"
                                style={{
                                    borderColor: done ? '#02c39a' : active ? '#028090' : '#1b263b',
                                    background:  done ? '#02c39a' : active ? 'rgba(2,128,144,0.2)' : '#0d1b2a',
                                    boxShadow:   active ? '0 0 0 4px rgba(2,128,144,0.15)' : 'none',
                                }}
                            >
                                {done ? (
                                    <CheckCircle2 size={15} strokeWidth={3} style={{ color: '#0d1b2a' }} />
                                ) : active ? (
                                    <Icon size={15} style={{ color: '#028090' }} />
                                ) : (
                                    <span className="text-[11px] font-bold" style={{ color: '#1b263b' }}>{step.id}</span>
                                )}
                                {active && (
                                    <span
                                        className="absolute inset-0 rounded-full border-2 animate-ping opacity-30"
                                        style={{ borderColor: '#028090' }}
                                    />
                                )}
                            </div>
                            {/* Label */}
                            <span
                                className="text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300"
                                style={{ color: done ? '#02c39a' : active ? '#028090' : '#2d4a5a' }}
                            >
                                {step.short}
                            </span>
                        </div>

                        {/* Connector */}
                        {!isLast && (
                            <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden" style={{ background: '#1b263b' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{ width: current > step.id ? '100%' : '0%', background: '#02c39a' }}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ─── Step 1 — Select Folder ───────────────────────────────────────────────────

function Step1({ folders, loading, error, selectedFolder, onSelectFolder }) {
    return (
        <div className="space-y-4" style={{ animation: 'fadein 0.3s ease-out both' }}>
            <div>
                <h3 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Select a Nessus folder</h3>
                <p className="mt-0.5 text-xs" style={{ color: '#4a7a8a' }}>Choose the folder containing your scan files.</p>
            </div>

            {error && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                    <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
                </div>
            )}

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1b263b' }}>
                {/* Panel header */}
                <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(6,14,22,0.6)', borderBottom: '1px solid #1b263b' }}>
                    <FolderOpen size={13} style={{ color: '#028090' }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#4a7a8a' }}>Folders</span>
                    {!loading && (
                        <span className="ml-auto text-[10px]" style={{ color: '#2d4a5a' }}>
                            {folders.length} folder{folders.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Folder list */}
                <div className="overflow-y-auto p-2 space-y-1" style={{ maxHeight: '260px', background: 'rgba(13,27,42,0.5)' }}>
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(27,38,59,0.5)' }} />
                        ))
                    ) : folders.length === 0 ? (
                        <div className="flex h-24 items-center justify-center text-xs" style={{ color: '#2d4a5a' }}>
                            No folders found in Nessus
                        </div>
                    ) : (
                        folders.map(folder => {
                            const isSelected = selectedFolder?.id === folder.id
                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => onSelectFolder(folder)}
                                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                                    style={{
                                        background: isSelected ? 'rgba(2,128,144,0.12)' : 'transparent',
                                        border: isSelected ? '1px solid rgba(2,128,144,0.3)' : '1px solid transparent',
                                        color: isSelected ? '#02c39a' : '#94a3b8',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = 'rgba(27,38,59,0.6)'
                                            e.currentTarget.style.color = '#cbd5e1'
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = 'transparent'
                                            e.currentTarget.style.color = '#94a3b8'
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <FolderOpen size={13} style={{ color: isSelected ? '#028090' : '#4a7a8a', flexShrink: 0 }} />
                                        <span className="text-xs font-medium truncate">{folder.name}</span>
                                    </div>
                                    <span
                                        className="shrink-0 ml-2 text-[10px] rounded-full px-2 py-0.5"
                                        style={{
                                            background: isSelected ? 'rgba(2,128,144,0.2)' : 'rgba(27,38,59,0.8)',
                                            color: isSelected ? '#028090' : '#2d4a5a',
                                        }}
                                    >
                                        {folder.scans?.length ?? 0}
                                    </span>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {selectedFolder && (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(2,195,154,0.06)', border: '1px solid rgba(2,195,154,0.2)' }}>
                    <CheckCircle2 size={14} style={{ color: '#02c39a', flexShrink: 0 }} />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#02c39a' }}>{selectedFolder.name}</p>
                        <p className="text-[10px]" style={{ color: '#028090' }}>
                            {selectedFolder.scans?.length ?? 0} scan{(selectedFolder.scans?.length ?? 0) !== 1 ? 's' : ''} available
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Step 2 — Select Scan ─────────────────────────────────────────────────────

function Step2({ selectedFolder, selectedScan, onSelectScan, syncing, syncError, onSync }) {
    const scans = selectedFolder?.scans ?? []

    return (
        <div className="space-y-4" style={{ animation: 'fadein 0.3s ease-out both' }}>
            <div>
                <h3 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Select a scan</h3>
                <p className="mt-0.5 text-xs" style={{ color: '#4a7a8a' }}>
                    Choose a completed scan from <span style={{ color: '#028090' }}>{selectedFolder?.name}</span> to import.
                </p>
            </div>

            {syncError && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                    <p className="text-xs" style={{ color: '#f87171' }}>{syncError}</p>
                </div>
            )}

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1b263b' }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(6,14,22,0.6)', borderBottom: '1px solid #1b263b' }}>
                    <Server size={13} style={{ color: '#028090' }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#4a7a8a' }}>Scans</span>
                    <span className="ml-auto text-[10px]" style={{ color: '#2d4a5a' }}>
                        {scans.length} scan{scans.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="overflow-y-auto p-2 space-y-1" style={{ maxHeight: '280px', background: 'rgba(13,27,42,0.5)' }}>
                    {scans.length === 0 ? (
                        <div className="flex h-24 items-center justify-center text-xs" style={{ color: '#2d4a5a' }}>
                            No scans in this folder
                        </div>
                    ) : (
                        scans.map(scan => {
                            const isSelected = selectedScan?.id === scan.id
                            const isRunning  = scan.status === 'running'
                            return (
                                <button
                                    key={scan.id}
                                    onClick={() => !isRunning && onSelectScan(scan)}
                                    disabled={isRunning}
                                    className="w-full rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                                    style={{
                                        background: isSelected ? 'rgba(2,128,144,0.12)' : 'transparent',
                                        border: isSelected ? '1px solid rgba(2,128,144,0.3)' : '1px solid transparent',
                                        opacity: isRunning ? 0.5 : 1,
                                        cursor: isRunning ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected && !isRunning) e.currentTarget.style.background = 'rgba(27,38,59,0.6)'
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(2,128,144,0.12)' : 'transparent'
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium truncate" style={{ color: isSelected ? '#02c39a' : '#e2e8f0' }}>
                                            {scan.name}
                                        </span>
                                        <span
                                            className="shrink-0 text-[10px] rounded-full px-2 py-0.5 font-semibold"
                                            style={{
                                                background: isRunning ? 'rgba(245,158,11,0.15)' : 'rgba(2,195,154,0.1)',
                                                color: isRunning ? '#fbbf24' : '#02c39a',
                                            }}
                                        >
                                            {scan.status}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[10px]" style={{ color: '#2d4a5a' }}>
                                        Modified {fmtDate(scan.last_modified)}
                                    </p>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {selectedScan && (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(2,195,154,0.06)', border: '1px solid rgba(2,195,154,0.2)' }}>
                    <CheckCircle2 size={14} style={{ color: '#02c39a', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#02c39a' }}>{selectedScan.name}</p>
                        <p className="text-[10px]" style={{ color: '#028090' }}>ID: {selectedScan.id}</p>
                    </div>
                    {syncing && (
                        <Loader2 size={14} className="animate-spin shrink-0" style={{ color: '#028090' }} />
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Step 3 — Results ─────────────────────────────────────────────────────────

function Step3({ result, selectedScan, onNewSync, onClose }) {
    const isError = result?.error
    const stats   = result?.stats ?? {}

    if (isError) {
        return (
            <div className="space-y-5" style={{ animation: 'fadein 0.3s ease-out both' }}>
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)' }}>
                        <AlertTriangle size={28} style={{ color: '#f87171' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ color: '#f1f5f9' }}>Synchronization failed</h3>
                        <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{result.error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5" style={{ animation: 'fadein 0.3s ease-out both' }}>
            {/* Success hero */}
            <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(2,195,154,0.1)', border: '2px solid rgba(2,195,154,0.3)' }}>
                    <CheckCircle2 size={28} style={{ color: '#02c39a' }} />
                    <span className="absolute inset-0 rounded-full border-2 animate-ping opacity-20" style={{ borderColor: '#02c39a' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold" style={{ color: '#f1f5f9' }}>Synchronization complete</h3>
                    <p className="mt-0.5 text-xs" style={{ color: '#4a7a8a' }}>Vulnerability data imported successfully.</p>
                </div>
            </div>

            {/* Stats from real API */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                    { label: 'Inserted',  value: stats.inserted  ?? 0, icon: Download,    accent: '#02c39a' },
                    { label: 'Updated',   value: stats.updated   ?? 0, icon: RefreshCcw,  accent: '#38bdf8' },
                    { label: 'Resolved',  value: stats.resolved  ?? 0, icon: ShieldCheck, accent: '#94a3b8' },
                    { label: 'Skipped',   value: stats.skipped   ?? 0, icon: SkipForward, accent: '#475569' },
                ].map(card => {
                    const Icon = card.icon
                    return (
                        <div
                            key={card.label}
                            className="rounded-xl p-3 flex flex-col gap-2"
                            style={{ background: 'rgba(13,27,42,0.6)', border: '1px solid #1b263b' }}
                        >
                            <Icon size={13} style={{ color: card.accent }} />
                            <p className="text-xl font-bold tabular-nums" style={{ color: '#f1f5f9' }}>{card.value}</p>
                            <p className="text-[10px]" style={{ color: '#2d4a5a' }}>{card.label}</p>
                        </div>
                    )
                })}
            </div>

            {/* Meta */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1b263b' }}>
                {[
                    { icon: Server, label: 'Scan',         value: selectedScan?.name ?? '—' },
                    { icon: Clock,  label: 'Completed at', value: fmtDateTime(result?.timestamp) },
                ].map((row, i) => {
                    const Icon = row.icon
                    return (
                        <div
                            key={row.label}
                            className="flex items-center gap-3 px-4 py-2.5"
                            style={{ background: 'rgba(13,27,42,0.5)', borderBottom: i === 0 ? '1px solid #1b263b' : 'none' }}
                        >
                            <Icon size={12} style={{ color: '#2d4a5a', flexShrink: 0 }} />
                            <span className="text-[11px] w-24 shrink-0" style={{ color: '#4a7a8a' }}>{row.label}</span>
                            <span className="text-[11px] font-medium truncate" style={{ color: '#cbd5e1' }}>{row.value}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NessusSync() {
    const navigate = useNavigate()
    const onClose  = useCallback(() => navigate('/vulnerabilities'), [navigate])

    const [step, setStep] = useState(1)

    // Step 1 state
    const [folders,        setFolders]        = useState([])
    const [loadingFolders, setLoadingFolders] = useState(true)
    const [folderError,    setFolderError]    = useState('')
    const [selectedFolder, setSelectedFolder] = useState(null)

    // Step 2 state
    const [selectedScan, setSelectedScan] = useState(null)
    const [syncing,      setSyncing]      = useState(false)
    const [syncError,    setSyncError]    = useState('')

    // Step 3 result (real data from API only)
    const [syncResult, setSyncResult] = useState(null)

    // ESC to close
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    // Load folders from real API
    useEffect(() => {
        const fetch = async () => {
            setLoadingFolders(true)
            setFolderError('')
            try {
                const res = await api.get('/scans')
                setFolders(res.data.folders || [])
            } catch (err) {
                setFolderError(err.response?.data?.message || 'Failed to load scan folders.')
            } finally {
                setLoadingFolders(false)
            }
        }
        fetch()
    }, [])

    // Run the actual sync against the real API
    const runSync = useCallback(async () => {
        if (!selectedScan) return
        setSyncing(true)
        setSyncError('')
        try {
            const res = await api.post(`/vulnerabilities/sync/nessus/${selectedScan.id}`)
            setSyncResult({
                stats:     res.data.stats     ?? {},
                timestamp: new Date().toISOString(),
            })
            setStep(3)
        } catch (err) {
            const message = err.response?.data?.message || 'Synchronization failed.'
            setSyncError(message)
            setSyncResult({ error: message, timestamp: new Date().toISOString() })
            setStep(3)
        } finally {
            setSyncing(false)
        }
    }, [selectedScan])

    const handleNewSync = () => {
        setStep(1)
        setSelectedFolder(null)
        setSelectedScan(null)
        setSyncResult(null)
        setSyncError('')
    }

    // Step navigation logic
    const canNext = () => {
        if (step === 1) return !!selectedFolder
        if (step === 2) return !!selectedScan && !syncing
        return false
    }

    const handleNext = () => {
        if (step === 1) { setStep(2) }
        else if (step === 2) { runSync() }
    }

    const handleBack = () => {
        if (step === 2) { setStep(1); setSelectedScan(null); setSyncError('') }
    }

    // ── Actions footer ──
    const renderActions = () => {
        if (step === 3) {
            return (
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={handleNewSync}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150"
                        style={{ background: 'transparent', border: '1px solid #1b263b', color: '#4a7a8a' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#028090'; e.currentTarget.style.color = '#028090' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1b263b'; e.currentTarget.style.color = '#4a7a8a' }}
                    >
                        <RefreshCcw size={12} /> New Sync
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150"
                        style={{ background: '#02c39a', color: '#0d1b2a' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#03d9ab' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#02c39a' }}
                    >
                        <CheckCircle2 size={12} /> Done
                    </button>
                </div>
            )
        }

        return (
            <div className="flex items-center justify-between gap-3">
                {/* Left */}
                {step > 1 ? (
                    <button
                        onClick={handleBack}
                        disabled={syncing}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 disabled:opacity-40"
                        style={{ background: 'transparent', border: '1px solid #1b263b', color: '#4a7a8a' }}
                        onMouseEnter={e => { if (!syncing) { e.currentTarget.style.borderColor = '#028090'; e.currentTarget.style.color = '#028090' } }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1b263b'; e.currentTarget.style.color = '#4a7a8a' }}
                    >
                        <ChevronLeft size={13} /> Back
                    </button>
                ) : (
                    <button
                        onClick={onClose}
                        className="rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150"
                        style={{ background: 'transparent', border: '1px solid #1b263b', color: '#4a7a8a' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#4a7a8a' }}
                    >
                        Cancel
                    </button>
                )}

                {/* Right */}
                <button
                    onClick={handleNext}
                    disabled={!canNext() || syncing}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: canNext() && !syncing ? '#02c39a' : 'rgba(2,195,154,0.3)', color: '#0d1b2a' }}
                    onMouseEnter={e => { if (canNext() && !syncing) e.currentTarget.style.background = '#03d9ab' }}
                    onMouseLeave={e => { e.currentTarget.style.background = canNext() && !syncing ? '#02c39a' : 'rgba(2,195,154,0.3)' }}
                >
                    {syncing ? (
                        <><Loader2 size={12} className="animate-spin" /> Importing…</>
                    ) : step === 2 ? (
                        <>Import Scan <ChevronRight size={13} /></>
                    ) : (
                        <>Next <ChevronRight size={13} /></>
                    )}
                </button>
            </div>
        )
    }

    return (
        <>
            <style>{`
                @keyframes fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
                .sync-panel-in { animation: fadein 0.35s ease-out both; }
            `}</style>

            {/* ── Full-page centering within the authenticated layout ── */}
            <div className="w-full">
                <div
                    className="sync-panel-in w-full overflow-hidden"
                >
                    {/* ── Header ── */}
                    <div
                        className="flex items-start justify-between gap-6 px-6 py-4"
                        style={{ borderBottom: '1px solid #1b263b' }}
                    >
                        <div className="flex items-center gap-3">
                            <div>
                                <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Nessus Synchronization</h2>
                                <p className="text-[10px]" style={{ color: '#4a7a8a' }}>
                                    Step {step} of {STEPS.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Step bar ── */}
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid #1b263b' }}>
                        <StepBar current={step} />
                    </div>

                    {/* ── Step content ── */}
                    <div className="px-6 py-5" style={{ minHeight: '320px' }}>
                        {step === 1 && (
                            <Step1
                                folders={folders}
                                loading={loadingFolders}
                                error={folderError}
                                selectedFolder={selectedFolder}
                                onSelectFolder={f => { setSelectedFolder(f); setSelectedScan(null) }}
                            />
                        )}
                        {step === 2 && (
                            <Step2
                                selectedFolder={selectedFolder}
                                selectedScan={selectedScan}
                                onSelectScan={setSelectedScan}
                                syncing={syncing}
                                syncError={syncError}
                            />
                        )}
                        {step === 3 && (
                            <Step3
                                result={syncResult}
                                selectedScan={selectedScan}
                                onNewSync={handleNewSync}
                                onClose={onClose}
                            />
                        )}
                    </div>

                    {/* ── Footer actions ── */}
                    <div className="px-6 py-4" style={{ borderTop: '1px solid #1b263b' }}>
                        {renderActions()}
                    </div>
                </div>
            </div>
        </>
    )
}