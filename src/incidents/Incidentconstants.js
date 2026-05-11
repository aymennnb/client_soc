// incidentConstants.js
// Severity is stored as a NUMBER (0-4) in the DB.
// All display logic uses these maps — never store the label in the DB.

export const SEVERITY_LABELS = {
    0: 'Info',
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Critical',
}

export const SEVERITY_BADGES = {
    0: 'bg-slate-700/60 text-slate-300 border border-slate-600/40',
    1: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    2: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    3: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    4: 'bg-red-500/15 text-red-300 border border-red-500/30',
}

export const SEVERITY_DOTS = {
    0: 'bg-slate-400',
    1: 'bg-emerald-400',
    2: 'bg-amber-400',
    3: 'bg-orange-400',
    4: 'bg-red-500',
}

export const STATUS_BADGES = {
    open:        'bg-red-500/15 text-red-300 border border-red-500/30',
    in_progress: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    resolved:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
}

export const STATUS_LABELS = {
    open:        'Open',
    in_progress: 'In Progress',
    resolved:    'Resolved',
}

export const fmt = (date) => {
    try {
        return new Date(date).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    } catch {
        return '—'
    }
}