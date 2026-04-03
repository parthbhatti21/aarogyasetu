# 🚀 Hospital Selection - COMPLETE DEPLOYMENT GUIDE

## ⚡ QUICKEST WAY TO DEPLOY (2 MINUTES)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com → Your Project
2. Click **"SQL Editor"** (left sidebar)
3. Click **"+ New Query"**

### Step 2: Copy & Run SQL
1. Open: `DEPLOY_TO_SUPABASE.sql`
2. Copy **entire content**
3. Paste into SQL Editor
4. Click **"Run"** button (or Cmd+Enter)

✅ **Done!** All migrations applied + data migrated

---

## ✅ VERIFY DEPLOYMENT (1 MINUTE)

After running SQL, you should see:
```
total_hospitals | 10+ (your hospital count)
unique_states   | 2+ (your state count)
```

If you see data, **DEPLOYMENT IS SUCCESSFUL** ✓

---

## 🔧 ASSIGN STAFF TO HOSPITALS (Optional)

### For Single Hospital Setup
```sql
UPDATE public.staff_profiles
SET hospital_id = (
  SELECT id FROM public.hospitals 
  WHERE hospital_name = 'AIIMS Delhi'
  LIMIT 1
)
WHERE role IN ('doctor', 'senior_doctor', 'registration_desk');
```

### For Multi-Hospital Setup (Specific Doctors)
```sql
-- Assign specific doctor to specific hospital
UPDATE public.staff_profiles
SET hospital_id = (
  SELECT id FROM public.hospitals 
  WHERE hospital_name = 'AIIMS Delhi'
  LIMIT 1
)
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'doctor1@example.com'
);

-- Leave admins without assignment (see all hospitals)
UPDATE public.staff_profiles
SET hospital_id = NULL
WHERE role = 'admin';
```

---

## 🧪 TEST THE FEATURE (5 MINUTES)

### Test 1: Patient Registration
```
1. Go to your app
2. Click "Sign Up" as Patient
3. Enter email/phone/name → Send OTP
4. Verify OTP → Should see HOSPITAL SELECTION screen ✓
5. Click "Use My Location" OR manually select state
6. Select a hospital
7. Should continue to dashboard ✓
```

**Expected**: Hospital selection step between OTP & dashboard

### Test 2: Verify Token Creation
In Supabase SQL Editor:
```sql
-- Check latest tokens have hospital_id
SELECT 
  token_number,
  (SELECT hospital_name FROM hospitals WHERE id = tokens.hospital_id) as hospital,
  created_at
FROM public.tokens
WHERE patient_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: All new tokens have `hospital` value (not NULL)

### Test 3: Doctor Queue Filtering
```
1. Login as Doctor
2. Go to Doctor Dashboard/Queue
3. Should only see tokens from assigned hospital ✓
```

In SQL, check doctor can only see their hospital:
```sql
-- Login as doctor with user_id = 'doctor_uuid'
SET request.jwt.claim.sub = 'doctor_uuid';

SELECT t.token_number, h.hospital_name
FROM tokens t
LEFT JOIN hospitals h ON t.hospital_id = h.id
WHERE t.visit_date = CURRENT_DATE;
-- Should only show one hospital ✓
RESET ROLE;
```

### Test 4: Admin Dashboard
```
1. Login as Admin
2. Check stats are correct
3. If admin has hospital_id assigned → see only that hospital's data
4. If admin has hospital_id = NULL → see all hospitals ✓
```

---

## ✅ SUCCESS CHECKLIST

After deployment, verify:

- [ ] SQL query completed without errors
- [ ] `total_hospitals` > 0 (your data copied)
- [ ] `unique_states` > 0 (states detected)
- [ ] Patient registration shows hospital selection
- [ ] Can select hospital during signup
- [ ] New tokens have `hospital_id` in database
- [ ] Doctor sees only their hospital's tokens
- [ ] Admin dashboard shows filtered data

---

## 🎯 WHAT'S NOW WORKING

✅ **Patient Experience**
- Registration includes hospital selection
- Location detection (with fallback)
- Can select from filtered hospital list
- Tokens linked to selected hospital

✅ **Doctor Experience**
- Dashboard shows only assigned hospital's patients
- Queue filtered automatically
- RLS enforces at database level

✅ **Admin Experience**
- Stats filtered by hospital (if assigned)
- Can see all hospitals (if not assigned)
- Flexible multi-hospital support

✅ **Data Security**
- Hospital-based access control
- RLS policies enforce boundaries
- Backward compatible (existing tokens still work)

---

## ⚠️ TROUBLESHOOTING

### Issue: "No hospitals showing"
**Solution**: Check data migrated
```sql
SELECT COUNT(*) FROM public.hospitals;
```
If 0, rerun `DEPLOY_TO_SUPABASE.sql`

### Issue: "Patient registration doesn't show hospital step"
**Solution**: Verify component updated
```bash
# Check if HospitalSelector component exists
ls src/components/patient/HospitalSelector.tsx
```
Should return file path

### Issue: "Doctor can't see any tokens"
**Solution**: Check hospital assignment
```sql
SELECT sp.display_name, h.hospital_name
FROM staff_profiles sp
LEFT JOIN hospitals h ON sp.hospital_id = h.id
WHERE role = 'doctor';
```
If all NULL, assign hospitals (see step above)

### Issue: "Location permission not working"
**Note**: Only works on HTTPS. In local dev, use manual state selection as fallback.

---

## 📊 MONITORING

Check daily:
```sql
-- Hospital distribution of new tokens
SELECT 
  h.hospital_name,
  COUNT(t.id) as tokens_created_today,
  COUNT(DISTINCT t.patient_id) as unique_patients
FROM tokens t
LEFT JOIN hospitals h ON t.hospital_id = h.id
WHERE DATE(t.created_at) = CURRENT_DATE
GROUP BY h.hospital_name
ORDER BY tokens_created_today DESC;
```

---

## 📞 QUICK REFERENCE

| Action | Command |
|--------|---------|
| Check hospitals | `SELECT COUNT(*) FROM hospitals;` |
| Assign doctor to hospital | `UPDATE staff_profiles SET hospital_id = ... WHERE ...` |
| View doctor assignments | `SELECT sp.display_name, h.hospital_name FROM staff_profiles sp LEFT JOIN hospitals h ON sp.hospital_id = h.id;` |
| Check token distribution | `SELECT hospital_id, COUNT(*) FROM tokens GROUP BY hospital_id;` |
| Reset admin to see all | `UPDATE staff_profiles SET hospital_id = NULL WHERE role = 'admin';` |

---

## 🎉 YOU'RE DONE!

The hospital selection feature is now **LIVE** in your application! 

Next features to consider:
- Hospital-specific appointment scheduling
- Doctor specialty routing within hospitals
- Hospital admin dashboard
- Multi-language support

**Questions?** Check `HOSPITAL_SELECTION_README.md` or the full documentation files.
