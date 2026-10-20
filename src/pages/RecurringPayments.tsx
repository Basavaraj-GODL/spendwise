
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, RefreshCw, Repeat, Pause, Play } from 'lucide-react'
import { supabase } from '../supabase'
import { formatINR } from '../lib/format'

type Payment = {
  id: string
  user_id: string
  title: string
  amount_paise: number
  category: string
  frequency: 'weekly' | 'monthly' | 'yearly'
  next_payment_date: string
  is_active: boolean
}

const today = () => new Date().toLocaleDateString('en-CA')

export default function RecurringPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Other')
  const [frequency, setFrequency] = useState<Payment['frequency']>('monthly')
  const [nextDate, setNextDate] = useState(today())
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      setMessage('Please sign in to view recurring payments.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('recurring_payments')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('next_payment_date', { ascending: true })

    if (error) {
      setMessage(`Could not load payments: ${error.message}`)
    } else {
      setPayments((data ?? []) as Payment[])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadPayments()
  }, [loadPayments])

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')

    const rupees = Number(amount)
    if (!title.trim() || !Number.isFinite(rupees) || rupees <= 0 || !nextDate) {
      setMessage('Enter a payment name, valid amount, and next payment date.')
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setMessage('Please sign in again.')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('recurring_payments').insert({
      user_id: userData.user.id,
      title: title.trim(),
      amount_paise: Math.round(rupees * 100),
      category,
      frequency,
      next_payment_date: nextDate,
      is_active: true,
    })
    setSaving(false)

    if (error) {
      setMessage(`Could not create payment: ${error.message}`)
      return
    }

    setTitle('')
    setAmount('')
    setCategory('Other')
    setFrequency('monthly')
    setNextDate(today())
    setMessage('Recurring payment added!')
    await loadPayments()
  }

  async function toggleActive(payment: Payment) {
    const { error } = await supabase
      .from('recurring_payments')
      .update({ is_active: !payment.is_active })
      .eq('id', payment.id)

    if (error) {
      setMessage(`Could not update payment: ${error.message}`)
      return
    }

    setMessage(payment.is_active ? 'Payment paused.' : 'Payment resumed.')
    await loadPayments()
  }

  async function deletePayment(payment: Payment) {
    if (!window.confirm(`Delete "${payment.title}"?`)) return

    const { error } = await supabase
      .from('recurring_payments')
      .delete()
      .eq('id', payment.id)

    if (error) {
      setMessage(`Could not delete payment: ${error.message}`)
      return
    }

    setMessage('Recurring payment deleted.')
    await loadPayments()
  }

  const activePayments = payments.filter((payment) => payment.is_active)
  const monthlyEstimate = activePayments.reduce((total, payment) => {
    const amountPaise = Number(payment.amount_paise)
    if (payment.frequency === 'weekly') return total + amountPaise * 52 / 12
    if (payment.frequency === 'yearly') return total + amountPaise / 12
    return total + amountPaise
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mute">
            STAY READY
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Recurring Payments</h1>
          <p className="mt-2 text-sm text-mute">
            Keep track of subscriptions, bills, and regular expenses.
          </p>
        </div>
        <button onClick={() => void loadPayments()} className="btn btn-secondary">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-line/10 bg-base p-4 text-sm text-ink">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <Repeat size={22} className="mb-4 text-violet-400" />
          <p className="text-sm text-mute">Active payments</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{activePayments.length}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-mute">Estimated monthly total</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {formatINR(Math.round(monthlyEstimate))}
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-mute">Paused payments</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {payments.length - activePayments.length}
          </p>
        </div>
      </div>

      <section className="glass rounded-2xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Add a recurring payment</h2>
        <form onSubmit={handleCreate} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm text-mute">
            Payment name
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="e.g. Spotify or Wi-Fi"
              required
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            />
          </label>

          <label className="text-sm text-mute">
            Amount (₹)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 499"
              required
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            />
          </label>

          <label className="text-sm text-mute">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            >
              {['Other', 'Subscriptions', 'Housing', 'Utilities', 'Food', 'Transport', 'Education', 'Health'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-mute">
            Frequency
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Payment['frequency'])}
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>

          <label className="text-sm text-mute">
            Next payment date
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            />
          </label>

          <div className="flex items-end">
            <button type="submit" disabled={saving} className="btn btn-primary w-full">
              <Plus size={16} /> {saving ? 'Adding...' : 'Add payment'}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Your payments</h2>

        {loading ? (
          <div className="glass rounded-2xl p-8 text-center text-mute">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Repeat className="mx-auto mb-3 text-mute" size={32} />
            <p className="font-medium text-ink">No recurring payments yet</p>
            <p className="mt-2 text-sm text-mute">Add your first payment above to track it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {payments.map((payment, index) => (
              <motion.article
                key={payment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{payment.title}</h3>
                    <p className="mt-1 text-sm text-mute">
                      {payment.category} · {payment.frequency.charAt(0).toUpperCase() + payment.frequency.slice(1)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${payment.is_active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-base text-mute'}`}>
                    {payment.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>

                <p className="mt-5 text-2xl font-semibold text-ink">
                  {formatINR(Number(payment.amount_paise))}
                </p>
                <p className="mt-1 text-sm text-mute">
                  Next payment: {payment.next_payment_date}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleActive(payment)}
                    className="btn btn-secondary"
                  >
                    {payment.is_active ? <Pause size={15} /> : <Play size={15} />}
                    {payment.is_active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePayment(payment)}
                    className="btn btn-secondary"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
