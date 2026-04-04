# Phase 2: Quick Start Deployment Checklist

## What's New
✅ Hospital-specific daily token sequences  
✅ Format: `HOSPCODE-DDMMYYYY-SEQUENCE` (e.g., `H001-04042026-001`)  
✅ Each hospital starts at 001 daily  
✅ Hospital selection required during patient registration  

## Pre-Deployment (Done ✓)
- [x] Database migration created: `20260404_hospital_specific_token_sequence.sql`
- [x] Token service implemented: `src/services/tokenService.ts`
- [x] AIPatientRegistration updated with hospital selector
- [x] PatientDashboard updated to use new token service
- [x] TypeScript types updated
- [x] Build succeeds: `npm run build` ✓
- [x] Code committed to main: commits `177ea2a`, `d910846`

## Deployment Checklist

### Step 1: Deploy Migration to Supabase
```bash
# Option A: Via CLI
supabase db push

# Option B: Via Dashboard
# 1. Go to Supabase SQL Editor
# 2. Create new query
# 3. Paste content of supabase/migrations/20260404_hospital_specific_token_sequence.sql
# 4. Execute
```

**Verification:**
```sql
-- In Supabase SQL Editor, run:
SELECT tablename FROM pg_tables WHERE tablename = 'hospital_queue_counters';
-- Should return: hospital_queue_counters

SELECT proname FROM pg_proc WHERE proname = 'generate_hospital_token_number';
-- Should return: generate_hospital_token_number
```

### Step 2: Populate Hospital Codes
```sql
-- In Supabase SQL Editor, run:
UPDATE hospitals 
SET hospital_code = 'H' || LPAD(ROW_NUMBER() OVER (ORDER BY id)::TEXT, 3, '0')
WHERE hospital_code IS NULL;

-- Verify:
SELECT hospital_code, hospital_name FROM hospitals LIMIT 5;
-- Should show: H001, H002, H003, etc.
```

### Step 3: Test Token Generation
```sql
-- In Supabase SQL Editor, run:
-- Get a hospital ID first
SELECT id, hospital_name FROM hospitals LIMIT 1;

-- Then test token generation (replace uuid with actual hospital id)
SELECT generate_hospital_token_number('YOUR-HOSPITAL-UUID'::UUID);
-- Should return something like: H001-04042026-001
```

### Step 4: Test in Application

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Test Patient Registration:**
   - Navigate to AIPatientRegistration
   - Fill form (name, age, phone, etc.)
   - **Select hospital from dropdown** ← New!
   - Click "Complete Registration"
   - Should see token like: `H001-04042026-001`

3. **Test Patient Dashboard:**
   - Go to PatientDashboard
   - Create another token
   - Verify format: `H001-04042026-002` (incremented)
   - Try with different hospital: Should see `H002-04042026-001`

### Step 5: Production Deployment

```bash
# 1. Ensure all migrations deployed to Supabase ✓
# 2. Deploy code (already in main branch)
npm run build
# 3. Deploy to your hosting (Vercel, etc.)
```

## Verification Queries

Run these in Supabase SQL Editor to verify everything:

```sql
-- Check today's token generation
SELECT hospital_id, hospital_code, hospital_name, COUNT(*) as token_count
FROM tokens
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY hospital_id, hospital_code, hospital_name;

-- Check hospital queue status
SELECT h.hospital_code, h.hospital_name, COALESCE(hqc.last_token_number, 0) as tokens_today
FROM hospitals h
LEFT JOIN hospital_queue_counters hqc ON h.id = hqc.hospital_id AND hqc.counter_date = CURRENT_DATE
ORDER BY h.hospital_code;

-- Check function exists and works
SELECT generate_hospital_token_number((SELECT id FROM hospitals LIMIT 1)::UUID);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Hospital dropdown empty | Ensure hospitals exist and migration deployed |
| Token format is old (T-001) | Verify `tokenService.ts` is being used, not old code |
| Hospital code is NULL | Run: `UPDATE hospitals SET hospital_code = 'H' \|\| ...` |
| "Hospital not found" error | Check hospital ID exists in hospitals table |
| Tokens not incrementing | Check `hospital_queue_counters` table created and indexed |

## Rollback (If Needed)

```bash
# Revert code
git revert d910846

# Database cleanup (optional, keeps audit trail)
# In Supabase SQL Editor:
DROP FUNCTION IF EXISTS generate_hospital_token_number(UUID);
DROP TABLE IF EXISTS hospital_queue_counters;
```

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `supabase/migrations/20260404_hospital_specific_token_sequence.sql` | DB migration | Ready |
| `src/services/tokenService.ts` | Token service | Ready |
| `src/pages/AIPatientRegistration.tsx` | Patient signup | Ready |
| `src/pages/PatientDashboard.tsx` | Patient dashboard | Ready |
| `src/types/database.ts` | TypeScript types | Ready |

## Support Resources

- **Full Guide**: See `PHASE_2_DEPLOYMENT_GUIDE.md`
- **Technical Details**: See `PHASE_2_TECHNICAL_SUMMARY.md`
- **Phase 1 Docs**: See `DEPLOYMENT_GUIDE_HOSPITAL_FILTER.md` and `HOSPITAL_FILTER_QUICK_START.md`

## Next Phase Features (Optional)

- [ ] Admin dashboard showing hospital token statistics
- [ ] Token history with patient details
- [ ] Export tokens as PDF/Excel per hospital per day
- [ ] Real-time token queue display for waiting patients
- [ ] Automatic token allocation based on specialty
- [ ] Token expiration and reallocation logic

---

**Status**: Phase 2 Complete ✅  
**Commits**: `177ea2a`, `d910846`  
**Date**: 2026-04-04  
**Next Action**: Deploy migration to Supabase and test!
