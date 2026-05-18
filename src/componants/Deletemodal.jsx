/**
 * DeleteModal.jsx
 *
 * Props:
 *   type     — 'incident' | 'vulnerability' | 'user' | 'ticket'
 *   name     — display name of the item being deleted
 *   onConfirm — called when user confirms deletion
 *   onCancel  — called when user cancels / clicks backdrop
 */

import { useEffect } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    incident:      { label: 'Incident',       article: "l'incident"       },
    vulnerability: { label: 'Vulnerability',  article: 'la vulnérabilité' },
    user:          { label: 'User',           article: "l'utilisateur"    },
    ticket:        { label: 'Ticket',         article: 'le ticket'        },
}

// ─── Main component ───────────────────────────────────────────────────────────

function DeleteModal({ type = 'incident', name = '', onConfirm, onCancel }) {
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
                        background: 'linear-gradient(160deg, #0d1b2a 0%, #0a1520 100%)',
                        border: '1px solid #1b263b',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(27,38,59,0.6)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top danger accent bar */}
                    <div
                        className="h-0.5 w-full"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), rgba(239,68,68,0.8), rgba(239,68,68,0.6), transparent)' }}
                    />

                    {/* ── Header ── */}
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: '1px solid #1b263b' }}
                    >
                        <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-xl"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                            >
                                <AlertTriangle size={15} style={{ color: '#f87171' }} />
                            </div>
                            <h3 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                                Delete {label}
                            </h3>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onCancel}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150"
                            style={{ border: '1px solid #1b263b', color: '#4a7a8a' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#028090'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1b263b'; e.currentTarget.style.color = '#4a7a8a' }}
                        >
                            <X size={13} />
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="px-6 py-5 space-y-4">

                        {/* Description */}
                        <div
                            className="rounded-xl px-4 py-3.5"
                            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
                        >
                            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                                Êtes-vous sûr de vouloir supprimer {article}{' '}
                                <span className="font-semibold" style={{ color: '#f1f5f9' }}>"{name}"</span>
                                {' '}? Cette action est irréversible.
                            </p>
                        </div>

                        {/* Warning note */}
                        <p className="text-[11px]" style={{ color: '#4a7a8a' }}>
                            Cette suppression est permanente et ne peut pas être annulée.
                        </p>
                    </div>

                    {/* ── Footer ── */}
                    <div
                        className="flex items-center justify-end gap-3 px-6 py-4"
                        style={{ borderTop: '1px solid #1b263b', background: 'rgba(6,14,22,0.4)' }}
                    >
                        {/* Cancel */}
                        <button
                            onClick={onCancel}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150"
                            style={{ background: 'transparent', border: '1px solid rgba(2,128,144,0.3)', color: '#028090' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(2,128,144,0.1)'; e.currentTarget.style.borderColor = 'rgba(2,195,154,0.4)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(2,128,144,0.3)' }}
                        >
                            Cancel
                        </button>

                        {/* Confirm delete */}
                        <button
                            onClick={onConfirm}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.25)'
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'
                                e.currentTarget.style.color = '#fca5a5'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'
                                e.currentTarget.style.color = '#f87171'
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