import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { VehicleStatus, NotificationType } from '../../lib/types';

interface ClientBadgeProps {
  children: ReactNode;
  variant?: VehicleStatus | NotificationType | 'default' | 'warning';
  className?: string;
}

const variantStyles: Record<string, string> = {
  // Vehicle statuses
  moving: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
  stopped: 'bg-sky-500/20 border-sky-500/40 text-sky-400',
  offline: 'bg-gray-500/20 border-gray-500/40 text-gray-400',
  critical: 'bg-red-500/20 border-red-500/40 text-red-400',
  // Notification types
  info: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
  warn: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
  crit: 'bg-red-500/20 border-red-500/40 text-red-400',
  // General
  default: 'glass-badge',
  warning: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
};

export function ClientBadge({ children, variant = 'default', className }: ClientBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border backdrop-blur-sm',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
