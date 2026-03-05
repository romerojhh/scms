import { useParams } from 'react-router-dom'
import { useMember } from '../hooks/useMember'

export function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const { data, isLoading } = useMember(memberId ?? '')

  if (!memberId) {
    return (
      <div className="text-sm text-slate-600">No member selected.</div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="text-sm text-slate-600">Loading member details...</div>
    )
  }

  const { member, attendanceSummary } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {member.full_name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Joined on {member.join_date}. Status: {member.status}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex justify-between">
              <dt className="text-slate-500">Birthdate</dt>
              <dd>{member.birthdate ?? '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Age</dt>
              <dd>{member.age ?? '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Phone</dt>
              <dd>{member.phone_number ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap">
                {member.notes ?? '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent attendance
          </h2>
          <div className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
            {attendanceSummary.length === 0 && (
              <div className="text-slate-500">
                No attendance records yet for this member.
              </div>
            )}
            {attendanceSummary.map((record) => (
              <div
                key={record.attendance_id}
                className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"
              >
                <div>
                  <div className="font-medium text-slate-800">
                    {record.date}
                  </div>
                  <div className="text-xs text-slate-500">
                    {record.event_name ?? 'Service'} •{' '}
                    {record.present ? 'Present' : 'Absent'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

