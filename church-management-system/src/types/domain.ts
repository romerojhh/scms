export type MemberStatus = 'Active' | 'Inactive'

export interface Member {
  member_id: string
  full_name: string
  birthdate?: string
  phone_number?: string
  age?: number
  join_date: string
  status: MemberStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  attendance_id: string
  date: string
  event_name?: string
  member_id: string
  present: boolean
  notes?: string
}

export type FinanceType = 'Income' | 'Expense'

export interface FinanceEntry {
  finance_id: string
  entry_date: string
  month: string
  type: FinanceType
  amount: number
  category: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface FinanceMonthlySummary {
  month: string
  totalIncome: number
  totalExpenses: number
  net: number
}

