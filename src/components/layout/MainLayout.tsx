import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideLayout?: boolean;
}

export const MainLayout = ({ children, title, hideLayout }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          title={title}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto pt-16">
          <div className={cn(
            'w-full h-full transition-all duration-300',
            'p-4 md:p-6 lg:p-8'
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
