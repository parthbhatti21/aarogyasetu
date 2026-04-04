# Phase 2: Hospital-Specific Daily Token Sequences - Deployment Guide

## Overview
Phase 2 implements hospital-scoped daily token counters with a new token format: `HOSPCODE-DDMMYYYY-SEQUENCE`

**Example tokens:**
- H001-04042026-001 (First patient at Hospital 1 on 2026-04-04)
- H001-04042026-002 (Second patient at Hospital 1 on 2026-04-04)
- H002-04042026-001 (First patient at Hospital 2 on 2026-04-04) - Different hospital, starts at 001 again

## What Changed

### Database Schema
1. **New Table: `hospital_queue_counters`**
   - Tracks daily token counters per hospital
   - Automatically resets each day
   - `hospital_id, counter_date` combination is unique
   - Prevents duplicate tokens via ON CONFLICT logic

2. **New Column: `hospital_code`**
   - Added to `hospitals` table
   - Auto-generated format: H + row number (H001, H002, etc.)
   - Used in token format for human readability
   - Can be manually set if different format desired

3. **New Function: `generate_hospital_token_number(p_hospital_id UUID)`**
   - Generates tokens in format: `HOSPCODE-DDMMYYYY-SEQUENCE`
   - Handles daily counter reset automatically
   - Validates hospital exists before token generation
   - Atomic operation using UPSERT pattern

### Backend Services
1. **New File: `src/services/tokenService.ts`**
   - `generateHospitalToken()` - Core token generation
   - `createTokenForPatient()` - Full token creation with queue tracking
   - `getHospitals()` - List hospitals for dropdown
   - `getTodayTokensForHospital()` - Get all tokens for today
   - `getHospitalTokenStats()` - Statistics for admin
   - Replaces old global counter approach

### Frontend Updates
1. **AIPatientRegistration.tsx**
   - Added hospital selection dropdown (required field)
   - Validates hospital before registration
   - Integrated createTokenForPatient() service
   - Display hospital code in confirmation

2. **PatientDashboard.tsx**
   - Updated token creation to use new service
   - Hospital ID now extracted from session
   - Receives formatted token (e.g., H001-04042026-001)

## Deployment Steps

### Step 1: Deploy Migration to Supabase

1. **Via Supabase Dashboard (Recommended for First-Time):**
   ```
   1. Login to Supabase dashboard
   2. Go to SQL Editor
   3. Create new query
   4. Copy content of supabase/migrations/20260404_hospital_specific_token_sequence.sql
   5. Execute
   6. Verify no errors
   ```

2. **Via CLI (If Setup Complete):**
   ```bash
   cd /path/to/careflow-ai
   supabase db push
   # Select "Yes" when prompted to confirm migrations
   ```

### Step 2: Verify Migration Success

Run these queries in Supabase SQL Editor:

```sql
-- Check hospital_queue_counters table exists
SELECT tablename FROM pg_tables 
WHERE tablename = 'hospital_queue_counters';

-- Check function exists
SELECT proname FROM pg_proc 
WHERE proname = 'generate_hospital_token_number';

-- Check hospital_code column
SELECT column_name FROM information_schema.columns 
WHERE table_name='hospitals' AND column_name='hospital_code';

-- Populate hospital codes if empty
UPDATE hospitals 
SET hospital_code = 'H' || LPAD(ROW_NUMBER() OVER (ORDER BY id)::TEXT, 3, '0')
WHERE hospital_code IS NULL;

-- Test token generation (replace with valid hospital_id)
SELECT generate_hospital_token_number('12345678-1234-1234-1234-123456789012'::UUID);
```

### Step 3: Deployment Verification

1. **Build Locally:**
   ```bash
   npm run build
   ```
   - Should complete without TypeScript errors
   - Watch for missing imports or type mismatches

2. **Test in Dev Environment:**
   ```bash
   npm run dev
   ```
   - Navigate to AIPatientRegistration form
   - Verify hospital dropdown loads
   - Complete registration (should generate hospital-specific token)
   - Check PatientDashboard token display

### Step 4: Test Token Format

1. **Single Hospital Test:**
   - Register patient at Hospital 1
   - Verify token format: `H001-DDMMYYYY-001`
   - Register another patient same day
   - Verify counter increments: `H001-DDMMYYYY-002`

2. **Multi-Hospital Test:**
   - Register patient at Hospital 2
   - Verify token starts at 001: `H002-DDMMYYYY-001`
   - Not 003 (proves independent counters)

3. **Daily Reset Test:**
   - Generate token on Day 1: `H001-04042026-001`
   - Wait until next day OR manually test with:
     ```sql
     -- Simulate next day token
     SELECT generate_hospital_token_number('hospital-id'::UUID);
     -- Should show 001 again if date changed
     ```

## Breaking Changes & Migration Notes

### Breaking Changes
1. **Token Format Change**: Old format `T-001`, new format `H001-04042026-001`
   - Any code parsing old `T-` prefix will break
   - Update display logic everywhere that shows tokens

2. **Hospital Selection Now Required**: 
   - Patient registration requires hospital selection
   - Cannot create token without hospital_id

3. **API Response Changes**:
   - Token creation now returns full format string
   - Queue position tracking is different

### Backward Compatibility
- Old `queue_counters` table is NOT modified
- If rolling back, old token logic remains untouched
- Both token formats can coexist during migration period

### Data Migration
```sql
-- Optional: Map existing patients to hospitals if not already set
UPDATE patients 
SET hospital_id = hospitals.id 
FROM hospitals 
WHERE patients.hospital_id IS NULL 
AND patients.state = hospitals.state
LIMIT 1;
```

## Rollback Plan

If issues occur, follow these steps:

1. **Immediate Rollback (Keep database):**
   ```bash
   # Checkout old version
   git revert <commit-hash>
   npm run build
   # Redeploy old code
   ```

2. **Database Cleanup (If Needed):**
   ```sql
   -- Drop new function (keeps table for audit)
   DROP FUNCTION IF EXISTS generate_hospital_token_number(UUID);
   
   -- Keep hospital_queue_counters for reference
   -- Old code will simply ignore it
   ```

3. **Revert in Supabase:**
   - Drop function: `DROP FUNCTION generate_hospital_token_number;`
   - Drop table: `DROP TABLE hospital_queue_counters;` (optional)
   - Existing tokens remain in old format

## Troubleshooting

### Issue: "Hospital ID cannot be null"
**Cause**: Patient registration attempted without hospital selection
**Fix**: Verify AIPatientRegistration form has hospital dropdown and validation

### Issue: Token format shows as NULL or old format
**Cause**: Code not using new tokenService
**Fix**: 
```bash
grep -r "generate_token_number" src/ # Should be empty
grep -r "createTokenForPatient" src/ # Should be in PatientDashboard + AIPatientRegistration
```

### Issue: Tokens not resetting daily
**Cause**: Counter_date logic error
**Fix**: Check current date in database:
```sql
SELECT CURRENT_DATE, 
       COUNT(*) as tokens_today 
FROM hospital_queue_counters 
WHERE counter_date = CURRENT_DATE;
```

### Issue: "Hospital not found" error
**Cause**: Invalid hospital_id passed to function
**Fix**: Verify hospital exists and hospital_code is populated:
```sql
SELECT id, hospital_code, hospital_name FROM hospitals LIMIT 5;
```

## Configuration

### Token Format Customization
To change hospital code format, edit the function logic:

```sql
-- Current: H + padded row number
-- To change: H + custom_code
UPDATE hospitals SET hospital_code = 'CUSTOM' WHERE id = 'uuid';

-- Then function will use custom code in tokens:
-- Output: CUSTOM-04042026-001
```

### Sequence Number Format
Default: 3-digit (001, 002, ..., 999)
Can be extended in function if >999 tokens needed per hospital per day

## Monitoring

### Key Metrics to Track
1. **Daily Token Generation**: 
   ```sql
   SELECT hospital_id, counter_date, MAX(last_token_number) as tokens_generated
   FROM hospital_queue_counters
   WHERE counter_date = CURRENT_DATE
   GROUP BY hospital_id, counter_date;
   ```

2. **Hospital Queue Health**:
   ```sql
   SELECT hospital_id, hospital_name, COUNT(*) as patient_count
   FROM tokens
   WHERE DATE(created_at) = CURRENT_DATE
   GROUP BY hospital_id, hospital_name;
   ```

3. **Performance**:
   - Token generation should take <100ms
   - Check if index is being used:
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM hospital_queue_counters 
   WHERE hospital_id = 'uuid' AND counter_date = CURRENT_DATE;
   ```

## Support & Questions

- **Token format issues**: Check `generate_hospital_token_number()` function logic
- **UI/Selection issues**: Review AIPatientRegistration.tsx hospital dropdown
- **Database issues**: Verify migration ran without errors in Supabase dashboard
- **Performance issues**: Check hospital_queue_counters index existence
