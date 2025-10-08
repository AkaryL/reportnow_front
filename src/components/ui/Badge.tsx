import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import type { VehicleStatus, NotificationType } from '../../lib/types';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | VehicleStatus | NotificationType;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-ok-50 text-ok-700',
  warning: 'bg-warn-50 text-warn-700',
  danger: 'bg-crit-50 text-crit-700',
  info: 'bg-info-50 text-info-700',
  // Vehicle statuses
  moving: 'bg-ok-50 text-ok-700',
  stopped: 'bg-info-50 text-info-700',
  offline: 'bg-gray-100 text-gray-700',
  critical: 'bg-crit-50 text-crit-700',
  // Notification types
  warn: 'bg-warn-50 text-warn-700',
  crit: 'bg-crit-50 text-crit-700',
};

export function Badge({ variant = 'default', children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
