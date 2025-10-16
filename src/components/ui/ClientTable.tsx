import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ClientTableProps {
  children: ReactNode;
  className?: string;
}

export function ClientTable({ children, className }: ClientTableProps) {
  return (
    <div className={cn('overflow-x-auto client-scrollbar', className)}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

interface ClientTableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ClientTableHeader({ children, className }: ClientTableHeaderProps) {
  return (
    <thead className={cn('border-b border-white/10', className)}>
      {children}
    </thead>
  );
}

interface ClientTableBodyProps {
  children: ReactNode;
  className?: string;
}

export function ClientTableBody({ children, className }: ClientTableBodyProps) {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
}

interface ClientTableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ClientTableRow({ children, className, onClick }: ClientTableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-white/5 transition-colors',
        onClick && 'cursor-pointer hover:bg-white/5',
        className
      )}
    >
      {children}
    </tr>
  );
}

interface ClientTableHeadProps {
  children: ReactNode;
  className?: string;
}

export function ClientTableHead({ children, className }: ClientTableHeadProps) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider client-text-tertiary', className)}>
      {children}
    </th>
  );
}

interface ClientTableCellProps {
  children: ReactNode;
  className?: string;
}

export function ClientTableCell({ children, className }: ClientTableCellProps) {
  return (
    <td className={cn('px-4 py-4 text-sm client-text-secondary', className)}>
      {children}
    </td>
  );
}
