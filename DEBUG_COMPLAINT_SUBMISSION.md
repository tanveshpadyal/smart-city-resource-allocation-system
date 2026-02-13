# Debugging Complaint Submission

I've added detailed logging to help identify why complaint submission isn't working. Follow these steps to diagnose the issue:

## Step 1: Open Browser Console

1. Open the app at http://localhost:5174
2. Press **F12** or Right-click → **Inspect** → **Console tab**
3. Clear the console (optional)

## Step 2: Try to Submit a Complaint

1. Fill out the form:
   - **Category**: Pick any (e.g., "Road Issue")
   - **Description**: Type anything (e.g., "Test complaint")
   - **Latitude**: `40.7128`
   - **Longitude**: `-74.0060`
   - **Image**: Skip (optional)
2. Click **"Submit Complaint"**

## Step 3: Check Console Output

Look for one of these logs:

### ✅ If you see `[CreateRequest] Form submitted`

→ The form IS being submitted. Look for next error.

### ✅ If you see `[CreateRequest] Form validation passed`

→ Form validation passed. Look for API call.

### ✅ If you see `[apiClient] Request to: /requests`

→ API request IS being sent. Check next.

### ⚠️ If you see `[apiClient] No token found in localStorage`

→ **PROBLEM**: User not logged in properly
→ **FIX**: Log out and log back in

### ❌ If you see error after `[useRequest.createRequest] Error:`

→ **PROBLEM**: API returned an error
→ **ACTION**: Tell me the error message shown

### ❌ If you see `[requestService.createRequest] Request failed:`

→ **PROBLEM**: Network request failed
→ **CHECK**:

- Backend server running? (Should see "Server running on port 5000")
- No console errors in red?

## Step 4: Report the Issue

After running through steps 1-3, please provide:

1. **Screenshot** of the browser console errors (if any)
2. **Exact error message** shown in the red text
3. **Logs** you see (copy-paste the [CreateRequest] and [apiClient] logs)

## Possible Issues & Fixes

### Issue 1: "No token found in localStorage"

```
Solution:
1. Go to Login page
2. Log out (if logged in)
3. Log back in with your credentials
4. Check DevTools > Application > Local Storage > smartcity_access_token exists
```

### Issue 2: "Invalid or expired token"

```
Solution:
1. Your token expired
2. Log out and log back in
3. Try submitting again
```

### Issue 3: "Access denied. Required role(s): CITIZEN"

```
Solution:
1. Your account might not have CITIZEN role
2. Check: DevTools > Application > Local Storage > smartcity_user
3. Should show "role":"CITIZEN"
```

### Issue 4: "Missing required field: latitude"

```
Solution:
1. Make sure you fill in all required fields:
   - Category (must select one)
   - Description (must not be empty)
   - Latitude (-90 to 90)
   - Longitude (-180 to 180)
2. Try again
```

## Quick Fix: Clear Cache & Re-login

If nothing works:

1. Press **F12** → **Application** tab
2. Click **Storage** → **Local Storage**
3. Delete all `smartcity_*` entries
4. Refresh the page (F5)
5. Log in again
6. Try submitting complaint

## Check Backend Server

Make sure the backend is running:

```powershell
cd server
npm start
```

You should see:

```
PostgreSQL connected successfully
Database models synced successfully
Server running on port 5000
```

---

**After running these diagnostics, share the console output and any errors you see!**
