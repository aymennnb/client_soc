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

    if (loading) return <p>Loading scans...</p>

    return (
        <div>
            <h2>Nessus Sync</h2>
            <button onClick={() => navigate('/vulnerabilities')}>← Back</button>

            <br /><br />

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '32px' }}>

                {/* Colonne 1 : liste des folders */}
                <div>
                    <h3>Folders</h3>
                    {folders.length === 0 ? (
                        <p>No folders found.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {folders.map(folder => (
                                <li key={folder.id} style={{ marginBottom: '6px' }}>
                                    <button
                                        onClick={() => handleSelectFolder(folder)}
                                        style={{
                                            fontWeight: selectedFolder?.id === folder.id ? 'bold' : 'normal'
                                        }}
                                    >
                                        {folder.name} ({folder.scans.length})
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Colonne 2 : scans du folder sélectionné */}
                <div>
                    <h3>Scans</h3>
                    {!selectedFolder ? (
                        <p>Select a folder.</p>
                    ) : selectedFolder.scans.length === 0 ? (
                        <p>No scans in this folder.</p>
                    ) : (
                        <table border="1" cellPadding="6">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Last modified</th>
                                    <th>Select</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedFolder.scans.map(scan => (
                                    <tr key={scan.id}>
                                        <td>{scan.name}</td>
                                        <td>{scan.status}</td>
                                        <td>
                                            {scan.last_modified
                                                ? new Date(scan.last_modified).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td>
                                            <input
                                                type="radio"
                                                name="selectedScan"
                                                checked={selectedScan?.id === scan.id}
                                                onChange={() => handleSelectScan(scan)}
                                                // Empêcher de synchroniser un scan en cours
                                                disabled={scan.status === 'running'}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>

            <br />

            {/* Zone de synchronisation */}
            <div>
                {selectedScan && (
                    <p>
                        Selected: <strong>{selectedScan.name}</strong> (id: {selectedScan.id})
                    </p>
                )}

                <button
                    onClick={handleSync}
                    disabled={!selectedScan || syncing}
                >
                    {syncing ? 'Syncing...' : 'Synchroniser'}
                </button>
            </div>

            {/* Résultat du sync */}
            {syncResult && (
                <div style={{ marginTop: '16px', border: '1px solid #ccc', padding: '12px' }}>
                    <strong>Sync completed</strong>
                    <p>Scan: {syncResult.scan_id} — Host: {syncResult.host}</p>
                    <table border="1" cellPadding="4">
                        <tbody>
                            <tr>
                                <td>Inserted</td>
                                <td>{syncResult.stats?.inserted}</td>
                            </tr>
                            <tr>
                                <td>Updated</td>
                                <td>{syncResult.stats?.updated}</td>
                            </tr>
                            <tr>
                                <td>Resolved</td>
                                <td>{syncResult.stats?.resolved}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default NessusSync