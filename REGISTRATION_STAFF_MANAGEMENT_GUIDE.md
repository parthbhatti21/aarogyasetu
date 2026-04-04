# Registration Desk Staff Management - Admin Integration Guide

## Overview

The registration desk staff management system allows admins to create, manage, and monitor registration desk operators and supervisors directly from the admin dashboard - similar to how doctors are managed.

## Features

✅ **Create Registration Staff** - Email, password, phone, role selection
✅ **Automatic Account Creation** - Staff credentials instantly available
✅ **Password Generation** - Generate secure passwords or use custom ones
✅ **Role Management** - Operator vs. Supervisor roles
✅ **Staff Deactivation** - Disable accounts without deletion
✅ **Staff Reactivation** - Restore disabled accounts
✅ **Hospital Assignment** - Link staff to specific hospitals
✅ **Activity Tracking** - See last login and registration counts

---

## Quick Integration Steps

### Step 1: Add Tab to Admin Dashboard

In `src/pages/AdminDashboard.tsx`, add staff management to the tabs:

```tsx
<Tabs defaultValue="queue" className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="queue">Queue</TabsTrigger>
    <TabsTrigger value="doctors">Doctors</TabsTrigger>
    <TabsTrigger value="staff">Registration Staff</TabsTrigger>  {/* NEW */}
    <TabsTrigger value="stats">Stats</TabsTrigger>
  </TabsList>

  {/* ... other tabs ... */}

  <TabsContent value="staff">
    <ManageRegistrationStaff selectedHospital={selectedHospital} />
  </TabsContent>
</Tabs>
```

### Step 2: Import Components and Services

```tsx
import { ManageRegistrationStaff } from '@/components/admin/ManageRegistrationStaff';
import { useRegistrationStaff } from '@/hooks/useRegistrationStaff';
```

### Step 3: Add to Stats Display (Optional)

```tsx
const { stats: staffStats } = useRegistrationStaff(selectedHospital?.id);

// Display in stats cards:
<StatCard
  icon={Users}
  label="Registration Staff"
  value={staffStats?.activeStaff || 0}
/>
```

---

## Services Available

### `registrationStaffService.ts`

```typescript
// Create new registration staff
createRegistrationStaff(input: CreateRegistrationStaffInput): Promise<RegistrationStaffProfile>

// Get all staff for a hospital
getRegistrationStaffByHospital(hospitalId: string): Promise<RegistrationStaffProfile[]>

// Get all staff (admin only)
getAllRegistrationStaff(): Promise<RegistrationStaffProfile[]>

// Update staff profile
updateRegistrationStaff(staffId: string, updates): Promise<RegistrationStaffProfile>

// Deactivate staff
deactivateRegistrationStaff(staffId: string): Promise<void>

// Reactivate staff
reactivateRegistrationStaff(staffId: string): Promise<void>

// Get staff statistics
getRegistrationStaffStats(hospitalId?): Promise<RegistrationStaffStats>

// Validate credentials
validateStaffCredentials(email: string, password: string): Promise<{valid, staff?}>

// Generate temporary password
generateTemporaryPassword(): string

// Get registrations by staff member
getRegistrationsByStaff(staffId: string, days?: number): Promise<AuditLog[]>
```

---

## UI Component

### `ManageRegistrationStaff`

**Location:** `src/components/admin/ManageRegistrationStaff.tsx`

**Props:**
```tsx
interface ManageRegistrationStaffProps {
  selectedHospital: Hospital | null;
}
```

**Features:**
- Create new staff with form validation
- Generate secure passwords
- View all staff members
- Toggle active/inactive status
- Show last login date
- Display role and contact info

---

## Hook

### `useRegistrationStaff`

```tsx
const { staff, stats, loading, error, refresh } = useRegistrationStaff(hospitalId);

// Returns:
// - staff: Array of RegistrationStaffProfile
// - stats: { totalStaff, activeStaff, inactiveStaff, operators, supervisors }
// - loading: Boolean
// - error: String | null
// - refresh: Function to reload data
```

---

## Complete Admin Dashboard Integration Example

```tsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageRegistrationStaff } from '@/components/admin/ManageRegistrationStaff';
import { useRegistrationStaff } from '@/hooks/useRegistrationStaff';
import type { Hospital } from '@/types/database';

const AdminDashboard = () => {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const { stats: staffStats, staff } = useRegistrationStaff(selectedHospital?.id);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Active Registration Staff"
          value={staffStats?.activeStaff || 0}
        />
        <StatCard
          icon={Users}
          label="Total Staff"
          value={staffStats?.totalStaff || 0}
        />
        <StatCard
          icon={Award}
          label="Supervisors"
          value={staffStats?.supervisors || 0}
        />
        <StatCard
          icon={Users}
          label="Operators"
          value={staffStats?.operators || 0}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="staff">Registration Staff</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <ManageRegistrationStaff selectedHospital={selectedHospital} />
        </TabsContent>

        {/* ... other tabs ... */}
      </Tabs>
    </div>
  );
};
```

---

## Staff Creation Flow

1. **Admin clicks "Create Registration Staff"**
2. **Form shows:**
   - Full Name
   - Email
   - Phone (optional)
   - Role (Operator / Supervisor)
   - Password (auto-generate or custom)
3. **On submit:**
   - Auth account created
   - Staff profile created in database
   - Registration desk staff role assigned
   - Success message shown
4. **Staff can now login** with email/password

---

## Staff Roles

### Registration Desk Operator
- Can register patients
- Can view patient history
- Can see today's queue
- Can generate tokens
- **Cannot:** Manage other staff, modify specialties

### Registration Desk Supervisor
- All operator permissions
- Can manage other operators
- Can override registrations
- Can view audit logs
- Can modify doctor suggestions

---

## Deactivation vs Deletion

**Deactivation:**
- Staff account is marked inactive
- Staff cannot login
- Historical records preserved
- Can be reactivated anytime
- Recommended approach

**Deletion:**
- Not currently implemented
- Breaks audit trail
- Not recommended

---

## Password Management

### Generate Password
```tsx
import { generateTemporaryPassword } from '@/services/registrationStaffService';

const password = generateTemporaryPassword();
// Returns: 12-character password with mix of uppercase, lowercase, numbers, symbols
// Example: "K7#mPq2@xR9$"
```

### Custom Password
Staff can provide their own password - must be at least 8 characters.

---

## Staff Statistics

```tsx
const stats = await getRegistrationStaffStats(hospitalId);

// Returns:
{
  totalStaff: 5,
  activeStaff: 4,
  inactiveStaff: 1,
  operators: 3,
  supervisors: 2
}
```

---

## Activity Tracking

Each staff member has:
- **created_at** - Account creation timestamp
- **last_login_at** - Last successful login
- **created_by** - Which admin created the account
- **is_active** - Current status

View registrations by staff:
```tsx
import { getRegistrationsByStaff } from '@/services/registrationStaffService';

const registrations = await getRegistrationsByStaff(staffId, 7); // Last 7 days
```

---

## Email Notifications (Optional)

After creating staff, you can send welcome email with credentials:

```tsx
// Not implemented yet - future enhancement
const sendWelcomeEmail = async (email: string, password: string) => {
  // Send email with login details
};
```

---

## Security Best Practices

1. ✅ **Role-Based Access** - Only admins can create/manage staff
2. ✅ **Password Security** - 12-char generated passwords
3. ✅ **Activity Logging** - All actions tracked
4. ✅ **Session Management** - Auto-logout for staff
5. ✅ **Data Encryption** - Supabase handles password hashing
6. ✅ **Audit Trail** - Historical records preserved on deactivation

---

## Troubleshooting

### "Failed to create account"
- Check if email already exists
- Verify hospital_id is correct
- Ensure role is valid

### "Staff cannot login"
- Check if staff is_active = true
- Verify email and password are correct
- Check user role is 'registration_staff'

### "Cannot load staff list"
- Select a hospital first
- Verify Supabase connection
- Check RLS policies are applied

---

## Testing Checklist

- [ ] Create operator account
- [ ] Create supervisor account
- [ ] Generate password works
- [ ] Copy password works
- [ ] Staff can login with credentials
- [ ] Deactivate staff blocks login
- [ ] Reactivate staff allows login
- [ ] Staff list shows correct info
- [ ] Stats update correctly
- [ ] Hospital filter works
- [ ] Last login updates

---

## Migration Status

✅ Database schema created (`20260404_registration_desk_phase1.sql`)
✅ Services implemented
✅ UI components created
✅ Hook implemented
⏳ Admin Dashboard integration (admin's choice)

---

## Files

- `src/services/registrationStaffService.ts` - Main service
- `src/components/admin/ManageRegistrationStaff.tsx` - UI component
- `src/hooks/useRegistrationStaff.ts` - React hook
- `supabase/migrations/20260404_registration_desk_phase1.sql` - Database

---

## Next Steps

1. ✅ Integration: Add to Admin Dashboard tabs
2. ✅ Testing: Test staff creation and login
3. ✅ Documentation: Share with admin team
4. ✅ Monitoring: Track staff registrations

---

**Status:** Ready for integration
**Recommendation:** Add as new tab in Admin Dashboard next to Doctors
