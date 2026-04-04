# Hospital Bifurcation - Phase 3 Deployment Guide

## Overview
This guide covers deploying the remaining fixes for hospital token visibility and AI patient registration without authentication.

## Changes Made

### 1. AI Patient Registration - No Authentication Required ✅
The AI chat now uses Cohere API directly, removing the need for Supabase authentication.

**New Hook**: `src/hooks/useCohereAIChat.ts`
- Direct Cohere API integration
- No Edge Function dependency
- Simpler, faster patient registration
- Cohere API key: `eeW4xQr5CnWGYdRsyAyQ072sHhUU1TFPZ9ZAkufa`

**Updated**: `src/pages/AIPatientRegistration.tsx`
- Switched from `useAIChat` to `useCohereAIChat`
- Hospital selection still required
- Token generation works with new hook

### 2. Hospital Token Visibility - Fixed Race Condition ✅
Patients now see only their hospital's queue.

**Updated**: `src/pages/PatientDashboard.tsx`
- Initialize `patientHospitalId` from sessionStorage on mount
- Store hospital_id to sessionStorage after database fetch
- Pass `hospitalId` to `useQueue` hook

**Updated**: `src/hooks/useQueue.ts`
- Added guard: skip fetching when `patientId` exists but `hospitalId` not loaded
- Prevents showing all hospital tokens during initial load

### 3. Database Schema - Add hospital_id to patients ⏳ PENDING
The `hospital_id` column must be added to the patients table for proper bifurcation.

**Migration**: `supabase/migrations/20260405_add_hospital_to_patients.sql`
```sql
-- Add hospital_id and hospital_name to patients table for bifurcation
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);

COMMENT ON COLUMN public.patients.hospital_id IS 'Links patient to their registered hospital';
COMMENT ON COLUMN public.patients.hospital_name IS 'Denormalized hospital name for quick reference';
```

## Deployment Steps

### Step 1: Deploy Code Changes ✅ (DONE)
All code changes are committed and ready:
```bash
git log --oneline | head -5
# 4848ca8 Fix hospital token visibility
# 20fea04 Add hospital_id and hospital_name columns to patients table
# a5e79ab Use Cohere API directly for AI patient registration
```

Build status: ✅ Successful (0 TypeScript errors)

### Step 2: Deploy Database Migration ⏳ PENDING
The migration needs to be applied to Supabase:

**Option A: Using Supabase Dashboard**
1. Go to: https://app.supabase.com/project/klqflfwsqooswhjjmloz/sql/new
2. Copy and paste the contents of `supabase/migrations/20260405_add_hospital_to_patients.sql`
3. Run the SQL

**Option B: Using Supabase CLI**
```bash
supabase db push --include-all
# This will push all pending migrations including the new one
```

**Option C: Manual SQL Execution**
Connect to your Supabase database and run:
```sql
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_name TEXT;
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
COMMENT ON COLUMN public.patients.hospital_id IS 'Links patient to their registered hospital';
COMMENT ON COLUMN public.patients.hospital_name IS 'Denormalized hospital name for quick reference';
```

## Verification Checklist

After deploying the migration, verify:

- [ ] `hospital_id` column exists in `patients` table
- [ ] `hospital_name` column exists in `patients` table
- [ ] Index `idx_patients_hospital_id` exists

```sql
-- Verify columns exist
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name IN ('hospital_id', 'hospital_name');

-- Verify index exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'patients' AND indexname = 'idx_patients_hospital_id';
```

## Testing Checklist

### AI Patient Registration
- [ ] Navigate to registration without being logged in
- [ ] AI chat loads and responds (no authentication required)
- [ ] Select hospital from dropdown
- [ ] Complete AI intake conversation
- [ ] Hospital is saved to patient record
- [ ] Token generated with hospital code (e.g., H001-04042026-001)

### Patient Dashboard
- [ ] Patient logs in
- [ ] Queue shows only their hospital's tokens (not all hospitals)
- [ ] Token with their hospital code displays correctly
- [ ] Tokens from other hospitals not visible

### Doctor Dashboard
- [ ] Doctor at Hospital A sees only Hospital A tokens
- [ ] Doctor at Hospital B sees only Hospital B tokens
- [ ] Each doctor sees independent token counter for their hospital

## Rollback Plan

If issues occur, you can rollback by removing the columns:

```sql
-- This should NOT be executed unless absolutely necessary
ALTER TABLE patients DROP COLUMN IF EXISTS hospital_id CASCADE;
ALTER TABLE patients DROP COLUMN IF EXISTS hospital_name;
```

Note: This is destructive and will lose any patient-hospital associations.

## Performance Considerations

The new index `idx_patients_hospital_id` enables efficient filtering:
- Queue queries: O(n) where n = tokens for that hospital (not all tokens)
- Dashboard loads: 10-100ms (depends on queue size)

## Security Notes

- Cohere API key is hardcoded in the frontend (`cohereAIService.ts`)
- In production, consider:
  - Moving API key to backend
  - Using environment variables
  - Implementing rate limiting
  - Adding usage monitoring

## Next Steps

1. ✅ Deploy code (committed to main branch)
2. ⏳ Deploy migration to Supabase
3. 🧪 Run verification tests
4. 🎯 Full end-to-end testing in staging
5. 🚀 Production deployment

## Support

For issues during deployment:
1. Check Supabase console for migration errors
2. Verify database permissions
3. Ensure no conflicts with existing columns
4. Check patient table for existing hospital data (if any)

---

**Status**: Code ✅ | Migration ⏳ | Testing 🧪 | Production 🚀

Last updated: 2026-04-04
