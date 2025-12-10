import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const buttonSize = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        buttonSize,
        'rounded-lg transition-all duration-200',
        // Light mode styles
        'bg-gray-100 hover:bg-gray-200 text-gray-600',
        // Dark mode styles
        'dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-yellow-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        className
      )}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      <div className="relative">
        {/* Sun icon - visible in dark mode */}
        <Sun
          className={cn(
            iconSize,
            'absolute inset-0 transition-all duration-300',
            isDark
              ? 'opacity-100 rotate-0 scale-100 text-yellow-400'
              : 'opacity-0 rotate-90 scale-50'
          )}
        />
        {/* Moon icon - visible in light mode */}
        <Moon
          className={cn(
            iconSize,
            'transition-all duration-300',
            isDark
              ? 'opacity-0 -rotate-90 scale-50'
              : 'opacity-100 rotate-0 scale-100 text-gray-600'
          )}
        />
      </div>
    </button>
  );
}
