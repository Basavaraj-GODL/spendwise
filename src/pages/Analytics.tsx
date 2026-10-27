
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import LoadingAnimation from '../components/Loader.tsx'
import { TrendingDown, Wallet, RefreshCw, ChartNoAxesCombined } from 'lucide-react'
import { supabase } from '../supabase'
import { formatINR } from '../lib/format'

type Transaction = {
  id: string
  amount_paise: number
  type: 'income' | 'expense'
  category: string
  transaction_date: string
}

type CategoryTotal = {
  name: string
  paise: number
}

const COLORS = [
  '#8b5cf6',
  '#06b6d4',
  '#f59e0b',
  '#f43f5e',
  '#10b981',
  '#3b82f6',
  '#ec4899',
  '#a3e635',
]

export default function Analytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadTransactions() {
    setLoading(true)
    setError('')

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setError('Please sign in to view your analytics.')
      setLoading(false)
      return
    }

    const { data, error: queryError } = await supabase
      .from('transactions')
      .select('id, amount_paise, type, category, transaction_date')
      .eq('user_id', userData.user.id)
      .order('transaction_date', { ascending: false })

    if (queryError) {
      setError('Could not load transactions. Please try again.')
      setLoading(false)
      return
    }

    setTransactions((data ?? []) as Transaction[])
    setLoading(false)
  }

  useEffect(() => {
    void loadTransactions()
  }, [])

  const expenses = transactions.filter((t) => t.type === 'expense')
  const income = transactions.filter((t) => t.type === 'income')

  const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount_paise), 0)
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount_paise), 0)

  const categoryMap = new Map<string, number>()

  expenses.forEach((t) => {
    categoryMap.set(
      t.category,
      (categoryMap.get(t.category) ?? 0) + Number(t.amount_paise),
    )
  })

  const categoryData: CategoryTotal[] = Array.from(categoryMap, ([name, paise]) => ({
    name,
    paise,
  })).sort((a, b) => b.paise - a.paise)

  const monthlyMap = new Map<string, number>()

  expenses.forEach((t) => {
    const month = t.transaction_date.slice(0, 7)
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + Number(t.amount_paise))
  })

  const monthlyData = Array.from(monthlyMap, ([month, paise]) => ({
    month,
    paise,
    label: new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN', {
      month: 'short',
      year: '2-digit',
    }),
  }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)

  const chartTooltipStyle = {
    backgroundColor: '#151923',
    border: '1px solid #303746',
    borderRadius: '12px',
    color: '#f8fafc',
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
            Spending Analytics
          </h1>
          <p className="mt-2 text-sm text-mute">
            Understand your spending patterns at a glance.
          </p>
        </div>

        <button
            type="button"
            onClick={() => void loadTransactions()}
            disabled={loading}
            aria-label="Refresh dashboard"
            className="grid size-11 place-items-center rounded-full border border-line/[var(--line-a)] bg-card text-mute shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-500/100/10 hover:text-[#F97316] hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? 'animate-spin text-[#F97316]' : 'transition-transform duration-300 hover:rotate-45'}
            />
          </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="fixed inset-0 z-50 flex min-h-[60vh] items-center justify-center bg-base">
          <LoadingAnimation />
        </div>
      ) : (
        <>
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass min-w-0 rounded-2xl p-4 sm:p-5">
              <TrendingDown className="mb-4 text-rose-400" size={22} />
              <p className="text-sm text-mute">Total expenses</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{formatINR(totalExpenses)}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass min-w-0 rounded-2xl p-4 sm:p-5">
              <Wallet className="mb-4 text-emerald-400" size={22} />
              <p className="text-sm text-mute">Total income</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{formatINR(totalIncome)}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass min-w-0 rounded-2xl p-4 sm:p-5">
              <ChartNoAxesCombined className="mb-4 text-violet-400" size={22} />
              <p className="text-sm text-mute">Categories used</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{categoryData.length}</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <section className="glass min-w-0 rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Expenses by category</h2>
              <p className="mt-1 text-sm text-mute">Where your recorded money goes.</p>

              {categoryData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-center text-sm text-mute">
                  No expenses recorded yet.
                </div>
              ) : (
                <div className="mt-4 h-64 w-full min-w-0 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="paise"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={62}
                        outerRadius={94}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatINR(Number(value))}
                        contentStyle={chartTooltipStyle}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="glass min-w-0 rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Monthly expenses</h2>
              <p className="mt-1 text-sm text-mute">Your last six recorded spending months.</p>

              {monthlyData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-center text-sm text-mute">
                  No monthly spending data yet.
                </div>
              ) : (
                <div className="mt-4 h-64 w-full min-w-0 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 4, left: 4, bottom: 4 }}>
                      <CartesianGrid stroke="#303746" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis
                        width={64}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        tickFormatter={(value) => `₹${Math.round(Number(value) / 100)}`}
                      />
                      <Tooltip
                        formatter={(value) => formatINR(Number(value))}
                        contentStyle={chartTooltipStyle}
                      />
                      <Bar dataKey="paise" name="Expenses" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          <section className="glass rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Category details</h2>
            <p className="mt-1 text-sm text-mute">A complete breakdown of your recorded expenses.</p>

            {categoryData.length === 0 ? (
              <p className="mt-6 text-sm text-mute">Add an expense to see your category breakdown.</p>
            ) : (
              <div className="mt-5 space-y-5">
                {categoryData.map((item, index) => {
                  const percentage = totalExpenses > 0 ? (item.paise / totalExpenses) * 100 : 0

                  return (
                    <div key={item.name}>
                      <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="flex items-center gap-2 font-medium text-ink">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {item.name}
                        </span>
                        <span className="break-words text-sm text-mute sm:text-right">
                          {formatINR(item.paise)} · {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-base/70">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
