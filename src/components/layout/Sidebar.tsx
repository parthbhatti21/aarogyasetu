import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import { Menu, X, LayoutDashboard, UserPlus, Users, Stethoscope, Package, BarChart3, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: any;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin', 'doctor', 'senior_doctor'] },
  { label: 'Registration', path: '/registration', icon: UserPlus, roles: ['registration_desk'] },
  { label: 'Patients', path: '/patient', icon: Users, roles: ['patient', 'doctor', 'senior_doctor', 'admin'] },
  { label: 'Doctors', path: '/doctor', icon: Stethoscope, roles: ['doctor', 'senior_doctor', 'admin'] },
  { label: 'Pharmacy', path: '/store-admin', icon: Package, roles: ['medical_store_admin', 'medical_store_sales'] },
  { label: 'Analytics', path: '/admin', icon: BarChart3, roles: ['admin'] },
];

export const Sidebar = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const { showMobileSidebar, setShowMobileSidebar } = useLayout();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleItems = NAV_ITEMS.filter(item => 
    role && item.roles.includes(role)
  );

  const handleLogout = () => {
    logout();
  };

  // Mobile: Show hamburger button in top-left, sidebar as overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile overlay */}
        {showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out z-50',
            showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full p-4 gap-4">
            {/* Header with close button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                  <span className="text-sidebar-primary-foreground font-bold text-sm">A</span>
                </div>
                <span className="font-semibold text-sidebar-foreground truncate">Aarogya Setu</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileSidebar(false)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <a
                    key={item.path}
                    href={item.path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                    onClick={() => setShowMobileSidebar(false)}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </a>
                );
              })}
            </nav>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="ml-2 text-sm">Logout</span>
            </Button>
          </div>
        </aside>
      </>
    );
  }

  // Desktop: Show fixed sidebar
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-40">
      <div className="flex flex-col h-full p-4 gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-sidebar-foreground truncate">Aarogya Setu</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <a
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </a>
            );
          })}
        </nav>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className="ml-2 text-sm">Logout</span>
        </Button>
      </div>
    </aside>
  );
};
