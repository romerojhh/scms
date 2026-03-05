import { useState } from 'react'
import type { FormEvent } from 'react'
import type { FinanceType, FinanceEntry } from '../types/domain'
import { useFinanceByMonth } from '../hooks/useFinanceByMonth'
import { createFinanceEntry } from '../api/client'
import type { CreateFinanceEntryRequest } from '../types/api'

function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function FinancePage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const { data, refetch } = useFinanceByMonth({ month })

  const [type, setType] = useState<FinanceType>('Income')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Tithe')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!amount) return
    setSaving(true)
    try {
      const payload: CreateFinanceEntryRequest = {
        entry_date: entryDate,
        month,
        type,
        amount: Number(amount),
        category,
        notes,
      }
      await createFinanceEntry(payload)
      setAmount('')
      setNotes('')
      await refetch()
    } finally {
      setSaving(false)
    }
  }

  const entries = (data?.entries ?? []) as FinanceEntry[]
  const summary = data?.summary

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Finance</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track monthly income and expenses.
          </p>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-600">
            Month (YYYY-MM)
          </label>
          <input
            type="text"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-xs font-medium uppercase text-slate-500">
              Income
            </div>
            <div className="mt-2 text-xl font-semibold text-emerald-700">
              {summary.totalIncome.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
              })}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-xs font-medium uppercase text-slate-500">
              Expenses
            </div>
            <div className="mt-2 text-xl font-semibold text-rose-600">
              {summary.totalExpenses.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
              })}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-xs font-medium uppercase text-slate-500">
              Net
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-900">
              {summary.net.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-lg bg-white p-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            Add entry
          </h2>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FinanceType)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Add entry'}
          </button>
        </form>

        <div className="md:col-span-2">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="mb-2 text-xs text-slate-500">
              {entries.length} entrie(s) in {month}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.finance_id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {entry.entry_date}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 font-medium ${
                            entry.type === 'Income'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">
                        {entry.category}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-slate-900">
                        {entry.amount.toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-center text-sm text-slate-500"
                      >
                        No entries yet for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

