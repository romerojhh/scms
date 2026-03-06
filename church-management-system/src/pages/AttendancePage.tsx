import { useState, useEffect, useRef, useMemo } from 'react'
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

  const isLoading = membersLoading || attendanceLoading

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Attendance
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Mark who was present for a given service
          </p>
        </header>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="date" className="mb-2 block text-sm font-semibold text-slate-700">
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
                className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-slate-900 outline-none transition-all duration-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="event" className="mb-2 block text-sm font-semibold text-slate-700">
                Event Name
              </label>
              <input
                id="event"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-slate-900 outline-none transition-all duration-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm"
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
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>You have unsaved changes</span>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
            role="alert"
          >
            {message.type === 'success' ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="relative flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-5 w-5 rounded border-2 border-slate-300 text-indigo-600 transition-all duration-200 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-0"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                      Select All
                    </span>
                  </label>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Present: <strong className="text-slate-900">{presentCount}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-slate-300" />
                    <span className="text-slate-600">Absent: <strong className="text-slate-900">{absentCount}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-indigo-500" />
                    <span className="text-slate-600">Total: <strong className="text-slate-900">{totalMembers}</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-500">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading members...</span>
                  </div>
                ) : (
                  <span>{totalMembers} member{totalMembers !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <svg className="mx-auto h-10 w-10 animate-spin text-indigo-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="mt-4 text-sm font-medium text-slate-600">Loading members...</p>
                </div>
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No members found</h3>
                <p className="mt-2 text-sm text-slate-600">Add members to start taking attendance</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Present</th>
                    <th className="px-6 py-4">Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => {
                    const record = recordsMap.get(member.member_id)
                    const checked = record?.present ?? false
                    return (
                      <tr
                        key={member.member_id}
                        className="group transition-all duration-150 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <label className="relative flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => handleToggle(member.member_id, e.target.checked)}
                              className="h-5 w-5 rounded border-2 border-slate-300 text-indigo-600 transition-all duration-200 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-0"
                            />
                            <span className={`text-sm font-medium ${checked ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {checked ? 'Present' : 'Absent'}
                            </span>
                          </label>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">
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

        <footer className="mt-8 text-center text-sm text-slate-500">
          <p>Take attendance by checking the box next to each member's name</p>
        </footer>
      </div>
    </div>
  )
}

