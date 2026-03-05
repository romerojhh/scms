import { NavLink, NavLinkProps } from 'react-router-dom'

type Props = Omit<NavLinkProps, 'className'>

export function NavLinkItem(props: Props) {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        [
          'flex items-center rounded-md px-3 py-2 text-sm font-medium',
          isActive
            ? 'bg-sky-50 text-sky-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        ].join(' ')
      }
    />
  )
}

