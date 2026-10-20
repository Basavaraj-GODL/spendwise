
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Inbox,
  ArrowRight,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { formatINR } from '../lib/format'

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

    setTotals({
      balance: balancePaise / 100,
      income: incomePaise / 100,
      expenses: expensePaise / 100,
      savings: balancePaise / 100,
    })

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard, location.key])

  const cards = [
    {
      label: 'Balance',
      value: totals.balance,
      icon: Wallet,
      color: 'text-cyan-400',
      background: 'bg-cyan-400/10',
    },
    {
      label: 'Income',
      value: totals.income,
      icon: TrendingUp,
      color: 'text-emerald-400',
      background: 'bg-emerald-400/10',
    },
    {
      label: 'Expenses',
      value: totals.expenses,
      icon: TrendingDown,
      color: 'text-violet-400',
      background: 'bg-violet-400/10',
    },
    {
      label: 'Savings',
      value: totals.savings,
      icon: PiggyBank,
      color: 'text-amber-400',
      background: 'bg-amber-400/10',
    },
  ]

  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="space-y-4 sm:space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-400">
            YOUR MONEY, YOUR CONTROL
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-mute">
            Your personal financial overview, all in one place.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            aria-label="Refresh dashboard"
            className="btn btn-ghost"
          >
            <RefreshCw size={17} />
          </button>
          <Link
            to="/app/transactions"
            className="btn btn-primary flex-1 sm:flex-none"
          >
            <Plus size={18} />
            Add transaction
          </Link>
        </div>
      </section>

      {error && (
        <div role="alert" className="glass rounded-xl p-4 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="ml-2 underline"
          >
            Try again
          </button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, background }, i) => (
          <motion.div
            key={label}
            className="glass min-w-0 overflow-hidden rounded-2xl p-2.5 sm:p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-mute sm:text-sm">{label}</span>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${background}`}>
                <Icon size={18} className={color} />
              </span>
            </div>

            <p className="dashboard-amount mt-3 break-words font-display text-base font-bold leading-tight tabular-nums sm:mt-4 sm:text-2xl">
  {loading ? '...' : formatINR(value)}
</p>
            <p className="mt-1 text-xs text-mute">
              {label === 'Balance'
                ? 'Income − expenses'
                : label === 'Savings'
                  ? 'Balance after expenses'
                  : 'All recorded transactions'}
            </p>
          </motion.div>
        ))}
      </section>

      <section className="glass rounded-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Recent transactions
            </h2>
            <p className="mt-1 text-sm text-mute">
              Your latest recorded activity.
            </p>
          </div>
          <Inbox size={20} className="shrink-0 text-violet-400" />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-mute">
            Loading your activity...
          </p>
        ) : recentTransactions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-medium">No transactions yet</p>
            <p className="mt-2 text-sm text-mute">
              Add your first income or expense to get started.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {recentTransactions.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-line/10 p-3"
              >
                <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                  item.type === 'income'
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'bg-violet-400/10 text-violet-400'
                }`}>
                  {item.type === 'income' ? (
                    <TrendingUp size={18} />
                  ) : (
                    <TrendingDown size={18} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {item.category}
                  </p>
                  <p className="text-xs text-mute">
                    {item.transaction_date}
                  </p>
                </div>

                <p className={`whitespace-nowrap text-sm font-semibold ${
                  item.type === 'income'
                    ? 'text-emerald-400'
                    : 'text-violet-400'
                }`}>
                  {item.type === 'income' ? '+' : '−'}
                  {formatINR(Number(item.amount_paise) )}
                </p>
              </div>
            ))}
          </div>
        )}

        <Link
          to="/app/transactions"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
        >
          View all transactions
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}
