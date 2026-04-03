## Auth Flow Diagnosis

The 401 error suggests the Edge Function is rejecting the request because:

1. **No session token** - User isn't logged in when accessing /patient/register
2. **Invalid token** - Session expired or malformed
3. **Wrong token format** - Not passing Bearer token correctly

### Test Steps:

1. Open browser DevTools → Network tab
2. Try to send AI message
3. Check the `cohere-chat` request:
   - Look at Request Headers → Authorization header
   - Should be: `Authorization: Bearer eyJ...`
   - If missing or empty → session not set

### Likely Issue:

After OTP verification, the Supabase session might not be persisting to the next page (/patient/register).

**Fix needed:** Ensure session is stored in AuthContext AND localStorage
