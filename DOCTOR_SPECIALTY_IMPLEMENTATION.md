# Doctor Specialty & Auto-Assignment Implementation

## Summary of Changes

This implementation adds doctor specialization and automatic patient assignment based on complaint types.

---

## 1. UI Changes - Admin Dashboard

### Before
- Patient info and doctor creation were in the **same card**, causing confusion
- No specialty field when creating doctors

### After  
- **Separate cards** for better organization:
  - **"Recent patient registrations"** - Shows patient list only
  - **"Doctor Management"** - Dedicated card for doctor creation
- Added **specialty dropdown** with 8 specialties matching patient complaint types

### Doctor Specialties Available
1. **General Practice** - default, handles all types
2. **Fever & Infectious Diseases** - fever, cold, flu
3. **Respiratory & Pulmonology** - cough, breathing issues
4. **Pain Management** - abdomen, chest, joint pain
5. **Neurology & Headache** - headaches, migraines
6. **Emergency & Trauma** - injuries, wounds
7. **Follow-up & Continuity Care** - follow-up visits
8. **Chronic Disease Management** - chronic conditions

---

## 2. Database Changes

### New Field Added
```sql
ALTER TABLE staff_profiles 
ADD COLUMN specialty VARCHAR(50);
```

### Migration File
- `supabase/migrations/20260403_add_doctor_specialty.sql`

### To Apply
Run this SQL in Supabase SQL Editor:

```sql
-- Add specialty column
ALTER TABLE staff_profiles 
ADD COLUMN IF NOT EXISTS specialty VARCHAR(50);

-- Set default specialty for existing doctors
UPDATE staff_profiles 
SET specialty = 'general' 
WHERE role IN ('doctor', 'senior_doctor') 
AND specialty IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_staff_profiles_specialty 
ON staff_profiles(specialty) 
WHERE role IN ('doctor', 'senior_doctor');
```

---

## 3. Auto-Assignment Logic

### New Utility: `src/utils/doctorAssignment.ts`

#### Functions:
- **`mapComplaintToSpecialty()`** - Maps patient complaints to doctor specialties
- **`findBestAvailableDoctor()`** - Finds best doctor based on:
  1. Specialty match
  2. Senior doctor preference
  3. Current workload (fewer active patients)
- **`autoAssignDoctor()`** - Automatically assigns doctor to token

### How It Works
When a patient creates a token:
1. Chief complaint is analyzed
2. Mapped to appropriate specialty
3. System finds best available doctor:
   - **Priority 1**: Exact specialty match
   - **Priority 2**: General practitioners (fallback)
   - **Priority 3**: Senior doctors preferred
   - **Priority 4**: Lower workload (fewer waiting/active patients)
4. Doctor is auto-assigned to the token

### Example
```
Patient: "Fever and cold symptoms"
→ Specialty: "fever"
→ System finds doctors with specialty="fever" or "general"
→ Picks one with fewest active patients
→ Auto-assigns to token
```

---

## 4. Files Modified

### Frontend Files
1. **`src/pages/AdminDashboard.tsx`**
   - Added `doctorSpecialty` state
   - Added `DOCTOR_SPECIALTIES` constant
   - Split patient info and doctor creation into separate cards
   - Added specialty dropdown in doctor creation form
   - Update doctor profile with specialty after creation

2. **`src/pages/PatientDashboard.tsx`**
   - Import `autoAssignDoctor` utility
   - Modified `createTokenForPatient()` to auto-assign doctor
   - Returns token ID to enable assignment

3. **`src/utils/doctorAssignment.ts`** (NEW)
   - Complete auto-assignment logic
   - Specialty mapping
   - Doctor selection algorithm

### Database Files
4. **`supabase/migrations/20260403_add_doctor_specialty.sql`** (NEW)
   - Adds specialty column
   - Creates index
   - Includes optional SQL function for server-side assignment

---

## 5. Testing Instructions

### Test Doctor Creation
1. Login as admin
2. Go to Admin Dashboard
3. Click "Create Doctor Account"
4. Fill in:
   - Name: Dr. John Smith
   - Email: john@hospital.com
   - Password: test123
   - Role: Doctor
   - **Specialty: Fever & Infectious Diseases** ← NEW
5. Submit
6. Verify doctor created with specialty

### Test Auto-Assignment
1. Login as patient
2. Select complaint type: "Fever / cold / flu"
3. Create token
4. Check database:
   ```sql
   SELECT t.token_number, t.chief_complaint, 
          s.display_name, s.specialty
   FROM tokens t
   LEFT JOIN staff_profiles s ON t.assigned_doctor_user_id = s.user_id
   WHERE t.patient_id = '<patient_id>'
   ORDER BY t.created_at DESC
   LIMIT 1;
   ```
5. Verify doctor with "fever" or "general" specialty is assigned

---

## 6. Complaint Type → Specialty Mapping

| Patient Complaint | Doctor Specialty |
|------------------|------------------|
| General consultation | `general` |
| Fever / cold / flu | `fever` |
| Cough / breathing difficulty | `cough` |
| Pain (abdomen / chest / joints) | `pain` |
| Headache / migraine | `headache` |
| Injury / wound | `injury` |
| Follow-up visit | `followup` |
| Chronic condition review | `chronic` |

---

## 7. Benefits

✅ **Better Organization** - Separate cards for patient list and doctor creation  
✅ **Specialized Care** - Patients matched to appropriate specialists  
✅ **Load Balancing** - Even distribution based on doctor workload  
✅ **Automatic** - No manual assignment needed  
✅ **Fallback** - General practitioners handle any complaint type  
✅ **Scalable** - Easy to add more specialties

---

## 8. Next Steps (Optional Enhancements)

1. **Admin View**: Show doctor specialties in the doctor stats table
2. **Reassignment**: Allow admins to manually reassign tokens
3. **Analytics**: Track specialty-based consultation times
4. **Notifications**: Notify doctors when assigned to new patient
5. **Multi-specialty**: Allow doctors to have multiple specialties

---

## Files Summary

### Created
- ✅ `src/utils/doctorAssignment.ts` - Auto-assignment logic
- ✅ `supabase/migrations/20260403_add_doctor_specialty.sql` - Database migration
- ✅ `apply-doctor-specialty.sh` - Helper script for database setup
- ✅ `DOCTOR_SPECIALTY_IMPLEMENTATION.md` - This documentation

### Modified
- ✅ `src/pages/AdminDashboard.tsx` - Separated cards, added specialty field
- ✅ `src/pages/PatientDashboard.tsx` - Integrated auto-assignment

---

## Support

For issues or questions:
1. Check console logs for assignment details
2. Verify specialty field exists in database
3. Ensure doctors have specialties set
4. Check that doctors are marked as `is_active = true`
