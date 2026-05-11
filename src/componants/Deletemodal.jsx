function DeleteModal({ type = 'incident', name = '', onConfirm, onCancel }) {
    const config = {
        incident:      { label: 'Incident',      article: "l'incident" },
        vulnerability: { label: 'Vulnerability', article: 'la vulnérabilité' },
        user:          { label: 'User',          article: "l'utilisateur" },
    }

    const { label, article } = config[type] ?? config.incident

    return (
        /* ── Backdrop ── */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
            onClick={onCancel}
        >
            {/* ── Modal card ── */}
            <div
                className="relative w-full max-w-md rounded-2xl border border-[#1c2b2f] bg-[#0b0f12] shadow-2xl lm:bg-white lm:border-slate-200"
                style={{ boxShadow: '0 0 0 1px #1c2b2f, 0 25px 60px rgba(0,0,0,0.7)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Top accent bar (rouge) ── */}
                <div className="h-1 w-full rounded-t-2xl bg-red-500/70" />

                <div className="px-6 py-6 space-y-5">
                    {/* ── Header ── */}
                    <h3 className="text-base font-bold text-white lm:text-slate-900">
                        Delete {label}
                    </h3>

                    {/* ── Message ── */}
                    <div className="rounded-lg border border-[#1c2b2f] bg-black/40 px-4 py-3 lm:bg-slate-50 lm:border-slate-200">
                        <p className="text-sm text-slate-300 lm:text-slate-600 leading-relaxed">
                            Êtes-vous sûr de vouloir supprimer {article}{' '}
                            <span className="font-semibold text-white lm:text-slate-900">"{name}"</span> ?{' '}
                        </p>
                    </div>

                    {/* ── Actions ── */}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="rounded-lg border border-[#275B66] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#275B66] hover:text-white lm:border-slate-200 lm:text-slate-600 lm:hover:bg-slate-100 lm:hover:text-slate-900"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="rounded-lg bg-red-500/90 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-500"
                        >
                            Delete {label}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeleteModal