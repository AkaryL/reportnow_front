import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  position?: 'left' | 'right';
}

export function ClientDrawer({
  isOpen,
  onClose,
  title,
  children,
  className,
  position = 'right',
}: ClientDrawerProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const positionStyles = {
    left: {
      container: 'left-0',
      translate: isOpen ? 'translate-x-0' : '-translate-x-full',
    },
    right: {
      container: 'right-0',
      translate: isOpen ? 'translate-x-0' : 'translate-x-full',
    },
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-[1100] transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer - Glassmorphism Style with Solid Background */}
      <div
        className={cn(
          'fixed top-0 bottom-0 z-[1200] w-full sm:w-96 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
          'bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-l border-white/20',
          positionStyles[position].container,
          positionStyles[position].translate,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 id="drawer-title" className="text-xl font-semibold client-text-primary">
            {title || 'Detalles'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/90 transition-colors"
            aria-label="Cerrar drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  );
}

interface ClientDrawerSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function ClientDrawerSection({ title, children, className }: ClientDrawerSectionProps) {
  return (
    <div className={cn('mb-6 last:mb-0', className)}>
      {title && (
        <h3 className="text-sm font-semibold client-text-secondary mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}

interface ClientDrawerItemProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function ClientDrawerItem({ label, value, className }: ClientDrawerItemProps) {
  return (
    <div className={cn('flex justify-between items-center py-2', className)}>
      <span className="text-sm client-text-secondary">{label}</span>
      <span className="text-sm font-medium client-text-primary">{value}</span>
    </div>
  );
}
