import { buildSystemPrompt } from "@/lib/claude/system-prompt";
import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  PageLink,
  RelationshipType,
  WikiPage,
} from "@/types/database";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { streamText, tool } from "ai";
import { z } from "zod";

// QA test user — matches an existing row in auth.users
const QA_USER_ID = "5ae62cd7-24b7-474b-88c8-c90d83df0cc2";

export const maxDuration = 60;

function createQaAdminClient(url: string, serviceRoleKey: string) {
  return createAdminClient<Database>(url, serviceRoleKey);
}

function getQaSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "QA_BYPASS requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url, serviceRoleKey };
}

const relationshipTypeEnum = z.enum([
  "related_to",
  "prerequisite_for",
  "extends",
  "contradicts",
  "example_of",
  "similar_to",
]);

const relationshipEntrySchema = z.object({
  title: z.string(),
  type: relationshipTypeEnum,
  reason: z.string(),
});

type PageSummary = Pick<WikiPage, "id" | "title" | "aliases">;

type ToolResult =
  | { status: "ok"; data: Record<string, unknown> }
  | { status: "empty" }
  | { status: "error"; message: string };

type AppSupabaseClient = ReturnType<typeof createQaAdminClient>;

export async function POST(request: Request): Promise<Response> {
  // QA_BYPASS: use admin client (service role) to bypass RLS — revert before shipping
  let userId: string;
  let supabase: AppSupabaseClient;

  if (process.env.QA_BYPASS === "1") {
    const { url, serviceRoleKey } = getQaSupabaseConfig();
    userId = QA_USER_ID;
    supabase = createQaAdminClient(url, serviceRoleKey);
  } else {
    supabase = (await createClient()) as unknown as AppSupabaseClient;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });
    userId = user.id;
  }

  const { messages } = (await request.json()) as {
    messages: import("ai").CoreMessage[];
  };

  // Fetch up to 50 most recently updated pages for context injection
  const { data: rawPages } = await supabase
    .from("wiki_pages")
    .select("id, title, aliases, summary")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  type PageWithSummary = PageSummary & { summary: string };
  const pageContext: PageWithSummary[] = (rawPages ?? []) as PageWithSummary[];

  // Helper: case-insensitive title/alias lookup
  function findPage(needle: string): PageSummary | undefined {
    const lower = needle.toLowerCase();
    return pageContext.find(
      (p) =>
        p.title.toLowerCase() === lower ||
        (p.aliases ?? []).some((a) => a.toLowerCase() === lower),
    );
  }

  // Helper: upsert page links for a set of relationship entries
  async function upsertLinks(
    sourcePageId: string,
    relationshipTypes: Array<{
      title: string;
      type: RelationshipType;
      reason: string;
    }>,
  ): Promise<number> {
    let count = 0;
    for (const entry of relationshipTypes) {
      const target = findPage(entry.title);
      if (!target) continue;

      const linkRow: Omit<PageLink, "id" | "created_at"> = {
        user_id: userId,
        source_page_id: sourcePageId,
        target_page_id: target.id,
        relationship_type: entry.type,
        relationship_reason: entry.reason,
      };

      await supabase.from("page_links").upsert(linkRow, {
        onConflict: "source_page_id,target_page_id",
        ignoreDuplicates: true,
      });

      count++;
    }
    return count;
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4.6"),
    system: buildSystemPrompt(pageContext),
    messages,
    maxSteps: 5,
    tools: {
      create_wiki_page: tool({
        description:
          "Create a new wiki page for a concept the user just learned. Before calling, verify no existing page matches the title or aliases. If a match exists, call update_wiki_page instead.",
        parameters: z.object({
          title: z.string(),
          summary: z.string(),
          body: z.string().describe("Full explanation in Markdown"),
          key_points: z.array(z.string()),
          examples: z.array(z.string()),
          aliases: z
            .array(z.string())
            .describe("Alternative names for this concept"),
          related_page_titles: z.array(z.string()),
          relationship_types: z.array(relationshipEntrySchema),
        }),
        execute: async ({
          title,
          summary,
          body,
          key_points,
          examples,
          aliases,
        }): Promise<ToolResult> => {
          // F20 deduplication — run update logic if a page already exists
          const existing = findPage(title);
          if (existing) {
            try {
              const { error } = await supabase
                .from("wiki_pages")
                .update({ title, summary, body, key_points, examples, aliases })
                .eq("id", existing.id)
                .eq("user_id", userId);

              if (error) return { status: "error", message: error.message };

              return {
                status: "ok",
                data: {
                  page_id: existing.id,
                  title,
                  action: "updated_existing",
                },
              };
            } catch (err) {
              return {
                status: "error",
                message: err instanceof Error ? err.message : "Unknown error",
              };
            }
          }

          try {
            const { data: rawPage, error } = await supabase
              .from("wiki_pages")
              .insert({
                user_id: userId,
                title,
                summary,
                body,
                key_points,
                examples,
                aliases,
              })
              .select()
              .single();

            if (error || !rawPage) {
              return {
                status: "error",
                message: error?.message ?? "Insert returned no data",
              };
            }

            const page = rawPage as WikiPage;
            return {
              status: "ok",
              data: { page_id: page.id, title: page.title },
            };
          } catch (err) {
            return {
              status: "error",
              message: err instanceof Error ? err.message : "Unknown error",
            };
          }
        },
      }),

      update_wiki_page: tool({
        description:
          "Update an existing wiki page with new or refined knowledge. Use when the user refines or expands a concept that already has a page.",
        parameters: z.object({
          page_id: z.string(),
          title: z.string(),
          summary: z.string(),
          body: z.string(),
          key_points: z.array(z.string()),
          examples: z.array(z.string()),
          aliases: z.array(z.string()),
          related_page_titles: z.array(z.string()),
          relationship_types: z.array(relationshipEntrySchema),
        }),
        execute: async ({
          page_id,
          title,
          summary,
          body,
          key_points,
          examples,
          aliases,
        }): Promise<ToolResult> => {
          try {
            const { error } = await supabase
              .from("wiki_pages")
              .update({ title, summary, body, key_points, examples, aliases })
              .eq("id", page_id)
              .eq("user_id", userId);

            if (error) return { status: "error", message: error.message };

            return { status: "ok", data: { page_id, title } };
          } catch (err) {
            return {
              status: "error",
              message: err instanceof Error ? err.message : "Unknown error",
            };
          }
        },
      }),

      link_related_pages: tool({
        description:
          "Create links between wiki pages. Call this after create_wiki_page or update_wiki_page when relationship_types are non-empty.",
        parameters: z.object({
          source_page_id: z.string(),
          source_page_title: z
            .string()
            .describe("Title of the source page, for display in the UI"),
          relationship_types: z.array(relationshipEntrySchema),
        }),
        execute: async ({
          source_page_id,
          source_page_title,
          relationship_types,
        }): Promise<ToolResult> => {
          try {
            const count = await upsertLinks(source_page_id, relationship_types);
            if (count === 0) return { status: "empty" };
            return {
              status: "ok",
              data: { links_created: count, source_page_title },
            };
          } catch (err) {
            return {
              status: "error",
              message: err instanceof Error ? err.message : "Unknown error",
            };
          }
        },
      }),

      query_personal_wiki: tool({
        description:
          "Fetch full page content to answer a question from the user's own wiki. Select relevant page IDs from the injected page list.",
        parameters: z.object({
          question: z.string(),
          relevant_page_ids: z
            .array(z.string())
            .describe(
              "IDs of pages relevant to this question, drawn from the injected list",
            ),
        }),
        execute: async ({ relevant_page_ids }): Promise<ToolResult> => {
          if (relevant_page_ids.length === 0) return { status: "empty" };

          try {
            const { data: rawPages, error } = await supabase
              .from("wiki_pages")
              .select("title, summary, body")
              .in("id", relevant_page_ids)
              .eq("user_id", userId);

            if (error) return { status: "error", message: error.message };
            if (!rawPages || rawPages.length === 0) return { status: "empty" };

            const pages = rawPages as Pick<
              WikiPage,
              "title" | "summary" | "body"
            >[];
            return { status: "ok", data: { pages } };
          } catch (err) {
            return {
              status: "error",
              message: err instanceof Error ? err.message : "Unknown error",
            };
          }
        },
      }),

      find_knowledge_gaps: tool({
        description:
          "Analyse the user's wiki for knowledge gaps. Returns page connectivity data (isolated concepts, link count, page summaries) so you can identify weakly-connected areas, missing bridge concepts, and suggest next learning topics.",
        parameters: z.object({
          topic_area: z
            .string()
            .optional()
            .describe("Optional topic to focus the gap analysis on"),
        }),
        execute: async ({ topic_area }): Promise<ToolResult> => {
          if (pageContext.length === 0) return { status: "empty" };

          try {
            const { data: links, error: linksError } = await supabase
              .from("page_links")
              .select("source_page_id, target_page_id")
              .eq("user_id", userId);

            if (linksError)
              return { status: "error", message: linksError.message };

            const linkedIds = new Set([
              ...(links ?? []).map((l) => l.source_page_id),
              ...(links ?? []).map((l) => l.target_page_id),
            ]);

            // Pages with no links at all — the most likely gap candidates
            const isolatedPages = pageContext
              .filter((p) => !linkedIds.has(p.id))
              .map((p) => p.title);

            const { data: rawContent, error: contentError } = await supabase
              .from("wiki_pages")
              .select("title, summary, key_points")
              .eq("user_id", userId)
              .order("updated_at", { ascending: false })
              .limit(50);

            if (contentError)
              return { status: "error", message: contentError.message };

            type PageContent = Pick<
              WikiPage,
              "title" | "summary" | "key_points"
            >;
            const allContent = (rawContent ?? []) as PageContent[];

            // Narrow to topic if requested
            const pages = topic_area
              ? allContent.filter(
                  (p) =>
                    p.title.toLowerCase().includes(topic_area.toLowerCase()) ||
                    p.summary.toLowerCase().includes(topic_area.toLowerCase()),
                )
              : allContent;

            return {
              status: "ok",
              data: {
                total_pages: pageContext.length,
                link_count: (links ?? []).length,
                isolated_pages: isolatedPages,
                topic_area: topic_area ?? null,
                pages,
              },
            };
          } catch (err) {
            return {
              status: "error",
              message: err instanceof Error ? err.message : "Unknown error",
            };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
