// import { useEffect, useState } from 'react'

// type Theme = 'dark' | 'light'

// export function useTheme() {
//   const [theme, setTheme] = useState<Theme>(() => {
//     try {
//       const saved = localStorage.getItem('sw-theme')
//       return saved === 'light' || saved === 'dark' ? saved : 'light'
//     } catch {
//       return 'light'
//     }
//   })

//   useEffect(() => {
//     const root = document.documentElement

//     root.classList.toggle('light', theme === 'light')
//     root.classList.toggle('dark', theme === 'dark')
//     root.style.colorScheme = theme

//     try {
//       localStorage.setItem('sw-theme', theme)
//     } catch {
//       // Storage unavailable
//     }
//   }, [theme])

//   const toggle = () => {
//     setTheme(current => current === 'dark' ? 'light' : 'dark')
//   }

//   return { theme, toggle }
// }]
import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'spendwise-theme-v2'

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return 'light' // default, ignores the system setting
}

function apply(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    apply(theme)
    try { localStorage.setItem(KEY, theme) } catch {}
  }, [theme])

  const toggle = useCallback(
    () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
    [],
  )

  return { theme, toggle }
}