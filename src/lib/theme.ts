import { useEffect, useState } from 'react'
type Theme = 'dark' | 'light'
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem('sw-theme') as Theme) || 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    try { localStorage.setItem('sw-theme', theme) } catch { /* storage unavailable */ }
  }, [theme])
  return { theme, toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')) }
}
