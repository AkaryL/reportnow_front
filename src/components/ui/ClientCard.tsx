import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ClientCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function ClientCard({ children, className, hover = false }: ClientCardProps) {
  return (
    <div
      className={cn(
        'client-card',
        hover && 'transition-all duration-200 hover:bg-white/8 hover:border-white/15 hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ClientCardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ClientCardHeader({ children, className }: ClientCardHeaderProps) {
  return (
    <div className={cn('p-6 border-b border-white/8', className)}>
      {children}
    </div>
  );
}

interface ClientCardTitleProps {
  children: ReactNode;
  className?: string;
}

export function ClientCardTitle({ children, className }: ClientCardTitleProps) {
  return (
    <h3 className={cn('client-heading text-xl', className)}>
      {children}
    </h3>
  );
}

interface ClientCardContentProps {
  children: ReactNode;
  className?: string;
}

export function ClientCardContent({ children, className }: ClientCardContentProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
}
