# All Features — QA Observations (2026-04-09)

## Summary
- Routes tested: `/` (redirect), `/login`, `/signup`
- Issues found: 2 (0 critical, 1 major fixed, 0 minor, 0 cosmetic, 1 ux-smell)
- Issues fixed: 1 (auth frozen-button bug)
- Overall UX score: A (auth pages) / untested (app, chat — blocked by empty env vars)

---

## Blocker: env vars not configured

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `ANTHROPIC_API_KEY` are all empty in `.env.local`. This blocks testing of every authenticated feature: app shell (F03), WikiPageView (F05), AgentPanel (F04), chat API (F09–F13), and file ingestion (F16).

**To unblock:** fill in `.env.local` with real Supabase project credentials and an Anthropic API key, then re-run `/test-feature app chat`.

---

## Feature: auth

### Route: `/` → redirect
- **UX Score: S**
- Middleware correctly intercepts unauthenticated requests and redirects to `/login`. Works even with empty Supabase keys (session check returns null → redirect, no crash).

---

### Route: `/login`

**UX Score: A**

Clean layout, dark card centered on page, correct labels and placeholders.

#### Issue: frozen button on Supabase throw (FIXED)
- **Severity**: major
- **Description**: Submitting the login form when Supabase URL/key are empty caused `supabase.auth.signInWithPassword()` to throw synchronously. The `setLoading(false)` call in the `if (authError)` branch never ran, leaving the button permanently stuck in "Signing in…" with no user-visible error.
- **Root cause**: `app/(auth)/login/page.tsx` — no `try/catch` around the Supabase call; synchronous throw bypassed the error branch entirely.
- **Fix applied**: Yes — Biome auto-applied `try/catch/finally` wrapping both Supabase calls in login and signup. `setLoading(false)` now runs in `finally`, and the `catch` branch surfaces "Unable to connect. Check your configuration." as a red inline error.

#### Behavioral Trace: empty-field submit
- **User action**: clicked "Sign in" with empty fields
- **Input field**: ✅ HTML5 `required` validation fires — "Please fill out this field." tooltip on email
- **Send button**: ✅ Never submits (browser blocks it)
- **UX quality**: Good — standard browser validation, acceptable for a dev tool

---

### Route: `/signup`

**UX Score: A**

Same layout as login. Fix confirmed working.

#### Issue: frozen button on Supabase throw (FIXED)
- Same root cause and fix as login. Verified: after fix, error message "Unable to connect. Check your configuration." appears in red, button re-enables immediately, form is fully recoverable.

#### Behavioral Trace: submit with empty Supabase config (post-fix)
- **User action**: filled email + password, clicked "Create account"
- **Button**: ✅ Briefly shows "Creating account…" then re-enables
- **Error message**: ✅ "Unable to connect. Check your configuration." shown in red below password field
- **Form state**: ✅ Fully recoverable — user can retry
- **UX quality**: Good

#### UX Observations
- **ux-smell**: The error message "Unable to connect. Check your configuration." is developer-facing language. For a real user getting a legitimate Supabase error (e.g. wrong password), the message from `authError.message` will be correct. But this catch-all fallback could confuse end users if it ever shows. Low priority since it only fires on unexpected throws, not normal auth errors.

---

## Features: app, chat — UNTESTED

Require `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `ANTHROPIC_API_KEY` to be set.

Once configured, re-run `/test-feature app chat` to test:
- Three-panel app shell layout and scroll health
- WikiPageView empty state and page rendering
- AgentPanel message list, streaming indicator, file upload
- Chat API streaming, KnowledgeUpdateCard, Realtime updates
- RightPanel mode switching (pages / related / referenced)
