
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Wallet, RefreshCw, AlertTriangle } from 'lucide-react'
import { supabase } from '../supabase'
import { formatINR } from '../lib/format'

type Budget = {
  id: string
  user_id: string
  category: string
  monthly_limit_paise: number
  month: string
}

type Transaction = {
  amount_paise: number
  category: string
  type: 'income' | 'expense'
  transaction_date: string
}

const categories = [
  'Food', 'Travel', 'Shopping', 'Education',
  'Bills', 'Entertainment', 'Salary', 'Other',
]

function currentMonth() {
  return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
}

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [category, setCategory] = useState('Food')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState(currentMonth())
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setMessage('')

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setMessage('Please sign in to manage your budgets.')
      setLoading(false)
      return
    }

    const [budgetResult, transactionResult] = await Promise.all([
      supabase
        .from('budgets')
        .select('id, user_id, category, monthly_limit_paise, month')
        .eq('user_id', userData.user.id)
        .order('month', { ascending: false }),
      supabase
        .from('transactions')
        .select('amount_paise, category, type, transaction_date')
        .eq('user_id', userData.user.id)
        .eq('type', 'expense'),
    ])

    if (budgetResult.error || transactionResult.error) {
      setMessage(budgetResult.error?.message ?? transactionResult.error?.message ?? 'Could not load budgets.')
      setLoading(false)
      return
    }

    setBudgets((budgetResult.data ?? []) as Budget[])
    setTransactions((transactionResult.data ?? []) as Transaction[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')

    const rupees = Number(amount)
    if (!Number.isFinite(rupees) || rupees <= 0) {
      setMessage('Enter a budget amount greater than zero.')
      return
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setMessage('Please sign in again.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('budgets').upsert(
      {
        user_id: userData.user.id,
        category,
        monthly_limit_paise: Math.round(rupees * 100),
        month,
      },
      { onConflict: 'user_id,category,month' },
    )

    setSaving(false)

    if (error) {
      setMessage(`Could not save budget: ${error.message}`)
      return
    }

    setAmount('')
    setMessage('Budget saved successfully!')
    await loadData()
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this budget?')) return

    const { error } = await supabase.from('budgets').delete().eq('id', id)

    if (error) {
      setMessage(`Could not delete budget: ${error.message}`)
      return
    }

    setMessage('Budget deleted.')
    await loadData()
  }

  const selectedMonthBudgets = budgets.filter((budget) => budget.month === month)

  const getSpent = (budget: Budget) => {
    const start = budget.month
    const endDate = new Date(`${start}T12:00:00`)
    endDate.setMonth(endDate.getMonth() + 1)
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`

    return transactions
      .filter((transaction) =>
        transaction.category === budget.category &&
        transaction.transaction_date >= start &&
        transaction.transaction_date < end,
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount_paise), 0)
  }

  const totalLimit = selectedMonthBudgets.reduce(
    (sum, budget) => sum + Number(budget.monthly_limit_paise), 0,
  )
  const totalSpent = selectedMonthBudgets.reduce(
    (sum, budget) => sum + getSpent(budget), 0,
  )

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mute">
            YOUR MONEY, YOUR CONTROL
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Monthly Budgets</h1>
          <p className="mt-2 text-sm text-mute">
            Set spending limits and keep track of your expenses.
          </p>
        </div>

        <button onClick={() => void loadData()} className="btn btn-secondary">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-line/10 bg-base p-4 text-sm text-ink">
          {message}
        </div>
      )}

      <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="glass min-w-0 rounded-2xl p-4 sm:p-5">
          <Wallet size={22} className="mb-4 text-violet-400" />
          <p className="text-sm text-mute">Monthly budget</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatINR(totalLimit)}</p>
        </div>
        <div className="glass min-w-0 rounded-2xl p-4 sm:p-5">
          <AlertTriangle size={22} className="mb-4 text-amber-400" />
          <p className="text-sm text-mute">Spent in budget categories</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatINR(totalSpent)}</p>
        </div>
        <div className="glass min-w-0 rounded-2xl p-4 sm:p-5">
          <Wallet size={22} className="mb-4 text-emerald-400" />
          <p className="text-sm text-mute">Remaining</p>
          <p className={`mt-2 text-2xl font-semibold ${totalLimit - totalSpent < 0 ? 'text-rose-400' : 'text-ink'}`}>
            {formatINR(totalLimit - totalSpent)}
          </p>
        </div>
      </div>

      <section className="glass rounded-2xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Create or update a budget</h2>
        <p className="mt-1 break-words text-xs text-mute sm:text-sm">
          One budget per category each month. Saving the same category again updates its limit.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm text-mute">
            Category
          
<select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  className="mt-2 block w-full min-w-0 rounded-xl border border-line/10 bg-base p-3 text-sm text-ink sm:text-base"
  style={{
    color: 'rgb(var(--ink))',
    backgroundColor: 'rgb(var(--base))',
    colorScheme: 'dark',
  }}
>
  {categories.filter((item) => item !== 'Salary').map((item) => (
    <option
      key={item}
      value={item}
      style={{ color: '#ffffff', backgroundColor: '#10162e' }}
    >
      {item}
    </option>
  ))}
</select>
          </label>

          <label className="text-sm text-mute">
            Monthly limit (₹)
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            />
          </label>

          <label className="text-sm text-mute">
            Month
            <input
              type="month"
              required
              value={month.slice(0, 7)}
              onChange={(e) => setMonth(`${e.target.value}-01`)}
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            />
          </label>

          <div className="flex items-end">
            <button type="submit" disabled={saving} className="btn btn-primary w-full">
              <Plus size={16} /> {saving ? 'Saving...' : 'Save budget'}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Your category budgets</h2>

        {loading ? (
          <div className="glass rounded-2xl p-8 text-center text-mute">Loading budgets...</div>
        ) : selectedMonthBudgets.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Wallet className="mx-auto mb-3 text-mute" size={32} />
            <p className="font-medium text-ink">No budgets for this month yet</p>
            <p className="mt-2 text-sm text-mute">Create your first category budget using the form above.</p>
          </div>
        ) : (
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
            {selectedMonthBudgets.map((budget, index) => {
              const spent = getSpent(budget)
              const limit = Number(budget.monthly_limit_paise)
              const percentage = limit > 0 ? (spent / limit) * 100 : 0
              const exceeded = spent > limit

              return (
                <motion.article
                  key={budget.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="glass min-w-0 rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-ink">{budget.category}</h3>
                      <p className="mt-1 text-sm text-mute">
                        {formatINR(spent)} spent of {formatINR(limit)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(budget.id)}
                      aria-label={`Delete ${budget.category} budget`}
                      className="rounded-lg p-2 text-mute transition hover:bg-red-400/10 hover:text-red-400"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-base/70">
                    <div
                      className={`h-full rounded-full transition-all ${exceeded ? 'bg-rose-400' : 'bg-violet-400'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className={exceeded ? 'font-medium text-rose-400' : 'text-mute'}>
                      {exceeded ? `Over budget by ${formatINR(spent - limit)}` : `${percentage.toFixed(1)}% used`}
                    </span>
                    <span className="text-mute">
                      {formatINR(Math.max(limit - spent, 0))} remaining
                    </span>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
