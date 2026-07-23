import { useTheme } from './ThemeProvider'
import SunIcon from './icons/SunIcon'
import MoonIcon from './icons/MoonIcon'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="theme-toggle"
    >
      {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  )
}
