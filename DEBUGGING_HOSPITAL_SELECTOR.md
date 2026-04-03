# Debugging Guide: Hospital Selector Component

## 📊 Component State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    HospitalSelector Component                   │
└─────────────────────────────────────────────────────────────────┘

State Variables:
├─ hospitals[] ........................ All hospitals from Supabase
├─ filteredHospitals[] ................ Hospitals in selected state
├─ selectedState ...................... Currently selected state (e.g., 'Gujarat')
├─ availableStates[] .................. Unique states from hospitals
├─ loadingHospitals ................... True while fetching from Supabase
├─ locationAttempted .................. True after location request
└─ detectedState (from hook) .......... State detected via geolocation

Effects Timeline:
┌────────────────────────────────────────────────────────────────┐
│ 1. Component Mount                                             │
├────────────────────────────────────────────────────────────────┤
│ Effect 1: loadHospitals()                                       │
│  - Sets: loadingHospitals = true                               │
│  - Calls: Supabase query                                       │
│  - Updates: hospitals[] with results                           │
│  - Sets: loadingHospitals = false                              │
│  - Dependency: [] (runs once on mount)                         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 2. Hospitals Loaded                                            │
├────────────────────────────────────────────────────────────────┤
│ Effect 2: Extract States                                        │
│  - Updates: availableStates[] from hospitals[]                 │
│  - Dependency: [hospitals]                                     │
│  - Runs: After hospitals are populated                         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 3a. Location Detected (Async)                                  │
├────────────────────────────────────────────────────────────────┤
│ From useGeolocation hook:                                       │
│  - Sets: detectedState = 'Gujarat'                             │
│  - Sets: detectedDistrict = 'Anand'                            │
│  - Triggers: detectedState dependency in HospitalSelector     │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 3b. ✅ FIXED: Guard Effect (Auto-Select State)                │
├────────────────────────────────────────────────────────────────┤
│ Effect 3: Auto-select detected state                            │
│  Condition:                                                     │
│    if (detectedState &&           ← Location detected         │
│        hospitals.length > 0 &&    ← Hospitals loaded ✅ NEW    │
│        !loadingHospitals)         ← Loading complete ✅ NEW    │
│  Then:                                                          │
│    - Updates: selectedState = 'Gujarat'                        │
│  Dependency: [detectedState, hospitals.length, loadingHospitals] │
│  Runs: When any dependency changes                             │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 4. Filter Hospitals by Selected State                          │
├────────────────────────────────────────────────────────────────┤
│ Effect 4: Filter & Sort                                         │
│  Input: selectedState = 'Gujarat'                              │
│  Process:                                                       │
│    filtered = hospitals.filter(h => h.state === selectedState) │
│    // Now has 22 hospitals from Gujarat ✅                      │
│  Output: setFilteredHospitals(filtered)                        │
│  Dependency: [selectedState, hospitals, detectedDistrict]      │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 5. User Selects Hospital                                       │
├────────────────────────────────────────────────────────────────┤
│ Event: handleHospitalChange(hospitalId)                        │
│  - Finds: hospital from filteredHospitals[]                   │
│  - Calls: onHospitalSelect(hospital)                          │
│  - Parent (PatientOTPForm) captures selection                 │
│  - Stored in: sessionStorage                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Problem: Before Fix

**Timeline of Bug:**

```
Time:   Event                          State                  UI Shows
─────   ──────────────────────────────  ──────────────────────  ──────────────
0ms     Component mounts               loadingHospitals=true   Loading...

10ms    Supabase query starts          hospitals=[]            Loading...
        Geolocation API called

20ms    Geolocation finishes FAST      detectedState='Gujarat' Location detected!

21ms    Effect 3 fires (OLD CODE)      selectedState='Gujarat' (No hospitals yet!)
        BUT hospitals[] still empty    filteredHospitals=[]
        ❌ Auto-selects BEFORE load done

22ms    Effect 4 filters              filteredHospitals=[] ← EMPTY!
        hospitals.filter(...) returns []
                                                               ❌ "No hospitals
                                                               found"

100ms   Supabase query returns         loadingHospitals=false
        setHospitals(data)             hospitals=[22 items]
        Effect 2 updates states        availableStates updated

101ms   User manually changes state    selectedState changed
        This triggers Effect 4 again

102ms   Effect 4 filters again         filteredHospitals=[22 ✅ "22 hospitals"
        NOW hospitals has data!        hospitals from GT]
```

**Root Cause:** `detectedState` effect didn't wait for async hospital loading.

---

## ✅ Solution: After Fix

**Timeline of Fix:**

```
Time:   Event                          State                  UI Shows
─────   ──────────────────────────────  ──────────────────────  ──────────────
0ms     Component mounts               loadingHospitals=true   Loading...

10ms    Supabase query starts          hospitals=[]            Loading...
        Geolocation API called

20ms    Geolocation finishes FAST      detectedState='Gujarat' Location detected!

21ms    Effect 3 GUARDS applied        selectedState=''        Still loading...
        ✅ NOT auto-selecting yet!     (waiting for hospitals)
        Check conditions:              hospitals.length=0 ← FALSE
        - detectedState='Gujarat' ✓
        - hospitals.length > 0 ✗ ← WAIT!
        - !loadingHospitals ✗ ← WAIT!

100ms   Supabase query returns         loadingHospitals=false  (Updating...)
        setHospitals(data)             hospitals=[22 items]

101ms   Effect 3 guards check again    selectedState=''        (Checking...)
        Now conditions pass:           Checks passed! ✅
        - detectedState='Gujarat' ✓
        - hospitals.length > 0 ✓ ← NOW TRUE!
        - !loadingHospitals ✓ ← NOW TRUE!

102ms   NOW auto-select fires          selectedState='Gujarat' Setting state...

103ms   Effect 4 filters               filteredHospitals=[22   ✅ "22 hospitals
        hospitals.filter(...)          hospitals from Gujarat]   in Gujarat"
        ✅ NOW has data!
```

**Result:** Auto-select waits for hospitals to load before running.

---

## 🧪 How to Debug

### 1. Check if Hospitals Are Loading

```javascript
// Add to HospitalSelector useEffect:
useEffect(() => {
  console.log('Hospital Loading State:', {
    loadingHospitals,
    hospitalsCount: hospitals.length,
    detectedState,
    selectedState,
    filteredCount: filteredHospitals.length
  });
}, [hospitals, loadingHospitals, detectedState, selectedState]);
```

**Expected Output:**
```
First log (mount):
  { loadingHospitals: true, hospitalsCount: 0, ... }

After Supabase returns:
  { loadingHospitals: false, hospitalsCount: 22, ... }

After state selected:
  { selectedState: 'Gujarat', filteredCount: 22, ... }
```

### 2. Add Console Logs to Each Effect

```javascript
// Effect 1: Load hospitals
useEffect(() => {
  console.log('Effect 1: Loading hospitals...');
  loadHospitals();
}, []);

// Effect 2: Extract states
useEffect(() => {
  console.log('Effect 2: Extracted states:', availableStates);
}, [hospitals]);

// Effect 3: Auto-select (FIXED)
useEffect(() => {
  console.log('Effect 3: Auto-select guard check:', {
    detectedState,
    hasHospitals: hospitals.length > 0,
    isLoading: loadingHospitals,
    willAutoSelect: !!(detectedState && hospitals.length > 0 && !loadingHospitals)
  });
  if (detectedState && hospitals.length > 0 && !loadingHospitals) {
    console.log('Effect 3: Auto-selecting state:', detectedState);
    setSelectedState(detectedState);
  }
}, [detectedState, hospitals.length, loadingHospitals]);

// Effect 4: Filter hospitals
useEffect(() => {
  console.log('Effect 4: Filtering hospitals for state:', selectedState);
  // ... filtering logic
  console.log('Effect 4: Found', filteredHospitals.length, 'hospitals');
}, [selectedState, hospitals, detectedDistrict]);
```

### 3. Test in Browser DevTools

1. Open DevTools → Console
2. Go through user flow
3. Watch console logs for order of operations
4. Check Network tab to see Supabase query timing

---

## 📋 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "No hospitals found" on load | Auto-select before hospitals loaded | ✅ **Fixed** - Guards added |
| Hospitals appear after manual state change | State change triggers filter with loaded data | ✅ **Fixed** - No longer needed |
| Loading spinner never disappears | Supabase query failed | Check error logs, verify DB data |
| State dropdown empty | No hospitals in Supabase | Run migration: `DEPLOY_TO_SUPABASE_FIXED.sql` |
| Manual state change slow | No hospitals yet in memory | Loading works, UI shows indicator |

---

## ✨ Testing Checklist

- [ ] Location allowed → Hospitals show automatically
- [ ] Location denied → State dropdown shown, manual selection works
- [ ] State changed manually → Hospitals update immediately
- [ ] No state selected → Hospital dropdown hidden
- [ ] Hospital selected → Goes to next step with hospital_id saved
- [ ] Browser console clean → No errors or warnings

---

## 🎯 Key Takeaway

**Before:** Auto-select happened immediately → Empty filter
**After:** Auto-select waits for hospitals → Populated filter

The fix adds **dependency guards** to ensure async operations complete before dependent state changes fire.
