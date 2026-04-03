import { ROLE_OPTIONS, UserRole } from '@/types/auth';
import { Shield, Stethoscope, ClipboardList, Pill, ShoppingCart, User } from 'lucide-react';

const iconMap = {
  Shield, Stethoscope, ClipboardList, Pill, ShoppingCart, User,
};

interface RoleSelectorProps {
  selectedRole: UserRole | null;
  onSelect: (role: UserRole) => void;
}

const RoleSelector = ({ selectedRole, onSelect }: RoleSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {ROLE_OPTIONS.map((role) => {
        const Icon = iconMap[role.icon as keyof typeof iconMap];
        const isSelected = selectedRole === role.id;
        return (
          <button
            key={role.id}
            onClick={() => onSelect(role.id)}
            className={`
              relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
              ${isSelected
                ? 'border-primary bg-primary/5 shadow-elevated'
                : 'border-border bg-card hover:border-primary/40 hover:shadow-card'
              }
            `}
          >
            <div className={`p-2.5 rounded-lg transition-colors ${isSelected ? 'gradient-primary' : 'bg-secondary'}`}>
              <Icon className={`h-5 w-5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            </div>
            <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
              {role.label}
            </span>
            <span className="text-[11px] text-muted-foreground text-center leading-tight">
              {role.description}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default RoleSelector;
