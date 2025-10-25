# Authentication Testing Guide

**Local Dev Server**: http://localhost:4322
**Supabase Studio**: http://127.0.0.1:54323
**Email Inbox (Inbucket)**: http://127.0.0.1:54324

---

## Test 1: Sign Up Flow

### Steps:
1. Open http://localhost:4322/sign-up
2. Enter test credentials:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Create account"

### Expected Behavior:
- ✅ Form submits without errors
- ✅ User is created in database
- ✅ Redirects to `/sign-in` (as per current code)
- ✅ Can see user in Supabase Studio > Authentication > Users

### Actual Results:
- [ ] Works as expected
- [ ] Issues found:

---

## Test 2: Sign In Flow (Email/Password)

### Steps:
1. Open http://localhost:4322/sign-in
2. Enter credentials from Test 1:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Sign in"

### Expected Behavior:
- ✅ Form submits without errors
- ✅ Sets `sb-access-token` and `sb-refresh-token` cookies
- ✅ Redirects to `/dashboard`
- ✅ Dashboard shows "Welcome test@example.com"
- ✅ Sign out button is visible

### Actual Results:
- [ ] Works as expected
- [ ] Issues found:

---

## Test 3: Protected Route (Dashboard)

### Steps:
1. In new incognito window, go to http://localhost:4322/dashboard
2. Should redirect to sign-in
3. Sign in, then try accessing dashboard again

### Expected Behavior:
- ✅ Unauthenticated access redirects to `/sign-in`
- ✅ After sign-in, can access dashboard
- ✅ Dashboard shows user email

### Actual Results:
- [ ] Works as expected
- [ ] Issues found:

---

## Test 4: Sign Out Flow

### Steps:
1. While signed in, click "Sign out" button on dashboard
2. Observe redirect behavior
3. Try accessing dashboard again

### Expected Behavior:
- ✅ Form submits to `/api/auth/sign-out`
- ✅ Cookies are cleared
- ✅ Redirects to home or sign-in
- ✅ Cannot access dashboard (redirects to sign-in)

### Actual Results:
- [ ] Works as expected
- [ ] Issues found:

---

## Test 5: Session Persistence

### Steps:
1. Sign in successfully
2. Navigate to dashboard
3. Refresh the page (F5)
4. Close tab and reopen http://localhost:4322/dashboard

### Expected Behavior:
- ✅ Session persists across page refresh
- ✅ User remains signed in
- ✅ Dashboard still accessible

### Actual Results:
- [ ] Works as expected
- [ ] Issues found:

---

## Test 6: GitHub OAuth Flow

### Steps:
1. Open http://localhost:4322/sign-in
2. Click "Sign in with GitHub"
3. Follow OAuth flow

### Expected Behavior:
- ✅ Redirects to GitHub OAuth (or local mock)
- ✅ After authorization, returns to `/api/auth/callback`
- ✅ Sets session cookies
- ✅ Redirects to `/dashboard`

### Known Limitation:
- GitHub OAuth requires public URL (won't work on localhost without ngrok/tunneling)
- May need to test with production deployment or skip for now

### Actual Results:
- [ ] Works as expected
- [ ] Issues found:
- [ ] Skipped (requires public URL)

---

## Test 7: Already Authenticated Redirects

### Steps:
1. Sign in successfully
2. While signed in, navigate to http://localhost:4322/sign-in
3. Also try http://localhost:4322/sign-up

### Expected Behavior:
- ✅ Sign-in page redirects to `/dashboard` (already authenticated)
- ✅ Sign-up page redirects to `/dashboard` (already authenticated)

### Actual Results:
- [ ] Works as expected
- [ ] Issues found:

---

## Test 8: Invalid Credentials

### Steps:
1. Go to sign-in page
2. Enter wrong password for existing user
3. Try to sign in

### Expected Behavior:
- ✅ Shows error message
- ✅ Does not redirect
- ✅ User remains on sign-in page
- ✅ Error is user-friendly

### Actual Results:
- [ ] Works as expected
- [ ] Issues found:

---

## Test 9: Non-existent User Sign In

### Steps:
1. Go to sign-in page
2. Enter email that doesn't exist: `fake@example.com`
3. Enter any password
4. Try to sign in

### Expected Behavior:
- ✅ Shows error message
- ✅ Does not create user
- ✅ Error is user-friendly (doesn't reveal if user exists)

### Actual Results:
- [ ] Works as expected
- [ ] Issues found:

---

## Test 10: Duplicate Email Sign Up

### Steps:
1. Sign up with `test@example.com` (already exists from Test 1)
2. Try to create account

### Expected Behavior:
- ✅ Shows error message
- ✅ Indicates email is already in use
- ✅ Does not create duplicate user

### Actual Results:
- [ ] Works as expected
- [ ] Issues found:

---

## Database Checks (Supabase Studio)

### View Created Users:
1. Open http://127.0.0.1:54323
2. Go to **Authentication** > **Users**
3. Verify test users are created correctly

### Check Auth Events:
1. In Supabase Studio, go to **Logs** (if available)
2. Check for auth-related events

---

## Summary of Issues Found

| Test # | Test Name | Status | Issues |
|--------|-----------|--------|--------|
| 1 | Sign Up | ⏳ | |
| 2 | Sign In | ⏳ | |
| 3 | Protected Route | ⏳ | |
| 4 | Sign Out | ⏳ | |
| 5 | Session Persistence | ⏳ | |
| 6 | GitHub OAuth | ⏳ | |
| 7 | Already Auth Redirect | ⏳ | |
| 8 | Invalid Credentials | ⏳ | |
| 9 | Non-existent User | ⏳ | |
| 10 | Duplicate Email | ⏳ | |

---

## Critical Issues to Fix Before Moving to Profiles

*Document issues here as you find them...*

---

## Nice-to-Have Improvements

*Document enhancement ideas here...*
