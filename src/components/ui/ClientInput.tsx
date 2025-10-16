import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ClientInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const ClientInput = forwardRef<HTMLInputElement, ClientInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn('client-input w-full', className)}
        {...props}
      />
    );
  }
);

ClientInput.displayName = 'ClientInput';
