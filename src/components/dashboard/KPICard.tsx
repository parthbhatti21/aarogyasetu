import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export const KPICard = ({
  icon,
  label,
  value,
  trend,
  size = 'md',
  onClick,
  className,
}: KPICardProps) => {
  const sizeClass = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const valueSize = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const labelSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer',
        sizeClass,
        onClick && 'hover:scale-105',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={cn('text-muted-foreground mb-2', labelSize)}>
            {label}
          </div>
          <div className={cn('font-bold text-foreground', valueSize)}>
            {value}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2',
              trend.direction === 'up' ? 'text-success' : 'text-destructive'
            )}>
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className={cn(labelSize, 'font-medium')}>
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className="ml-4 p-3 bg-primary/10 rounded-lg flex items-center justify-center h-fit">
          <div className="text-primary">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};
