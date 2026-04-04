import { cn } from '@/lib/utils';
import { Topbar } from './Topbar';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideLayout?: boolean;
}

export const MainLayout = ({ children, title, hideLayout }: MainLayoutProps) => {
  if (hideLayout) {
    return <>{children}</>;
  }

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
          {children}
        </div>
      </main>
    </div>
  );
};
