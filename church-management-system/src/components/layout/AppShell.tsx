import type { ReactNode } from 'react'
import { NavLinkItem } from './NavLinkItem'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell bg-slate-50 text-slate-900">
      <aside className="hidden border-r border-slate-200 bg-white px-4 py-6 md:block">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-600">
            SCMS
          </div>
          <div className="text-lg font-semibold text-slate-900">
            Simple Church
          </div>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <NavLinkItem to="/">Dashboard</NavLinkItem>
          <NavLinkItem to="/members">Members</NavLinkItem>
          <NavLinkItem to="/attendance">Attendance</NavLinkItem>
          <NavLinkItem to="/finance">Finance</NavLinkItem>
        </nav>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-sm font-semibold text-sky-600">SCMS</span>
          </div>
          <div className="text-sm font-medium text-slate-600">
            Simple Church Management System
          </div>
          <div className="text-xs text-slate-500">Admin</div>
        </header>
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

