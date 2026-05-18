import { useState, useEffect, useRef } from 'react'

/**
 * UserSearchSelect — searchable user dropdown with a clear (×) button.
 *
 * Props:
 *  users      – array of { id, firstName, lastName, username, email }
 *  value      – selected user id (string)
 *  onChange   – called with a synthetic event { target: { name, value } }
 *  name       – field name forwarded in onChange (default: 'assigned_to')
 *  className  – extra classes for the input
 *  placeholder– input placeholder
 */
export default function UserSearchSelect({
    users = [],
    value = '',
    onChange,
    name = 'assigned_to',
    className = '',
    placeholder = 'Search or select user…',
}) {
    const [isOpen,         setIsOpen]         = useState(false)
    const [searchQuery,    setSearchQuery]     = useState('')
    const containerRef = useRef(null)

    // ── Close on outside click ──
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false)
                setSearchQuery('')
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filteredUsers = searchQuery.trim()
        ? users.filter(u => {
              const q = searchQuery.toLowerCase()
              return (
                  u.firstName?.toLowerCase().includes(q) ||
                  u.lastName?.toLowerCase().includes(q)  ||
                  u.username?.toLowerCase().includes(q)  ||
                  u.email?.toLowerCase().includes(q)
              )
          })
        : users

    const selectedUser = users.find(u => u.id === value)

    const displayValue = isOpen
        ? searchQuery
        : selectedUser
            ? `${[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ')} (${selectedUser.username})`
            : ''

    const handleSelect = (userId) => {
        onChange({ target: { name, value: userId } })
        setIsOpen(false)
        setSearchQuery('')
    }

    const handleClear = (e) => {
        e.stopPropagation()
        onChange({ target: { name, value: '' } })
        setSearchQuery('')
        setIsOpen(false)
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="relative flex items-center">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className={`${className} pr-8`}
                    autoComplete="off"
                />

                {/* Clear button — only when a value is selected */}
                {value && !isOpen && (
                    <button
                        type="button"
                        onClick={handleClear}
                        title="Clear selection"
                        className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500 hover:text-white transition text-[10px] font-bold leading-none"
                    >
                        ×
                    </button>
                )}

                {/* Chevron — when no value selected */}
                {!value && (
                    <span className="pointer-events-none absolute right-2.5 text-slate-500 text-xs">▾</span>
                )}
            </div>

            {/* ── Dropdown ── */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-[#1c2b2f] bg-[#0a1215] shadow-xl">
                    {filteredUsers.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-slate-500 text-center">
                            No users found
                        </div>
                    ) : (
                        filteredUsers.map(user => {
                            const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleSelect(user.id)}
                                    className={`w-full text-left px-3 py-2.5 text-sm transition ${
                                        value === user.id
                                            ? 'bg-[#00A897]/20 text-[#00A897] border-l-2 border-[#00A897]'
                                            : 'text-slate-300 hover:bg-[#0e1a1e] hover:text-white'
                                    }`}
                                >
                                    <div className="font-medium">{fullName || user.username}</div>
                                    <div className="text-xs text-slate-500">
                                        {user.username}{user.email && ` • ${user.email}`}
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}