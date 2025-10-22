import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to relative time (e.g., "5 minutos", "2 horas")
 */
export function formatRelativeTime(minutes: number): string {
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${Math.floor(minutes)} min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hrs`;
  return `${Math.floor(minutes / 1440)} días`;
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format speed
 */
export function formatSpeed(speed: number): string {
  return `${Math.round(speed)} km/h`;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<keyof T, string>
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = Object.keys(data[0]) as (keyof T)[];
  const headerRow = headers
    ? keys.map(key => headers[key] || String(key))
    : keys.map(String);

  const csvContent = [
    headerRow.join(','),
    ...data.map(row =>
      keys.map(key => {
        const value = row[key];
        const stringValue = String(value ?? '');
        // Escape quotes and wrap in quotes if contains comma
        return stringValue.includes(',')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get layout storage key for user and route
 */
export function getLayoutKey(userId: string, route: string): string {
  return `reportnow:layout:${userId}:${route}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
