import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, User, Settings, X } from 'lucide-react';
import LogoImage from '@/assets/logo.jpg';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/utils/supabase';

interface TopbarProps {
  title?: string;
}

export const Topbar = ({ title }: TopbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [settings, setSettings] = useState({
    full_name: '',
    phone: '',
  });

  // Load patient data and hospitals
  useEffect(() => {
    if (showSettings && user?.id) {
      loadSettings();
    }
  }, [showSettings, user?.id]);

  const loadSettings = async () => {
    try {
      // Get current patient data
      const { data: patient } = await supabase
        .from('patients')
        .select('full_name, phone')
        .eq('user_id', user?.id)
        .single();

      setSettings({
        full_name: patient?.full_name || '',
        phone: patient?.phone || '',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!user?.id) return;

    // Validate required fields
    if (!settings.full_name.trim()) {
      toast({
        title: 'Invalid Name',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    // Validate phone number
    if (settings.phone && !/^\d{10}$/.test(settings.phone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingSettings(true);

    try {
      // Update patient data in database
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          full_name: settings.full_name,
          phone: settings.phone,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Settings updated successfully',
        variant: 'default',
      });

      setShowSettings(false);
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center px-4 gap-3 z-40 shadow-sm">
      {/* Logo and company name */}
      <div className="flex items-center gap-3">
        <img src={LogoImage} alt="AarogyaSetuX" className="h-8 w-8 rounded" />
        <div className="text-xl font-bold text-foreground tracking-tight">AarogyaSetuX</div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User profile dropdown */}
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="text-foreground flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium">Profile</span>
        </Button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-lg z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border">
              <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.user_metadata?.role || 'User'}</p>
            </div>

            {!showSettings ? (
              <div className="p-2 space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-foreground hover:bg-muted"
                  onClick={() => setShowSettings(true)}
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
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">Settings</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={settings.full_name}
                    onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
                    disabled={isLoadingSettings}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="10-digit number"
                    maxLength={10}
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    disabled={isLoadingSettings}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveSettings}
                    disabled={isLoadingSettings}
                    className="flex-1 h-8 bg-emerald-700 hover:bg-emerald-800 text-white text-sm"
                  >
                    {isLoadingSettings ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                    disabled={isLoadingSettings}
                    className="flex-1 h-8 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
