import { useCallback, useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Inbox,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
  CalendarDays,
  Activity,
  ArrowUpRight,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import LoadingAnimation from '../components/Loader.tsx'
import { supabase } from '../supabase'
import { formatINR } from '../lib/format'
// import { div } from 'motion/react-m'

type Transaction = {
  id: string
  amount_paise: number
  type: 'income' | 'expense'
  category: string
  transaction_date: string
}

type Totals = {
  balance: number
  income: number
  expenses: number
  savings: number
}

const initialTotals: Totals = {
  balance: 0,
  income: 0,
  expenses: 0,
  savings: 0,
}

function AnimatedAmount({ value }: { value: number }) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, {
    stiffness: 65,
    damping: 20,
    mass: 0.8,
  })
  const rounded = useTransform(spring, latest =>
    formatINR(Math.round(latest * 100) / 100),
  )
  const [display, setDisplay] = useState(formatINR(0))

  useEffect(() => {
    const unsubscribe = rounded.on('change', setDisplay)
    motionValue.set(value)
    return unsubscribe
  }, [motionValue, rounded, value])

  return <span className="tabular-nums">{display}</span>
}

const cardMotion = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const location = useLocation()
  const [totals, setTotals] = useState<Totals>(initialTotals)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data: userData, error: userError } =
      await supabase.auth.getUser()

    if (userError || !userData.user) {
      setError('Please log in to view your dashboard.')
      setLoading(false)
      return
    }

    const { data, error: queryError } = await supabase
      .from('transactions')
      .select('id, amount_paise, type, category, transaction_date')
      .eq('user_id', userData.user.id)
      .order('transaction_date', { ascending: false })
    console.log('Logged-in user ID:', userData.user.id)

    if (queryError) {
      setError('Could not load your transactions. Please try again.')
      setLoading(false)
      return
    }

    const rows = (data ?? []) as Transaction[]
    setTransactions(rows)

    const incomePaise = rows
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount_paise), 0)

    const expensePaise = rows
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount_paise), 0)

    const balancePaise = incomePaise - expensePaise
    console.log('Income rows:', rows.filter(item => item.type === 'income'))
    console.log('Total income in paise:', incomePaise)
    console.log('Total income in rupees:', incomePaise)

    setTotals({
      balance: balancePaise,
      income: incomePaise,
      expenses: expensePaise,
      savings: balancePaise,
    })

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard, location.key])

  const cards = [
    {
      label: 'Total balance',
      value: totals.balance,
      icon: Wallet,
      iconColor: 'text-[#F97316]',
      iconBg: 'bg-orange-500/10',
      description: 'Income minus expenses',
    },
    {
      label: 'Total income',
      value: totals.income,
      icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      description: 'Money received',
    },
    {
      label: 'Total expenses',
      value: totals.expenses,
      icon: TrendingDown,
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-500/10',
      description: 'Money spent',
    },
    {
      label: 'Available savings',
      value: totals.savings,
      icon: PiggyBank,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-500/10',
      description: 'Balance after expenses',
    },
  ]

  const recentTransactions = transactions.slice(0, 5)
  const incomePercent =
    totals.income + totals.expenses > 0
      ? (totals.income / (totals.income + totals.expenses)) * 100
      : 0

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingAnimation />
      </div>
    )
  }
  return (
    <div className="min-h-full space-y-7 bg-base p-1 text-ink sm:space-y-9">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
        className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
      >
        <motion.div variants={cardMotion}>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Good things start with <span className="text-[#F97316]">clarity.</span>
          </h1>
          <p className="mt-2 text-sm text-mute">
            Your money at a glance. Make every rupee count.
          </p>
        </motion.div>

        <motion.div variants={cardMotion} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-line/[var(--line-a)] bg-card px-3 py-2.5 text-xs text-mute">
            <CalendarDays size={15} className="text-[#F97316]" />
            {today}
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            aria-label="Refresh dashboard"
            className="grid size-11 place-items-center rounded-full border border-line/[var(--line-a)] bg-card text-mute shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-500/100/10 hover:text-[#F97316] hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? 'animate-spin text-[#F97316]' : 'transition-transform duration-300 hover:rotate-45'}
            />
          </button>
          <Link
            to="/app/transactions"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-[#EA580C]"
          >
            <Plus size={17} />
            Add transaction
          </Link>
        </motion.div>
      </motion.section>

      {
        error && (
          <div role="alert" className="rounded-2xl border border-red-500/30 bg-card p-4 text-sm text-red-600 dark:text-red-400">
            {error}
            <button type="button" onClick={() => void loadDashboard()} className="ml-2 font-semibold underline">
              Try again
            </button>
          </div>
        )
      }
      <motion.section
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4"
      >
        {cards.map(({ label, value, icon: Icon, iconColor, iconBg, description }, i) => (
          <motion.article
            key={label}
            variants={cardMotion}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            whileHover={{ y: -5 }}
            className={`group relative overflow-hidden rounded-3xl border border-line/[var(--line-a)] bg-card p-5 shadow-[0_3px_14px_rgba(0,0,0,0.025)] transition-shadow duration-300 hover:shadow-xl hover:shadow-orange-900/5 sm:p-6 ${i === 0 ? 'border-orange-500/30' : ''}`}
          >
            {i === 0 && (
              <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-orange-500/10 transition-transform duration-500 group-hover:scale-125" />
            )}
            <div className="relative flex items-center justify-between">
              <span className="text-sm font-medium text-mute">{label}</span>
              <span className={`grid size-11 place-items-center rounded-2xl ${iconBg}`}>
                <Icon size={20} className={iconColor} />
              </span>
            </div>
            <div className="relative mt-7">
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                {loading ? (
                  <span className="inline-block h-8 w-32 animate-pulse rounded-lg bg-line/5" />
                ) : (
                  <AnimatedAmount value={value} />
                )}
              </p>
              <p className="mt-2 text-xs text-mute">{description}</p>
            </div>
            <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-line/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${loading ? 0 : i === 0 ? Math.min(Math.abs(value) / Math.max(totals.income, 1) * 100, 100) : i === 1 ? 100 : i === 2 ? incomePercent : 65}%` }}
                transition={{ duration: 1, delay: 0.2 + i * 0.12 }}
                className={`h-full rounded-full ${i === 0 ? 'bg-[#F97316]' : i === 1 ? 'bg-emerald-500/100' : i === 2 ? 'bg-rose-500/100' : 'bg-violet-500/100'}`}
              />
            </div>
          </motion.article>
        ))}
      </motion.section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl border border-line/[var(--line-a)] bg-card p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F97316]">

                FINANCIAL ACTIVITY
              </div>
              <h2 className="mt-2 text-xl font-bold">Your money overview</h2>
              <p className="mt-1 text-sm text-mute">A simple look at money coming in and going out.</p>
            </div>
          
          </div>

          <div className="mt-8 rounded-2xl bg-base p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-mute">Income recorded</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{loading ? '...' : formatINR(totals.income)}</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-line/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${loading ? 0 : incomePercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-emerald-500/100"
              />
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-sm text-mute">Expenses recorded</span>
              <span className="text-sm font-bold text-[#EA580C] dark:text-orange-400">{loading ? '...' : formatINR(totals.expenses)}</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-line/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${loading ? 0 : 100 - incomePercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-[#F97316]"
              />
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-mute">
              <span className="size-2 rounded-full bg-emerald-500/100" />
              Income
              <span className="ml-3 size-2 rounded-full bg-[#F97316]" />
              Expenses
              <span className="ml-auto">All-time totals</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/10/70 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold">Want a clearer picture?</p>
              <p className="mt-1 text-xs text-mute">Explore your spending patterns and financial trends.</p>
            </div>
            <Link to="/app/analytics" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#EA580C] dark:text-orange-400 hover:gap-3">
              Open analytics <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="flex flex-col rounded-3xl border border-line/[var(--line-a)] bg-card p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-mute">LATEST ACTIVITY</p>
              <h2 className="mt-2 text-xl font-bold">Recent transactions</h2>
            </div>
            <span className="grid size-11 place-items-center rounded-2xl bg-line/5 text-mute">
              <Inbox size={20} />
            </span>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="flex items-center gap-3">
                  <div className="size-11 animate-pulse rounded-2xl bg-line/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-line/5" />
                    <div className="h-2 w-16 animate-pulse rounded bg-line/5" />
                  </div>
                  <div className="h-4 w-16 animate-pulse rounded bg-line/5" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-orange-500/10 text-[#F97316]">
                <Inbox size={24} />
              </span>
              <p className="mt-4 font-semibold">Your story starts here</p>
              <p className="mt-2 max-w-xs text-sm text-mute">Add your first transaction to see your financial activity appear here.</p>
              <Link to="/app/transactions" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white">
                <Plus size={16} /> Add transaction
              </Link>
            </div>
          ) : (
            <div className="mt-5 flex-1 divide-y divide-line/[var(--line-a)]">
              {recentTransactions.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="group flex items-center gap-3 py-4 first:pt-0"
                >
                  <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${item.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-[#EA580C] dark:text-orange-400'}`}>
                    {item.type === 'income' ? <TrendingUp size={19} /> : <TrendingDown size={19} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink group-hover:text-[#EA580C] dark:group-hover:text-orange-400">{item.category}</p>
                    <p className="mt-1 text-xs text-mute">{item.transaction_date}</p>
                  </div>
                  <p className={`whitespace-nowrap text-sm font-bold ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink'}`}>
                    {item.type === 'income' ? '+' : '−'}
                    {formatINR(Number(item.amount_paise) / 100)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          <Link to="/app/transactions" className="mt-5 inline-flex items-center gap-2 border-t border-line/[var(--line-a)] pt-4 text-sm font-semibold text-[#EA580C] dark:text-orange-400">
            View all transactions
            <ArrowUpRight size={17} />
          </Link>
        </motion.div>
      </section>
    </div>
  )
}