---
name: test-feature
description: Systematically browser-test features using Playwright Docker, observe live behavior patiently, trace function-level state changes, assess UX quality, and log all findings. Use when the user says "test feature", "test the UI", "browser test", "QA the app", "test landing", "test auth", "test discovery", "test ideation", "test dashboard", "test blog", "test templates", "test settings", "test admin", "test lp", or any request to visually test specific app features via the browser. Also trigger when the user says "run QA", "check the UI", "smoke test", "observe behavior", "watch what happens when", or names any feature area to test. Takes feature names as arguments (e.g., `/test-feature landing blog auth`).
---

# Test Feature — Browser QA Skill

Systematically test app features via Playwright Docker. Go beyond screenshots: **observe live behavior**, **trace what updates when users interact**, **assess UX quality**, and **log broken logic or ugly UX experiences** to the observations file.

## Arguments

Space-separated feature names. If none provided, ask which features to test.

Valid features: `landing`, `blog`, `auth`, `dashboard`, `ideation`, `discovery`, `templates`, `settings`, `admin`, `lp`

Example: `/test-feature discovery ideation` or `/test-feature landing auth`

## Feature Route Map

Use the test idea ID from CLAUDE.md (`925c54e8-b105-48f5-8270-e99e6db51927`) for all `{ideaId}` routes. For `{slug}` routes (blog, templates, lp) pick any published slug from the DB.

> **Route group note**: Next.js route groups `(admin)`, `(app)`, `(auth)`, `(marketing)` are layout wrappers only — they do not appear in URLs.

---

### `landing` — Marketing Home
| Route | Notes |
|-------|-------|
| `/` | Landing page — hero, pricing, social proof |

**Auth required**: No

---

### `blog` — Public Blog
| Route | Notes |
|-------|-------|
| `/blog` | Blog index (list of posts) |
| `/blog/{slug}` | Individual published post — pick a real slug |

**Auth required**: No

---

### `auth` — Authentication Flows
| Route | Notes |
|-------|-------|
| `/sign-in` | Login form |
| `/sign-up` | Registration form |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset form (requires token in URL) |
| `/auth/callback` | OAuth callback — do not navigate directly; triggered by Google auth |

**Auth required**: No

---

### `dashboard` — Idea Dashboard
| Route | Notes |
|-------|-------|
| `/dashboard` | Lists all ideas; create new idea CTA |
| `/idea` | Redirect hub (no content, redirects to dashboard) |

**Auth required**: Yes

---

### `ideation` — Ideation Workspace
All routes are under `/idea/{ideaId}/`. Replace `{ideaId}` with the test idea ID.

| Route | Notes |
|-------|-------|
| `/idea/{ideaId}` | Idea overview: readiness scores, framework progress, timeline, kill signals |
| `/idea/{ideaId}/problem-definition` | Problem definition framework (AI chat + structured output) |
| `/idea/{ideaId}/bmc` | Business Model Canvas framework |
| `/idea/{ideaId}/competitive` | Competitive landscape framework |
| `/idea/{ideaId}/value-proposition` | Value proposition framework |
| `/idea/{ideaId}/assumptions` | Assumptions tracker framework |
| `/idea/{ideaId}/review` | Ideation readiness review (summary, scores, recommendations) |
| `/idea/{ideaId}/fishbone` | Fishbone diagram (template framework) |
| `/idea/{ideaId}/root-cause-5whys` | 5 Whys root-cause analysis (template framework) |
| `/idea/{ideaId}/mashup-ideation` | Mashup ideation framework |
| `/idea/{ideaId}/mind-map` | Mind map brainstorm framework |
| `/idea/{ideaId}/scamper-ideation` | SCAMPER ideation framework |

**Auth required**: Yes  
**Note**: Unknown slugs pass through as-is (custom deployed templates). `[framework]` is a dynamic segment resolved via `SLUG_TO_FRAMEWORK` map in the page component.

---

### `discovery` — Discovery Phase
All routes are under `/idea/{ideaId}/discovery/`.

| Route | Notes |
|-------|-------|
| `/idea/{ideaId}/discovery` | Discovery dashboard: persona count, LP status, interview stats, JTBD count, assumption coverage, widget conversion rate |
| `/idea/{ideaId}/discovery/personas` | Proto-personas list |
| `/idea/{ideaId}/discovery/personas/{personaId}` | Persona canvas: full profile, linked assumptions, customer segments, framework summaries |
| `/idea/{ideaId}/discovery/interviews` | Interviews list |
| `/idea/{ideaId}/discovery/interviews/{interviewId}` | Interview detail: transcript, AI-extracted insights, assumption links |
| `/idea/{ideaId}/discovery/jtbd` | Jobs-To-Be-Done list and analysis |
| `/idea/{ideaId}/discovery/analysis` | Cross-interview synthesis and insight patterns |
| `/idea/{ideaId}/discovery/landing-page` | Landing page builder (generate/edit/publish) |
| `/idea/{ideaId}/discovery/review` | Discovery review: decision gate, synthesis, go/no-go |

**Auth required**: Yes  
**Note**: `{personaId}` and `{interviewId}` must be real IDs from the test idea. Query the DB or check network responses after visiting the list pages.

---

### `templates` — Templates Marketplace
| Route | Notes |
|-------|-------|
| `/templates` | Templates index (list of available frameworks) |
| `/templates/{slug}` | Template detail page — pick a real slug from the index |

**Auth required**: Yes

---

### `settings` — User Settings
| Route | Notes |
|-------|-------|
| `/settings` | Account info (email, display name), billing section, plan limits |

**Auth required**: Yes  
**Sections to test**: Account card, BillingSection component (plan badge, upgrade CTA), Plan Limits card

---

### `admin` — Admin Panel
| Route | Notes |
|-------|-------|
| `/admin` | Admin home / overview |
| `/admin/users` | User management |
| `/admin/blog` | Blog post management |
| `/admin/pipeline` | Pipeline admin |
| `/admin/invite-codes` | Invite code management |
| `/admin/feedback` | User feedback inbox |
| `/admin/errors` | Error log viewer |
| `/admin/ai-usage` | AI usage / cost analytics |
| `/admin/activity` | Activity feed |
| `/admin/feature-flags` | Feature flag toggles |

**Auth required**: Yes (admin role)

---

### `lp` — Published Landing Pages
| Route | Notes |
|-------|-------|
| `/p/{slug}` | Public landing page for a specific idea; built via the landing-page builder |
| `/rss.xml` | RSS feed (no auth, GET only) |

**Auth required**: No

---

## Setup Phase

Before testing, verify infrastructure:

1. **Dev server**: Check if port 3001 is responding. If not, start it:
   ```bash
   cd apps/web && npm run dev
   ```
   Wait for "Ready" output before proceeding.

2. **Auth session** (if any feature requires login): Navigate to `http://localhost:3001/sign-in`, fill credentials (`test@startsah.dev` / `Test123!`), submit, and confirm redirect to dashboard. Reuse this session for all authenticated routes — don't re-login between features.

3. **Observations file**: Create `fixes_observations/{YYYY-MM-DD}-{feature}-observations.md` for each feature being tested. Use today's date.

---

## Testing Protocol

For EACH route in the feature, execute this sequence in full. **Be patient — wait for async operations to settle before capturing state.**

### Phase 1 — Navigate and Capture

```
browser_navigate → http://localhost:3001{route}
browser_wait_for → wait for page to settle (specific text or 2-3s delay)
browser_take_screenshot → save to playwright-screenshots/{feature}-{route-slug}-initial.png
browser_snapshot → capture accessibility tree (DOM state)
browser_console_messages → check for JS errors/warnings
```

> **Patience rule**: If the page shows a loading spinner or streaming text, wait for it to fully settle. Take a second screenshot after content loads. Do not capture observations mid-load.

---

### Phase 2 — Scroll & Viewport Health Check

**Mandatory for every route.** Pages that look fine in a screenshot can have broken scroll that locks users out of content.

Run via `browser_evaluate` on every page after it loads:

```js
() => {
  const html = document.documentElement, body = document.body;
  const main = document.querySelector('main') || body;
  const scrollables = [...document.querySelectorAll('*')].filter(el => {
    const s = getComputedStyle(el);
    return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
  });
  let maxBottom = 0;
  main.querySelectorAll('*').forEach(el => { const b = el.getBoundingClientRect().bottom; if (b > maxBottom) maxBottom = b; });
  return {
    viewport: { w: innerWidth, h: innerHeight },
    html: { scrollH: html.scrollHeight, clientH: html.clientHeight, canScroll: html.scrollHeight > html.clientHeight },
    body: { overflow: getComputedStyle(body).overflow },
    scrollables: scrollables.slice(0, 5).map(el => ({
      el: el.tagName + (el.id ? '#'+el.id : '') + (el.className ? '.'+el.className.split(' ')[0] : ''),
      scrollH: el.scrollHeight, clientH: el.clientHeight, clipped: el.scrollHeight - el.clientHeight
    })),
    content: { furthest: Math.round(maxBottom), cutOff: maxBottom > innerHeight + 50 }
  };
}
```

**Red flags:**

| Signal | Meaning | Severity |
|--------|---------|----------|
| `html.canScroll === false` AND `content.cutOff === true` | Content below viewport but page can't scroll — users locked out | **major** |
| `scrollables` empty AND page has below-fold content | No scrollable area — content trapped | **major** |
| `body.overflow === 'hidden'` with no open modal | Stale scroll lock from a modal/drawer that didn't clean up | **major** |

**When scroll is broken:**
1. Try `browser_press_key → End` then `Home` — re-screenshot to see if content moved
2. Take a `fullPage: true` screenshot to reveal all trapped content
3. Trace the overflow chain: find which ancestor has `overflow: hidden`, `h-screen` without `overflow-y-auto`, or a flex parent missing `min-h-0`

---

### Phase 2b — Page Assessment

Read the screenshot, accessibility snapshot, scroll diagnostics, and console output. Look for:

- **Broken scroll / trapped content**: Content below the fold that users cannot reach (caught by Phase 2). This is a **major** UX bug — users literally cannot use the page.
- **Stale / frozen pages**: Page loads but feels dead — no scroll, elements don't respond. Caused by `overflow: hidden` on a parent, `h-screen` without inner scroll, or hydration mismatch.
- **Broken layouts**: Overlapping elements, overflow, missing content, blank areas, truncated text
- **Console errors**: React errors, 404s, failed fetches, unhandled rejections, hydration mismatches
- **Missing data**: Empty states that should have content, loading spinners that never resolve
- **Visual regressions**: Wrong colors, broken dark mode, misaligned elements, inconsistent spacing
- **Accessibility**: Missing labels, broken focus order, non-interactive elements with click handlers
- **Navigation**: Dead links, wrong redirects, broken back-button behavior
- **UX flow breaks**: Unclear next steps, missing feedback after actions, confusing UI states

---

### Phase 3 — Behavioral Interaction Testing

> **This is the most important phase.** Don't just click — *observe and trace* what happens at each step.

#### 3a. Interaction Testing Protocol

For each meaningful interaction:

1. **Before state**: Take a snapshot (`browser_snapshot`) before acting. Note visible UI elements, text, loading states.
2. **Perform the action**: Use `browser_click`, `browser_type`, `browser_key_press`, etc.
3. **Wait patiently**: Use `browser_wait_for` for network responses, state changes, animations to settle (at least 1-2s for async ops).
4. **After state**: Take another snapshot + screenshot. Diff mentally what changed.
5. **Log the delta**: In your observation, record WHAT changed, HOW it changed, and whether it was expected.

#### 3b. Interactions to Always Test (by page type)

**Forms**:
- Fill each field individually and check for real-time validation feedback
- Submit with empty fields — observe error messages (are they clear? positioned correctly?)
- Submit with valid data — observe loading state, success message or redirect
- Check if the submit button becomes disabled during submission

**Chat / Agent Panels** (critical — see Phase 4):
- Send a message and observe the full response cycle
- Check for streaming behavior: does text appear word-by-word or all at once?
- Observe which UI elements update: message list, scroll position, input state, button states
- Check if the input clears after sending
- Check if the send button disables during response generation
- Observe what happens when you send a second message while a response is still streaming

**Buttons and CTAs**:
- Click each primary CTA — observe what changes immediately and after async ops
- Look for missing loading indicators (button should show pending state)
- Verify navigation targets are correct

**Modals / Drawers / Panels**:
- Open them — observe animation smoothness, focus management (does focus move inside?)
- Close them with the X button, Escape key, and backdrop click
- Check that scroll is restored after closing

**Tabs / Accordions / Steppers**:
- Switch between all tabs — observe which parts of the page re-render
- Check for URL updates (hash or query params) on tab switch
- Verify selected state is visually clear

**Dark Mode** (if theme toggle exists):
- Toggle theme and immediately screenshot
- Look for elements that ignore the theme (hardcoded colors, images, third-party widgets)

---

### Phase 4 — Agent / Chat Behavioral Tracing

When testing routes with an AI chat agent (ideation, discovery, or any panel with a chat interface):

#### What to Trace

When you send a message to the agent, observe and document each of the following:

| Component | What to observe |
|-----------|----------------|
| **Input field** | Does it clear after send? Does it disable during response? Does it restore cursor focus after? |
| **Send button** | Does it disable during generation? Does it change icon/label? Does it re-enable after response completes? |
| **Message list** | Does user message appear immediately? Does assistant bubble appear as a placeholder before content streams? Does scroll auto-follow to bottom during streaming? |
| **Streaming behavior** | Is text streamed token-by-token or chunked? Is there a visible cursor/indicator during streaming? Does it feel smooth or choppy? |
| **Sidebar / panel state** | Does any sidebar section update after the agent responds (e.g., saved notes, generated content, idea fields)? |
| **Page content outside chat** | Does the main content area update based on what the agent says? (e.g., does a "problem definition" section update when the agent confirms one?) |
| **Error states** | If the agent fails or times out, is there a clear error message? Is the UI recoverable (can you try again)? |
| **Multi-turn behavior** | Send a follow-up question. Does the agent reference previous context? Does the message list grow correctly? |

#### Behavioral Trace Format

For each chat interaction, add a behavioral trace to the observations file:

```
### Behavioral Trace: [Action Description]
- **User action**: "sent message: 'What should my startup focus on?'"
- **Input field**: ✅ Cleared after send | ⚠️ Did not disable during response
- **Send button**: ✅ Disabled during generation, re-enabled after
- **Message appearance**: ✅ User message appeared instantly
- **Streaming**: ✅ Token-by-token, smooth | ⚠️ Visible lag at start
- **Scroll**: ✅ Auto-scrolled to bottom during streaming
- **Panel/sidebar updates**: [Describe any state changes outside the chat]
- **After response**: [What changed on the page? Did any sections update?]
- **UX quality**: [Rate: Excellent / Good / Needs work / Broken] — [Reason]
```

---

### Phase 5 — UX Quality Assessment

After completing interaction testing for a route, give it an overall UX quality score. This goes into the observations file.

**UX Assessment Checklist**:

- [ ] **Feedback clarity**: Does every action produce visible feedback within 200ms?
- [ ] **Loading states**: Are async operations covered with spinners, skeletons, or disabled states?
- [ ] **Error handling**: Are errors friendly, specific, and recoverable?
- [ ] **Empty states**: Are empty lists/results handled with helpful messaging (not just blank space)?
- [ ] **Responsive feel**: Does the layout hold up at different zoom levels?
- [ ] **Content clarity**: Is text legible, hierarchy clear, CTAs obvious?
- [ ] **Transition smoothness**: Are route changes and modal opens smooth (<300ms)?
- [ ] **Consistency**: Do button styles, spacing, and colors match the rest of the app?
- [ ] **Delight**: Is there anything that feels particularly polished or delightful?
- [ ] **Friction points**: Are there any steps that feel unnecessarily hard or confusing?

**UX Score**:
- `S` — Excellent. Polished, smooth, no issues.
- `A` — Good. Minor rough edges only.
- `B` — Acceptable. Some noticeable UX issues, functional.
- `C` — Poor. Friction points hurt usability.
- `F` — Broken. Cannot complete the primary flow.

---

### Phase 6 — Classify and Act on Issues

Every issue gets a severity:

| Severity | Definition | Action |
|----------|-----------|--------|
| **critical** | Feature broken, data loss risk, security issue | Log with full context. Present to user — do NOT fix without approval. |
| **major** | Feature partially broken, bad UX, >3 files to fix | Log with full context and proposed fix. Present to user. |
| **minor** | Wrong styling, missing polish, easy 1-2 file fix | Fix immediately in code. Re-test to confirm. Note the fix in observations. |
| **cosmetic** | Nitpick, slight misalignment, could-be-better | Log it. Don't fix unless the user asked for a thorough polish pass. |
| **ux-smell** | Works technically but feels clunky or confusing | Log under UX Observations. Propose improvement. Only fix if minor. |

The threshold for "fix immediately" is: you're confident in the fix, it touches 1-2 files, and it won't break anything else. When in doubt, log and ask.

### Fix Approach — Defaults

When fixing issues, follow these defaults:

- **MCP-first**: Before writing any fix, check available MCP servers (shadcn, radix-ui, magicui, aceternity-ui, chakra-ui, xyflow-docs) for existing components or patterns that solve the problem. Use `mcp__shadcn__*`, `mcp__radix-ui__*`, `mcp__magicui__*` tools to find ready-made solutions.
- **Library-first**: Prefer built-in components from shadcn/ui, Radix primitives, Magic UI, Framer Motion, and TanStack Query over custom code. If a library already handles the behavior (dropdowns, toasts, modals, form validation, data fetching), use it.
- **Reuse project components**: Check `.claude/docs/ui-components-ref.md` for existing project components before creating new ones. Compose existing primitives instead of building from scratch.
- **No custom reimplementations**: Never rewrite functionality that a dependency already provides. A 1-line library import beats a 30-line custom helper every time.

---

## Observations File Format

Each feature gets its own file: `fixes_observations/{YYYY-MM-DD}-{feature}-observations.md`

```markdown
# {Feature} — QA Observations ({YYYY-MM-DD})

## Summary
- Routes tested: X
- Issues found: X (Y critical, Z major, W minor, V cosmetic, U ux-smell)
- Issues fixed: X
- Overall UX score: [S/A/B/C/F]

---

## Route: {route path}

### UX Score: [S/A/B/C/F]
{One-line justification}

### Issue: {short description}
- **Severity**: critical | major | minor | cosmetic | ux-smell
- **Screenshot**: `playwright-screenshots/{filename}.png`
- **Console errors**: {if any, paste the error}
- **Description**: {what's wrong and why it matters}
- **Root cause**: {trace to source file if possible}
- **Fix applied**: {Yes — describe what you changed} | {No — needs user approval}
- **Suggested fix**: {if not fixed, describe what to do}

---

### Behavioral Trace: {action description}
- **User action**: {what was done}
- **Input field**: ✅/⚠️/❌ {observation}
- **Send button**: ✅/⚠️/❌ {observation}
- **Message appearance**: ✅/⚠️/❌ {observation}
- **Streaming**: ✅/⚠️/❌ {observation}
- **Scroll**: ✅/⚠️/❌ {observation}
- **Panel/sidebar updates**: {any changes outside chat}
- **After response**: {what changed on the page}
- **UX quality**: {Excellent / Good / Needs work / Broken} — {reason}

---

### UX Observations
- {Friction point or UX smell with suggested improvement}
- {Another UX observation}

---

## No Issues Found
{If a route is clean, note it briefly}
- `/route` — Clean. No errors, layout correct, interactions working. UX: S.
```

---

## Completion

After testing all routes for all requested features:

1. **Print a summary** to the conversation:
   - Total routes tested
   - Issues by severity (including ux-smells separately)
   - UX scores per feature
   - Issues fixed vs. flagged
   - Any critical/major items needing user attention

2. **If fixes were applied**: List each fix briefly so the user knows what changed in their codebase.

3. **If major/critical issues exist**: Present them clearly with enough context for the user to make a decision.

4. **Highlight top UX friction points**: Even if they're not bugs, surface the top 2-3 UX improvements that would have the biggest impact.

---

## Important Constraints

- **Use `mcp__playwright-docker__*` tools ONLY** — never the built-in Playwright plugin or claude-in-chrome.
- **Save screenshots to `playwright-screenshots/`** at project root — not inside `fixes_observations/`.
- **Be patient with async behavior.** Wait for streaming to finish, spinners to resolve, and animations to settle before capturing state. A half-loaded page is not a finding — a page that never finishes loading is.
- **Don't retry-loop past errors.** If a page fails to load or throws errors, that's a finding — log it, trace the cause, and move on.
- **Don't test destructive actions** (deleting ideas, canceling subscriptions, etc.) unless the user explicitly asks.
- **Be efficient but thorough.** Focus on: does it load, does it error, does it look right, do the main interactions work, and does it feel good to use.
- **Trace agent/chat behavior deeply.** When testing any AI-driven feature, always complete Phase 4 (Behavioral Tracing). These are high-complexity surfaces and subtle bugs matter.
- **Read CLAUDE.md** for test account credentials, idea IDs, and other project-specific context before starting.
