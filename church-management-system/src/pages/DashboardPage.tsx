import { useMembers } from '../hooks/useMembers'
import { useAttendanceByDate } from '../hooks/useAttendanceByDate'
import { useFinanceByMonth } from '../hooks/useFinanceByMonth'

function getTodayISO() {
  return new Date().toISOString().slice(0, 10)
}

function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function DashboardPage() {
  const today = getTodayISO()
  const month = getCurrentMonth()

  const { data: membersData } = useMembers({})
  const { data: attendanceData } = useAttendanceByDate({ date: today })
  const { data: financeData } = useFinanceByMonth({ month })

  const totalMembers = membersData?.total ?? 0
  const todaysAttendance = attendanceData?.records.filter((r) => r.present)
    .length
  const net = financeData?.summary.net ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          High-level snapshot of your church today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">
            Total active members
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {totalMembers}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">
            Attendance today
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {todaysAttendance ?? 0}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">
            Net this month
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-600">
            {net.toLocaleString(undefined, {
              style: 'currency',
              currency: 'USD',
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

