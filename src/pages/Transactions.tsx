
import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, ArrowLeftRight } from 'lucide-react'
import { supabase } from '../supabase'
import { formatINR } from '../lib/format'
import LoadingAnimation from '../components/Loader.tsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
type Transaction = {
  id: string
  user_id: string
  title: string
  amount_paise: number
  type: 'income' | 'expense'
  category: string
  transaction_date: string
  notes: string | null
}

const categories = [
  'Food', 'Travel', 'Shopping', 'Education',
  'Bills', 'Entertainment', 'Salary', 'Other',
]

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState(
    new Date().toLocaleDateString('en-CA')
  )
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadTransactions() {
    setLoading(true)

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
    } else {
      setTransactions((data ?? []) as Transaction[])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadTransactions()
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')
    const rupees = Number(amount)
    const paise = Math.round(rupees * 100)

    if (!Number.isFinite(rupees) || rupees <= 0 || !Number.isSafeInteger(paise)) {
      setMessage('Enter a valid amount greater than zero.')
      return
    }

    setSaving(true)

    const { data: userData, error: userError } =
      await supabase.auth.getUser()

    if (userError || !userData.user) {
      setMessage('Your session has expired. Please log in again.')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('transactions').insert({
      user_id: userData.user.id,
      title: title.trim(),
      amount_paise: paise,
      type,
      category,
      transaction_date: date,
      notes: notes.trim() || null,
    })

    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setTitle('')
    setAmount('')
    setNotes('')
    setMessage('Transaction saved successfully!')

    await loadTransactions()
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction?'
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setTransactions(current =>
      current.filter(transaction => transaction.id !== id)
    )
    setMessage('Transaction deleted.')
  }
  function downloadTransactionsPDF() {
    if (transactions.length === 0) {
      setMessage('No transactions available to export.')
      return
    }

    const doc = new jsPDF()

    const formatPDFMoney = (paise: number) =>
      `INR ${(Number(paise) / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`

    const income = transactions
      .filter(transaction => transaction.type === 'income')
      .reduce((sum, transaction) => sum + Number(transaction.amount_paise), 0)

    const expenses = transactions
      .filter(transaction => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + Number(transaction.amount_paise), 0)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('SpendWise - Transactions Report', 14, 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30)
    doc.text(`Total Income: ${formatPDFMoney(income)}`, 14, 40)
    doc.text(`Total Expenses: ${formatPDFMoney(expenses)}`, 14, 48)
    doc.text(`Net Balance: ${formatPDFMoney(income - expenses)}`, 14, 56)
    doc.text(`Total Transactions: ${transactions.length}`, 14, 64)

    autoTable(doc, {
      startY: 72,
      margin: { left: 14, right: 14 },
      head: [['Date', 'Title', 'Type', 'Category', 'Amount']],
      body: transactions.map(transaction => [
        transaction.transaction_date || 'No date',
        transaction.title || '',
        transaction.type,
        transaction.category || 'Other',
        formatPDFMoney(Number(transaction.amount_paise)),
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 27 },
        1: { cellWidth: 48 },
        2: { cellWidth: 23 },
        3: { cellWidth: 35 },
        4: { cellWidth: 45, halign: 'right' },
      },
      headStyles: {
        fillColor: [91, 65, 190],
        textColor: 255,
      },
      didDrawPage: () => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber}`,
          196,
          287,
          { align: 'right' }
        )
      },
    })

    doc.save(`spendwise-transactions-${new Date().toISOString().slice(0, 10)}.pdf`)
  }
  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="break-words font-display text-xl font-semibold sm:text-2xl">
          Transactions
        </h1>
        <button
          type="button"
          className="install-btn"
          aria-label="Download transactions report as PDF"
          title="Download transactions report as PDF"
          onClick={downloadTransactionsPDF}
          disabled={loading || transactions.length === 0}
        >
          <svg
            className="install-btn__svg"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <defs>
              <mask id="install-mask">
                <circle
                  className="install-btn__mask-circle"
                  cx="50"
                  cy="50"
                  r="20"
                  strokeDasharray="39.2 13.6"
                  strokeLinecap="round"
                />
              </mask>
            </defs>

            <circle
              className="install-btn__track"
              cx="50"
              cy="50"
              r="20"
              strokeDasharray="39.2 13.6"
              strokeLinecap="round"
            />

            <circle
              className="install-btn__fill"
              cx="50"
              cy="50"
              r="20"
              mask="url(#install-mask)"
            />
          </svg>

          <svg
            className="install-btn__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

      </div>
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <motion.section
          className="glass min-w-0 rounded-2xl p-4 sm:p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-5 flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold">
              Add transaction
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="transaction-type" className="mb-1 block text-sm text-mute">
                Transaction type
              </label>
              <select
                id="transaction-type"
                value={type}
                onChange={e => setType(e.target.value as 'income' | 'expense')}
                className="w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label htmlFor="transaction-title" className="mb-1 block text-sm text-mute">
                Title
              </label>
              <input
                id="transaction-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Lunch, college fees, salary"
                maxLength={100}
                required
                className="block w-full min-w-0 rounded-xl border border-line/10 bg-base p-3 text-sm text-ink"
              />
            </div>

            <div>
              <label htmlFor="transaction-amount" className="mb-1 block text-sm text-mute">
                Amount (₹)
              </label>
              <input
                id="transaction-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
              />
            </div>

            <div>
              <label htmlFor="transaction-category" className="mb-1 block text-sm text-mute">
                Category
              </label>
              <select
                id="transaction-category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
              >
                {categories.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="transaction-date" className="mb-1 block text-sm text-mute">
                Date
              </label>
              <input
                id="transaction-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
              />
            </div>

            <div>
              <label htmlFor="transaction-notes" className="mb-1 block text-sm text-mute">
                Notes (optional)
              </label>
              <textarea
                id="transaction-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary w-full disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save transaction'}
            </button>
          </form>

          {message && (
            <p role="status" className="mt-4 break-words text-sm text-cyan">
              {message}
            </p>
          )}
        </motion.section>

        <section className="glass min-w-0 rounded-2xl p-4 sm:p-6">
          <h2 className="mb-5 font-display text-lg font-semibold">
            Recent transactions
          </h2>

          {loading ? (
            <div className=" flex min-h-[60vh] items-center justify-center">
              <LoadingAnimation />
            </div>
          ) : transactions.length === 0 ? (
            <div className="grid place-items-center py-12 text-center">
              <ArrowLeftRight size={28} className="mb-3 text-mute" />
              <p className="font-medium">No transactions yet</p>
              <p className="mt-1 text-sm text-mute">
                Add your first income or expense.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(transaction => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-line/10 p-2.5 sm:gap-3 sm:p-3"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet/15 text-violet">
                    {transaction.type === 'income' ? '↗' : '↘'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{transaction.title}</p>
                    <p className="text-xs text-mute">
                      {transaction.category} · {transaction.transaction_date}
                    </p>
                  </div>

                  <div className="min-w-0 shrink-0 text-right">
                    <p className={`whitespace-nowrap text-sm font-semibold ${transaction.type === 'income' ? 'text-emerald' : 'text-violet'
                      }`}>
                      {transaction.type === 'income' ? '+' : '−'}
                      {formatINR(transaction.amount_paise)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleDelete(transaction.id)}
                      aria-label={`Delete ${transaction.title}`}
                      className="mt-1 text-mute transition hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div >
  )
}
