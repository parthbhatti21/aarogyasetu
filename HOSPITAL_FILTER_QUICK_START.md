# Quick Start: Hospital Filter Feature

## For Admin Users

### Filtering by Hospital

1. Go to Admin Dashboard
2. You'll see **"Filter by Hospital"** section at the top
3. **Step 1:** Select a State from the dropdown
4. **Step 2:** Choose a Hospital by name (search available)
5. Dashboard now shows data filtered to that hospital:
   - Live queue shows only tokens from that hospital
   - Doctor list shows only doctors from that hospital
   - All stats are scoped to selected hospital

### Creating a Hospital-Specific Doctor

1. Click **"Create Doctor Account"** button
2. Fill in:
   - **Full Name:** Dr. John Doe
   - **Email:** john@hospital.com
   - **Password:** (temporary password)
   - **Role:** Doctor or Senior Doctor
   - **Specialty:** Choose from 8 options
   - **Hospital:** Select state → Search hospital name → Click to select
3. Click **"Create Doctor Account"**
4. Doctor is now assigned to that hospital
5. Doctor tokens will only go to this doctor from their hospital

### Clearing Hospital Filter

- Click the **"Clear"** button in the Hospital Filter section
- All data returns to unfiltered view
- Showing all hospitals and doctors

---

## For Developers: Using the Components

### HospitalFilter (Full Dashboard Filter)
```tsx
import { HospitalFilter } from '@/components/admin/HospitalFilter';
import { useState } from 'react';
import type { Hospital } from '@/types/database';

export function MyComponent() {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  return (
    <HospitalFilter 
      onSelect={setSelectedHospital} 
      selectedHospital={selectedHospital}
    />
  );
}
```

**Props:**
- `onSelect: (hospital: Hospital | null) => void` - Callback when hospital is selected/cleared
- `selectedHospital: Hospital | null` - Currently selected hospital

**Features:**
- Auto-loads states on mount
- Loads hospitals when state selected
- Real-time search filtering
- Shows selected hospital details

---

### InlineHospitalSelector (For Forms)
```tsx
import { InlineHospitalSelector } from '@/components/admin/InlineHospitalSelector';
import { useState } from 'react';
import type { Hospital } from '@/types/database';

export function DoctorForm() {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  return (
    <form>
      {/* ...other form fields... */}
      <InlineHospitalSelector 
        onSelect={setSelectedHospital}
        selectedHospital={selectedHospital}
      />
    </form>
  );
}
```

**Props:** Same as HospitalFilter

**Benefits:**
- Compact form-friendly layout
- Two-column state/hospital selectors
- Shows hospital as compact badge when selected

---

## Database Schema

### New Columns Added (with triggers)

```sql
-- Denormalized hospital_name columns
ALTER TABLE patients ADD COLUMN hospital_name TEXT;
ALTER TABLE tokens ADD COLUMN hospital_name TEXT;
ALTER TABLE staff_profiles ADD COLUMN hospital_name TEXT;
ALTER TABLE medical_records ADD COLUMN hospital_name TEXT;
ALTER TABLE prescriptions ADD COLUMN hospital_name TEXT;
ALTER TABLE medicines ADD COLUMN hospital_name TEXT;
```

### Automatic Updates

When `hospital_id` changes on any table, the trigger automatically:
1. Looks up the hospital name from `hospitals` table
2. Updates the `hospital_name` column
3. Keeps data consistent

---

## Service Functions

### fetchStates()
Returns unique list of all states with hospitals

```tsx
const states = await fetchStates();
// ['Maharashtra', 'Karnataka', 'Delhi', ...]
```

### fetchHospitalsByState(state?: string)
Returns hospitals, optionally filtered by state

```tsx
// All hospitals
const all = await fetchHospitalsByState();

// Hospitals in specific state
const maharashtra = await fetchHospitalsByState('Maharashtra');
```

---

## Type Definitions

### Hospital Type
```tsx
interface Hospital {
  id: string;
  hospital_id: string;
  hospital_name: string;
  state: string;
  district: string | null;
  sl_no: number | null;
  created_at: string;
  updated_at: string;
}
```

### Updated Types with hospital_name
```tsx
interface StaffProfile {
  id: string;
  user_id: string;
  role: 'admin' | 'doctor' | 'senior_doctor' | ...;
  display_name: string;
  department?: string;
  specialty?: string;
  hospital_id?: string;        // ← NEW
  hospital_name?: string;      // ← NEW
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Token {
  id: string;
  token_number: string;
  patient_id: string;
  hospital_id?: string;        // ← NEW
  hospital_name?: string;      // ← NEW
  // ... other fields
}

// Similar updates for: Patient, MedicalRecord, Prescription, Medicine
```

---

## Querying by Hospital

### Get all tokens for a hospital
```tsx
const { data } = await supabase
  .from('tokens')
  .select('*')
  .eq('hospital_name', 'City General Hospital')
  .eq('visit_date', today);
```

### Get all doctors for a hospital
```tsx
const { data } = await supabase
  .from('staff_profiles')
  .select('*')
  .eq('hospital_id', hospitalId)
  .in('role', ['doctor', 'senior_doctor']);
```

### Filter with state
```tsx
const { data: states } = await supabase
  .from('hospitals')
  .select('state')
  .distinct();
```

---

## Troubleshooting

**Q: Hospital dropdown is empty after selecting state?**
A: Check if the `hospitals` table has hospitals in that state. Run:
```sql
SELECT * FROM hospitals WHERE state = 'Maharashtra';
```

**Q: hospital_name not updating?**
A: Ensure the migration `20260404_add_hospital_name_denormalization.sql` was applied. The triggers should auto-sync.

**Q: Can't create doctor without hospital?**
A: Hospital selection is required in the form. It's enforced by:
1. Form validation (button disabled until hospital selected)
2. Backend validation (requires hospital_id in update query)

**Q: Doctor not appearing in filtered list?**
A: Make sure doctor's `hospital_id` matches the selected hospital's `id` (not name).

---

## Performance Notes

- `hospital_name` denormalization avoids JOIN operations
- Filtering by `hospital_name` is fast (indexed column)
- Triggers run on INSERT/UPDATE only (minimal overhead)
- Recommended to add indexes for filtering by state and hospital_name
