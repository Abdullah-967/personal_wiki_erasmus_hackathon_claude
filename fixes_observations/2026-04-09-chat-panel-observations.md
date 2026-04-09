# Chat Panel — QA Observations (2026-04-09)

## Summary
- Routes tested: `/signup`, `/login`, `/` (main app)
- Issues found: 2 cosmetic
- Issues fixed: 0
- Overall UX score: A

---

## Route: `/signup`

### UX Score: A
Clean form, correct feedback state.

- `/signup` — No JS errors. Email/password fields work. On submit, transitions to "Check your email" confirmation state. ✅
- **Note**: Email confirmation is enabled by default in Supabase. For testing, the account was confirmed directly via SQL (`UPDATE auth.users SET email_confirmed_at = now() WHERE email = ...`). Consider disabling email confirmation in Supabase Auth settings for the demo/hackathon.

### Issue: favicon.ico 404
- **Severity**: cosmetic
- **Description**: `GET /favicon.ico` returns 404. Browser logs it as an error on every page load.
- **Fix applied**: No
- **Suggested fix**: Add a `favicon.ico` to `/public/` or configure one in `app/layout.tsx` via the Next.js metadata API.

---

## Route: `/login`

### UX Score: S
Clean. Sign in redirects correctly to `/` (main app) after successful auth.

- No errors. Form fields, submit button, and "Sign up" link all work. ✅

---

## Route: `/` (Main App — Three-Panel Layout)

### UX Score: A

The core product loop works end-to-end in a single test turn.

### No critical or major issues found.

---

### Behavioral Trace: First knowledge input

- **User action**: Typed "Today I learned what transformer attention mechanisms are..." and clicked Send
- **Input field**: ✅ Cleared after send | ✅ Disabled during response generation
- **Send button**: ✅ Disabled while text area empty (on load) | ✅ Enabled after typing | ✅ Disabled during generation | ✅ Re-enabled after response
- **Attach file button**: ✅ Disabled during generation, re-enabled after
- **Message appearance**: ✅ User message appeared in message list immediately after send
- **Thinking indicator**: ✅ "Thinking..." animated indicator appeared below assistant bubble during tool execution
- **Streaming**: ✅ Assistant response appeared token-by-token; rich Markdown with bold terms streamed smoothly
- **KnowledgeUpdateCard**: ✅ Rendered inline below assistant message after completion — showed "✓ Page Created" badge, clickable page title ("Transformer Attention Mechanisms"), and "Page added to your wiki."
- **Center panel**: ✅ Wiki page appeared automatically via Supabase Realtime — title, summary, full Markdown body with headings, Key Points section all rendered
- **Right panel**: ✅ "All Pages" list updated to show the new page with title + summary snippet
- **KnowledgeUpdateCard link**: ✅ Clicking the page name button in the card focuses the center panel on that page (already active — no re-render needed)
- **After response**: Input cleared, all controls restored, full three-panel state updated
- **UX quality**: Excellent — the visible evolution from chat message → wiki page appearing in real time is the core magic moment and it works

---

### Scroll / Layout Health Check

```
viewport: 945 × 921
body.overflow: hidden  ← intentional for fixed panel layout
html.canScroll: false  ← expected
```

| Panel | overflow-y | scrollH | clientH | Verdict |
|-------|-----------|---------|---------|---------|
| Left (chat history) | auto | 986 | 986 | ✅ Scrollable (at capacity with current content) |
| Center (wiki page) | auto | 1978 | 1095 | ✅ Scrollable — 883px of overflow content reachable |
| Right (page list) | auto | — | — | ✅ Scrollable (confirmed by class `overflow-y-auto`) |

No scroll traps. Each panel is independently scrollable. `body: overflow hidden` is by design for the fixed three-panel layout.

---

### UX Observations

- **Thinking indicator placement**: The "Thinking..." text appears outside the assistant message bubble (below it), which is slightly visually detached. A pulsing dot inside the bubble would feel more cohesive — but this is a polish note, not a bug.
- **No empty-state scroll needed yet**: Right panel correctly shows "No pages yet" before the first page, then updates cleanly. Empty-state messaging is clear.
- **Delight moment works**: Seeing the wiki page appear in the center panel while the assistant is still writing the chat response is genuinely satisfying. The Realtime integration lands exactly as specced.
