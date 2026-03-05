import {
  mockMembers,
  mockAttendance,
  mockFinanceEntries,
  computeMonthlySummary,
} from './mockData'
import type {
  ListMembersParams,
  ListMembersResponse,
  GetMemberResponse,
  AttendanceByDateParams,
  AttendanceByDateResponse,
  SaveAttendanceRequest,
  FinanceByMonthParams,
  FinanceByMonthResponse,
  CreateFinanceEntryRequest,
} from '../types/api'
import type { AttendanceRecord, FinanceEntry } from '../types/domain'

// For now we always use mock data. Later this can switch to real HTTP calls.
const USE_MOCK = true

export async function getMembers(
  params: ListMembersParams,
): Promise<ListMembersResponse> {
  if (USE_MOCK) {
    let items = [...mockMembers]
    if (params.search) {
      const q = params.search.toLowerCase()
      items = items.filter((m) =>
        m.full_name.toLowerCase().includes(q),
      )
    }
    return {
      items,
      total: items.length,
    }
  }

  const query = new URLSearchParams(params as Record<string, string>)
  const res = await fetch(`/api/members?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to load members')
  return res.json()
}

export async function getMember(
  memberId: string,
): Promise<GetMemberResponse> {
  if (USE_MOCK) {
    const member = mockMembers.find((m) => m.member_id === memberId)
    const attendance = mockAttendance.filter(
      (r) => r.member_id === memberId && r.present,
    )
    if (!member) {
      throw new Error('Member not found')
    }
    return {
      member,
      attendanceSummary: attendance.slice(-10),
    }
  }

  const res = await fetch(`/api/members/${memberId}`)
  if (!res.ok) throw new Error('Failed to load member')
  return res.json()
}

export async function getAttendanceByDate(
  params: AttendanceByDateParams,
): Promise<AttendanceByDateResponse> {
  if (USE_MOCK) {
    const records = mockAttendance.filter(
      (r) =>
        r.date === params.date &&
        (!params.eventName || r.event_name === params.eventName),
    )
    return {
      date: params.date,
      eventName: params.eventName,
      records,
    }
  }

  const query = new URLSearchParams(params as Record<string, string>)
  const res = await fetch(`/api/attendance?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to load attendance')
  return res.json()
}

export async function saveAttendance(
  payload: SaveAttendanceRequest,
): Promise<void> {
  if (USE_MOCK) {
    // Remove existing for date/event
    for (let i = mockAttendance.length - 1; i >= 0; i -= 1) {
      const r = mockAttendance[i]
      if (
        r.date === payload.date &&
        (payload.eventName ? r.event_name === payload.eventName : true)
      ) {
        mockAttendance.splice(i, 1)
      }
    }
    const now = new Date().toISOString()
    payload.records.forEach((r, index) => {
      const record: AttendanceRecord = {
        attendance_id: `${payload.date}-${index}`,
        date: payload.date,
        event_name: payload.eventName,
        member_id: r.member_id,
        present: r.present,
        notes: r.notes,
      }
      mockAttendance.push(record)
    })
    return
  }

  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to save attendance')
}

export async function getFinanceByMonth(
  params: FinanceByMonthParams,
): Promise<FinanceByMonthResponse> {
  if (USE_MOCK) {
    const entries = mockFinanceEntries.filter(
      (e) => e.month === params.month,
    )
    const summary = computeMonthlySummary(params.month, mockFinanceEntries)
    return {
      month: params.month,
      entries,
      summary,
    }
  }

  const query = new URLSearchParams(params as Record<string, string>)
  const res = await fetch(`/api/finance?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to load finance')
  return res.json()
}

export async function createFinanceEntry(
  payload: CreateFinanceEntryRequest,
): Promise<FinanceEntry> {
  if (USE_MOCK) {
    const now = new Date().toISOString()
    const entry: FinanceEntry = {
      ...payload,
      finance_id: `f-${mockFinanceEntries.length + 1}`,
      created_at: now,
      updated_at: now,
    }
    mockFinanceEntries.push(entry)
    return entry
  }

  const res = await fetch('/api/finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create finance entry')
  return res.json()
}

