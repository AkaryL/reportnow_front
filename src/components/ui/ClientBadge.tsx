import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { VehicleStatus } from '../../lib/types';

interface ClientBadgeProps {
  children: ReactNode;
  variant?: VehicleStatus | 'default';
  className?: string;
}

const variantStyles = {
  moving: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
  stopped: 'bg-sky-500/20 border-sky-500/40 text-sky-400',
  offline: 'bg-gray-500/20 border-gray-500/40 text-gray-400',
  critical: 'bg-red-500/20 border-red-500/40 text-red-400',
  default: 'glass-badge',
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
