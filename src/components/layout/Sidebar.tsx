import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  if (isMobile && isCollapsed) {
    return (
      <div className="fixed left-0 top-0 h-full w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center justify-start pt-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Overlay on mobile when sidebar is open */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out z-50',
          isCollapsed ? 'w-0 -translate-x-full md:w-16' : 'w-64 md:w-64'
        )}
      >
        <div className="flex flex-col h-full p-4 gap-4">
          {/* Header with close button (mobile) */}
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                  <span className="text-sidebar-primary-foreground font-bold text-sm">A</span>
                </div>
                <span className="font-semibold text-sidebar-foreground truncate">Aarogya Setu</span>
              </div>
            )}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
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
                  onClick={() => isMobile && setIsCollapsed(true)}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Collapse button (desktop) and Logout */}
          <div className="space-y-2 border-t border-sidebar-border pt-4">
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? '→' : '←'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="ml-2 text-sm">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop */}
      {!isMobile && !isCollapsed && <div className="w-64" />}
      {!isMobile && isCollapsed && <div className="w-16" />}
    </>
  );
};
