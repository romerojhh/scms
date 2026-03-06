import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useMembers } from '../hooks/useMembers'
import { useAttendanceByDate } from '../hooks/useAttendanceByDate'
import { saveAttendance } from '../api/client'

function getTodayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function AttendancePage() {
  const [date, setDate] = useState(getTodayISO())
  const [eventName, setEventName] = useState('Sunday Service')
  const { data: membersData, isLoading: membersLoading } = useMembers({})
  const { data: attendanceData, refetch, isLoading: attendanceLoading } = useAttendanceByDate({
    date,
    eventName,
  })

  const [recordsMap, setRecordsMap] = useState<Map<string, any>>(new Map())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const messageTimeoutRef = useRef<number | null>(null)
  const [selectAll, setSelectAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const members = membersData?.items ?? []
  const totalMembers = members.length

  const presentCount = useMemo(() => {
    let count = 0
    members.forEach(member => {
      if (recordsMap.get(member.member_id)?.present) count++
    })
    return count
  }, [members, recordsMap])

  const absentCount = totalMembers - presentCount

  useEffect(() => {
    setRecordsMap(new Map(
      (attendanceData?.records ?? []).map((r) => [r.member_id, r]),
    ))
  }, [attendanceData])

  useEffect(() => {
    if (message) {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
      messageTimeoutRef.current = window.setTimeout(() => {
        setMessage(null)
      }, 3000)
    }
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [message])

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setRecordsMap(prev => {
      const newMap = new Map(prev)
      members.forEach(member => {
        const existing = newMap.get(member.member_id)
        newMap.set(member.member_id, {
          attendance_id: existing?.attendance_id ?? `${date}-${member.member_id}`,
          date,
          event_name: eventName,
          member_id: member.member_id,
          present: checked,
          notes: existing?.notes ?? '',
        })
      })
      return newMap
    })
  }

  const handleToggle = (memberId: string, checked: boolean) => {
    const existing = recordsMap.get(memberId)
    setRecordsMap(prev => {
      const newMap = new Map(prev)
      newMap.set(memberId, {
        attendance_id: existing?.attendance_id ?? `${date}-${memberId}`,
        date,
        event_name: eventName,
        member_id: memberId,
        present: checked,
        notes: existing?.notes ?? '',
      })
      return newMap
    })
  }

  const handleSave = async () => {
    if (!membersData) return
    setSaving(true)
    setMessage(null)
    try {
      await saveAttendance({
        date,
        eventName,
        records: members.map((m) => ({
          member_id: m.member_id,
          present: recordsMap.get(m.member_id)?.present ?? false,
          notes: recordsMap.get(m.member_id)?.notes ?? '',
        })),
      })
      await refetch()
      setMessage({ text: 'Attendance saved successfully', type: 'success' })
      setSelectAll(false)
    } catch (e) {
      setMessage({ text: 'Failed to save attendance', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const hasUnsavedChanges = useMemo(() => {
    if (!attendanceData) return false
    return members.some(member => {
      const current = recordsMap.get(member.member_id)?.present ?? false
      const original = attendanceData.records.find(r => r.member_id === member.member_id)?.present ?? false
      return current !== original
    })
  }, [members, recordsMap, attendanceData])

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    const query = searchQuery.toLowerCase()
    return members.filter(member =>
      member.full_name.toLowerCase().includes(query)
    )
  }, [members, searchQuery])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const scrollToMember = useCallback((memberId: string) => {
    const element = document.getElementById(`member-row-${memberId}`)
    if (element && tableContainerRef.current) {
      const container = tableContainerRef.current
      const elementTop = element.offsetTop
      const containerHeight = container.clientHeight
      const elementHeight = element.clientHeight
      const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2)
      container.scrollTo({
        top: Math.max(0, scrollTo),
        behavior: 'smooth'
      })
      element.classList.add('bg-indigo-50')
      setTimeout(() => {
        element.classList.remove('bg-indigo-50')
      }, 2000)
    }
  }, [])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredMembers.length > 0) {
      const firstMember = filteredMembers[0]
      scrollToMember(firstMember.member_id)
    }
  }

  const isLoading = membersLoading || attendanceLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="mt-1 text-sm text-slate-600">
          Mark who was present for a given service
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Attendance</span>
                </>
              )}
            </button>

            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Unsaved changes</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-6">
            <div>
              <label htmlFor="date" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  refetch()
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-all hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label htmlFor="event" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Event
              </label>
              <input
                id="event"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-all hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
          role="alert"
        >
          {message.type === 'success' ? (
            <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <label className="relative flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 transition-all hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                    Select All
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span><strong className="text-slate-900">{presentCount}</strong> present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span><strong className="text-slate-900">{absentCount}</strong> absent</span>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading...</span>
                </div>
              ) : (
                <span>{totalMembers} total</span>
              )}
            </div>
          </div>
        </div>

        <div className="max-h-[480px] overflow-y-auto" ref={tableContainerRef}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 animate-spin text-indigo-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="mt-3 text-sm font-medium text-slate-600">Loading members...</p>
              </div>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-3 text-base font-semibold text-slate-900">No members</h3>
              <p className="mt-1 text-sm text-slate-600">Add members to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Status</th>
                  <th className="px-4 py-3 sm:px-6">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => {
                  const record = recordsMap.get(member.member_id)
                  const checked = record?.present ?? false
                  return (
                    <tr
                      key={member.member_id}
                      id={`member-row-${member.member_id}`}
                      className="transition-colors hover:bg-slate-100"
                    >
                      <td className="px-4 py-3 sm:px-6">
                        <label className="relative flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => handleToggle(member.member_id, e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 transition-all hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <span className={`text-sm font-medium ${checked ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {checked ? 'Present' : 'Absent'}
                          </span>
                        </label>
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <span className="text-sm font-medium text-slate-900">
                          {member.full_name}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

