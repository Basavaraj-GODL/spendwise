import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ShieldCheck, ArrowLeftRight, PiggyBank, Target, Repeat, FileBarChart, Lock } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { formatINR } from '../lib/format'

// Illustrative sample only (paise). Labelled as sample in the UI. Real data starts in Stage 4.
const sample = [
  { m: 'May', v: 4200000 }, { m: 'Jun', v: 3850000 }, { m: 'Jul', v: 4600000 },
  { m: 'Aug', v: 3900000 }, { m: 'Sep', v: 4400000 }, { m: 'Oct', v: 3600000 },
]
const features = [
  { icon: ArrowLeftRight, t: 'Every rupee, categorised', d: 'Log income and expenses with payment method and notes, then search and filter in seconds.' },
  { icon: PiggyBank, t: 'Budgets that warn you', d: 'Set monthly limits overall or per category and see progress before you overspend.' },
  { icon: Target, t: 'Savings goals', d: 'Set a target and a deadline, and track how close you are.' },
  { icon: Repeat, t: 'Subscriptions and bills', d: 'Know what renews, when, and for how much.' },
  { icon: FileBarChart, t: 'Reports you can export', d: 'Pick a date range, read the charts, download a CSV.' },
]

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      <motion.div
  className="grid-bg absolute inset-x-0 top-0 h-[560px]"
  aria-hidden="true"
 animate={{ backgroundPositionY: ['0px', '44px'] }}
transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
/>
      <motion.div
  className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
  style={{ background: 'radial-gradient(#8B5CF6, #22D3EE55, transparent 70%)' }}
  animate={{ x: [-12, 12, -12], scale: [1, 1.04, 1] }}
  transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
  aria-hidden="true"
/>
      <header className="relative mx-auto flex w-full min-w-0 max-w-6xl items-center justify-between gap-2 px-3 py-4 sm:gap-4 sm:px-5 sm:py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/signup" className="btn btn-primary hidden sm:inline-flex">Create account</Link>
        </div>
      </header>

      <section className="relative mx-auto grid w-full min-w-0 max-w-6xl items-center gap-8 px-3 pb-16 pt-10 sm:gap-12 sm:px-5 sm:pb-24 sm:pt-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1 className="break-words font-display text-3xl font-bold leading-[1.08] tracking-tight sm:text-6xl">Know where your <span className="grad-text">money</span> goes before it's gone.</h1>
          <p className="mt-4 w-full max-w-lg text-base text-mute sm:mt-6 sm:text-lg">Track spending, hold yourself to budgets, and reach savings goals, all in rupees, all in one calm place.</p>
          <div className="mt-8 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
  to="/signup"
  className="btn btn-primary w-full justify-center sm:w-auto"
>
  Start tracking free
</Link>
            <Link
  to="/app"
  className="btn btn-ghost w-full justify-center sm:w-auto"
>
  Explore the dashboard
</Link>
          </div>
        </div>
        <motion.div
  className="glass relative w-full min-w-0 overflow-hidden rounded-3xl p-4 shadow-[0_0_80px_-20px_#8B5CF6] sm:p-6"
  initial={{ opacity: 0, scale: 0.96 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.7 }}
>

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-violet-300/40 bg-violet-500/20 text-xl font-bold text-violet-200 shadow-lg shadow-violet-500/20"
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            ₹
          </motion.div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-sm text-mute">Monthly spending</div>
              <div className="font-display text-3xl font-semibold tabular-nums">{formatINR(sample[sample.length - 1].v)}</div>
            </div>
            <span className="rounded-full border border-line/10 px-3 py-1 text-xs text-mute">Sample data</span>
          </div>

          <div className="mt-4 h-48" role="img" aria-label="Sample chart of monthly spending over six months">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sample}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.6} /><stop offset="100%" stopColor="#22D3EE" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fill: '#8B96B5', fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: '#10162e', border: '1px solid #ffffff22', borderRadius: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#22D3EE" strokeWidth={2} fill="url(#g)" animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      
      <section className="relative mx-auto max-w-6xl px-5 pb-24">
        <h2 className="font-display text-3xl font-semibold">Everything for your money, nothing you don't need</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-6">
          {features.map(({ icon: Icon, t, d }, i) => (
            <motion.div
              key={t}
              className={`glass rounded-2xl p-6 ${i < 2 ? 'md:col-span-3' : 'md:col-span-2'}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Icon className="mb-4 text-cyan" size={22} />
              <h3 className="font-display text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-mute">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-24">
        <div className="glass flex flex-col gap-6 rounded-3xl p-8 md:flex-row md:items-center">
          <ShieldCheck size={40} className="shrink-0 text-emerald" />
          <div>
            <h2 className="font-display text-2xl font-semibold">Your data stays yours</h2>
            <p className="mt-2 max-w-2xl text-mute">SpendWise is being built so each account can read only its own records, enforced in the database itself. Admin tools will show aggregate numbers, never your individual transactions. <span className="inline-flex items-center gap-1 text-ink"><Lock size={14} /> Database security arrives in Stage 2.</span></p>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-line/10 py-8 text-center text-sm text-mute">© 2026 SpendWise. A portfolio project.</footer>
    </div>
  )
}
