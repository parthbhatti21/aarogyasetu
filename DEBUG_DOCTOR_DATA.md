# 🔍 Debug: Doctor Details Not Coming

## Possible Causes

1. ❓ Migration not deployed yet
2. ❓ No doctor data in database
3. ❓ RLS policy blocking access
4. ❓ Frontend query failing silently
5. ❓ Browser console errors
6. ❓ Cache not cleared

---

## 🔧 Step 1: Check Browser Console for Errors

1. Open Admin Dashboard
2. Press **F12** (open DevTools)
3. Go to **Console** tab
4. Look for error messages (red text)

**What to look for:**
```
- Policy violation
- Network error
- TypeError
- Cannot read property
- relation does not exist
```

**Share any red errors you see!**

---

## 🔧 Step 2: Verify Data Exists in Supabase

Go to: https://app.supabase.com

1. Select **Aarogya Setu** project
2. Go to **SQL Editor**
3. Run this query:

```sql
SELECT COUNT(*) as total_doctors
FROM staff_profiles 
WHERE role IN ('doctor', 'senior_doctor');
```

**Result should show:**
- `total_doctors` = Some number (e.g., 5, 10, etc.)
- If `0` → No doctors created yet
- If error → Check below

---

## 🔧 Step 3: Check If Hospital Data Exists

Run in SQL Editor:

```sql
SELECT COUNT(*) as total_with_hospital
FROM staff_profiles 
WHERE role IN ('doctor', 'senior_doctor') 
AND hospital_id IS NOT NULL;
```

**Result should show:**
- Same number as Step 2 (or close)
- If `0` → Doctors not assigned to hospitals
- If less → Some doctors missing hospital assignment

---

## 🔧 Step 4: Check Admin Access (RLS Policy)

Run in SQL Editor:

```sql
-- Check if admin RLS is working
SELECT user_id, role 
FROM staff_profiles 
WHERE role = 'admin' 
LIMIT 1;
```

**Result:**
- If returns 1 row → Admin exists
- If returns 0 → No admin role set

---

## 🔧 Step 5: Check What Frontend Can See

Run in SQL Editor:

```sql
-- Simulate what the query would return
SELECT 
  id, 
  user_id, 
  display_name, 
  role, 
  specialty, 
  hospital_id, 
  hospital_name, 
  is_active, 
  created_at
FROM staff_profiles 
WHERE role IN ('doctor', 'senior_doctor')
ORDER BY created_at DESC;
```

**Check:**
- Hospital names populated? (not NULL)
- Correct number of doctors showing?
- All fields have values?

---

## 🔧 Step 6: Clear All Caches

1. **Browser Cache:**
   - F12 → Application → Clear storage → Clear all

2. **Supabase Cache:**
   - Go to Supabase settings
   - Look for cache settings
   - Clear if available

3. **Refresh Page:**
   - Ctrl+R or Cmd+R (hard refresh)
   - Or Ctrl+Shift+R for full cache clear

---

## 🔧 Step 7: Check Migration Deployed

Run in SQL Editor:

```sql
-- Check if Phase 1 table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'registration_staff_profiles';
```

**Result:**
- If 1 row → Phase 1 deployed ✓
- If 0 rows → Phase 1 NOT deployed ✗ (need to deploy)

---

## 🔧 Step 8: Test Direct Query

Go to browser console (F12 → Console) and run:

```javascript
// Test if Supabase is accessible
console.log("Testing Supabase connection...");

// Check if connection exists
if (window.supabase) {
  console.log("✓ Supabase connected");
} else {
  console.log("✗ Supabase NOT connected");
}
```

---

## 📋 Debugging Checklist

- [ ] Opened browser console (F12)
- [ ] Checked for red error messages
- [ ] Ran SQL: Count doctors
- [ ] Checked if doctors have hospitals
- [ ] Verified admin role exists
- [ ] Cleared browser cache
- [ ] Hard refreshed page (Ctrl+Shift+R)
- [ ] Checked if Phase 1 migration deployed

---

## 🎯 Most Likely Causes

### 1. Migration Not Deployed
**Check:** Run SQL query from Step 7
**Fix:** Deploy both migrations from `DEPLOY_NOW_2_STEPS.md`

### 2. No Doctors Created
**Check:** Result from Step 2 is 0
**Fix:** Create a doctor from Admin Dashboard

### 3. Doctors Not Assigned to Hospital
**Check:** Result from Step 3 is less than Step 2
**Fix:** Edit doctors and assign hospital

### 4. RLS Policy Blocking
**Check:** Error in console mentions "policy"
**Fix:** Re-run Phase 2 migration to fix RLS

### 5. Browser Cache Issue
**Check:** Console shows correct data but page doesn't
**Fix:** Clear cache (F12 → Application → Clear storage)

---

## ❌ Common Error Messages & Fixes

**"relation ... does not exist"**
→ Phase 1 migration not deployed
→ Fix: Deploy from `DEPLOY_NOW_2_STEPS.md`

**"permission denied for schema public"**
→ RLS policy too restrictive
→ Fix: Re-run Phase 2 migration

**"Cannot read property 'hospital_name' of undefined"**
→ Data fetch working but hospital_name NULL
→ Fix: Assign hospital to doctors

**"Failed to fetch"**
→ Network/connection issue
→ Fix: Check internet, refresh page

**Empty array in console**
→ Query returns no results
→ Fix: Check if doctors exist (Step 2)

---

## 📞 Need Help?

After running debugging steps above:

1. **Share results from Step 2-5 SQL queries**
2. **Screenshot console errors (F12 → Console)**
3. **Confirm if Phase 1 migration deployed**
4. **Tell me what you see in browser**

---

**Status:** 🔍 Debugging
**Need:** Your debugging results
**Time:** ~5 minutes to debug

👉 **Next Step:** Follow debugging steps 1-8 above and share results
