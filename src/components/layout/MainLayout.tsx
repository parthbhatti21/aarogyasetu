import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Topbar } from './Topbar';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideLayout?: boolean;
}

export const MainLayout = ({ children, title, hideLayout }: MainLayoutProps) => {
  const { user } = useAuth();
  
  if (hideLayout) {
    return <>{children}</>;
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Topbar only */}
      <Topbar />

      {/* Page content - offset by topbar height */}
      <main className="flex-1 overflow-auto pt-16">
        <div className={cn(
          'w-full h-full transition-all duration-300',
          'p-4 md:p-6 lg:p-8'
        )}>
          {/* Welcome message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-1">Welcome {userName}</h1>
            {title && <p className="text-muted-foreground text-sm">{title}</p>}
          </div>
          
          {children}
        </div>
      </main>
    </div>
  );
};
