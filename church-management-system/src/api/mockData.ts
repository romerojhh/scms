import type {
  Member,
  AttendanceRecord,
  FinanceEntry,
  FinanceMonthlySummary,
} from '../types/domain'

const now = new Date().toISOString()

export const mockMembers: Member[] = [
  {
    member_id: 'm1',
    full_name: 'John Doe',
    birthdate: '1990-01-15',
    phone_number: '555-0101',
    age: 35,
    join_date: '2020-03-01',
    status: 'Active',
    notes: '',
    created_at: now,
    updated_at: now,
  },
  {
    member_id: 'm2',
    full_name: 'Jane Smith',
    birthdate: '1985-07-20',
    phone_number: '555-0202',
    age: 40,
    join_date: '2018-09-15',
    status: 'Active',
    notes: '',
    created_at: now,
    updated_at: now,
  },
]

export const mockAttendance: AttendanceRecord[] = []

export const mockFinanceEntries: FinanceEntry[] = [
  {
    finance_id: 'f1',
    entry_date: now.slice(0, 10),
    month: `${new Date().getFullYear()}-${String(
      new Date().getMonth() + 1,
    ).padStart(2, '0')}`,
    type: 'Income',
    amount: 1500,
    category: 'Tithe',
    notes: '',
    created_at: now,
    updated_at: now,
  },
  {
    finance_id: 'f2',
    entry_date: now.slice(0, 10),
    month: `${new Date().getFullYear()}-${String(
      new Date().getMonth() + 1,
    ).padStart(2, '0')}`,
    type: 'Expense',
    amount: 500,
    category: 'Rent',
    notes: '',
    created_at: now,
    updated_at: now,
  },
]

export function computeMonthlySummary(
  month: string,
  entries: FinanceEntry[],
): FinanceMonthlySummary {
  const filtered = entries.filter((e) => e.month === month)
  const totalIncome = filtered
    .filter((e) => e.type === 'Income')
    .reduce((sum, e) => sum + e.amount, 0)
  const totalExpenses = filtered
    .filter((e) => e.type === 'Expense')
    .reduce((sum, e) => sum + e.amount, 0)

  return {
    month,
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
  }
}

