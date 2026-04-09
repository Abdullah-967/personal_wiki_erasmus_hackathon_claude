# Personal Wikipedia Companion

## 1. Overview

**Personal Wikipedia Companion** is a conversational AI that turns everything a user learns into a living, linked personal wiki.
Users can talk to it, paste notes, or upload files, and the system creates, updates, links, and reasons over their personal knowledge base.

### One-line pitch

Talk to your learning, and your personal wiki builds itself.

## 2. Problem

People learn across chats, notes, papers, screenshots, and random thoughts, but their knowledge stays fragmented.

Current tools mostly help users **store notes**. They do not actively:

- structure knowledge
- connect ideas
- maintain evolving understanding
- surface gaps or contradictions

Result:

- insights get lost
- connections are missed
- learning remains shallow
- revisiting prior understanding is hard

## 3. Vision

Build a **living personal Wikipedia** that:

- captures what the user learns
- structures it into pages
- links related ideas
- updates pages as understanding evolves
- answers questions grounded in the user's own knowledge
- surfaces patterns, gaps, and contradictions

This is not just note-taking. It is **knowledge maintenance and sensemaking**.

## 4. Core Promise

The user should be able to:

- say what they learned
- upload notes or a paper
- ask how it connects to prior knowledge
- get a clean wiki page and linked knowledge structure back

The AI should do the heavy lifting:

- page creation
- summarization
- linking
- updating
- merging
- pattern finding
- answering from the user's own wiki

## 5. Target Users

Primary users: students, researchers, self-learners, builders, knowledge workers.

Especially people who: learn a lot, think in concepts, consume many sources, struggle with fragmented understanding, want a second brain without manual maintenance.

## 6. Product Thesis

Notes apps = passive storage.
Personal Wikipedia Companion = active structuring, linking, and reasoning.

The product helps users build an evolving knowledge world, not just collect notes.

## 7. Core User Stories

### Capture

- As a user, I want to tell the system what I just learned so it turns it into a structured wiki page.
- As a user, I want to upload a paper or notes so the system adds them to my wiki.

### Organize

- As a user, I want the system to detect related topics and create links automatically.
- As a user, I want overlapping concepts to be merged or reconciled.

### Reflect

- As a user, I want to ask how a new idea connects to what I already know.
- As a user, I want the system to surface contradictions, gaps, and recurring themes.

### Retrieve

- As a user, I want to ask questions grounded in my own wiki rather than getting generic answers.
- As a user, I want to browse my knowledge through linked pages.

## 8. Core Experience

### Inputs

The user can provide: chat text, rough reflections, pasted notes, uploaded file or paper, follow-up questions.

### Outputs

The system generates or updates: a wiki page, related topic links, summary and key points, connected concepts, source references, knowledge gaps or contradictions where relevant.

## 9. Product Loop

1. **User inputs knowledge** - Example: "Today I learned what RDDs really are."

2. **System interprets intent** - new knowledge / update to existing / question / connect concepts

3. **System acts on the wiki** - create a page, update a page, merge pages, create links, attach source material, surface patterns or gaps

4. **User sees visible evolution** - what page changed, what was added, what links were created, what related topics were found

This visible evolution is the magic moment.

### AI write authority

All wiki mutations (create, update, merge, link) are **auto-applied immediately** - no confirmation step.
The knowledge update card is the user's notification, not an approval gate.

## 10. Product Principles

1. **Conversational first** - The system should feel like a companion, not a database UI.
2. **Structured behind the scenes** - Natural interaction, structured knowledge.
3. **Visible intelligence** - The user should see what changed, added, or connected.
4. **Personal grounding** - Responses should come from the user's own wiki first.
5. **Evolving understanding** - Knowledge should be refined over time, not stored once.

## 11. Scope

### Must-have

- conversational ingestion
- file-based ingestion
- wiki page creation/update
- concept linking
- personal wiki Q&A
- action transparency in UI

### Stretch (V1 if time allows)

- knowledge gaps surfacing
- suggested next learning topics

### Deferred to V2

Explicitly out of scope for the prototype - do not implement:

- contradiction detection
- learning graph / graph view
- page history UI and changelog diffing
- user-facing confidence/completeness indicators
- page, link, or source deletion
- fuzzy/semantic deduplication (exact title/alias match only in V1)
- OCR for scanned PDFs

### Non-goals

This product is **not**: a general-purpose chatbot, a productivity suite, a note-taking clone, a multi-user collaboration tool, or a generic graph database pitch.

It is specifically: **a self-building personal wiki companion**

## 12. Internal System Architecture

### High-level model

One main conversational runtime with specialized internal skills.

### Main runtime responsibilities

- receive user input
- detect knowledge action needed
- invoke the right skill/tool
- update wiki state
- return user-facing response

### Internal skills

- ingest_knowledge
- summarize_source
- create_wiki_page
- update_wiki_page
- link_related_pages
- merge_duplicate_concepts
- query_personal_wiki
- find_knowledge_gaps
- surface_patterns

Optional internal worker framing:

- **Archivist** - stores and updates knowledge
- **Synthesizer** - structures raw input
- **Linker** - connects concepts
- **Cartographer** - builds the map
- **Socratic Companion** - asks, explains, challenges

## 13. Data Model

Supabase is the system of record for user auth, structured knowledge, and realtime updates.

### V1 tables

- profiles
- wiki_pages
- page_links
- sources

### Deferred to V2

- page_change_log (full diff history; V1 logs to console only)
- open_questions (surfaced gaps; V1 skips this)
- knowledge_updates (separate event log; V1 derives from Realtime)

### Wiki Page (V1 columns)

- id
- user_id
- title
- aliases (text array)
- summary (short paragraph, plain text)
- body (Markdown string)
- key_points (text array)
- examples (text array)
- created_at
- updated_at

Deferred fields (V2): type, open_questions, confidence_or_completeness, change_log

### Link Object

- source_page_id
- target_page_id
- relationship_type (related_to | prerequisite_for | extends | contradicts | example_of | similar_to)
- relationship_reason

### Source Object

- source_type
- source_name
- uploaded_at
- excerpt
- file_reference

## 14. Main Flows

### Flow 1 - Add new knowledge

User: "Today I learned what Catalyst optimizer does."

System:
- detects concept
- checks whether page exists (exact title or alias match)
- creates or updates page
- identifies related pages
- links to Spark, DataFrames, query planning, optimization

### Flow 2 - Upload a paper

User uploads a paper and says: "Add this to my wiki and connect it to what I know about attention."

System:
- extracts title, topic, and core claims
- creates paper page and/or concept page
- links to relevant existing pages
- shows summary, key insights, related topics

### File ingestion contract

Supported types (V1):
- PDF - text layer extraction via pdf-parse
- Plain text - .txt, .md

Unsupported types are rejected with a clear inline error in chat. The wiki is not modified on failure.
Max file size: 10 MB.

### Flow 3 - Ask across wiki

User: "How does this connect to my earlier understanding of RDDs?"

System:
- retrieves relevant pages (title injection -> Claude picks top matches -> full bodies fetched)
- synthesizes the connection
- points to linked topics
- suggests missing bridge concepts where relevant

### Flow 4 - Reflective companion

User: "What am I still missing?"

System:
- checks topic coverage
- surfaces weakly connected or unresolved areas
- suggests next topics or questions

## 14a. Edge Case Flows

### Empty state / first-run

- New user sees the center panel with a placeholder: "Your wiki is empty. Tell me something you learned."
- Right panel shows an empty page list with a prompt to get started.
- Chat has a single seed message from the companion introducing itself.
- No demo pages are pre-populated.

### File upload states

- Idle: paperclip icon in chat input
- Uploading: progress indicator in chat input area
- Extracting / ingesting: "Processing your file..." message in chat
- Success: normal knowledge update card
- Unsupported type: inline error "Unsupported file type. Try PDF, .txt, or .md."
- File too large: inline error "File exceeds 10 MB limit."
- Parse failure: inline error with option to paste the text content manually

### Deduplication

Check: exact title match OR alias match (case-insensitive) against all user pages.
If match found: route to update_wiki_page, merge new content into existing page.
No fuzzy/semantic matching in V1.

### Multi-message behavior

- Each user message is one independent knowledge action unit.
- Messages are processed sequentially - no batching across messages.
- If the user sends a follow-up before the first action completes, it queues.

### AI failure states

- Claude returns malformed JSON: surface inline error in chat, wiki unchanged.
- Supabase write fails: surface inline error, retry once, then fail with message.
- No page silently disappears - every failure is visible in chat.

### Tool response contract

Every tool `execute` function returns a typed result. The orchestrator must distinguish:

- `{ status: "ok", data: ... }` — success
- `{ status: "empty" }` — success but no results (e.g. wiki has no matching pages)
- `{ status: "error", message: string }` — DB or network failure

Claude's system prompt must instruct it to treat `"empty"` and `"error"` differently: `"empty"` means "you haven't added that yet"; `"error"` means "I couldn't reach your wiki — try again." Never conflate the two.

### maxSteps partial completion

`maxSteps: 5` caps the tool chain per turn. If a message requires more than 5 steps (e.g. ingest + create 2 pages + link 3 concepts = 6 steps), the chain is silently truncated.

Rule: if the last tool call completes but the `finishReason` is `"max-steps"` rather than `"stop"`, append a visible notice in chat: *"I ran out of steps — some links may be missing. Continue?"* so the user knows the action was partial.

## 15. UX / Interface

### Main layout

Three fixed panels - no collapsing in V1:

- **Left panel (agent):** chat input + conversation history
- **Center panel (wiki):** active wiki page renderer
- **Right panel (context):** contextual - switches based on last AI action

## 15a. Component Spec

### WikiPage (center panel)

Renders the currently selected wiki page. Layout top to bottom:

1. **Title** - h1, read-only (rename via chat only)
2. **Summary** - short paragraph, plain text
3. **Body** - Markdown, rendered read-only
4. **Key Points** - bulleted list
5. **Examples** - collapsible section, hidden if empty
6. **Related Topics** - chip list; each chip loads that page in the center panel
7. **Sources** - collapsed by default; expands to show source name and excerpt
8. **Backlinks** - collapsed; shows page titles that link to this page; clickable. Computed on read via `SELECT source_page_id FROM page_links WHERE target_page_id = $current`. No stored backlinks column.

Page navigation: clicking a Related Topics chip or backlink loads that page in the center panel. No URL-per-page routing in V1.

Empty state: "Your wiki is empty. Tell me something you learned."

### AgentPanel (left panel)

- Input area (bottom): multiline textarea, Enter to send, Shift+Enter for newline, paperclip icon for file upload
- Message list (above input): user messages right-aligned, assistant messages left-aligned
- Thinking state: while Claude is processing, input is disabled and an animated indicator appears
- The assistant message contains the conversational reply only - not the wiki page content
- A KnowledgeUpdateCard is appended inline directly below the assistant message that triggered a wiki action

### KnowledgeUpdateCard

Appears inline in chat after every wiki mutation. Not dismissible - it is part of the conversation record.

Fields:
- Action badge: "Page Created" | "Page Updated" | "Pages Linked"
- Page name(s) affected - clickable; loads that page in center panel
- Links added (if any) - e.g. "Linked to: Spark, DataFrames"
- One-line summary of what changed

### Right Panel

Switches automatically based on the last AI action - no manual tab switching in V1:

- After page created or updated: Related pages (linked page titles, clickable)
- After Q&A response: Pages referenced (pages cited in the answer)
- Default / idle: Full page list (all wiki pages, sorted by last updated, with a search input)

## 16. Technical Direction

### Recommended build approach

- Next.js 15 App Router frontend
- API routes as the backend orchestrator (/app/api/)
- Supabase: Postgres + Auth + Realtime + Storage
- Claude API via Vercel AI SDK (useChat for streaming)
- Vercel for deployment

### Supabase setup

- Postgres stores wiki pages, links, and source metadata
- Row Level Security on every user-owned table - JWT forwarded from client to enforce RLS
- Storage handles uploaded files
- Realtime pushes page and link mutations to the client after the API route confirms the DB write

### Core technical behaviors

- narrow, product-specific intent detection
- page generation from raw input
- automatic link generation via title injection
- retrieval grounded in personal wiki first

### Q&A evidence contract

- Answers must cite sources inline - e.g. "as you noted in your **RDDs** page..."
- Every response that draws from the wiki must name the specific page(s) used
- Citation is part of the answer body, not a footer
- If the wiki is insufficient, the AI labels it explicitly - e.g. "Outside your wiki:" - so the user always knows what came from their knowledge vs. the model
- `query_personal_wiki` returns verbatim excerpts from page bodies, not summaries. Claude's system prompt instructs it to quote from those excerpts directly — not paraphrase from its own training knowledge. This prevents citation hallucination (Claude attributing to the user's wiki a fact that came from the model).

## 16a. AI Prompt Architecture

### Context injection strategy

Claude has no native awareness of the user's wiki. The orchestrator injects context on every request.

**For create_wiki_page / update_wiki_page:**
- Inject all existing page titles + one-line summaries into the system prompt
- Claude uses this to detect if a matching page already exists and to identify related pages by title
- Cap: if the user has more than 100 pages, inject the 50 most recently updated

**For query_personal_wiki:**
- Step 1: Inject all page titles + summaries; Claude selects the relevant ones (up to 10)
- Step 2: Fetch full bodies of selected pages; inject into a second call
- Step 3: Claude synthesizes the answer with inline citations
- Title-injection-based retrieval - Claude acts as the ranker. No vector DB in V1.

### Claude output schema

All API routes use structured output (JSON mode). Claude must return a typed envelope per action.

create_wiki_page / update_wiki_page response:
  action: "create" or "update"
  title: string
  summary: string
  body: string (Markdown)
  key_points: string[]
  examples: string[]
  related_page_titles: string[]
  relationship_types: { title: string, type: related_to|extends|prerequisite_for|contradicts|example_of|similar_to }[]
  chat_response: string

query_personal_wiki response:
  answer: string (Markdown with inline citations)
  pages_used: string[]
  chat_response: string

### Streaming

- chat_response streams to the agent panel via Vercel AI SDK useChat
- Wiki mutations (DB writes for page + links) happen after the full response is received
- Supabase Realtime pushes the confirmed mutation to the center and right panels
- The KnowledgeUpdateCard renders client-side after the Realtime event is received

## 16b. Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Page body format | Markdown string column | Renderable, Claude writes it naturally, easy to diff later |
| Retrieval (Q&A + linking) | Title + summary injection; Claude as ranker | No pgvector setup needed for V1. Revisit at >200 pages. |
| Streaming | Stream chat_response; apply mutations after full response | Atomic DB writes are simpler than streaming partial page state |
| Auth scope | Real Supabase Auth (email + password) | RLS must work; single user for demo but data is correctly gated |
| Deduplication | Exact title or alias match (case-insensitive) | Semantic dedup deferred to V2 |
| Multi-step failure | Partial state shown; no rollback | If linking fails after page creation, the page still appears |
| File parsing | pdf-parse for PDF; native read for .txt/.md | Scanned PDF OCR deferred to V2 |
| RLS auth pattern | JWT forwarded from client; passed to Supabase client in API route | Service role key never used in user-data routes |

## 17. Demo Strategy

### Demo goal

Show that the system: absorbs messy learning input, structures it into a page, links it into a broader knowledge web, reasons over the user's own knowledge.

### Demo sequence

1. Show fragmented learning
2. Paste a rough note or upload a paper
3. Show wiki page creation/update
4. Show related links appear
5. Ask: "How does this connect to what I knew before?" and "What am I still missing?"

That sequence demonstrates the core magic clearly.

## 18. Success Criteria

The prototype succeeds if a user can:

- tell it something they learned
- see a clean wiki page appear
- see related concepts linked automatically
- ask a question over their own knowledge
- feel that the system organizes and deepens their understanding

## 19. Pitch-ready Closing

**Personal Wikipedia Companion** turns fragmented learning into a living, linked knowledge world.
Instead of manually maintaining notes, users simply talk, paste, or upload what they learn, and the system builds, updates, and reasons over their personal wiki for them.
