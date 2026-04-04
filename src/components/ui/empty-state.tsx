import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4',
      'bg-card border border-dashed border-border rounded-lg',
      className
    )}>
      <div className="text-muted-foreground mb-4 p-3 bg-muted rounded-lg">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground text-center mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-xs">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
