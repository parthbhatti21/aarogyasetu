import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormGroupProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const FormGroup = ({
  children,
  columns = 2,
  className,
}: FormGroupProps) => {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      className={cn(
        'grid gap-4',
        gridClass[columns],
        className
      )}
    >
      {children}
    </div>
  );
};
