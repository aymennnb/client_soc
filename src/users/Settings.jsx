import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../api'

const inputCls = "w-full rounded-lg border border-[#1c2b2f] bg-[#0a1215] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition focus:border-[#00A897] focus:outline-none focus:ring-1 focus:ring-[#00A897]/40"
const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5"

function Flash({ msg }) {
    if (!msg) return null
    return (
        <div className={`rounded-lg border px-4 py-3 text-sm transition-all ${
            msg.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
            {msg.text}
        </div>
    )
}

function Card({ title, subtitle, children }) {
    return (
        <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-6 space-y-5">
            <div className="border-b border-[#1c2b2f] pb-4">
                <h3 className="text-sm font-bold text-white">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
            {children}
        </div>
    )
}

function Settings() {
    const { userId, username, email } = useAuth()

    // ── Profile loading ──
    const [profile, setProfile] = useState(null)
    const [profileLoading, setProfileLoading] = useState(true)

    // ── Department form ──
    const [department, setDepartment] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)
    const [flashProfile, setFlashProfile] = useState(null)

    const flash = (setter, type, text) => {
        setter({ type, text })
        setTimeout(() => setter(null), 3500)
    }

    // ── Load user profile (Keycloak + MongoDB) ──
    useEffect(() => {
        if (!userId) return
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/me')
                setProfile(res.data)
                setDepartment(res.data.department || '')
            } catch (err) {
                console.error('[Settings] Failed to load profile:', err)
                flash(setFlashProfile, 'error', 'Failed to load profile.')
            } finally {
                setProfileLoading(false)
            }
        }
        fetchProfile()
    }, [userId])

    // ── Update profile (department, preferences, etc.) ──
    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const res = await api.put('/users/me', {
                department: department.trim() || null
            })
            setProfile(res.data.user)
            flash(setFlashProfile, 'success', 'Profile updated successfully.')
        } catch (err) {
            flash(setFlashProfile, 'error', err.response?.data?.message || 'Failed to update profile.')
        } finally {
            setSavingProfile(false)
        }
    }

    return (
        <div className="space-y-6 text-slate-100 max-w-2xl">

            {/* ── Header ── */}
            <div className="border-b border-[#1c2b2f] pb-5">
                <h2 className="text-xl font-bold tracking-tight text-white">Account Settings</h2>
                <p className="mt-1 text-xs text-slate-500">Manage your profile and preferences</p>
            </div>

            {/* ── Keycloak user info ── */}
            <Card title="Keycloak Account" subtitle="Your authentication details (managed by Keycloak)">
                <div className="space-y-4">
                    <div>
                        <label className={labelCls}>Username</label>
                        <div className="rounded-lg border border-[#1c2b2f] bg-[#0a1215]/50 px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed opacity-60">
                            {username || '—'}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600">Contact admin to change.</p>
                    </div>

                    <div>
                        <label className={labelCls}>Email</label>
                        <div className="rounded-lg border border-[#1c2b2f] bg-[#0a1215]/50 px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed opacity-60">
                            {email || '—'}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600">Contact admin to change.</p>
                    </div>
                </div>
            </Card>

        </div>
    )
}

export default Settings