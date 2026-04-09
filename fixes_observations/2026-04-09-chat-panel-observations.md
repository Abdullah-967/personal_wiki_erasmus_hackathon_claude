# Chat Panel End-to-End — QA Observations (2026-04-09)

## Summary
- Routes tested: 1 (`/`)
- Issues found: 2 (0 critical, 0 major, 1 minor fixed, 0 cosmetic, 1 ux-smell)
- Issues fixed: 1
- Overall UX score: A

---

## Route: `/`

### UX Score: A
Core flow is polished and fully functional. One build error fixed. One ux-smell logged.

---

### Issue: Turbopack parse error on escaped backticks in template literal
- **Severity**: minor (build error — app served error overlay)
- **Root cause**: `lib/claude/system-prompt.ts` used `\`` inside a template literal to format tool names. Turbopack threw "Expression expected" at line 14:48.
- **Fix applied**: Yes — replaced all escaped-backtick sequences with plain text tool references. Semantically equivalent for a system prompt.

---

### Issue: Center panel shows empty state on load even when pages exist
- **Severity**: ux-smell
- **Description**: After login the center shows "Your wiki is empty" even with 6 pages. No page auto-selected on mount.
- **Root cause**: `AppShell.tsx` — activePage defaults to null, only set by click or Realtime INSERT.
- **Fix applied**: No
- **Suggested fix**: After init() fetches pages, if data.length > 0, call setActivePage(data[0]) to auto-select the most recent page.

---

### Behavioral Trace: Send learning note → wiki page creation
- **Input field**: Cleared immediately, disabled during generation, re-enabled after
- **Send button**: Disabled during generation, re-enabled after
- **Message appearance**: User message appeared instantly
- **Streaming**: Token-by-token. "Thinking..." indicator during tool execution, narrative streamed after
- **Panel updates**: Right panel updated live (new page at top). Center switched to new page via Realtime
- **Knowledge cards**: Page Created + Pages Linked (3) rendered correctly
- **UX quality**: Excellent — full loop felt seamless

---

### Behavioral Trace: Wiki page interactions
- **Page click**: Instantly loads full structured content in center
- **Related Topics**: Navigates to linked page correctly
- **Examples toggle**: Works, active state applied
- **Backlinks**: Shows correct inbound links
- **Search**: Filters in real-time
- **UX quality**: Good

---

### UX Observations
- Empty center panel on login is the top friction point. Auto-selecting the most recent page would be a quick win.
- AI follow-up suggestions ("consider adding bias-variance tradeoff") feel natural and useful.
- Knowledge cards are informative without being obtrusive.

---

## Clean Areas
- Auth flow, session persistence, middleware redirect — all correct
- Scroll health — panels use overflow:auto, no trapped content
- Console errors — 0 on clean load and post-interaction
- Realtime — INSERT events fire correctly, both panels update without reload
