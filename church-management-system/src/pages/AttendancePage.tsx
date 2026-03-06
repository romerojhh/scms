import { useState, useEffect, useRef } from 'react'
import { useMembers } from '../hooks/useMembers'
import { useAttendanceByDate } from '../hooks/useAttendanceByDate'
import { saveAttendance } from '../api/client'

function getTodayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function AttendancePage() {
  const [date, setDate] = useState(getTodayISO())
  const [eventName, setEventName] = useState('Sunday Service')
  const { data: membersData } = useMembers({})
  const { data: attendanceData, refetch } = useAttendanceByDate({
    date,
    eventName,
  })

  const [recordsMap, setRecordsMap] = useState(new Map())

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const messageTimeoutRef = useRef<number | null>(null)

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
      }, 2000)
    }
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [message])

  async function handleToggle(memberId: string, checked: boolean) {
    const existing = recordsMap.get(memberId)
    setRecordsMap(prev => {
      const newMap = new Map(prev);
      newMap.set(memberId, {
        attendance_id: existing?.attendance_id ?? `${date}-${memberId}`,
        date,
        event_name: eventName,
        member_id: memberId,
        present: checked,
        notes: existing?.notes ?? '',
      })
      return newMap;
    })
  }

  async function handleSave() {
    if (!membersData) return
    setSaving(true)
    setMessage(null)
    try {
      await saveAttendance({
        date,
        eventName,
        records: membersData.items.map((m) => ({
          member_id: m.member_id,
          present: recordsMap.get(m.member_id)?.present ?? false,
          notes: recordsMap.get(m.member_id)?.notes ?? '',
        })),
      })
      await refetch()
      setMessage('Attendance saved.')
    } catch (e) {
      setMessage('Failed to save attendance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
          <p className="mt-1 text-sm text-slate-600">
            Mark who was present for a given service.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => { 
                setDate(e.target.value)
                refetch()
              }}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">
              Event name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Save attendance'}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </div>
      )}

      <div className="rounded-lg bg-white p-3 shadow-sm">
        <div className="mb-2 text-xs text-slate-500">
          {membersData?.total ?? 0} member(s)
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Present</th>
                <th className="px-3 py-2">Name</th>
              </tr>
            </thead>
            <tbody>
              {membersData?.items.map((member) => {
                const record = recordsMap.get(member.member_id)
                const checked = record?.present ?? false
                return (
                  <tr
                    key={member.member_id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          handleToggle(member.member_id, e.target.checked)
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      {member.full_name}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

