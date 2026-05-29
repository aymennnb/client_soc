/**
 * DeleteModal.jsx
 *
 * Props:
 *   type     — 'incident' | 'vulnerability' | 'user' | 'ticket'
 *   name     — display name of the item being deleted
 *   onConfirm — called when user confirms deletion
 *   onCancel  — called when user cancels / clicks backdrop
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

// ─── useTheme ─────────────────────────────────────────────────────────────────
//
//  Reads data-theme attribute written by AuthenticatedLayout.
//  Identical hook used across Dashboard, Incidents, Vulnerabilities.
//
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
        bgPanel:       d
            ? 'linear-gradient(160deg, #0d1b2a 0%, #0a1520 100%)'
            : 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
        borderPanel:   d ? '#1b263b'                         : '#e2e8f0',
        shadowPanel:   d
            ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(27,38,59,0.6)'
            : '0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(226,232,240,0.8)',

        // Header / footer
        bgFooter:      d ? 'rgba(6,14,22,0.4)'               : 'rgba(248,250,252,0.9)',
        borderDivider: d ? '#1b263b'                         : '#e2e8f0',

        // Backdrop
        bgBackdrop:    d ? 'rgba(6,14,22,0.75)'              : 'rgba(15,23,42,0.45)',

        // Warning box
        bgWarn:        d ? 'rgba(239,68,68,0.05)'            : 'rgba(220,38,38,0.04)',
        borderWarn:    d ? 'rgba(239,68,68,0.15)'            : 'rgba(220,38,38,0.18)',

        // Icon box
        bgDangerIcon:  d ? 'rgba(239,68,68,0.1)'             : 'rgba(220,38,38,0.08)',
        borderDangerIcon: d ? 'rgba(239,68,68,0.25)'         : 'rgba(220,38,38,0.25)',

        // Close button
        borderClose:   d ? '#1b263b'                         : '#e2e8f0',

        // Cancel button
        borderCancel:  d ? 'rgba(2,128,144,0.3)'             : 'rgba(2,128,144,0.35)',
        borderCancelHover: d ? 'rgba(2,195,154,0.4)'         : 'rgba(2,195,154,0.5)',
        bgCancelHover: d ? 'rgba(2,128,144,0.1)'             : 'rgba(2,128,144,0.07)',

        // Delete button
        bgDelete:      d ? 'rgba(239,68,68,0.15)'            : 'rgba(220,38,38,0.08)',
        borderDelete:  d ? 'rgba(239,68,68,0.35)'            : 'rgba(220,38,38,0.3)',
        bgDeleteHover: d ? 'rgba(239,68,68,0.25)'            : 'rgba(220,38,38,0.15)',
        borderDeleteHover: d ? 'rgba(239,68,68,0.5)'         : 'rgba(220,38,38,0.45)',

        // Text
        textPrimary:   d ? '#f1f5f9' : '#0f172a',
        textBody:      d ? '#94a3b8' : '#475569',
        textFaint:     d ? '#4a7a8a' : '#64748b',
        textCancel:    d ? '#028090' : '#0369a1',
        textDanger:    d ? '#f87171' : '#dc2626',
        textDangerHover: d ? '#fca5a5' : '#b91c1c',
        textClose:     d ? '#4a7a8a' : '#64748b',
        textCloseHover:d ? '#ffffff' : '#0f172a',
        textNameHighlight: d ? '#f1f5f9' : '#0f172a',
    }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    incident:      { label: 'Incident',       article: "l'incident"       },
    vulnerability: { label: 'Vulnerability',  article: 'la vulnérabilité' },
    user:          { label: 'User',           article: "l'utilisateur"    },
    ticket:        { label: 'Ticket',         article: 'le ticket'        },
}

// ─── Main component ───────────────────────────────────────────────────────────

function DeleteModal({ type = 'incident', name = '', onConfirm, onCancel }) {
    const isDark = useTheme()
    const tk     = tokens(isDark)

    const { label, article } = TYPE_CONFIG[type] ?? TYPE_CONFIG.incident

    // ESC to close
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onCancel() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onCancel])

    return (
        <>
            <style>{`
                @keyframes delete-modal-in {
                    from { opacity: 0; transform: scale(0.94) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);   }
                }
                .delete-modal-panel {
                    animation: delete-modal-in 0.2s cubic-bezier(0.16,1,0.3,1) both;
                }
            `}</style>

            {/* ── Backdrop ── */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onCancel}
            >
                {/* ── Panel ── */}
                <div
                    className="delete-modal-panel relative w-full max-w-md overflow-hidden rounded-2xl"
                    style={{
                        background:  tk.bgPanel,
                        border:      `1px solid ${tk.borderPanel}`,
                        boxShadow:   tk.shadowPanel,
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top danger accent bar — invariant, always red, theme-independent */}
                    <div
                        className="h-0.5 w-full"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), rgba(239,68,68,0.8), rgba(239,68,68,0.6), transparent)' }}
                    />

                    {/* ── Header ── */}
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: `1px solid ${tk.borderDivider}` }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-xl"
                                style={{ background: tk.bgDangerIcon, border: `1px solid ${tk.borderDangerIcon}` }}
                            >
                                <AlertTriangle size={15} style={{ color: tk.textDanger }} />
                            </div>
                            <h3 className="text-sm font-semibold" style={{ color: tk.textPrimary }}>
                                Delete {label}
                            </h3>
                        </div>

                        <button
                            onClick={onCancel}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150"
                            style={{ border: `1px solid ${tk.borderClose}`, color: tk.textClose }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#028090'; e.currentTarget.style.color = tk.textCloseHover }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = tk.borderClose; e.currentTarget.style.color = tk.textClose }}
                        >
                            <X size={13} />
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="px-6 py-5 space-y-4">
                        <div
                            className="rounded-xl px-4 py-3.5"
                            style={{ background: tk.bgWarn, border: `1px solid ${tk.borderWarn}` }}
                        >
                            <p className="text-sm leading-relaxed" style={{ color: tk.textBody }}>
                                Êtes-vous sûr de vouloir supprimer {article}{' '}
                                <span className="font-semibold" style={{ color: tk.textNameHighlight }}>
                                    "{name}"
                                </span>
                                {' '}? Cette action est irréversible.
                            </p>
                        </div>

                        <p className="text-[11px]" style={{ color: tk.textFaint }}>
                            Cette suppression est permanente et ne peut pas être annulée.
                        </p>
                    </div>

                    {/* ── Footer ── */}
                    <div
                        className="flex items-center justify-end gap-3 px-6 py-4"
                        style={{ borderTop: `1px solid ${tk.borderDivider}`, background: tk.bgFooter }}
                    >
                        {/* Cancel */}
                        <button
                            onClick={onCancel}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: 'transparent', border: `1px solid ${tk.borderCancel}`, color: tk.textCancel }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background    = tk.bgCancelHover
                                e.currentTarget.style.borderColor   = tk.borderCancelHover
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background    = 'transparent'
                                e.currentTarget.style.borderColor   = tk.borderCancel
                            }}
                        >
                            Cancel
                        </button>

                        {/* Confirm delete */}
                        <button
                            onClick={onConfirm}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150"
                            style={{ background: tk.bgDelete, border: `1px solid ${tk.borderDelete}`, color: tk.textDanger }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background  = tk.bgDeleteHover
                                e.currentTarget.style.borderColor = tk.borderDeleteHover
                                e.currentTarget.style.color       = tk.textDangerHover
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background  = tk.bgDelete
                                e.currentTarget.style.borderColor = tk.borderDelete
                                e.currentTarget.style.color       = tk.textDanger
                            }}
                        >
                            <Trash2 size={13} />
                            Delete {label}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default DeleteModal