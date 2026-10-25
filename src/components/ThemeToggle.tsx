import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { flushSync } from 'react-dom'
import type { MouseEvent } from 'react'
import { useTheme } from '../lib/theme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const supported = typeof document.startViewTransition === 'function'

    if (!supported || reduceMotion) {
      toggle()
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const radius = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy),
    )

    const root = document.documentElement
    root.style.setProperty('--theme-cx', `${cx}px`)
    root.style.setProperty('--theme-cy', `${cy}px`)
    root.style.setProperty('--theme-r', `${radius}px`)
    root.dataset.themeAnim = '1'

    const transition = document.startViewTransition(() => {
      flushSync(() => toggle())
    })

    transition.finished.finally(() => {
      delete root.dataset.themeAnim
    })
  }

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileHover={{ scale: 1.1, rotate: 12, y: -2 }}
      whileTap={{ scale: 0.88, rotate: -8 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      className="grid h-11 w-11 place-items-center rounded-full border border-line/10 bg-card text-ink shadow-sm transition-colors duration-300 hover:border-orange-300 hover:text-orange-500"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          className="grid place-items-center"
        >
          {isDark ? <Sun size={19} strokeWidth={2} /> : <Moon size={19} strokeWidth={2} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}