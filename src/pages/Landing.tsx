import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ArrowLeftRight, FileBarChart, } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import Grainient from '../components/Grainient'
import { formatINR } from '../lib/format'

// Illustrative sample only (paise). Labelled as sample in the UI. Real data starts in Stage 4.
const sample = [
  { m: 'Jan', v: 4200000 }, { m: 'Feb', v: 3850000 }, { m: 'Mar', v: 4600000 },
  { m: 'Apr', v: 3900000 }, { m: 'May', v: 4400000 }, { m: 'Jun', v: 3600000 },
]
const features = [
  { icon: ArrowLeftRight, t: 'Every rupee, categorised', d: 'Log income and expenses with payment method and notes, then search and filter in seconds.' },
  { icon: FileBarChart, t: 'Reports you can export', d: 'Pick a date range, read the charts, download a CSV.' },
]

// Follows the <html class="dark"> flag, so the background stays in sync with the sun/moon toggle
function useIsLight() {
  const [light, setLight] = useState(() => !document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setLight(!root.classList.contains('dark')))
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return light
}

const fadeMask = 'linear-gradient(to bottom, #000 50%, transparent 100%)'

export default function Landing() {
  const isLight = useIsLight()

  return (
    <div className="relative overflow-hidden">
      {/* Grainy orange gradient hero background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-70 dark:opacity-80"
        style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
      >
        <Grainient
          colors={['#0f1117', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa']}
          type="linear"
          angle={55}
          bands={1}
          speed={1}
          flow={0.8}
          scale={1}
          softness={1}
          silk={0.35}
          grainAmount={0.08}
          grainSize={1.2}
          grainAnimated
          contrast={1}
          saturation={1}
          variation={0}
          interactive
          stir={1}
          clickSwirl
          intro
          lightMode={isLight}
        />
      </div>
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
              className="btn btn-primary flex w-full items-center justify-center text-center sm:w-auto"
            >
              Start tracking free
            </Link>
            <Link
              to="/app"
              className="btn btn-ghost flex w-full items-center justify-center text-center sm:w-auto"
            >
              Explore the dashboard
            </Link>
          </div>
        </div>
        <motion.div
          className="glass relative w-full min-w-0 overflow-hidden rounded-3xl p-4 shadow-[0_24px_60px_-28px_rgba(249,115,22,0.35)] sm:p-6"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        >

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-sm text-mute">Monthly spending</div>
              <div className="font-display text-3xl font-semibold tabular-nums">{formatINR(sample[sample.length - 1].v)}</div>
            </div>
            <span className="rounded-full border border-line/10 px-3 py-1 text-xs text-mute">Sample data</span>
          </div>

          <div className="mt-4 h-48" role="img" aria-label="Sample chart of monthly spending over six months">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sample}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFA500" stopOpacity={0.6} /><stop offset="100%" stopColor="#FFA500" stopOpacity={0} /></linearGradient></defs>
                <XAxis
                  dataKey="m"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#737373', fontSize: 12 }}
                  interval={0}
                  padding={{ left: 10, right: 10 }}
                />
                <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: 'rgb(var(--card))', color: 'rgb(var(--ink))', border: '1px solid rgb(var(--line) / var(--line-a))', borderRadius: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#FFA500" strokeWidth={2} fill="url(#g)" animationDuration={1400} />
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
              <Icon className="mb-4 text-orange-500" size={22} />
              <h3 className="font-display text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-mute">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-line/10 py-8 text-center text-sm text-mute">&copy; 2026 SpendWise.</footer>
    </div>
  )
}
