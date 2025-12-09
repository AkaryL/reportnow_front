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
  default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  success: 'bg-ok-50 dark:bg-ok-900/30 text-ok-700 dark:text-ok-400',
  warning: 'bg-warn-50 dark:bg-warn-900/30 text-warn-700 dark:text-warn-400',
  danger: 'bg-crit-50 dark:bg-crit-900/30 text-crit-700 dark:text-crit-400',
  info: 'bg-info-50 dark:bg-info-900/30 text-info-700 dark:text-info-400',
  // Vehicle statuses
  moving: 'bg-ok-50 dark:bg-ok-900/30 text-ok-700 dark:text-ok-400',
  stopped: 'bg-info-50 dark:bg-info-900/30 text-info-700 dark:text-info-400',
  offline: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  critical: 'bg-crit-50 dark:bg-crit-900/30 text-crit-700 dark:text-crit-400',
  // Notification types
  warn: 'bg-warn-50 dark:bg-warn-900/30 text-warn-700 dark:text-warn-400',
  crit: 'bg-crit-50 dark:bg-crit-900/30 text-crit-700 dark:text-crit-400',
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
