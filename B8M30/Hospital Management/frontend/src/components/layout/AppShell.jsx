import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, UserRound, X } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { NAV_ITEMS, ROLE_BADGE, ROLE_LABEL, navFor } from '../../auth/roles'
import { cn, initials, personName } from '../../lib/utils'
import Logo from './Logo'

function NavList({ role, onNavigate }) {
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {navFor(role).map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={18}
                className={cn('shrink-0', isActive ? 'text-brand-600' : 'text-ink-400')}
                aria-hidden="true"
              />
              <span className="truncate">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function UserMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const name = personName(user, user?.username)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pr-2 pl-1.5 transition-colors hover:bg-ink-100"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {initials(name)}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-40 truncate text-sm font-semibold text-ink-800">
            {name}
          </span>
          <span className="block text-[11px] text-ink-400">
            {ROLE_LABEL[user?.role] ?? user?.role}
          </span>
        </span>
        <ChevronDown size={15} className="text-ink-400" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-rise absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl bg-white shadow-pop ring-1 ring-ink-200"
        >
          <div className="border-b border-ink-100 px-3.5 py-3">
            <p className="truncate text-sm font-semibold text-ink-900">{name}</p>
            <p className="truncate text-xs text-ink-400">
              {user?.email || user?.username}
            </p>
            <span
              className={cn(
                'mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                ROLE_BADGE[user?.role],
              )}
            >
              {ROLE_LABEL[user?.role] ?? user?.role}
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate('/profile')
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
          >
            <UserRound size={16} className="text-ink-400" aria-hidden="true" />
            My profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              signOut()
              navigate('/login', { replace: true })
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 border-t border-ink-100 px-3.5 py-2.5 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppShell() {
  const { role } = useAuth()
  const location = useLocation()
  // Every link inside the drawer closes it via NavList's onNavigate, so no
  // route-change effect is needed here.
  const [drawerOpen, setDrawerOpen] = useState(false)

  const current = NAV_ITEMS.find((item) => item.to === location.pathname)

  return (
    <div className="min-h-dvh bg-ink-50">
      {/* Sidebar — permanent from lg up */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-ink-100 px-5">
          <Logo />
        </div>
        <NavList role={role} />
        <p className="border-t border-ink-100 px-5 py-3 text-[11px] text-ink-400">
          MediCore · v1.0
        </p>
      </aside>

      {/* Sidebar — drawer below lg */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/45"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="animate-slide-in-right relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-pop">
            <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
              <Logo />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="cursor-pointer rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <NavList role={role} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="-ml-1 cursor-pointer rounded-lg p-2 text-ink-600 transition-colors hover:bg-ink-100 lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-800 lg:text-base">
              {current?.label ?? 'MediCore'}
            </p>
          </div>

          <UserMenu />
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
