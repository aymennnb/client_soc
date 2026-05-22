import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import {
    FolderOpen, CheckCircle2, AlertTriangle,
    ChevronRight, ChevronLeft, RefreshCcw, Loader2,
    AlertCircle, Rocket, Layout, Target,
} from 'lucide-react'

// ─── useTheme ─────────────────────────────────────────────────────────────────
// Identical to NessusSync

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
        const mq  = window.matchMedia('(prefers-color-scheme: light)')
        const mqh = (e) => { if (!document.documentElement.getAttribute('data-theme')) setIsDark(!e.matches) }
        mq.addEventListener('change', mqh)
        return () => { mo.disconnect(); mq.removeEventListener('change', mqh) }
    }, [])
    return isDark
}

// ─── Design tokens ────────────────────────────────────────────────────────────
// Identical to NessusSync

const tokens = (isDark) => {
    const d = isDark
    return {
        bgCard:           d ? 'rgba(13,27,42,0.7)'    : 'rgba(255,255,255,0.97)',
        bgSubtle:         d ? 'rgba(27,38,59,0.4)'    : 'rgba(241,245,249,0.8)',
        bgPanelHeader:    d ? 'rgba(6,14,22,0.6)'     : 'rgba(248,250,252,0.95)',
        bgPanelList:      d ? 'rgba(13,27,42,0.5)'    : 'rgba(249,250,251,0.8)',
        bgSkeleton:       d ? 'rgba(27,38,59,0.5)'    : 'rgba(203,213,225,0.5)',
        bgItemSelected:   d ? 'rgba(2,128,144,0.12)'  : 'rgba(2,128,144,0.09)',
        bgItemHover:      d ? 'rgba(27,38,59,0.6)'    : 'rgba(241,245,249,0.9)',
        bgCountBadge:     d ? 'rgba(27,38,59,0.8)'    : 'rgba(226,232,240,0.8)',
        bgSuccessBanner:  d ? 'rgba(2,195,154,0.06)'  : 'rgba(2,195,154,0.07)',
        bgErrorBanner:    d ? 'rgba(239,68,68,0.08)'  : 'rgba(220,38,38,0.06)',
        bgStatCard:       d ? 'rgba(13,27,42,0.6)'    : 'rgba(255,255,255,0.9)',
        bgMetaRow:        d ? 'rgba(13,27,42,0.5)'    : 'rgba(248,250,252,0.8)',
        bgInput:          d ? 'rgba(13,27,42,0.8)'    : 'rgba(255,255,255,0.95)',
        bgStepNode:       d ? '#0d1b2a'               : '#f1f5f9',
        bgStepDone:       '#02c39a',
        bgStepActive:     d ? 'rgba(2,128,144,0.2)'   : 'rgba(2,128,144,0.12)',

        border:           d ? '#1b263b'               : '#e2e8f0',
        borderSubtle:     d ? 'rgba(27,38,59,0.6)'    : 'rgba(226,232,240,0.8)',
        borderSelected:   d ? 'rgba(2,128,144,0.3)'   : 'rgba(2,128,144,0.35)',
        borderSuccess:    d ? 'rgba(2,195,154,0.2)'   : 'rgba(2,195,154,0.25)',
        borderError:      d ? 'rgba(239,68,68,0.2)'   : 'rgba(220,38,38,0.22)',
        borderStepNode:   d ? '#1b263b'               : '#cbd5e1',
        borderStepDone:   '#02c39a',
        borderStepActive: d ? '#028090'               : '#028090',
        borderInput:      d ? '#1b263b'               : '#e2e8f0',
        borderInputFocus: '#028090',

        textPrimary:      d ? '#f1f5f9' : '#0f172a',
        textSecondary:    d ? '#e2e8f0' : '#1e293b',
        textMuted:        d ? '#94a3b8' : '#475569',
        textFaint:        d ? '#4a7a8a' : '#64748b',
        textGhost:        d ? '#2d4a5a' : '#94a3b8',
        textAction:       d ? '#028090' : '#0369a1',
        textDanger:       d ? '#f87171' : '#dc2626',
        textStepDone:     '#02c39a',
        textStepActive:   '#028090',
        textStepInactive: d ? '#2d4a5a' : '#94a3b8',
        textStepNodeInactive: d ? '#1b263b' : '#94a3b8',
        textItemSelected: '#02c39a',
        textItemDefault:  d ? '#94a3b8' : '#475569',
        textCountSelected:d ? '#028090' : '#0369a1',
        textCountDefault: d ? '#2d4a5a' : '#94a3b8',
        textMetaLabel:    d ? '#4a7a8a' : '#64748b',
        textMetaValue:    d ? '#cbd5e1' : '#1e293b',
        textMetaIcon:     d ? '#2d4a5a' : '#94a3b8',
        textConnector:    d ? '#1b263b' : '#e2e8f0',
        textInput:        d ? '#f1f5f9' : '#0f172a',
    }
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
    { id: 1, label: 'Details',         icon: Target,       short: 'Details'  },
    { id: 2, label: 'Choose Template', icon: Layout,       short: 'Template' },
    { id: 3, label: 'Choose Folder',   icon: FolderOpen,   short: 'Folder'   },
    { id: 4, label: 'Done',            icon: CheckCircle2, short: 'Done'     },
]

// ─── Step Progress Bar ────────────────────────────────────────────────────────
// Pixel-identical to NessusSync

function StepBar({ current, tk }) {
    return (
        <div className="flex items-center w-full gap-0">
            {STEPS.map((step, idx) => {
                const done   = current > step.id
                const active = current === step.id
                const Icon   = step.icon
                const isLast = idx === STEPS.length - 1

                return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-2 min-w-0 flex-1">
                            {/* Node */}
                            <div
                                className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500"
                                style={{
                                    borderColor: done ? tk.borderStepDone : active ? tk.borderStepActive : tk.borderStepNode,
                                    background:  done ? tk.bgStepDone     : active ? tk.bgStepActive     : tk.bgStepNode,
                                    boxShadow:   active ? '0 0 0 4px rgba(2,128,144,0.15)' : 'none',
                                }}
                            >
                                {done ? (
                                    <CheckCircle2 size={15} strokeWidth={3} style={{ color: '#0d1b2a' }} />
                                ) : active ? (
                                    <Icon size={15} style={{ color: tk.textStepActive }} />
                                ) : (
                                    <span className="text-[11px] font-bold" style={{ color: tk.textStepNodeInactive }}>{step.id}</span>
                                )}
                                {active && (
                                    <span
                                        className="absolute inset-0 rounded-full border-2 animate-ping opacity-30"
                                        style={{ borderColor: tk.borderStepActive }}
                                    />
                                )}
                            </div>
                            {/* Label */}
                            <span
                                className="text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 text-center"
                                style={{ color: done ? tk.textStepDone : active ? tk.textStepActive : tk.textStepInactive }}
                            >
                                {step.short}
                            </span>
                        </div>

                        {/* Connector */}
                        {!isLast && (
                            <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden" style={{ background: tk.textConnector }}>
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

// ─── Step 1 — Details (scan name + targets) ───────────────────────────────────

function Step1({ scanName, onChangeName, targets, onChangeTargets, tk }) {
    const baseInput = {
        background:   tk.bgInput,
        border:       `1px solid ${tk.borderInput}`,
        color:        tk.textInput,
        borderRadius: '0.5rem',
        padding:      '0.5rem 0.75rem',
        fontSize:     '0.75rem',
        width:        '100%',
        outline:      'none',
        transition:   'border-color 0.15s',
    }
    const onFocus = (e) => { e.target.style.borderColor = tk.borderInputFocus }
    const onBlur  = (e) => { e.target.style.borderColor = tk.borderInput }

    const targetList = targets.split(/[\n,]+/).map(t => t.trim()).filter(Boolean)

    return (
        <div className="space-y-4" style={{ animation: 'fadein 0.3s ease-out both' }}>
            <div>
                <h3 className="text-sm font-semibold" style={{ color: tk.textPrimary }}>Scan details</h3>
                <p className="mt-0.5 text-xs" style={{ color: tk.textFaint }}>Define a name and the targets to scan.</p>
            </div>

            {/* Scan name */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: tk.textPrimary }}>Scan name</label>
                <input
                    type="text"
                    placeholder="e.g. Weekly perimeter scan"
                    value={scanName}
                    onChange={e => onChangeName(e.target.value)}
                    style={baseInput}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            </div>

            {/* Targets */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: tk.textPrimary }}>Targets</label>
                <p className="text-[10px]" style={{ color: tk.textFaint }}>
                    One per line or comma-separated — IPs, CIDR ranges, or hostnames.
                </p>
                <textarea
                    value={targets}
                    onChange={e => onChangeTargets(e.target.value)}
                    placeholder={'192.168.1.0/24\n10.0.0.1\nserver.company.com'}
                    spellCheck={false}
                    style={{
                        ...baseInput,
                        resize:     'vertical',
                        minHeight:  '120px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        lineHeight: '1.6',
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            </div>

            {/* Live target preview */}
            {targetList.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tk.border}` }}>
                    <div className="flex items-center gap-2 px-4 py-3"
                        style={{ background: tk.bgPanelHeader, borderBottom: `1px solid ${tk.border}` }}>
                        <Target size={13} style={{ color: tk.textAction }} />
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textFaint }}>Preview</span>
                        <span className="ml-auto text-[10px]" style={{ color: tk.textGhost }}>
                            {targetList.length} target{targetList.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-1" style={{ maxHeight: '130px', background: tk.bgPanelList }}>
                        {targetList.map((t, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                                style={{ background: tk.bgItemSelected, border: `1px solid ${tk.borderSelected}` }}
                            >
                                <Target size={11} style={{ color: tk.textAction, flexShrink: 0 }} />
                                <span className="text-[11px] font-mono truncate" style={{ color: tk.textItemSelected }}>{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Banner when valid */}
            {scanName.trim() && targetList.length > 0 && (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: tk.bgSuccessBanner, border: `1px solid ${tk.borderSuccess}` }}>
                    <CheckCircle2 size={14} style={{ color: '#02c39a', flexShrink: 0 }} />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#02c39a' }}>{scanName}</p>
                        <p className="text-[10px]" style={{ color: tk.textAction }}>
                            {targetList.length} target{targetList.length !== 1 ? 's' : ''} defined
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Step 2 — Choose Template ─────────────────────────────────────────────────

function Step2({ templates, loading, error, selectedTemplate, onSelectTemplate, tk }) {
    return (
        <div className="space-y-4" style={{ animation: 'fadein 0.3s ease-out both' }}>
            <div>
                <h3 className="text-sm font-semibold" style={{ color: tk.textPrimary }}>Choose a scan template</h3>
                <p className="mt-0.5 text-xs" style={{ color: tk.textFaint }}>Select the policy that defines what Nessus will check.</p>
            </div>

            {error && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3"
                    style={{ background: tk.bgErrorBanner, border: `1px solid ${tk.borderError}` }}>
                    <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: tk.textDanger }} />
                    <p className="text-xs" style={{ color: tk.textDanger }}>{error}</p>
                </div>
            )}

            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tk.border}` }}>
                {/* Panel header */}
                <div className="flex items-center gap-2 px-4 py-3"
                    style={{ background: tk.bgPanelHeader, borderBottom: `1px solid ${tk.border}` }}>
                    <Layout size={13} style={{ color: tk.textAction }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textFaint }}>Templates</span>
                    {!loading && (
                        <span className="ml-auto text-[10px]" style={{ color: tk.textGhost }}>
                            {templates.length} template{templates.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Template list */}
                <div className="overflow-y-auto p-2 space-y-1" style={{ maxHeight: '320px', background: tk.bgPanelList }}>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: tk.bgSkeleton }} />
                        ))
                    ) : templates.length === 0 ? (
                        <div className="flex h-24 items-center justify-center text-xs" style={{ color: tk.textGhost }}>
                            No templates found in Nessus
                        </div>
                    ) : (
                        templates.map(tpl => {
                            const isSelected = selectedTemplate?.uuid === tpl.uuid
                            return (
                                <button
                                    key={tpl.uuid}
                                    onClick={() => onSelectTemplate(tpl)}
                                    className="w-full rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                                    style={{
                                        background: isSelected ? tk.bgItemSelected : 'transparent',
                                        border:     isSelected ? `1px solid ${tk.borderSelected}` : '1px solid transparent',
                                        color:      isSelected ? tk.textItemSelected : tk.textItemDefault,
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = tk.bgItemHover
                                            e.currentTarget.style.color      = tk.textSecondary
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = 'transparent'
                                            e.currentTarget.style.color      = tk.textItemDefault
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        <Layout size={12} style={{ color: isSelected ? tk.textAction : tk.textFaint, flexShrink: 0, marginTop: 1 }} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium truncate">{tpl.title || tpl.name}</p>
                                            {tpl.desc && (
                                                <p className="text-[10px] truncate mt-0.5" style={{ color: isSelected ? tk.textAction : tk.textGhost }}>
                                                    {tpl.desc}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {selectedTemplate && (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: tk.bgSuccessBanner, border: `1px solid ${tk.borderSuccess}` }}>
                    <CheckCircle2 size={14} style={{ color: '#02c39a', flexShrink: 0 }} />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#02c39a' }}>{selectedTemplate.title || selectedTemplate.name}</p>
                        <p className="text-[10px]" style={{ color: tk.textAction }}>Template selected</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Step 3 — Choose Folder ───────────────────────────────────────────────────

function Step3({ folders, loading, error, selectedFolder, onSelectFolder, tk }) {
    return (
        <div className="space-y-4" style={{ animation: 'fadein 0.3s ease-out both' }}>
            <div>
                <h3 className="text-sm font-semibold" style={{ color: tk.textPrimary }}>Choose a destination folder</h3>
                <p className="mt-0.5 text-xs" style={{ color: tk.textFaint }}>
                    Optional — where the scan will appear in Nessus.
                </p>
            </div>

            {error && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3"
                    style={{ background: tk.bgErrorBanner, border: `1px solid ${tk.borderError}` }}>
                    <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: tk.textDanger }} />
                    <p className="text-xs" style={{ color: tk.textDanger }}>{error}</p>
                </div>
            )}

            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tk.border}` }}>
                {/* Panel header */}
                <div className="flex items-center gap-2 px-4 py-3"
                    style={{ background: tk.bgPanelHeader, borderBottom: `1px solid ${tk.border}` }}>
                    <FolderOpen size={13} style={{ color: tk.textAction }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tk.textFaint }}>Folders</span>
                    {!loading && (
                        <span className="ml-auto text-[10px]" style={{ color: tk.textGhost }}>
                            {folders.length} folder{folders.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Folder list */}
                <div className="overflow-y-auto p-2 space-y-1" style={{ maxHeight: '280px', background: tk.bgPanelList }}>
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: tk.bgSkeleton }} />
                        ))
                    ) : folders.length === 0 ? (
                        <div className="flex h-24 items-center justify-center text-xs" style={{ color: tk.textGhost }}>
                            No folders found in Nessus
                        </div>
                    ) : (
                        folders.map(folder => {
                            const isSelected = selectedFolder?.id === folder.id
                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => onSelectFolder(isSelected ? null : folder)}
                                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                                    style={{
                                        background: isSelected ? tk.bgItemSelected : 'transparent',
                                        border:     isSelected ? `1px solid ${tk.borderSelected}` : '1px solid transparent',
                                        color:      isSelected ? tk.textItemSelected : tk.textItemDefault,
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = tk.bgItemHover
                                            e.currentTarget.style.color      = tk.textSecondary
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = 'transparent'
                                            e.currentTarget.style.color      = tk.textItemDefault
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <FolderOpen size={13} style={{ color: isSelected ? tk.textAction : tk.textFaint, flexShrink: 0 }} />
                                        <span className="text-xs font-medium truncate">{folder.name}</span>
                                    </div>
                                    <span
                                        className="shrink-0 ml-2 text-[10px] rounded-full px-2 py-0.5"
                                        style={{
                                            background: isSelected ? 'rgba(2,128,144,0.2)' : tk.bgCountBadge,
                                            color:      isSelected ? tk.textCountSelected  : tk.textCountDefault,
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

            {/* Skip hint */}
            {!selectedFolder && (
                <p className="text-[10px] text-center" style={{ color: tk.textGhost }}>
                    No folder selected — scan will be placed in the default Nessus folder.
                </p>
            )}

            {selectedFolder && (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: tk.bgSuccessBanner, border: `1px solid ${tk.borderSuccess}` }}>
                    <CheckCircle2 size={14} style={{ color: '#02c39a', flexShrink: 0 }} />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#02c39a' }}>{selectedFolder.name}</p>
                        <p className="text-[10px]" style={{ color: tk.textAction }}>Destination folder selected</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Step 4 — Result ──────────────────────────────────────────────────────────

function Step4({ result, scanName, tk }) {
    if (!result) return null

    if (result.error) {
        return (
            <div className="space-y-5" style={{ animation: 'fadein 0.3s ease-out both' }}>
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)' }}>
                        <AlertTriangle size={28} style={{ color: tk.textDanger }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ color: tk.textPrimary }}>Launch failed</h3>
                        <p className="mt-1 text-xs max-w-xs mx-auto" style={{ color: tk.textDanger }}>{result.error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5" style={{ animation: 'fadein 0.3s ease-out both' }}>
            {/* Hero */}
            <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: 'rgba(2,195,154,0.1)', border: '2px solid rgba(2,195,154,0.3)' }}>
                    <Rocket size={28} style={{ color: '#02c39a' }} />
                    <span className="absolute inset-0 rounded-full border-2 animate-ping opacity-20"
                        style={{ borderColor: '#02c39a' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold" style={{ color: tk.textPrimary }}>Scan launched</h3>
                    <p className="mt-0.5 text-xs" style={{ color: tk.textFaint }}>
                        The scan is now running in Nessus.
                    </p>
                </div>
            </div>

            {/* Meta rows */}
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tk.border}` }}>
                {[
                    { icon: Target, label: 'Scan name', value: result.name  || scanName || '—' },
                    { icon: Rocket, label: 'Scan ID',   value: result.scan_id ? String(result.scan_id) : '—' },
                    { icon: CheckCircle2, label: 'Status', value: result.status || 'running', accent: '#02c39a' },
                ].map((row, i, arr) => {
                    const Icon = row.icon
                    return (
                        <div
                            key={row.label}
                            className="flex items-center gap-3 px-4 py-2.5"
                            style={{
                                background:   tk.bgMetaRow,
                                borderBottom: i < arr.length - 1 ? `1px solid ${tk.border}` : 'none',
                            }}
                        >
                            <Icon size={12} style={{ color: tk.textMetaIcon, flexShrink: 0 }} />
                            <span className="text-[11px] w-24 shrink-0" style={{ color: tk.textMetaLabel }}>{row.label}</span>
                            <span className="text-[11px] font-medium truncate" style={{ color: row.accent || tk.textMetaValue }}>
                                {row.value}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Running pulse */}
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: tk.bgSuccessBanner, border: `1px solid ${tk.borderSuccess}` }}>
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: '#02c39a' }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#02c39a' }} />
                </span>
                <p className="text-xs font-medium" style={{ color: '#02c39a' }}>
                    Scan is running — check Nessus for live progress
                </p>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LaunchScan() {
    const navigate = useNavigate()
    const onClose  = useCallback(() => navigate('/vulnerabilities'), [navigate])

    const isDark = useTheme()
    const tk     = useMemo(() => tokens(isDark), [isDark])

    const [step, setStep] = useState(1)

    // Step 1
    const [scanName, setScanName] = useState('')
    const [targets,  setTargets]  = useState('')

    // Step 2 — templates
    const [templates,        setTemplates]        = useState([])
    const [loadingTemplates, setLoadingTemplates] = useState(true)
    const [templateError,    setTemplateError]    = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState(null)

    // Step 3 — folders
    const [folders,        setFolders]        = useState([])
    const [loadingFolders, setLoadingFolders] = useState(true)
    const [folderError,    setFolderError]    = useState('')
    const [selectedFolder, setSelectedFolder] = useState(null)

    // Step 4 — launch result
    const [launching,    setLaunching]    = useState(false)
    const [launchResult, setLaunchResult] = useState(null)

    // ESC to close
    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [onClose])

    // Load templates once on mount
    useEffect(() => {
        const load = async () => {
            setLoadingTemplates(true)
            setTemplateError('')
            try {
                const res = await api.get('/nessus/templates')
                setTemplates(res.data.templates || [])
            } catch (err) {
                setTemplateError(err.response?.data?.message || 'Failed to load scan templates.')
            } finally {
                setLoadingTemplates(false)
            }
        }
        load()
    }, [])

    // Load folders once on mount (same endpoint as NessusSync)
    useEffect(() => {
        const load = async () => {
            setLoadingFolders(true)
            setFolderError('')
            try {
                const res = await api.get('/scans')
                setFolders((res.data.folders || []).filter(f => f.type !== 'trash'))
            } catch (err) {
                setFolderError(err.response?.data?.message || 'Failed to load scan folders.')
            } finally {
                setLoadingFolders(false)
            }
        }
        load()
    }, [])

    // Launch — called when user clicks "Launch Scan" on step 3
    const runLaunch = useCallback(async () => {
        if (!selectedTemplate) return
        setLaunching(true)
        try {
            // Targets are sent as-is (comma-separated string).
            // The backend / nessusService.createScan() handles normalization.
            const targetsCsv = targets
                .split(/[\n,]+/)
                .map(t => t.trim())
                .filter(Boolean)
                .join(', ')

            const payload = {
                name:         scanName.trim(),
                targets:      targetsCsv,
                templateUuid: selectedTemplate.uuid,
            }
            // Only include folderId when the user actually selected one
            if (selectedFolder?.id != null) {
                payload.folderId = selectedFolder.id
            }

            const res = await api.post('/vulnerabilities/nessus/launch-scan', payload)
            setLaunchResult({ ...res.data })
            setStep(4)
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to launch scan.'
            setLaunchResult({ error: message })
            setStep(4)
        } finally {
            setLaunching(false)
        }
    }, [scanName, targets, selectedTemplate, selectedFolder])

    const handleNewLaunch = () => {
        setStep(1)
        setScanName('')
        setTargets('')
        setSelectedTemplate(null)
        setSelectedFolder(null)
        setLaunchResult(null)
    }

    // Parsed target list (used for step-1 validation)
    const targetList = targets.split(/[\n,]+/).map(t => t.trim()).filter(Boolean)

    const canNext = () => {
        if (step === 1) return scanName.trim().length > 0 && targetList.length > 0
        if (step === 2) return !!selectedTemplate
        if (step === 3) return !launching   // folder is optional — always can proceed
        return false
    }

    const handleNext = () => {
        if (step === 1) setStep(2)
        else if (step === 2) setStep(3)
        else if (step === 3) runLaunch()    // step 3 → launch → step 4
    }

    const handleBack = () => {
        if (step === 2) setStep(1)
        else if (step === 3) setStep(2)
    }

    // ── Footer actions — identical structure to NessusSync ──
    const renderActions = () => {
        if (step === 4) {
            return (
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={handleNewLaunch}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150"
                        style={{ background: 'transparent', border: `1px solid ${tk.border}`, color: tk.textFaint }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = tk.textAction; e.currentTarget.style.color = tk.textAction }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border;     e.currentTarget.style.color = tk.textFaint }}
                    >
                        <RefreshCcw size={12} /> New Scan
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
                        disabled={launching}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 disabled:opacity-40"
                        style={{ background: 'transparent', border: `1px solid ${tk.border}`, color: tk.textFaint }}
                        onMouseEnter={e => { if (!launching) { e.currentTarget.style.borderColor = tk.textAction; e.currentTarget.style.color = tk.textAction } }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textFaint }}
                    >
                        <ChevronLeft size={13} /> Back
                    </button>
                ) : (
                    <button
                        onClick={onClose}
                        className="rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150"
                        style={{ background: 'transparent', border: `1px solid ${tk.border}`, color: tk.textFaint }}
                        onMouseEnter={e => { e.currentTarget.style.color = tk.textMuted }}
                        onMouseLeave={e => { e.currentTarget.style.color = tk.textFaint }}
                    >
                        Cancel
                    </button>
                )}

                {/* Right */}
                <button
                    onClick={handleNext}
                    disabled={!canNext() || launching}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: canNext() && !launching ? '#02c39a' : 'rgba(2,195,154,0.3)', color: '#0d1b2a' }}
                    onMouseEnter={e => { if (canNext() && !launching) e.currentTarget.style.background = '#03d9ab' }}
                    onMouseLeave={e => { e.currentTarget.style.background = canNext() && !launching ? '#02c39a' : 'rgba(2,195,154,0.3)' }}
                >
                    {launching ? (
                        <><Loader2 size={12} className="animate-spin" /> Launching…</>
                    ) : step === 3 ? (
                        <><Rocket size={12} /> Launch Scan</>
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
                .launch-panel-in { animation: fadein 0.35s ease-out both; }
            `}</style>

            <div className="w-full">
                <div className="launch-panel-in w-full overflow-hidden">

                    {/* ── Header ── */}
                    <div
                        className="flex items-start justify-between gap-6 px-6 py-4"
                        style={{ borderBottom: `1px solid ${tk.border}` }}
                    >
                        <div>
                            <h2 className="text-sm font-semibold" style={{ color: tk.textPrimary }}>Launch Nessus Scan</h2>
                            <p className="text-[10px]" style={{ color: tk.textFaint }}>
                                Step {step} of {STEPS.length}
                            </p>
                        </div>
                    </div>

                    {/* ── Step bar ── */}
                    <div className="px-6 py-4" style={{ borderBottom: `1px solid ${tk.border}` }}>
                        <StepBar current={step} tk={tk} />
                    </div>

                    {/* ── Step content ── */}
                    <div className="px-6 py-5" style={{ minHeight: '320px' }}>
                        {step === 1 && (
                            <Step1
                                scanName={scanName}
                                onChangeName={setScanName}
                                targets={targets}
                                onChangeTargets={setTargets}
                                tk={tk}
                            />
                        )}
                        {step === 2 && (
                            <Step2
                                templates={templates}
                                loading={loadingTemplates}
                                error={templateError}
                                selectedTemplate={selectedTemplate}
                                onSelectTemplate={setSelectedTemplate}
                                tk={tk}
                            />
                        )}
                        {step === 3 && (
                            <Step3
                                folders={folders}
                                loading={loadingFolders}
                                error={folderError}
                                selectedFolder={selectedFolder}
                                onSelectFolder={setSelectedFolder}
                                tk={tk}
                            />
                        )}
                        {step === 4 && (
                            <Step4
                                result={launchResult}
                                scanName={scanName}
                                tk={tk}
                            />
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-6 py-4" style={{ borderTop: `1px solid ${tk.border}` }}>
                        {renderActions()}
                    </div>

                </div>
            </div>
        </>
    )
}