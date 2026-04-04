import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline';
  };
  onRefresh?: () => void;
  children?: ReactNode;
  className?: string;
}

export const DashboardHeader = ({
  title,
  subtitle,
  action,
  onRefresh,
  children,
  className,
}: DashboardHeaderProps) => {
  return (
    <div className={cn(
      'flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8',
      className
    )}>
      <div className="flex-1">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground">{subtitle}</p>
        )}
      </div>
      
      <div className="flex gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            size="sm"
          >
            {action.label}
          </Button>
        )}
      </div>

      {children}
    </div>
  );
};
