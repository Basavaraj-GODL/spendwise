import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  ScanLine,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  AlignRight
} from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { supabase } from '../supabase'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/app/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/app/ai-scan', label: 'AI Scan', icon: ScanLine, featured: true },
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/app/admin', label: 'Admin Dashboard', icon: LayoutDashboard, adminOnly: true },
]
function NavList({
  onNavigate,
  isAdmin,
}: {
  onNavigate?: () => void
  isAdmin: boolean
}) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1.5">
      <p className="mb-2 mt-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-mute">
        Workspace
      </p>

      {nav
        .filter(item => !item.adminOnly || isAdmin)
        .map(({ to, label, icon: Icon, end, }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 overflow-hidden rounded-full px-3.5 py-3 text-[13px] font-medium transition-all duration-200 ${isActive
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                : 'text-mute hover:bg-black/[0.035] hover:text-ink dark:hover:bg-white/[0.06]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <motion.span
                  layoutId="spendwise-active-nav"
                  className="absolute inset-0 z-0 rounded-full border border-orange-500/20 bg-orange-500/[0.08]"
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 32,
                  }}
                  aria-hidden="true"
                />

                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={`shrink-0 transition-colors ${isActive ? 'text-orange-500' : 'text-mute group-hover:text-orange-500'
                    }`}
                />

                <span className="flex-1">{label}</span>



                {isActive && <ChevronRight size={14} className="text-orange-500" />}
              </>
            )}
          </NavLink>
        ))}
    </nav>
  )
}

export default function AppShell() {
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const location = useLocation()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function checkAdminRole() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (active) setIsAdmin(false)
        return
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (active) {
        setIsAdmin(!error && data?.role === 'admin')
      }
    }

    checkAdminRole()

    return () => {
      active = false
    }
  }, [])

  const currentPage =
    nav.find(item =>
      item.end
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to)
    )?.label ?? 'SpendWise'

  async function signOut() {
    setError('')
    setMessage('')

    const confirmed = window.confirm('Are you sure you want to sign out?')
    if (!confirmed) return

    const { error } = await supabase.auth.signOut()

    if (error) {
      setError(error.message)
      return
    }

    window.location.assign('/login')
  }

  return (
    <div className="min-h-screen w-full min-w-0 bg-base text-ink lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-line/[var(--line-a)] bg-card/80 p-5 lg:flex lg:flex-col">
        <div className="mb-9 px-2 pt-1">
          <Logo />
        </div>

        <NavList isAdmin={isAdmin} />


      </aside>

      {/* Main content */}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-[68px] min-w-0 items-center justify-between border-b border-line/[var(--line-a)] bg-base/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line/[var(--line-a)] bg-card text-ink shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/40 hover:text-orange-500 hover:shadow-md active:scale-95 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={19} />
            </button>

            <div className="lg:hidden">
              <Logo />
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">
                Your workspace
              </p>
              <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-ink">
                {currentPage}
              </h1>
            </div>
          </div>
          <div className="flex gap-7">
            <button id="btn-sign-out" type="button" onClick={() => void signOut()}>
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                Sign out
                <LogOut size={16} />
              </span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9 lg:py-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
              transition={{
                duration: 0.28,
                ease: [0.22, 0.61, 0.36, 1],
              }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile navigation */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[3px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.aside
              className="flex h-full w-[min(310px,86vw)] flex-col border-r border-line/[var(--line-a)] bg-card p-5 shadow-2xl"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={event => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="mb-8 flex items-center justify-between">
                <Logo />
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full border border-line/[var(--line-a)] bg-card text-mute shadow-sm transition-all duration-300 hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-500 active:scale-95"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X size={18} />
                </button>
              </div>

              <NavList
                isAdmin={isAdmin}
                onNavigate={() => setOpen(false)}
              />

              <div className="mt-auto border-t border-line/[var(--line-a)] pt-4">
                <p className="text-xs text-mute">SpendWise · Personal Finance</p>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}