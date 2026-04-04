import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, Menu, LogOut, User, Settings } from 'lucide-react';
import LogoImage from '@/assets/logo.jpg';

interface TopbarProps {
  onMenuClick?: () => void;
  title?: string;
}

export const Topbar = ({ onMenuClick, title }: TopbarProps) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center px-4 gap-4 z-40 shadow-sm">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="md:hidden text-foreground"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo and hospital name */}
      <div className="hidden md:flex items-center gap-2">
        <img src={LogoImage} alt="Aarogya Setu" className="h-8 w-8 rounded" />
        <div className="text-sm font-semibold text-foreground">Hospital</div>
      </div>

      {/* Page title (center on desktop) */}
      {title && (
        <div className="hidden lg:block flex-1">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1 hidden lg:block" />

      {/* Notifications */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-foreground"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
      </Button>

      {/* User profile dropdown */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="text-foreground"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        </Button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
            <div className="p-4 border-b border-border">
              <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.user_metadata?.role || 'User'}</p>
            </div>
            <div className="p-2 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-foreground hover:bg-muted"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
