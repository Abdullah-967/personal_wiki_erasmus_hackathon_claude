# Chat Panel E2E — QA Observations (2026-04-09)

## Summary
- Routes tested: 1
- Issues found: 2 (1 critical, 0 major, 0 minor, 0 cosmetic, 1 ux-smell)
- Issues fixed: 0
- Overall UX score: F

---

## Route: /

### UX Score: F
The shell renders, but the primary chat flow fails on the first turn and cannot complete a response.

### Issue: First-turn chat send fails with only a masked generic error
- **Severity**: critical
- **Screenshot**: `playwright-screenshots/chat-panel-after-first-send-error.png`
- **Console errors**: No useful chat-specific client exception was surfaced. A direct `POST` to `/api/chat` returned `200` with the streamed body `3:"An error occurred."`. Separate dev-only HMR websocket errors were also present in the browser console throughout this run.
- **Description**: The user message appears immediately in the thread, then the assistant never shows a placeholder, streamed text, or tool activity. Instead, the panel renders a generic red inline error banner saying `"An error occurred."`. Dismissing and retrying reproduces the same failure deterministically.
- **Root cause**: The chat route is configured with `anthropic("claude-sonnet-4.6")` in [route.ts](C:\Users\PC\Downloads\erasmus_claude_hackathon\app\api\chat\route.ts#L114). That string does not match the project convention in `AGENTS.md` (`claude-sonnet-4-6`) and also does not match the known model IDs listed by the installed `@ai-sdk/anthropic` package. The thrown provider-side error is then masked by `toDataStreamResponse()`, so the client only receives the fallback error handled in [AgentPanel.tsx](C:\Users\PC\Downloads\erasmus_claude_hackathon\components\AgentPanel.tsx#L182) and rendered in [AgentPanel.tsx](C:\Users\PC\Downloads\erasmus_claude_hackathon\components\AgentPanel.tsx#L334).
- **Fix applied**: No — critical issue, flagged instead of patched during the QA pass.
- **Suggested fix**: Replace the model string with a supported Anthropic model identifier, then add server-side logging or a development-only error hook around the data stream response so provider failures are not collapsed to the same generic message.

---

### Behavioral Trace: First send attempt
- **User action**: Sent `"I learned that vector databases speed up semantic search by storing embeddings and enabling nearest-neighbor retrieval."`
- **Input field**: ✅ Cleared immediately after send. ⚠️ Focus did not return after the failure.
- **Send button**: ✅ Submission was accepted. ⚠️ No meaningful loading label or assistant placeholder appeared before the error state.
- **Message appearance**: ✅ User message appeared instantly.
- **Streaming**: ❌ No token streaming or partial assistant output appeared.
- **Scroll**: ✅ The chat container stayed at the bottom; no trapped content was observed in this viewport.
- **Panel/sidebar updates**: ❌ No changes to the main wiki content or right-hand page list.
- **After response**: The chat rendered a red inline error banner with `"An error occurred."` and a dismiss action.
- **UX quality**: Broken — the primary action hard-stops immediately.

---

### Behavioral Trace: Retry after dismiss
- **User action**: Dismissed the error, then sent `"How does that relate to retrieval-augmented generation?"`
- **Input field**: ✅ Accepted new text after dismiss. ⚠️ The prior failure had dropped focus to the page body, so recovery requires manually re-entering the field.
- **Send button**: ✅ Re-enabled correctly after dismiss and enabled again once text was entered.
- **Message appearance**: ✅ Second user message appended correctly.
- **Streaming**: ❌ Again no assistant placeholder or streamed response.
- **Scroll**: ✅ Message list remained pinned to the bottom.
- **Panel/sidebar updates**: ❌ No updates outside the chat panel.
- **After response**: The same generic error banner reappeared, confirming the failure is deterministic rather than transient.
- **UX quality**: Broken — retry path exists, but the outcome is identical.

---

### UX Observations
- The error copy is too generic for a primary AI surface. Users cannot tell whether the problem is provider configuration, billing, request validation, or a transient network failure.
- After an error, focus falls off the textarea to the page body. That adds unnecessary friction to repeated attempts.
- On this dev instance, the page initially presented the empty-state shell before existing wiki content appeared. The route eventually settled with populated content, but the lack of an explicit loading state makes the first impression feel unreliable.
