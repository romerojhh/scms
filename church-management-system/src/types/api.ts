import type {
  Member,
  AttendanceRecord,
  FinanceEntry,
  FinanceMonthlySummary,
} from './domain'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

// Members

export interface ListMembersParams {
  search?: string
  status?: string
  joinedFrom?: string
  joinedTo?: string
  minAge?: number
  maxAge?: number
  page?: number
  pageSize?: number
}

export type ListMembersResponse = PaginatedResponse<Member>

export interface CreateMemberRequest
  extends Omit<
    Member,
    'member_id' | 'created_at' | 'updated_at' | 'age'
  > {}

export interface UpdateMemberRequest
  extends Partial<
    Omit<Member, 'member_id' | 'created_at' | 'updated_at' | 'age'>
  > {}

export interface GetMemberResponse {
  member: Member
  attendanceSummary: AttendanceRecord[]
}

// Attendance

export interface AttendanceByDateParams {
  date: string
  eventName?: string
}

export interface AttendanceByDateResponse {
  date: string
  eventName?: string
  records: AttendanceRecord[]
}

export interface SaveAttendanceRequest {
  date: string
  eventName?: string
  records: Array<Pick<AttendanceRecord, 'member_id' | 'present' | 'notes'>>
}

// Finance

export interface FinanceByMonthParams {
  month: string
}

export interface FinanceByMonthResponse {
  month: string
  entries: FinanceEntry[]
  summary: FinanceMonthlySummary
}

export interface CreateFinanceEntryRequest
  extends Omit<
    FinanceEntry,
    'finance_id' | 'created_at' | 'updated_at'
  > {}

