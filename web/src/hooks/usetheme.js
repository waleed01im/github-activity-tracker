import { useEffect, useState } from 'react'

export default function useTheme() {
    const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  return [theme, setTheme]
}