# Auth — QA Observations (2026-04-09)

## Summary
- Routes tested: `/login`, `/signup`
- Issues found: 1 critical (config), 1 cosmetic
- Issues fixed: 0
- Overall UX score: A (UI is correct; one config blocker prevents Google flow from completing)

---

## Route: `/login`

### UX Score: A
Layout correct, Google button renders and triggers OAuth correctly. Flow blocked by Supabase config — not a code issue.

### Issue: Google provider not enabled in Supabase
- **Severity**: critical
- **Description**: Clicking "Continue with Google" correctly redirects to `https://bftbygpnyzkoqeaubcuu.supabase.co/auth/v1/authorize?provider=google&...` but Supabase returns `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`. The OAuth flow cannot complete.
- **Root cause**: Google provider is not toggled on in the Supabase dashboard (Authentication → Providers → Google).
- **Fix applied**: No — code is correct, this is a dashboard configuration step.
- **Suggested fix**: In Supabase dashboard → Authentication → Providers → Google → enable and paste Client ID + Client Secret from Google Cloud Console. Authorized redirect URI must include `https://bftbygpnyzkoqeaubcuu.supabase.co/auth/v1/callback`.

### Issue: favicon.ico 404
- **Severity**: cosmetic
- **Description**: `GET /favicon.ico` 404 on every page load.
- **Fix applied**: No.

---

## Route: `/signup`

### UX Score: A
Identical layout to `/login`. Google button, divider, and email/password form all render correctly.

- No JS errors (only expected HMR WebSocket error in Docker).
- Google button hits the same OAuth endpoint — same config blocker applies.

---

## No Issues Found (UI layer)
- Both pages: Google "G" icon renders with correct multicolor SVG. ✅
- Button styling matches the email/password form width and dark theme. ✅
- "or" divider is centered and visually balanced. ✅
- Both buttons disable correctly during loading states. ✅
- "Sign up" / "Sign in" cross-links work. ✅
- OAuth redirect URL is correctly set to `${window.location.origin}/auth/callback`. ✅
- `/auth/callback` route already handles `exchangeCodeForSession` — will work once provider is enabled. ✅
