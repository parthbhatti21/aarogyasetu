import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export const FormSection = ({
  title,
  description,
  children,
  className,
}: FormSectionProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-3 p-4 bg-card rounded-lg border border-border">
        {children}
      </div>
    </div>
  );
};
