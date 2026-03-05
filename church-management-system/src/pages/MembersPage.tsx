import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers } from '../hooks/useMembers'

export function MembersPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useMembers({ search })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Members</h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse and manage your church members.
          </p>
        </div>
        <button className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700">
          Add member
        </button>
      </div>

      <div className="rounded-lg bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:max-w-xs"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="text-xs text-slate-500">
            {data?.total ?? 0} member(s) found
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Join date</th>
                <th className="px-3 py-2">Age</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-sm text-slate-500"
                  >
                    Loading members...
                  </td>
                </tr>
              )}
              {!isLoading &&
                data?.items.map((member) => (
                  <tr
                    key={member.member_id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2">
                      <Link
                        to={`/members/${member.member_id}`}
                        className="text-sky-700 hover:underline"
                      >
                        {member.full_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 font-medium ${
                          member.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {member.join_date}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {member.age ?? '-'}
                    </td>
                  </tr>
                ))}
              {!isLoading && (data?.items.length ?? 0) === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-sm text-slate-500"
                  >
                    No members yet. Click &quot;Add member&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

