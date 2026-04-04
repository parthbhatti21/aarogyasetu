# Phase 2: Hospital-Specific Daily Token Sequences - Technical Summary

## Architecture Overview

### New Token Generation Flow
```
Patient Registration (AIPatientRegistration.tsx)
    ↓
[Hospital Selection Required]
    ↓
createTokenForPatient(tokenService.ts)
    ↓
generate_hospital_token_number(SQL Function)
    ↓
UPSERT hospital_queue_counters
    ↓
Return: "H001-04042026-001"
    ↓
Token saved to tokens table
    ↓
Display in PatientDashboard
```

## Key Components

### 1. Database Schema Changes

**Table: `hospital_queue_counters`**
```sql
CREATE TABLE hospital_queue_counters (
    id UUID PRIMARY KEY,
    hospital_id UUID NOT NULL,
    counter_date DATE NOT NULL,
    last_token_number INTEGER DEFAULT 0,
    UNIQUE(hospital_id, counter_date)
);
```
- One row per hospital per day
- Automatically resets on date change
- Atomic UPSERT prevents race conditions

**Function: `generate_hospital_token_number(p_hospital_id UUID)`**
- Input: Hospital UUID
- Process: Get/create daily counter, increment, format
- Output: Format string like "H001-04042026-001"
- Atomic: Uses UPSERT...RETURNING for consistency

**Column Addition: `hospitals.hospital_code`**
- Format: "H001", "H002", etc.
- Auto-generated on first token generation
- Used in token display for readability

### 2. Service Layer: `tokenService.ts`

**Core Functions:**

| Function | Purpose | Returns |
|----------|---------|---------|
| `generateHospitalToken(hospitalId)` | Core token generation | String: "H001-04042026-001" |
| `createTokenForPatient(params)` | Full token creation | `{ token_number, token_id }` |
| `getHospitals()` | List all hospitals | `Hospital[]` |
| `getQueuePosition(hospitalId)` | Current queue position | Number |
| `getTodayTokensForHospital(hospitalId)` | Daily tokens | `Token[]` |
| `getHospitalTokenStats(hospitalId)` | Stats for admin | `{ total, today, ... }` |

**Error Handling:**
- Throws if hospital_id is NULL
- Throws if hospital not found
- Catches database constraints

### 3. Frontend Integration

**AIPatientRegistration.tsx (Patient Signup)**
```typescript
// State additions
const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
const [hospitals, setHospitals] = useState<Hospital[]>([]);

// Load hospitals on mount
useEffect(() => {
  getHospitals().then(setHospitals);
}, []);

// Validation: Hospital required before submit
disabled={!selectedHospital || !formData.full_name || !formData.phone}

// Token generation
await createTokenForPatient({
  patientId: newPatient.id,
  hospitalId: selectedHospital.id
});
```

**PatientDashboard.tsx (Token Display)**
```typescript
// Create token with hospital context
const tokenNumber = await createTokenForPatient({
  patientId: patientId,
  hospitalId: sessionStorage.getItem('hospital_id'),
  ...otherParams
});

// Display formatted token: "H001-04042026-001"
```

### 4. Type System

**Updated Interfaces (database.ts):**
- `Patient`: Added `hospital_id?: string`, `hospital_name?: string`
- `Token`: Added `hospital_id?: string`, `hospital_name?: string`
- `StaffProfile`: Added `hospital_id?: string`, `hospital_name?: string`
- `MedicalRecord`: Added `hospital_id?: string`, `hospital_name?: string`
- `Prescription`: Added `hospital_id?: string`, `hospital_name?: string`
- `Medicine`: Added `hospital_id?: string`, `hospital_name?: string`

## Token Format Specification

### Format: `HOSPCODE-DDMMYYYY-SEQUENCE`

**Example: `H001-04042026-001`**

| Part | Length | Format | Example |
|------|--------|--------|---------|
| HOSPCODE | 4 | H + 3 digits | H001 |
| Separator | 1 | Dash | - |
| Date | 8 | DDMMYYYY | 04042026 |
| Separator | 1 | Dash | - |
| Sequence | 3+ | Zero-padded | 001, 002, ..., 999+ |

**Benefits:**
- **Human-readable**: Hospital code visible at a glance
- **Sortable**: Date component enables sorting
- **Trackable**: Sequence shows patient order per day
- **Independent**: Each hospital has own counter

## Concurrency & Race Conditions

### Solution: PostgreSQL UPSERT with Atomic Increment

```sql
-- Atomic operation (no race condition)
INSERT INTO hospital_queue_counters (hospital_id, counter_date, last_token_number)
VALUES (p_hospital_id, today, 1)
ON CONFLICT (hospital_id, counter_date)
DO UPDATE SET last_token_number = hospital_queue_counters.last_token_number + 1
RETURNING last_token_number;
```

**Why this works:**
- Single SQL statement (no round-trip to app)
- Database-level locking handles concurrent requests
- Guaranteed unique sequence numbers per hospital per day

### Potential Issues:
- High volume (>1000 tokens/hospital/minute) may cause lock contention
- Solution: Partition queue_counters by hospital if needed

## Data Consistency

### Denormalization Strategy (Phase 1)
Redundant `hospital_name` stored in tokens, patients, etc. for:
- Faster queries (no JOIN)
- Offline availability
- Audit trail preservation

Maintained via:
- Triggers on INSERT/UPDATE to hospitals table
- Manual updates where necessary
- Async jobs for batch updates

### Referential Integrity
- `hospital_id` is NOT NULL foreign key
- ON DELETE CASCADE removes tokens if hospital deleted
- Application validates hospital_id before token generation

## Testing Strategy

### Unit Tests
```typescript
// Test 1: Single hospital daily sequence
Token1: H001-04042026-001
Token2: H001-04042026-002

// Test 2: Multiple hospitals independence
Token1: H001-04042026-001
Token2: H002-04042026-001 // Separate counter

// Test 3: Daily reset
Token1: H001-04042026-001
[Next day]
Token2: H001-05042026-001 // Counter reset to 001

// Test 4: Hospital validation
generateToken(null) → Error: Hospital ID cannot be null
```

### Integration Tests
```typescript
// Full flow: Registration → Token Generation → Display
1. Navigate to AIPatientRegistration
2. Fill form with hospital selection
3. Submit registration
4. Verify token format in database
5. Check display in PatientDashboard
```

### Manual Testing
```bash
# Test via SQL
SELECT generate_hospital_token_number('hospital-id'::UUID);
# Expected: H001-04042026-001

# Test via API
POST /api/token
{
  "patient_id": "uuid",
  "hospital_id": "uuid"
}
# Expected: { "token_number": "H001-04042026-001" }

# Test via UI
1. Register at Hospital A
2. Verify token: H001-04042026-001
3. Register at Hospital B
4. Verify token: H002-04042026-001
```

## Performance Characteristics

| Operation | Complexity | Time |
|-----------|-----------|------|
| Token generation | O(1) | <100ms |
| Query today's tokens | O(n) | <500ms |
| Hospital list | O(m) | <200ms |
| Queue position | O(n) | <300ms |

Where n = tokens/day, m = hospitals total

## Security Considerations

1. **Hospital Access Control**: 
   - Verify patient hospital_id matches session hospital_id
   - Prevent cross-hospital token access

2. **Token Uniqueness**:
   - Database constraint ensures no duplicates
   - Function validates hospital exists

3. **Data Isolation**:
   - Each hospital's tokens are independent
   - No token information leakage between hospitals

## Migration Path & Rollback

### Forward Compatibility
- Old `T-XXX` format not generated (new code only)
- Existing tokens remain unchanged
- Can coexist during transition period

### Rollback Path
```bash
# If needed, revert code:
git revert <commit-hash>

# Database remains intact:
# - hospital_queue_counters table preserved
# - Old tokens table untouched
# - Can manually clean up if desired
```

## Files Changed

| File | Lines | Purpose |
|------|-------|---------|
| `supabase/migrations/20260404_hospital_specific_token_sequence.sql` | 70 | DB schema + function |
| `src/services/tokenService.ts` | 246 | Service layer |
| `src/pages/AIPatientRegistration.tsx` | +85 | Hospital selector UI |
| `src/pages/PatientDashboard.tsx` | +20 | Integration |
| `src/types/database.ts` | +12 | Type additions |

## Known Limitations & Future Improvements

1. **Queue Position Race Condition**: 
   - Current: Manual count query (O(n) complexity)
   - Future: Denormalize position to tokens table

2. **3-digit Sequence Limit**:
   - Current: Supports 000-999 tokens/hospital/day
   - Future: Auto-extend if needed

3. **Time Zone Handling**:
   - Current: Uses server timezone (UTC typically)
   - Future: Per-hospital timezone support

4. **Token Regeneration**:
   - Current: Once generated, token is immutable
   - Future: Support re-issuing tokens if needed

## Configuration & Customization

### Change Hospital Code Format
```sql
UPDATE hospitals SET hospital_code = 'CUSTOM' WHERE id = 'uuid';
-- Tokens will now show: CUSTOM-04042026-001
```

### Change Date Format in Tokens
Edit function line 48:
```sql
-- Current: DDMMYYYY
formatted_date := TO_CHAR(today, 'DDMMYYYY');
-- Could be: MMDDYYYY, YYYY-MM-DD, etc.
```

### Extend Sequence Numbers Beyond 999
Modify function return to use more digits:
```sql
-- Current: LPAD(next_number, 3, '0')
-- Future: LPAD(next_number, 6, '0') for 000000-999999
```

---

**Last Updated**: 2026-04-04  
**Phase**: 2 of N  
**Status**: Ready for Deployment
