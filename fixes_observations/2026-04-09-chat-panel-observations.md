# Chat Panel — QA Observations (2026-04-09)

## Summary
- Routes tested: 1 (`/`)
- Issues found: 2 (1 critical, 1 minor)
- Issues fixed: 1
- Overall UX score: F

---

## Route: `/`

### UX Score: F
The static shell loads cleanly, but the primary chat flow is blocked in the current environment because `/api/chat` cannot reach Anthropic successfully.

### Issue: Chat generation fails because the Anthropic account has insufficient credits
- **Severity**: critical
- **Screenshot**: `playwright-screenshots/chat-panel-root-initial-3012.png`
- **Console errors**: No route-specific frontend exception was required to trigger the failure. Server log recorded: `[chat/route] stream error: AI_APICallError: Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.`
- **Description**: The core chat-panel action cannot complete. A direct `POST` to `/api/chat` returned the streamed error payload `3:"An error occurred."`, so the assistant cannot produce a response for the user.
- **Root cause**: Environment / billing, not local UI logic. Confirmed in [.next/dev/logs/next-development.log](C:/Users/PC/Downloads/erasmus_claude_hackathon/.next/dev/logs/next-development.log).
- **Fix applied**: No — requires replenishing Anthropic credits or swapping to a funded key.
- **Suggested fix**: Restore Anthropic API access, then re-run the chat-panel pass to verify streaming, tool calls, multi-turn context, and post-response panel updates.

---

### Issue: Dev HMR requests from `127.0.0.1` were blocked, causing repeated websocket console noise during QA
- **Severity**: minor
- **Screenshot**: `playwright-screenshots/chat-panel-root-initial-full-3012.png`
- **Console errors**: `WebSocket connection to 'ws://127.0.0.1:3012/_next/webpack-hmr...' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE`
- **Description**: Local QA through `127.0.0.1` triggered repeated dev-only HMR errors, which polluted the console and destabilized the browser session used for the chat-panel pass.
- **Root cause**: `127.0.0.1` was missing from `allowedDevOrigins` in [next.config.ts](C:/Users/PC/Downloads/erasmus_claude_hackathon/next.config.ts).
- **Fix applied**: Yes — added `127.0.0.1` to `allowedDevOrigins`.
- **Suggested fix**: Restart the dev server so the config change takes effect before the next QA run.

---

### Behavioral Trace: Attempt to send a first chat message
- **User action**: Entered a knowledge statement in the chat input and attempted to submit from the app shell.
- **Input field**: ⚠️ Accepted text visually, but the browser wrapper became unstable after the failed dev-origin/HMR cycle, so the final field state was not trustworthy enough to classify as a product regression.
- **Send button**: ⚠️ Not reliable to score in this session. The current browser pass did not yield a stable, reproducible button-state result after the HMR-origin failures started.
- **Message appearance**: ❌ No stable user-message append was observed in this run.
- **Streaming**: ❌ Not observed. Backend generation is currently blocked by the Anthropic billing error.
- **Scroll**: ✅ No trapped-content issue detected. Root layout stayed within the viewport, and the left panel remained reachable.
- **Panel/sidebar updates**: None observed in this run.
- **After response**: No assistant response could be validated because `/api/chat` failed upstream.
- **UX quality**: Broken — the primary action is unavailable until Anthropic access is restored.

---

### UX Observations
- The empty-state shell is visually solid: the three-panel split reads clearly, the chat entry point is obvious, and the empty wiki state is understandable.
- The current failure mode is not user-friendly enough for a primary surface. With exhausted API credits, the chat panel should surface a clearer inline error than a generic stream failure.
- The dev-origin/HMR issue amplified QA noise unnecessarily. The `allowedDevOrigins` fix should make subsequent local browser passes much more stable.

---

## No Issues Found
- `/` static layout — Clean. Three-column shell, empty state copy, and chat-panel placement all render correctly.
- `/` scroll health — Clean. No below-fold content was trapped, and the page did not require root scrolling for the empty state.
