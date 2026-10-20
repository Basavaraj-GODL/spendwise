
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  ScanLine,
  PiggyBank,
  Target,
  Repeat,
  FileBarChart,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/app/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/app/ai-scan', label: 'AI Scan', icon: ScanLine },
  { to: '/app/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/app/goals', label: 'Savings goals', icon: Target },
  { to: '/app/recurring', label: 'Recurring', icon: Repeat },
  { to: '/app/reports', label: 'Reports', icon: FileBarChart },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              isActive
                ? 'bg-violet/15 text-ink shadow-[inset_2px_0_0_#22D3EE]'
                : 'text-mute hover:bg-line/5 hover:text-ink'
            }`
          }
        >
          <Icon size={18} />
          {label}
          {label === 'AI Scan' && (
            <span className="ml-auto rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
              NEW
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AppShell() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen w-full min-w-0 lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="glass hidden border-y-0 border-l-0 p-5 lg:block">
        <div className="mb-8">
          <Logo />
        </div>
        <NavList />
      </aside>

      <div>
        
<header className="glass sticky top-0 z-20 flex min-w-0 items-center justify-between border-x-0 border-t-0 px-4 py-3 sm:px-6">
  <div className="flex items-center gap-3">
    <button
      className="btn btn-ghost !px-3 lg:hidden"
      onClick={() => setOpen(true)}
      aria-label="Open menu"
    >
      <Menu size={18} />
    </button>

    <div className="lg:hidden">
      <Logo />
    </div>

    <span className="hidden text-sm text-mute lg:block">
      Your personal finance dashboard
    </span>
  </div>

  <ThemeToggle />
</header>


        <main className="mx-auto w-full min-w-0 max-w-6xl px-3 py-4 sm:p-8">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="glass h-full w-72 bg-base p-5"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Menu"
            >
              <div className="mb-8 flex items-center justify-between">
                <Logo />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
              <NavList onNavigate={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
