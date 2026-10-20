
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download, RefreshCw, FileBarChart, TrendingUp,
  TrendingDown, Wallet, CalendarDays,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'
import { supabase } from '../supabase'
import { formatINR } from '../lib/format'

type Transaction = {
  id: string
  title: string
  amount_paise: number
  type: 'income' | 'expense'
  category: string
  transaction_date: string
}

const currentMonth = () => new Date().toLocaleDateString('en-CA').slice(0, 7)

export default function Reports() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [month, setMonth] = useState(currentMonth())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setMessage('')

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setMessage('Please sign in to view your reports.')
      setLoading(false)
      return
    }

    const startDate = `${month}-01`
    const [year, monthNumber] = month.split('-').map(Number)
    const endDate = new Date(year, monthNumber, 0).toLocaleDateString('en-CA')

    const { data, error } = await supabase
      .from('transactions')
      .select('id, title, amount_paise, type, category, transaction_date')
      .eq('user_id', userData.user.id)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false })

    if (error) {
      setMessage(`Could not load report: ${error.message}`)
    } else {
      setTransactions((data ?? []) as Transaction[])
    }

    setLoading(false)
  }, [month])

  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])

  const income = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + Number(transaction.amount_paise), 0)

  const expenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.amount_paise), 0)

  const balance = income - expenses

  const categoryTotals = Object.values(
    transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce<Record<string, { category: string; amount: number }>>((groups, transaction) => {
        const category = transaction.category || 'Other'
        groups[category] ??= { category, amount: 0 }
        groups[category].amount += Number(transaction.amount_paise)
        return groups
      }, {}),
  ).sort((a, b) => b.amount - a.amount)

  const dailyTotals = Object.values(
    transactions.reduce<Record<string, { date: string; income: number; expenses: number }>>(
      (groups, transaction) => {
        const date = transaction.transaction_date
        groups[date] ??= { date, income: 0, expenses: 0 }
        if (transaction.type === 'income') {
          groups[date].income += Number(transaction.amount_paise) / 100
        } else {
          groups[date].expenses += Number(transaction.amount_paise) / 100
        }
        return groups
      },
      {},
    ),
  ).sort((a, b) => a.date.localeCompare(b.date))

  function downloadCSV() {
    const rows = [
      ['Date', 'Title', 'Type', 'Category', 'Amount (INR)'],
      
...transactions.map((transaction) => [
  transaction.transaction_date
    ? String(transaction.transaction_date).slice(0, 10)
    : 'No date',
  transaction.title,
  transaction.type,
  transaction.category,
  (Number(transaction.amount_paise) / 100).toFixed(2),
]),

    ]

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `spendwise-report-${month}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mute">
            YOUR FINANCIAL OVERVIEW
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Reports</h1>
          <p className="mt-2 text-sm text-mute">
            Review your income, expenses, and spending patterns.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void loadTransactions()} className="btn btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={downloadCSV} disabled={loading || transactions.length === 0} className="btn btn-primary">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <section className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={22} className="text-violet-400" />
          <div>
            <h2 className="font-semibold text-ink">Report period</h2>
            <p className="text-sm text-mute">{monthLabel}</p>
          </div>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value || currentMonth())}
          className="rounded-xl border border-line/10 bg-base p-3 text-ink"
          aria-label="Choose report month"
        />
      </section>

      {message && (
        <div className="rounded-xl border border-line/10 bg-base p-4 text-sm text-ink">
          {message}
        </div>
      )}

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-mute">Preparing your report...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total income', value: income, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Total expenses', value: expenses, icon: TrendingDown, color: 'text-rose-400' },
              { label: 'Net balance', value: balance, icon: Wallet, color: balance >= 0 ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'Transactions', value: transactions.length, icon: FileBarChart, color: 'text-violet-400', count: true },
            ].map((item) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-5"
                >
                  <Icon size={22} className={`mb-4 ${item.color}`} />
                  <p className="text-sm text-mute">{item.label}</p>
                  <p className="mt-2 break-words text-2xl font-semibold text-ink">
                    {item.count ? item.value : formatINR(item.value)}
                  </p>
                </motion.div>
              )
            })}
          </div>

          <section className="glass rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Daily cash flow</h2>
            <p className="mt-1 text-sm text-mute">Income and expenses by transaction date.</p>
            <div className="mt-6 h-72">
              {dailyTotals.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-mute">
                  No transactions for this month yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyTotals}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.12} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(date) => date.slice(8)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                    <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#fb7185" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="glass rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Expense breakdown</h2>
            <p className="mt-1 text-sm text-mute">Where your money went this month.</p>

            {categoryTotals.length === 0 ? (
              <p className="mt-6 text-sm text-mute">No expense transactions for this month.</p>
            ) : (
              <div className="mt-5 space-y-5">
                {categoryTotals.map((item) => {
                  const percentage = expenses > 0 ? (item.amount / expenses) * 100 : 0
                  return (
                    <div key={item.category}>
                      <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                        <span className="font-medium text-ink">{item.category}</span>
                        <span className="text-mute">
                          {formatINR(item.amount)} · {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-base">
                        <div
                          className="h-full rounded-full bg-violet-400"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="glass overflow-hidden rounded-2xl">
            <div className="border-b border-line/10 p-5">
              <h2 className="text-lg font-semibold text-ink">Transactions in this report</h2>
              <p className="mt-1 text-sm text-mute">{transactions.length} records · {monthLabel}</p>
            </div>

            {transactions.length === 0 ? (
              <p className="p-6 text-sm text-mute">No transactions found for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-base/60 text-mute">
                    <tr>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Title</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-t border-line/10">
                        <td className="p-4 text-mute">{transaction.transaction_date}</td>
                        <td className="p-4 font-medium text-ink">{transaction.title}</td>
                        <td className="p-4 text-mute">{transaction.category}</td>
                        <td className={`p-4 capitalize ${transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {transaction.type}
                        </td>
                        <td className="p-4 text-right font-medium text-ink">
                          {formatINR(Number(transaction.amount_paise))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
