import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, User, Settings } from 'lucide-react';
import LogoImage from '@/assets/logo.jpg';

interface TopbarProps {
  title?: string;
}

export const Topbar = ({ title }: TopbarProps) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center px-4 gap-4 z-40 shadow-sm">
      {/* Logo and company name */}
      <div className="flex items-center gap-2">
        <img src={LogoImage} alt="AarogyaSetuX" className="h-8 w-8 rounded" />
        <div className="text-sm font-semibold text-foreground">AarogyaSetuX</div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

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
