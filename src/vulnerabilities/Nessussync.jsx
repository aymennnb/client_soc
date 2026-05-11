import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function NessusSync() {
    const [folders, setFolders]         = useState([])
    const [selectedFolder, setSelectedFolder] = useState(null)
    const [selectedScan, setSelectedScan]     = useState(null)
    const [loading, setLoading]         = useState(true)
    const [syncing, setSyncing]         = useState(false)
    const [error, setError]             = useState('')
    const [syncResult, setSyncResult]   = useState(null)

    const navigate = useNavigate()

    useEffect(() => {
        const fetchScans = async () => {
            setLoading(true)
            setError('')
            try {
                const response = await api.get('/scans')
                setFolders(response.data.folders)
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load scans.')
            } finally {
                setLoading(false)
            }
        }
        fetchScans()
    }, [])

    const handleSelectFolder = (folder) => {
        setSelectedFolder(folder)
        setSelectedScan(null)
        setSyncResult(null)
    }

    const handleSelectScan = (scan) => {
        setSelectedScan(scan)
        setSyncResult(null)
    }

    const handleSync = async () => {
        if (!selectedScan) return
        setSyncing(true)
        setError('')
        setSyncResult(null)

        try {
            const response = await api.post(`/vulnerabilities/sync/nessus/${selectedScan.id}`)
            setSyncResult(response.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Sync failed.')
        } finally {
            setSyncing(false)
        }
    }

    if (loading)
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">Loading scans...</p>
            </div>
        )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Nessus Sync</h2>
                    <p className="text-sm text-slate-400">Synchronize Nessus scans with vulnerabilities</p>
                </div>
                <button
                    onClick={() => navigate('/vulnerabilities')}
                    className="rounded-lg border border-[#275B66] px-4 py-2 text-sm font-semibold text-[#00A897] hover:bg-[#275B66] hover:text-white transition-colors"
                >
                    ← Back
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Colonne 1 : Folders */}
                <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Folders</h3>
                    {folders.length === 0 ? (
                        <p className="text-slate-500">No folders found.</p>
                    ) : (
                        <div className="space-y-2">
                            {folders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => handleSelectFolder(folder)}
                                    className={`w-full text-left rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                                        selectedFolder?.id === folder.id
                                            ? 'bg-[#00A897] text-black'
                                            : 'bg-black/40 text-slate-300 hover:bg-[#275B66] hover:text-white border border-[#275B66]'
                                    }`}
                                >
                                    <span className="font-semibold">{folder.name}</span>
                                    <span className="ml-2 text-xs opacity-70">({folder.scans.length})</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Colonne 2 : Scans */}
                <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Scans</h3>
                    {!selectedFolder ? (
                        <p className="text-slate-500">Select a folder to view scans.</p>
                    ) : selectedFolder.scans.length === 0 ? (
                        <p className="text-slate-500">No scans in this folder.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#275B66]">
                                        <th className="px-4 py-2 text-left text-xs uppercase text-slate-400 font-semibold">Name</th>
                                        <th className="px-4 py-2 text-left text-xs uppercase text-slate-400 font-semibold">Status</th>
                                        <th className="px-4 py-2 text-left text-xs uppercase text-slate-400 font-semibold">Last Modified</th>
                                        <th className="px-4 py-2 text-center text-xs uppercase text-slate-400 font-semibold">Select</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedFolder.scans.map((scan, idx) => (
                                        <tr
                                            key={scan.id}
                                            className={`border-b border-[#1c2b2f] ${idx % 2 === 0 ? 'bg-black/30' : 'bg-black/20'} hover:bg-[#275B66]/20 transition-colors`}
                                        >
                                            <td className="px-4 py-3 text-slate-300">{scan.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                                    scan.status === 'running'
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                    {scan.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-sm">
                                                {scan.last_modified
                                                    ? new Date(scan.last_modified).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="radio"
                                                    name="selectedScan"
                                                    checked={selectedScan?.id === scan.id}
                                                    onChange={() => handleSelectScan(scan)}
                                                    disabled={scan.status === 'running'}
                                                    className="cursor-pointer accent-[#00A897] disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Selection & Sync Button */}
            {selectedScan && (
                <div className="rounded-xl border border-[#1c2b2f] bg-black/60 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Selected Scan:</p>
                            <p className="text-lg font-semibold text-[#00A897]">{selectedScan.name}</p>
                            <p className="text-xs text-slate-500 mt-1">ID: {selectedScan.id}</p>
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={!selectedScan || syncing}
                            className="rounded-lg bg-[#00A897] px-6 py-3 text-sm font-semibold text-black hover:bg-[#275B66] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {syncing ? 'Syncing...' : 'Synchronize'}
                        </button>
                    </div>
                </div>
            )}

            {/* Sync Result */}
            {syncResult && (
                <div className="rounded-xl border border-[#00A897]/30 bg-[#00A897]/5 p-6">
                    <h4 className="text-lg font-semibold text-[#00A897] mb-4">Sync Completed</h4>
                    <div className="grid gap-4 mb-6 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-slate-400 uppercase mb-1">Scan</p>
                            <p className="font-semibold text-slate-300">{syncResult.scan_id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase mb-1">Host</p>
                            <p className="font-semibold text-slate-300">{syncResult.host}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b border-[#1c2b2f] hover:bg-black/20">
                                    <td className="px-4 py-3 text-slate-400">Inserted</td>
                                    <td className="px-4 py-3 text-right font-semibold text-green-400">{syncResult.stats?.inserted || 0}</td>
                                </tr>
                                <tr className="border-b border-[#1c2b2f] hover:bg-black/20">
                                    <td className="px-4 py-3 text-slate-400">Updated</td>
                                    <td className="px-4 py-3 text-right font-semibold text-blue-400">{syncResult.stats?.updated || 0}</td>
                                </tr>
                                <tr className="hover:bg-black/20">
                                    <td className="px-4 py-3 text-slate-400">Resolved</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-300">{syncResult.stats?.resolved || 0}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NessusSync
