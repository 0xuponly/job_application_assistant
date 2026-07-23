import { useTheme } from './ThemeProvider'
import SunIcon from './icons/SunIcon'
import MoonIcon from './icons/MoonIcon'

interface Props {
  className?: string
}

export default function ThemeToggle({ className }: Props = {}) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'
  const cls = className ? `theme-toggle ${className}` : 'theme-toggle'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cls}
    >
      {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  )
}
