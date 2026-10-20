
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Target, RefreshCw, PiggyBank, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabase'
import { formatINR } from '../lib/format'

type Goal = {
  id: string
  user_id: string
  title: string
  target_paise: number
  saved_paise: number
  target_date: string | null
}

export default function SavingsGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [contributions, setContributions] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadGoals = useCallback(async () => {
    setLoading(true)
    setMessage('')

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setMessage('Please sign in to view your savings goals.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('savings_goals')
      .select('id, user_id, title, target_paise, saved_paise, target_date')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`Could not load goals: ${error.message}`)
      setLoading(false)
      return
    }

    setGoals((data ?? []) as Goal[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadGoals()
  }, [loadGoals])

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')

    const rupees = Number(target)

    if (!title.trim() || !Number.isFinite(rupees) || rupees <= 0) {
      setMessage('Enter a goal name and a target amount greater than zero.')
      return
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setMessage('Please sign in again.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('savings_goals').insert({
      user_id: userData.user.id,
      title: title.trim(),
      target_paise: Math.round(rupees * 100),
      saved_paise: 0,
      target_date: targetDate || null,
    })

    setSaving(false)

    if (error) {
      setMessage(`Could not create goal: ${error.message}`)
      return
    }

    setTitle('')
    setTarget('')
    setTargetDate('')
    setMessage('Savings goal created!')
    await loadGoals()
  }

  async function handleContribution(goal: Goal) {
    setMessage('')

    const rupees = Number(contributions[goal.id])

    if (!Number.isFinite(rupees) || rupees <= 0) {
      setMessage('Enter a contribution greater than zero.')
      return
    }

    const nextSaved = Number(goal.saved_paise) + Math.round(rupees * 100)

    const { error } = await supabase
      .from('savings_goals')
      .update({ saved_paise: nextSaved })
      .eq('id', goal.id)

    if (error) {
      setMessage(`Could not update goal: ${error.message}`)
      return
    }

    setContributions((previous) => ({ ...previous, [goal.id]: '' }))
    setMessage(`Contribution added to ${goal.title}.`)
    await loadGoals()
  }

  async function handleDelete(goal: Goal) {
    if (!window.confirm(`Delete the "${goal.title}" savings goal?`)) return

    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goal.id)

    if (error) {
      setMessage(`Could not delete goal: ${error.message}`)
      return
    }

    setMessage('Savings goal deleted.')
    await loadGoals()
  }

  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target_paise), 0)
  const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.saved_paise), 0)

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mute">
            YOUR MONEY, YOUR CONTROL
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Savings Goals</h1>
          <p className="mt-2 text-sm text-mute">
            Set a target, add contributions, and celebrate your progress.
          </p>
        </div>

        <button onClick={() => void loadGoals()} className="btn btn-secondary">
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
          <Target size={22} className="mb-4 text-violet-400" />
          <p className="text-sm text-mute">Total target</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatINR(totalTarget)}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <PiggyBank size={22} className="mb-4 text-emerald-400" />
          <p className="text-sm text-mute">Total saved</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatINR(totalSaved)}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <CheckCircle2 size={22} className="mb-4 text-cyan-400" />
          <p className="text-sm text-mute">Goals completed</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {goals.filter((goal) => Number(goal.saved_paise) >= Number(goal.target_paise)).length}
            <span className="ml-1 text-sm font-normal text-mute">/ {goals.length}</span>
          </p>
        </div>
      </div>

      <section className="glass rounded-2xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Create a savings goal</h2>

        <form onSubmit={handleCreate} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm text-mute">
            Goal name
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="e.g. New laptop"
              required
              className="mt-2 block w-full min-w-0 rounded-xl border border-line/10 bg-base p-3 text-sm text-ink sm:text-base"
            />
          </label>

          <label className="text-sm text-mute">
            Target amount (₹)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 50000"
              required
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            />
          </label>

          <label className="text-sm text-mute">
            Target date (optional)
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toLocaleDateString('en-CA')}
              className="mt-2 w-full rounded-xl border border-line/10 bg-base p-3 text-ink"
            />
          </label>

          <div className="flex items-end">
            <button type="submit" disabled={saving} className="btn btn-primary w-full">
              <Plus size={16} /> {saving ? 'Creating...' : 'Create goal'}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Your goals</h2>

        {loading ? (
          <div className="glass rounded-2xl p-8 text-center text-mute">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Target className="mx-auto mb-3 text-mute" size={32} />
            <p className="font-medium text-ink">No savings goals yet</p>
            <p className="mt-2 text-sm text-mute">Create your first goal above to start tracking progress.</p>
          </div>
        ) : (
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
            {goals.map((goal, index) => {
              const saved = Number(goal.saved_paise)
              const targetAmount = Number(goal.target_paise)
              const percentage = targetAmount > 0 ? (saved / targetAmount) * 100 : 0
              const completed = saved >= targetAmount

              return (
                <motion.article
                  key={goal.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="glass min-w-0 overflow-hidden rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
                    <div>
                      <h3 className="break-words text-base font-semibold text-ink sm:text-lg">
  {goal.title}
</h3>
                      {goal.target_date && (
                        <p className="mt-1 text-sm text-mute">
                          Target date: {goal.target_date}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(goal)}
                      aria-label={`Delete ${goal.title}`}
                      className="rounded-lg p-2 text-mute transition hover:bg-red-400/10 hover:text-red-400"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm text-mute">Saved so far</p>
                      <p className="mt-1 break-words text-lg font-semibold text-ink sm:text-xl">
  {formatINR(saved)}
</p>
                    </div>
                    <p className="max-w-full break-words text-xs text-mute sm:text-sm">
  of {formatINR(targetAmount)}
</p>
                  </div>

                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-base/70">
                    <div
                      className={`h-full rounded-full transition-all ${completed ? 'bg-emerald-400' : 'bg-violet-400'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className={completed ? 'font-medium text-emerald-400' : 'text-mute'}>
                      {completed ? 'Goal completed!' : `${percentage.toFixed(1)}% saved`}
                    </span>
                    <span className="text-mute">
                      {formatINR(Math.max(targetAmount - saved, 0))} to go
                    </span>
                  </div>

                  {!completed && (
                    <div className="mt-5 flex gap-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={contributions[goal.id] ?? ''}
                        onChange={(e) => setContributions((previous) => ({
                          ...previous,
                          [goal.id]: e.target.value,
                        }))}
                        placeholder="Contribution (₹)"
                        aria-label={`Contribution for ${goal.title}`}
                        className="min-w-0 flex-1 rounded-xl border border-line/10 bg-base p-3 text-ink"
                      />
                      <button
                        type="button"
                        onClick={() => void handleContribution(goal)}
                        className="btn btn-primary"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </motion.article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
