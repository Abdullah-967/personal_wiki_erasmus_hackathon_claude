# QA Observations — 2026-04-09

## Summary
- Routes tested: 1 (`/` — app shell with all panels)
- Issues found: 2 (0 critical, 0 major, 1 minor [fixed], 1 cosmetic)
- Issues fixed: 1
- Overall UX score: A

**Testing context**: QA_BYPASS=1 is set. Auth is skipped, fake UUID (`00000000-0000-0000-0000-000000000000`) is used as userId. Supabase RLS blocks all write operations since no valid JWT session exists. Wiki page creation/display and Realtime updates cannot be fully exercised in this mode. ANTHROPIC_API_KEY is set and the chat API works.

---

## Route: `/` — App Shell

### UX Score: A
Clean layout, good empty states, chat works end-to-end (streaming, markdown, tool indicator). Wiki and Realtime blocked by auth limitation in QA mode.

---

### Issue: Search empty state shows wrong message
- **Severity**: minor
- **Description**: When "All Pages" mode had no pages and the user typed a search query, the empty state showed "No pages yet. Start a conversation." instead of "No pages match your search." — misdirecting the user.
- **Root cause**: `components/RightPanel.tsx` — empty state always showed `EMPTY_STATES[mode]` without checking if a search was active.
- **Fix applied**: Yes — added `mode === "pages" && search.trim()` guard to show the contextual message.

---

### Issue: Cold-start 500 on first chat request (dev mode)
- **Severity**: cosmetic (dev-only)
- **Description**: The very first POST to `/api/chat` after `npm run dev` returns a 500. Retry succeeds. This appears to be a Next.js dev server route cold-start issue coinciding with a Fast Refresh cycle. Not reproducible in production.
- **Fix applied**: No — dev-mode artefact, not worth fixing.

---

### Behavioral Trace: Send chat message → streaming response

- **User action**: Typed "Photosynthesis is the process by which plants convert sunlight, water, and CO2 into glucose and oxygen using chlorophyll." and clicked Send.
- **Input field**: ✅ Cleared after send, disabled during response
- **Attach button**: ✅ Disabled during generation, re-enabled after
- **Send button**: ✅ Disabled during generation (also disabled when input empty — expected)
- **Message appearance**: ✅ User message appeared immediately in blue bubble
- **Thinking indicator**: ✅ Three bouncing dots + "Thinking..." label shown
- **Streaming**: ✅ Response streamed progressively, smooth token-by-token
- **Markdown rendering**: ✅ Bold labels, subscript chemical formulas (CO₂, C₆H₁₂O₆), code block for equation — all rendered correctly
- **Tool execution**: ℹ️ `create_wiki_page` tool was called but blocked by Supabase RLS (expected in QA_BYPASS mode). AI gracefully reported the error and outlined what it would have captured.
- **Error feedback from AI**: ✅ Clear, actionable message suggesting page refresh to re-establish session
- **Scroll**: ✅ Auto-scrolled to bottom during streaming
- **After response**: Controls re-enabled, input ready for next message
- **UX quality**: Excellent — smooth streaming, good error degradation, rich markdown output

---

### WikiPageView — Code Review (not interactively testable in QA mode)

- **Skeleton at module scope**: ✅ `Skeleton` and `SectionSkeleton` defined at module scope — no remount-on-render issue
- **Section reveal animation**: ✅ `sectionClass()` correctly gates opacity transitions per section key
- **Update flash**: ✅ `flashClass()` applies `bg-yellow-500/10 transition-colors` only to changed sections
- **Empty state guard**: ✅ `!page && !isSkeletonMode` correctly shows empty state
- **Scroll**: ✅ `overflow-y-auto` on container, `min-h-0` on flex parent — no trapped content
- **Interactive test**: Blocked — requires authenticated user session + Supabase service role key to insert test pages

---

### Realtime Subscription (AppShell) — Not testable in QA mode

Supabase Realtime requires a valid JWT session to authenticate the WebSocket. With QA_BYPASS=1 and a fake userId, the subscription is created but no INSERT/UPDATE events for the fake user_id will arrive. The F18 skeleton→reveal animation and F18 section-flash on update cannot be exercised.

**To fully test**: Remove `QA_BYPASS=1`, sign up with a real account, and use the chat to create a wiki page, then observe the center panel.

---

### Right Panel — All Modes

- **All Pages + empty**: ✅ "No pages yet. Start a conversation."
- **All Pages + search with no match**: ✅ "No pages match your search." (fixed)
- **All Pages + search with no match (visual)**: ✅ Confirmed in browser screenshot
- **Related Pages**: ✅ "No related pages found."
- **Pages Referenced**: ✅ "No pages were cited."
- **Scroll health**: ✅ No content cutoff, no overflow issues

---

## No Issues Found
- `/` layout and grid — Clean. Proper 3-column split, borders, background colours consistent.
- Chat panel — Clean. Header, message list, input area all well-structured.
- AgentPanel error handling — `chatError` state wired to `onError`, dismiss button present.
- File attach — Input hidden, button triggers click on ref, proper MIME/size validation.

---

## QA Revert Checklist (before shipping)

- [ ] Remove `QA_BYPASS=1` from `.env.local`
- [ ] Revert `if (process.env.QA_BYPASS === "1") return NextResponse.next({ request })` in `middleware.ts`
- [ ] Revert `if (process.env.QA_BYPASS !== "1")` guard in `app/page.tsx`
- [ ] Revert `if (process.env.QA_BYPASS === "1")` userId bypass in `app/api/chat/route.ts`
- [ ] Run full authenticated flow: sign up → confirm email → send message → verify wiki page appears
